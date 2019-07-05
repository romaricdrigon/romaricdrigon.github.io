---
layout: post
title: "Stop repeating yourself in Doctrine and Symfony forms with Value objects"
date: 2019-07-05 16:53:45 +0200
categories: [Software architecture, Domain-Driven Design, Symfony, Doctrine]
description: |
  Lorem ipsum
image:
  file: assets/images/posts/tsanfleuron.jpg
  facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024,h_535,c_lfill/githubio/assets/images/posts/tsanfleuron.jpg
  description: Tsanfleuron glacier tip - 150 years ago, everything on the picture foreground would have been covered by ice
commentIssueNumber: 6
---

To continue my series on software architecture, I will go through different concepts and patterns popular in Domain-Driven Design.
We will see how they can be useful every day and in most project.   
The first concept is **value object**. Using those, you will get a better, more concise and more expressive, model. Practically, it helps to avoid repeating yourself in your Doctrine entities, as some logic and some properties will be factorized.  
Eventually, it could also help make your Symfony forms more readable. A common form type could replace some copy-pasted code.

<!-- more -->

## Definition

A Value object is a PHP* object representing a piece of information. In a more formal vocabulary, it represents a specific state.  
A very straightforward example: `Money`. "CHF 100" is composed of a currency (Swiss Francs), and an amount (100), with a given precision (watch out for floating-point precision in PHP!).  
I could write down an amount as an integer, ie. `100` but then it is up to you to guess the units (is it 100 CHF or 1 CHF with cent precision?) and comparing 2 values requires making sure the currency is the same. Here a value object is useful to fully represent all details.   
Moreover, we could use the value object to hold methods useful for any monetary value (ie., convert to another currency...).

Let's take another example: an `Address`.    
A specific address has nothing unique, it is equal to any other address with the same street, the same street number and the same city. So it is a value object, and not an _entity_.  
Here I used the **"equality" rule-of-thumb**, keep that in mind that whether you don't know if anything is an entity or a value-object.  
Similarly, two `Money` objects are equal if they have the same amount and the same currency. Versus a `User` person, who will typically be represented by an entity: 2 users of your software are not the same if they have the same name (!).

_* Note: PHP or any object-oriented language. Java, C#, anything with classes._

## Implementation

Value objects have a few interesting properties, since they represent _one_ value.  

First of all, you can't build a `Money` value object without giving an amount and a currency. In DDD terms, we would say that's an _invariant_ you have to respect, otherwise your object will be in an unstable state. So a **constructor with arguments** makes more sense than setters:  
```php
// is $someMoney object below ready to use?
$someMoney = (new Money())
    ->setAmount(100);
// No, it is missing the currency!

// Constructor arguments: that's better
$someMoney = new Money(100, 'CHF');
```

Secondly, for convenience, you want to add some **comparison method** to your objects.
In example:
```php
$myMoney = new Money(100, 'CHF');
$aPrice = new Money(99, 'CHF');

// Comparing is verbose,
// and requires to know the inner working of Money object
// (it has an amount, a currency...)
if ($myMoney->getAmountInCents() === $aPrice->getAmountInCents()
    && $myMoney->getCurrency() === $aPrice->getCurrency()
) {
    echo 'equals!';
}

// An "equals()" methods simplifies your code,
// and hide implementation details in your object
if ($myMoney->equals($aPrice)) {
    echo 'equals!';
}
```

Last but not least, objects are passed by reference in PHP. This leads to subtle issues, sometimes counter-intuitive and hard to debug.  
In example, let's imagine we are working on an e-commerce software:  
```php
$price = new Money(99, 'CHF');
$product = new Product();
$product->setPrice($price);

// Somewhere else in your code...
$price->setAmount(49);
$cheapProduct = new Product();
$cheapProduct->setPrice($price);

echo $product->getDisplayPrice();
// displays '49 CHF': the $price was modified, so both products change prices
```
Make your value objects **immutable**. You may think you will never fall for something as simple as in my example, but in real life, in thousands of lines of code, it happens. Make things simpler and less error prone from the beginning.   

To wrap up, my example `Money` value object class would look like this:  
```php
class Money {
    private $amountInCents;
    private $currency;

    public function __construct(int $amount, string $currency)
    {
        $this->amountInCents = $amountInCents;
        $this->currency = $currency;
    }

    public function getDisplayAmount(): string
    {
        return sprintf('%s %s', $this->amountInCents, $this->currency);
    }

    public function equals(Money $money): boolean
    {
        // PHP visibility is per class, not per instance
        // So a Money object can access another Money instance private properties
        return $this->amountInCents === $money->amountInCents
            && $this->currency === $money->currency;
    }
}
```

