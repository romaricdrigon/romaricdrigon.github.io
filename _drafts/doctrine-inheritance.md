---
layout: post
title: "About Doctrine inheritance"
date: 2019-06-10 19:06:30 +0200
categories: [symfony, doctrine]
image:
  file: assets/images/posts/diablerets.jpg
  facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024/githubio/assets/images/posts/diablerets.jpg
  description: Diablerets glacier and "refuge de l'espace", from Quille du diable
#commentIssueNumber: 3
---

At a previous SymfonyLive conference [(slides here, in French)](https://speakerdeck.com/romaricdrigon/doctrine-en-dehors-des-sentiers-battus-7020e5ed-33a1-4f1d-9bf1-ea9062bdf5ed), I advised not to use Doctrine inheritance mapping. After a discussion with another developper last week, I realized the subject is worth an article with more details.

<!-- more -->


## 3 different flavors

Doctrine ORM offers 3 different type of inheritance mapping ([reference documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/reference/inheritance-mapping.html)):
 - Single Table Inheritance (STI)
 - Class Table Inheritance (CTI)
 - Mapped Superclass.

Let's start with Single and Multiple Class Inheritance. Those types change database schema, let's try to understand how data is stored.  
Imagine we have 3 entities, a Blog `Article`, `ArticleWithPicture` and `ArticleWithVideo`. `Article` entity has a few properties, and each child has some additional properties.
On top of that, Doctrine requires the parent entity to have a "discriminator" colum, which will contain the type of the entity (string). We call that one `discr`, and we assume the class name in snake case is used.

| Article |
| ------- |
| title   |
| content |
| discr   |

| ArticleWithPicture |
| ------ |
| picturePath |

| ArticleWithVideo |
| ------ |
| videoPath |


### Single Table Inheritance

Single Table Inheritance will map all those entities to the very same table in database. That table will have a column for every property of `Article`, `ArticleWithPicture` and `ArticleWithVideo`, they may be eventually `null`.  
Here is an example of what the `article` table could look like:

| id | discr | title | content | picturePath | videoPath |
| 1 | `article` | `Hello world` | `Lorem...` | `null` | `null` |
| 2 | `article_with_picture` | `My first picture!` | `Nec devio nec...` | `romaric.jpg`| `null` |
| 3 | `article_with_video` | `My first video` | `Aliquam et...` | `null` | `video.mp4` |

This option is not quite scallable. Entities with a dozen of properties will result in an huge database, and we could be concerned about "holes" in data. For instance, in the schema, `picturePath` and `videoPath` will always be nullable.


### Class Table Inheritance

Here comes Class Table Inheritance. In that mode, entities will share a table for the parent data, plus one table for every child own data.  
Let's continue with previous example. We will have 3 tables:

- a `article` table (for the parent entity):

| id | discr | title | content |
| 1 | `article` | `Hello world` | `Lorem...` |
| 2 | `article_with_picture` | `My first picture!` | `Nec devio nec...` |
| 3 | `article_with_video` | `My first video` | `Aliquam et...` |

- a `article_with_picture` table, with only one row. Notice the `article_id` referring to the parent entity:

| id | article_id | picturePath |
| 1 | 2 | `romaric.jpg` |

- and, finally, a `article_with_video` table:

| id | article_id | videoPath |
| 1 | 3 | `video.mp4` |

The schema is way more complex, but Doctrine will gracefully handle it and build entities from multiple tables. It implies a lot of `JOIN` operations, with eventually some impact on performance and query complexity (ie., writing manual queries becomes harder).


## A limited use, and what you really want to do

From a technical point of view, STI and CTI both brings some complexity,  along some technical limitations. For instance, lazy-loading won't be available in some scenarii.

But the biggest issue for me is that **most of the time, having entity inheritance does not make any sense**. My previous example probably looked bad to some of you, and you are right. Composition, ie. having 3 separate `Article`, `Picture` and `Video` entities, would have been a better choice.  
On real-world cases, I remember seeing only once entity polymorphism being justified. At that time, I implemented CTI, but later technical limitations, especially related to querying, slowed down the project.
**Hence my piece of advice: avoid STI and CTI.**


## Mapped Superclass

There is another type reference in Doctrine documentation I skipped: Mapped Superclass.
That one is more of a _mapping trick_, because it won't impact database schema. The "mapped superclass", the parent class, is not an entity. It merely provides some properties to children, which will be stored in every child table.

The perfect example is the `User` class from [FOSUserBundle](https://github.com/FriendsOfSymfony/FOSUserBundle/blob/master/Resources/config/doctrine-mapping/User.orm.xml). Typically your project `User` entity class will extend it, it provides some base fields (`email`, `password`...).
Oustide of that very specific scenario, ie. of a bundle providing a "base" entity, I don't see much use to it.


## Final word

I hope the different mode of Doctrine inheritance mapping, and their limitations, are clearer now. Most of the time, I think we want to achieve code reuse, or de-duplication, instead of _real_ polymorphism. PHP has a built-in mechanism for that: **traits**. Doctrine ORM support those out of the box, without any additional configuration. So, as a final word, you may want to consider using traits next time you want to share some properties accross entities.
