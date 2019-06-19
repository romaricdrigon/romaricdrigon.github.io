---
layout: post
title: "CQRS, Symfony, ElasticSearch and React"
date: 2019-06-19 18:10:10 +0200
categories: [Symfony, Application architecture, DDD, ElasticSearch, Javascript]
description: |
  Command Query Responsibility Segregation, or CQRS, is a very popular technical subject.
  But beyond all the hype, CQRS is at the core a very simple concept.
image:
  file: assets/images/posts/jaman.jpg
  facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024,h_535,c_lfill,g_north/githubio/assets/images/posts/jaman.jpg
  description: Around rochers de Naye and col de Jaman, last week-end
#commentIssueNumber: 4
---

_Software architecture is an extremely interesting and useful topic.
A lack of architecture and you code will turn into some spaghetti mess.
But if you overuse it, you code will be overcomplicated and equally hard to work with.
A few years ago I dived into the academic literature, and various online sources.
This post is the first of a serie about what I learnt, what was useful in my past professional experiences
and my current approach to different methodologies/tools/patterns._

<!-- more -->

**Command Query Responsibility Segregation**, or CQRS, is a very popular technical subject.
A Github search of "Symfony CQRS" returned 117 repositories, including some examples on Symfony 4,
a few bundles, a boilerplate and a skeleton (for Symfony 2/3).
But beyond all the hype, CQRS is at the core a very simple concept.
We will explore it in this article, and how it impacted modern application architecture.


## What is CQRS?

CQRS pattern dictates to separate read from write.
Each will have different models, respectively _queries_ (think of a "SQL query", it specifies a read) and _commands_ (from the [Command pattern](https://en.wikipedia.org/wiki/Command_pattern)). The basic principle is nothing more, nothing less.  
A schema is worth a thousand words, let's compare a _standard_ Symfony application to one following CQRS:

<!--
https://mermaidjs.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcblxuICAgIFVzZXIgLS0-fFwiUE9TVCAvYXJ0aWNsZVwifCBDb250cm9sbGVyXG4gICAgZGIgLS4gXCJyZWFkKClcIiAuLT4gQ29udHJvbGxlclxuICAgIENvbnRyb2xsZXIgLS4gXCJ3cml0ZSgpXCIgLi0-IGRiXG4gICAgZGIoRGF0YWJhc2UpXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ
-->
<!--
https://mermaidjs.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBVc2VyIC0tPnxcIkdFVCByZXF1ZXN0XCJ8IFJlYWRfY29udHJvbGxlclxuICAgIERhdGFiYXNlIC0uIFwicmVhZCgpXCIgLi0-IENvbnRyb2xsZXJcbiAgICBDb250cm9sbGVyIC0uIFwid3JpdGUoKVwiIC4tPiBEYXRhYmFzZVxuICAgIHJkYihSZWFkIGRhdGFiYXNlKVxuICAgIHFkYigoV3JpdGUgZGF0YWJhc2UpKVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0
-->

Regarding implementation, read and write models could share the same SQL database, just have different tables.
Typically, one of the many reason to bring CQRS is performances.
The read table would contain denormalized data, nested structures instead of JOIN, etc.
It could also be updated asynchronously, so writes do not impact read performances, ie. with a bus / message queue.

If you want to read more on the subject, there is a great article on [Martin Fowler "bliki"](https://martinfowler.com/bliki/CQRS.html) and [this post by Udi Dahan](http://udidahan.com/2009/12/09/clarified-cqrs/) which go more into details.

Just an extra note before moving on: CQRS is not related _per-se_ to Domain-Driven Design.  
I see those 2 as orthogonal architecture patterns, one can be implemented without the other.
The source of the confusion is likely that they where both described in the "big blue book",
by Eric Evans. But I believe it is a mistake to always present both together,
they are better explained separately and they have different use cases.


## You may already use it: Symfony and ElasticSearch

We detailed how CQRS could be implemented, with a fast and denormalized read data storage,
a relational (SQL) write data storage, and some asynchronous update mechanism.  
But isn't exactly what [FOSElasticaBundle](https://github.com/FriendsOfSymfony/FOSElasticaBundle) offer?  
ElasticSearch can be used as an extremely fast document data storage, with nested structures.
The bundle provides Doctrine listeners, and you can even [push those to a queue](https://github.com/FriendsOfSymfony/FOSElasticaBundle/blob/master/doc/cookbook/doctrine-queue-listener.md).

I'm not saying this is an _optimal_ implementation. Neither what I described is the only possible implementation.  
But I find funny than a lot of developers deal with _something close to CQRS_, without even realizing it. Without fancy names or buzzwords. Just because CQRS is a way to solve real problems, and it is not as complex as you may be lead to believe.  

Personal story, on my first contract as a senior consultant, I met a team who implemented CQRS, without knowing it.
They had a Symfony application with a SQL database full a complex, entangled, data. They had some asynchronous mechanism writing a "flat" version to ElasticSearch. And they had a lot of users - sometimes, even peaks caused by TV ads - consuming that data. They had everything, but the name.  
Still, knowing the name of what you are doing helps. It helps you when looking for resources, both documentation and libraries. More importantly, the name helps you communicate what you are doing, in the way of a [Alexandrian language](https://fr.slideshare.net/JoshuaKerievsky/a-timeless-way-of-communicating-alexandrian-pattern-languages).


## CQRS v2.0: Flux in the Javascript ecosystem

In 2014, Facebook introduced the [Flux](https://facebook.github.io/flux/) architecture. One of its most popular implementation is [Redux](https://redux.js.org/), typically used with React, but we also have [Vuex](https://vuex.vuejs.org/) for Vue.js, etc.  
Let's have a look at the architecture, and compare it with CQRS:

![Flux diagram](/assets/images/content/cqrs-flux-diagram.png)
*Diagram from [Flux documentation](https://github.com/facebook/flux/tree/master/examples/flux-concepts)*

We find (again) our _unidirectional data flow_. Actions would be equivalent to _commands_, they encapsulate all information needed to perform an action, and they represent a "write". The _change event_ is the read model, the query. Both commands and queries share the same data store, but that's an implementation detail The CQRS architecture is about different models, not different data storage, again.  
In the end, the biggest difference comes from the reactive nature of Javascript apps. Data flows, and not only on User actions. But that's more of an update than really a new architecture.

The pattern from 2003 (Eric Evans) is still relevant today, that pattern being adapted from the CQS principle (Bertrand Meyer, ~1989). I hope I convinced you that studying software architecture is more useful that it sounds, and not to stop at looking at implementations.  **"Old" ideas are still useful when doing PHP or Javascript in 2019.**
