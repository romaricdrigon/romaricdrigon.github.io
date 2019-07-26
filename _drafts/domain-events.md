---
layout: post
title: "Decouple your Symfony application using Domain events"
date: 2019-07-05 16:53:45 +0200
categories: [Software architecture, Domain-Driven Design, Symfony, Doctrine]
description: Lipsum
image:
    file: assets/images/posts/tsanfleuron.jpg
    facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024,h_535,c_lfill/githubio/assets/images/posts/tsanfleuron.jpg
    description: Tsanfleuron glacier - 150 years ago, all the rocks were covered by ice
commentIssueNumber: ~
---

In my [previous post](https://romaricdrigon.github.io/2019/07/05/value-objects-doctrine-and-symfony-forms),
we saw a better way to represent model data with value objects and Doctrine embeddable.
But sometimes, you need to represent not data, but what happened. That's where you need **domain events**.  
They are a lesser known concept, but they will immensely be useful to decouple your application. With those, you will be able to better isolate the domain logic.
Implementing them on a Symfony application, typically with Doctrine ORM, is challenging. Let's see what are the options, and try to find the best way.

<!-- more -->

## What they are

Domain events are small PHP object representing something which happened. In a more formal vocabulary, they indicate a state change in the system.  
Not everything in an application, even is simple one, is represented by a piece of data you can store.
Think of a Bank account, it has a balance, and sometimes transactions happen (you pay for something, you receive your salary...).
Every time the balance is modified, you may want to initiate some actions, like warning the user, checking for fraud... No matter what caused it. Having imperative code, calling a method every time, is a burden. Imagine calling that very method when someone sends you money, but also when bank is charging you a fee, or interests are paid, etc. It will become very complex, too, as it may need more and more parameters.    
Throwing an event, as `AccountBalanceModified`, `MoneySent`, `InterestsPaid`, etc., allows to decouple what happened from what will happen (in event listeners), and so to better decouple you code. It also helps to isolate different technical domain, you don't want to handle e-mail or push notifications in the same piece of of code than updating the account balance.  

Domain events were first defined by [Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html) around 2005, though at first they were seen in a more specific way. Eric Evans later insisted on how important they are when using Domain-Driven Design, and he said he regretted not to have put more emphasis on those earlier (you can watch his talk [here](https://www.infoq.com/presentations/ddd-eric-evans/), is starts around 14:00). If your are not convinced yet, please check [this article](https://beberlei.de/2012/08/25/decoupling_applications_with_domain_events.html) from Benjamin Eberlei, which focus more on how they are beneficial to decoupling your application.

Events are typically named with a verb in the past tense (ie., `UserCreated`). You don't need to add any `Event` suffix, but you should group them in a specific namespace. I like `Model/Event`, not to mixed them up with (potential) infrastructure events (in `Event/`).   
Second, domain events should encapsulate all relevant data, as they represent a "snapshot" of something which happened.  
That rule is sometimes more challenging to implement, as objects are always passed by reference in PHP. But you don't want a listener to be able to modify your entity freely, that would be a side effect and a serious issue risk. So it is better to pass either scalar data either immutable data, and maybe sometimes you will need to clone an object.  
Finally, as usual, I recommend those to be immutable (no setters, use a constructor with arguments).  

To wrap up, here's how I would implement the event thrown when an user is created:
```php
namespace App\Model\Event;

use App\Entity\User;
use Symfony\Component\EventDispatcher\Event;

// We have to extend Symfony EventDispatcher base Event if we want to use the component, later
// It does not add much constraints, though.
class UserCreated extends Event
{
    private $date;
    private $userId;
    private $emailAddress;

    public function __construct(User $user)
    {
        $this->date = new \DateTimeImmutable('now');
        $this->userId = $user->getId(); // It could be used to identify user later
        $this->emailAddress = $user->getEmailAddress(); // Maybe we will send an e-mail?
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
And not by a controller, a manager, anything from your application (or infrastructure). In practice, doing so will lead to code duplication and inconsistencies. It would be easy to forget to fire the `UserCreated` event if you create `User` entities in three different places in your application. Some of those may even be out of your reach, for example if you use [FOSUserBundle](https://github.com/FriendsOfSymfony/FOSUserBundle) (not that I would recommend, but having entities created by someone else is a relatively common scenario).

Last but not least, it may be tempting to use Doctrine listeners, but in practice, it is not a good solution.  
Doctrine listeners have many technical limitations regarding how you can create new entities and whether you can or can not modify relationships, long-term, it will be a burden. And again, they are infrastructure code, it should not be responsible for domain-related logic.
So Doctrine listeners can not replace events raised from your entity, and they should not call directly domain events handlers.

_* Note: in pure DDD, we say they are throw by aggregates. Which will likely be (Doctrine) entities in a relatively simple applications._

## Implementation: the entity side

The implementation, at core, is relatively straightforward: domain events are PHP objects created and raised from a Doctrine entity.  
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

    // This method is totally optional, I like adding it because
    // it allows checking event type and a cleaner syntax.
    protected function raise(Event $event)
    {
        $this->events[] = $event;
    }

    // This method is needed for later
    public function popEvents(): array
    {
        $events = $this->events;

        $this->events = [];

        return $events;
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

// I like to suffix my interfaces, but you are free not to!
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
There's a specific scenario: User deletion. We can't rely on PHP destructor, it won't be called when the entity is removed from database. In that very scenario, I found [Doctrine lifecycle callbacks](https://symfony.com/doc/current/doctrine/lifecycle_callbacks.html) to be useful. But they won't do more than raising the event.

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

- a first approach
  - sent to Symfony event dispatcher (so they are routed to an event listener)
  - more elaborate version: routed to a Messenger bus (https://symfony.com/doc/current/messenger.html), so routing is easier & can be asynchronous
  - different scenarios


## Implementation: the challenging part



 - how to collect them?
   - we have to collect them as data is persisted (for consistency)
   - we need entity manager to collect them (we focus on gradual improvement, there)
   - we have to dispatch them after Doctrine flush
   - solution 1: service to manually call
   - solution 2: request listener
   - solution 3: decorate Entity Manager (https://symfony.com/doc/current/service_container/service_decoration.html)
   - solution 4: with replacing it
 - final word: powerful pattern, implementation is up-to-you. I found #1 and #2 to work well, but we saw many options to pick from.
