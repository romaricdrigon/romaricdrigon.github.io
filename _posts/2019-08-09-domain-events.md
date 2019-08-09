---
layout: post
title: "Decouple your Symfony application using Domain Events"
date: 2019-08-09 14:12:00 +0200
categories: [Software architecture, Domain-Driven Design, Symfony, Doctrine]
description: |
    Domain Events represents what happened in your application. They are a lesser known concept, but they will help you immensely to decouple your application.
    Implementing them in a Symfony application, typically with Doctrine ORM, is challenging. Let's find the best way together.
image:
    file: assets/images/posts/britannia-hut.jpg
    facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024,h_535,c_lfill/githubio/assets/images/posts/britannia-hut.jpg
    description: Allalin glacier and Schwazberg glacier, from Britannia hut, 3030m, Saas-Fee
    gravity: g_north
commentIssueNumber: 7
---

In my [previous post](https://romaricdrigon.github.io/2019/07/05/value-objects-doctrine-and-symfony-forms),
we saw a better way to represent model data with value objects and Doctrine embeddable.
But sometimes, you need to represent not data, but what happened. There, you need **Domain Events**.  
They are a lesser known concept, but they will help you immensely to decouple your application. With those, you will be able to better isolate the domain logic.  
Implementing them in a Symfony application, typically with Doctrine ORM, is challenging. Let's see what are the options, and try to find the best way.

<!-- more -->

## What are Domain Events

Domain Events are small PHP object representing something which happened. In a more formal vocabulary, they indicate a state change in the system.  

Not everything in an application, even is simple one, is represented by a piece of data you can store.  
Think of a Bank account, it has a balance, and sometimes transactions happen (you pay for something, you receive your salary...).
Every time the balance is modified, you may want to initiate some actions, like warning the user, checking for fraud... No matter what caused it. Having imperative code, calling a method every time, is a burden. Imagine calling this method when someone sends you money, but also when bank is charging you a fee, or interests are paid, etc. It will become very complex, as it may need more and more parameters.    
Throwing an event, as `AccountBalanceModified`, `MoneySent`, `InterestsPaid`, etc., allows to decouple what happened from what will happen (in event listeners). It also helps to isolate different technical domain, you don't want to handle e-mail or push notifications in the same piece of code which updates the account balance.  

Domain events were first defined by [Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html) around 2005, though at first they were seen in a more specific way. Eric Evans later insisted on how important they are when using Domain-Driven Design, and he said he regretted not to have put more emphasis on those earlier (you can watch his talk [here](https://www.infoq.com/presentations/ddd-eric-evans/), the part about events starts around 14:00). If your are not convinced yet, please check [this article](https://beberlei.de/2012/08/25/decoupling_applications_with_domain_events.html) from Benjamin Eberlei, which focuses on how they are beneficial to decoupling your application.

Events are typically named with a verb in the past tense (ie., `UserCreated`). You don't need to add any `Event` suffix, but you should group them in a specific namespace. I like `Model/Event`, not to mix them up with (potential) infrastructure events (in `Event/`).   
Second, domain events should encapsulate all relevant data, as they represent a "snapshot" of something which happened. That rule is sometimes more challenging to implement, as objects are always passed by reference in PHP. But you don't want a listener to be able to modify your entity freely, it would be a side effect and prone to create issues later on. So it is better to pass either scalar data either immutable data, and maybe sometimes you will need to clone an object.  
Finally, as usual, I recommend those to be immutable (no setters, use a constructor with arguments).  

To wrap up, here's how I would implement the event thrown when an User is created:
```php
namespace App\Model\Event;

use App\Entity\User;
use Symfony\Component\EventDispatcher\Event;

// We have to extend Symfony EventDispatcher base Event if we want to use the component
// It does not add much constraints, though.
class UserCreated extends Event
{
    private $date;
    private $userId;
    private $emailAddress;

    public function __construct(User $user)
    {
        $this->date = new \DateTimeImmutable('now');
        $this->userId = $user->getId(); // It could be used to identify User later
        $this->emailAddress = $user->getEmailAddress(); // We may want to send an e-mail
    }

    public function getDate(): \DateTimeImmutable
    {
        return $this->date;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getEmailAddress(): string
    {
        return $this->emailAddress;
    }
}
```

## How they are thrown

Domain events have something very unique there, something you may be unfamiliar with: **they should be throw by entities*.**  
Why? In substance, they are part of the domain, so they should be handled by the domain.  
And not by a controller, a manager, anything from your application (or infrastructure). In practice, doing so will lead to code duplication and inconsistencies. It would be easy to forget to fire the `UserCreated` event if you create `User` entities in three different places in your application. Some of those may even be out of your reach, for example if you use [FOSUserBundle](https://github.com/FriendsOfSymfony/FOSUserBundle) (not that I would recommend FOSUserBundle, but having entities created by someone else is a relatively common scenario).

Last but not least, it may be tempting to use Doctrine listeners, but in practice, it is not a good solution.  
Doctrine listeners have many technical limitations regarding how you can create new entities and whether you can or can not modify relationships, long-term, it will be a burden. And again, they are infrastructure code, it should not be responsible for domain-related logic.
**So Doctrine listeners can not replace events raised from your entity, and they should not call directly domain events handlers.**

_* Note: in "pure DDD", they are throw by aggregates. Which will likely be (Doctrine) entities in a relatively simple applications._

## Implementation: the entity side

The first step of the implementation is relatively easy: domain events are PHP objects created and raised from a Doctrine entity.  
The first time I implemented those I followed [this article](https://beberlei.de/2013/07/24/doctrine_and_domainevents.html).  
That's what I will do below, over my previous `User` example:

```php
namespace App\Entity;

use App\Model\Event\UserCreated;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 */
class User
{
    // We have to store events in the entity
    protected $events = [];

    public function __construct()
    {
        $this->raiseEvent(new UserCreated($this));
    }

    // This method is needed for later
    public function popEvents(): array
    {
        $events = $this->events;

        $this->events = [];

        return $events;
    }

    // This method is totally optional, I like adding it because
    // it allows checking event type and I feel like the syntax is cleaner.
    protected function raise(Event $event)
    {
        $this->events[] = $event;
    }
}
```

To make the code a little bit cleaner and easier to work with, we can introduce a `RaiseEventsInterface` and a `RaiseEventsTrait`:

```php
namespace App\Entity;

use App\Model\Event\UserCreated;
use App\Model\RaiseEventsInterface;
use App\Model\RaiseEventsTrait;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 */
class User implements RaiseEventsInterface
{
    use RaiseEventsTrait;

    public function __construct()
    {
        $this->raiseEvent(new UserCreated($this));
    }
}
```

```php
namespace App\Model;

use Symfony\Component\EventDispatcher\Event;

// I'm used to suffixing interfaces names, but you are free not to!
interface RaiseEventsInterface
{
    /**
     * Return events raised by the entity and clear those.
     *
     * @return Event[]
     */
    public function popEvents(): array;
}
```

```php
namespace App\Model;

use Symfony\Component\EventDispatcher\Event;

trait RaiseEventsTrait
{
    protected $events = [];

    public function popEvents(): array
    {
        $events = $this->events;

        $this->events = [];

        return $events;
    }

    protected function raise(Event $event)
    {
        $this->events[] = $event;
    }
}
```

We can imagine more events will be raised by our entity. For instance, we could have a `UserEnabled` event.  
There's a specific scenario: User deletion. We can't rely on PHP destructor, it won't be called when the entity is removed from database. In that very scenario, I found [Doctrine lifecycle callbacks](https://symfony.com/doc/current/doctrine/lifecycle_callbacks.html) to be useful. But they should not do more than raising the event.

```php
namespace App\Entity;

use App\Model\Event\UserCreated;
use App\Model\Event\UserEnabled;
use App\Model\Event\UserRemoved;
use App\Model\RaiseEventsInterface;
use App\Model\RaiseEventsTrait;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM|HasLifecycleCallbacks
 */
class User implements RaiseEventsInterface
{
    use RaiseEventsTrait;

    // Let's imagine we have a "enabled" boolean
    private $enabled;

    public function __construct()
    {
        $this->raiseEvent(new UserCreated($this));
    }

    public function enable(): void
    {
        // We can do more checks, typically, we don't want even to be triggered twice
        if (false === $this->enabled) {
            $this->raiseEvent(new UserEnabled($this));
        }

        $this->enabled = true;
    }

    /**
     * @ORM\PreRemove
     */
    public function onRemove()
    {
        $this->raiseEvent(new UserRemoved($this));
    }
}
```  

## Implementation: dispatching events

Dispatching events is relatively straightforward. We can use [Symfony EventDispatcher component](https://symfony.com/doc/current/components/event_dispatcher.html).  
Domain Events are dispatched, and they will be routed to events subscribers. I advise to use [subscribers](https://symfony.com/doc/current/components/event_dispatcher.html#using-event-subscribers) rather than listeners, it is easier to deal with events mapping configuration in code rather than in service declaration.
Each event subscriber can listen to one or more events ; you can also have multiple subscriber for the same event. There's no definitive rule there, basically **I would keep subscribers short and focused**. That way, it is easier to test and to understand what's going on.

![Events profiler](/assets/images/content/events-profiler.png)
*You can easily follow which events are triggered, and which listeners or subscribers are called by accessing the Symfony Profiler at `/_profiler/latest?panel=events`*

For a more elaborate dispatching, you could use [Symfony Messenger](https://symfony.com/doc/current/messenger.html).  
You have to convert your events to messages, which will be posted on a bus, and then they can be dispatched to a specific handler.
Eventually, it could be asynchronous, using RabbitMQ for instance.

## Implementation: the challenging part

Last but not least, you have to connect those 2 parts together: collecting events from your entities, and dispatching those.  
We have to collect events just after data is persisted, for consistency. For instance, we don't want to trigger events if there's a database failure which prevents our User from being saved.  
But the challenge is that we can't use any of Doctrine events: in all potential Doctrine events, ie. [postFlush](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/reference/events.html#postflush), `EntityManager::flush()` can not be safely called. It means that our event listeners won't be able to create new entities, or to modify some (or modify relationships). There are some workarounds, but there's no definitive solution. Code will be either brittle either complex.

So it leaves us with a 2 required steps:
 - on Doctrine lifecycle events, we can loop over entities implementing `RaiseEventsInterface` and collect events ;
 - later on, we dispatch all collected events.

As for the first part, an event collector would like this.  
I used successfully code below on previous projects, feel free to re-use it as a template or as is:

```php
namespace App\EventSubscriber;

use App\Model\RaiseEventsInterface;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\ORM\Events;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\Event;

class DomainEventsCollector implements EventSubscriber
{
    /**
     * @var Event[] Domain events that are queued
     */
    private $events = [];

    private $eventDispatcher;

    public function __construct(EventDispatcherInterface $eventDispatcher)
    {
        $this->eventDispatcher = $eventDispatcher;
    }

    public function postPersist(LifecycleEventArgs $event)
    {
        $this->doCollect($event);
    }

    public function postUpdate(LifecycleEventArgs $event)
    {
        $this->doCollect($event);
    }

    /**
     * You need to listen to preRemove if you use soft delete from Doctrine extensions,
     * because it prevents postRemove from being called.
     */
    public function preRemove(LifecycleEventArgs $event)
    {
        $this->doCollect($event);
    }

    public function postRemove(LifecycleEventArgs $event)
    {
        $this->doCollect($event);
    }

    /**
     * {@inheritdoc}
     */
    public function getSubscribedEvents()
    {
        return [
            Events::postPersist,
            Events::postUpdate,
            Events::preRemove,
            Events::postRemove,
        ];
    }

    /**
     * Returns all collected events and then clear those.
     */
    public function dispatchCollectedEvents(): void
    {
        $events = $this->events;
        $this->events = [];

        foreach ($events as $event) {
            // Here we use Symfony < 4.3 syntax:
            $this->eventDispatcher->dispatch(get_class($event), $event);
            // Otherwise you can do just this:
            //$this->eventDispatcher->dispatch($event);
        }

        // Maybe listeners emitted some new events!
        if ($this->events) {
            $this->dispatchCollectedEvents();
        }
    }

    /**
     * Optional, we will see why it can be useful later.
     */
    public function hasUndispatchedEvents(): bool
    {
        return 0 !== count($this->events);
    }

    private function doCollect(LifecycleEventArgs $event)
    {
        $entity = $event->getEntity();

        if (!$entity instanceof RaiseEventsInterface) {
            return;
        }

        foreach ($entity->popEvents() as $event) {
            // We index by object hash, not to have the same event twice
            $this->events[spl_object_hash($event)] = $event;
        }
    }
}
```

Now we need to make sure to call `DomainEventsCollector::dispatchCollectedEvents()` after we flush database.  
First option is to call manually, from our controllers and commands (commands from Symfony Console, which include data fixtures).  
Second option, if you want to automate it, is to have an event subscriber on `request.terminate` and `console.terminate`.    

The second option cause some overhead, if you use Domain Events only in part of your application it feels superfluous.  
In such a past project, I settled for that: developers had to manually call `DomainEventsCollector` service, but in `dev` environment, a listener was checking that no events were left undispatched. It combines both no overhead and a good developer experience. Here's the code we used, commented:

```php
namespace App\EventSubscriber;

use Psr\Log\LoggerInterface;
use Symfony\Component\Console\ConsoleEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class ForgottenDomainEventsSubscriber implements EventSubscriberInterface
{
    private $domainEventsCollector;
    private $logger;

    public function __construct(DomainEventsCollector $domainEventsCollector, LoggerInterface $logger)
    {
        $this->domainEventsCollector = $domainEventsCollector;
        $this->logger = $logger;
    }

    /**
     * Log if some Domain events were left undispatched.
     * Exceptions thrown on kernel.response are not handled so we can't throw exceptions.
     *
     * @param FilterResponseEvent $responseEvent
     */
    public function onKernelResponse(FilterResponseEvent $responseEvent)
    {
        if (true === $this->domainEventsCollector->hasUndispatchedEvents()) {
            $message = 'Some domain events were left undispatched!';

            $this->logger->emergency($message);

            // Change error code so it is obvious
            $responseEvent->getResponse()->setStatusCode(Response::HTTP_INTERNAL_SERVER_ERROR);
            $responseEvent->getResponse()->setContent($message);
        }
    }

    /**
     * Same check but on console.
     * Here we can throw some exception so the command will fail.
     *
     * @throws \Exception
     */
    public function onConsoleTerminate()
    {
        if (true === $this->domainEventsCollector->hasUndispatchedEvents()) {
            $message = 'Some domain events were left undispatched!';

            throw new \Exception($message);

            // ERROR will be displayed to the user
            $this->logger->error($message);
        }
    }

    /**
     * {@inheritdoc}
     */
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
            ConsoleEvents::TERMINATE => 'onConsoleTerminate',
        ];
    }
}
```

## Final word

**Domain Events are a powerful pattern**, which can be implemented in many different ways.  
Here I wanted to explain a relatively simple one, which does not compromise consistency or rely too much on manual calls. It is also compatible with "continuous enhancement" of an application, it does not require to rewrite all persistence calls to use another mechanism than Doctrine provided EntityManager (ie., a command bus...).  
In my experience, I found those pieces of code to work well, I hope they can help you too :)
