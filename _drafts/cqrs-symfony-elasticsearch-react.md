---
layout: post
title: "CQRS, Symfony, ElasticSearch and React"
date: 2019-06-11 12:35:30 +0200
categories: [Symfony, Application architecture, DDD, ElasticSearch, Javascript]
image:
  file: assets/images/posts/diablerets.jpg
  facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024,h_535,c_lfill,g_north/githubio/assets/images/posts/diablerets.jpg
  description: Diablerets glacier, from Quille du diable
  gravity: g_north
#commentIssueNumber: 4
---

_This post if the first of a serie about what I learnt after studying Domain-Driven Design
& related architecture patterns._
<!-- insister sur le retour réel d'expérience -->

Command Query Responsibility Segregation, or CQRS, is a very popular technical subject.
A Github search of "Symfony CQRS" returned 117 repositories, including some examples on Symfony 4,
a few bundles, a boilerplate and a skeleton (for Symfony 2/3).
But beyond all the hype, CQRS is at the core a very simple concept.
We will explore it in this article, and how it impacted modern application architecture.

Just a preliminery note: CQRS is not related _per-se_ to Domain-Driven Design.
I see those 2 as orthonal architecture patterns, one can be implemented without the other.
The source of the confusion is likely that they where both described in the "big blue book",
by Eric Evans. But I believe it is a mistake to always present both together,
they are better explained separately, they have each different use cases.


## Command Query Responsibility Segregation

CQRS pattern dictates to separate read _queries_ from write _commands_.
Each will have differents models. In practise, it means different data storage.
A schema is worth a thousand words, let's compare a basic Symfony application to one implementing CQRS:

<!--
https://mermaidjs.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcblxuICAgIFVzZXIgLS0-fFwiUE9TVCAvYXJ0aWNsZVwifCBDb250cm9sbGVyXG4gICAgZGIgLS4gXCJyZWFkKClcIiAuLT4gQ29udHJvbGxlclxuICAgIENvbnRyb2xsZXIgLS4gXCJ3cml0ZSgpXCIgLi0-IGRiXG4gICAgZGIoRGF0YWJhc2UpXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ
-->
<!--
https://mermaidjs.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBVc2VyIC0tPnxcIkdFVCByZXF1ZXN0XCJ8IFJlYWRfY29udHJvbGxlclxuICAgIERhdGFiYXNlIC0uIFwicmVhZCgpXCIgLi0-IENvbnRyb2xsZXJcbiAgICBDb250cm9sbGVyIC0uIFwid3JpdGUoKVwiIC4tPiBEYXRhYmFzZVxuICAgIHJkYihSZWFkIGRhdGFiYXNlKVxuICAgIHFkYigoV3JpdGUgZGF0YWJhc2UpKVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0
-->

## Implementing it with Symfony - enters ElasticSearch

## CQRS v2.0: Flux in React ecosystem