To go further, there are a lot of resources on that subject. In a previous comment on this blog, Adamo Crespi linked to [a great article](https://io.serendipityhq.com/experience/php-and-doctrine-immutable-objects-value-objects-and-embeddables/) he wrote.
Outside of PHP, you have the "traditional" entry [bliki entry from Martin Fowler](https://martinfowler.com/bliki/ValueObject.html) with Javascript and Java examples, and [some discussion in Ward Cunningham's wiki](http://wiki.c2.com/?ValueObject).

## How to store those with Doctrine ORM

Typically, value objects are "owned" by an entity. We saw our `Money` object is used to store the price of a `Product`, a Doctrine entity.
In DDD terms, the compound is an _aggregate_. Let's see how to store those.  

The naive approach would be to flatten the value object in the entity accessors. Then the `Product` would have `amount` and `currency` properties.  
This offers no advantages; there's a lot of boilerplate code, and low code re-use.  

A better approach is to have a custom [Doctrine type](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/cookbook/custom-mapping-types.html), which will convert the value object to its database representation. Because a Doctrine type is applied to only one property, one database column, usually this leads to some kind of serialization.  
This approach was popular at some point in the past. Types can be re-used in the whole project. But creating custom type is slow, and serialization in database restricts querying.

Doctrine 2.4 introduced **embeddables** ([documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/tutorials/embeddables.html)), and it is pretty much a perfect fit!  
We can keep objects (exclusively) in the model, and Doctrine will flatten objects while saving to/reading from database.
Even better, embeddables can be queried seamlessly in DQL ([in example](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/tutorials/embeddables.html#dql)).  
It is easy to set up, that's the option I would recommend in most scenarii.

In example, with again prices and products:

```php
use Doctrine\ORM\Mapping as ORM;

/** @ORM\Embeddable */
class Money {
    /** @ORM\Column(type="integer") */
    private $amountInCents;

    /** @ORM\Column(type="string") */
    private $currency;

    // ...
}

/** @ORM\Entity */
class Product
{
    /** @ORM\Embedded(class="Money") */
    private $price;

    // ...

    public function setPrice(Money $price): void
    {
        $this->price = $price;
    }

    public function getPrice(): Money
    {
        return $this->price;
    }
}
```

Last option, sometimes the same value object will be used at many places.  
Let's go back to the `Address` example I gave earlier.  
In our e-commerce shop, a Customer may have different addresses in his account. When placing an Order, he may choose one as a billing address, and one as shipping address. It is tempting to want to store all those in the same `address` table, so that would be an `Address` entity _for Doctrine_.  
Something crucial here is to see that **Doctrine vocabulary is not DDD vocabulary**. They have some differences, because **Domain-Driven Design vocabulary is about your domain**, whereas Doctrine is about persistence, that it-s to say **infrastructure**.  
So as long as you never expose an `Address ID` in your domain code, which would be very wrong since we considered addresses as value objects, they can be stored any way your infrastructure implementation like.  
**Always think about your domain first**, about what makes sense. In my current example, does it make sense for `Addresses` to be shared? If a customer edits an address, should his past order address be updated? Is the same street/street number/city sufficient to say 2 addresses are equals? etc.  
<small>(and it may prove my example doubtful!)</small>


## Value objects and Symfony forms

Since we now have some `Address` object, every time we need to have some address in a form, we can use an `AddressType` instead of mapping to every single property.

In example, it means that instead of having that:
```php
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\TextType;

class OrderType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('street', TextType::class)
            ->add('streetNumber', TextType::class)
            ->add('zipCode', TextType::class)
            ->add('city', TextType::class)
        ;
    }
}
```

We can move those properties to a shared type:
```php
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\TextType;

class OrderType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('address', AddressType::class)
        ;
    }
}

class AddressType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('street', TextType::class)
            ->add('streetNumber', TextType::class)
            ->add('zipCode', TextType::class)
            ->add('city', TextType::class)
        ;
    }
}
```

## Final word

I hope I have convinced you that patterns traditionally associated with DDD can be useful in every project, even if not sticking to a DDD-only approach.  
In that last part, we bound a Symfony form directly to a Doctrine entity. It is something which can cause issues, we can find a better way to do things. It may be the topic of another article, or if you like some existing resources, feel free to post those in comments below :)
