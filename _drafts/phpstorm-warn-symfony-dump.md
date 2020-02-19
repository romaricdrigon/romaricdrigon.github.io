---
layout: post
title: "How to get a PhpStorm warning over Symfony dump()"
#date: 2020-02-20 17:16:36 +0200
categories: [Symfony, PhpStorm]
description: |-
  Sometimes, I forget a `dump()` in my code, and will commit it. It will crash in "prod" (environment), so you want to avoid that. Here is how to configure PhpStorm to trigger a warning.
image:
  file: assets/images/posts/arranmore-sunset.jpg
  facebook: https://res.cloudinary.com/duiajlyml/image/upload/w_1024/githubio/assets/images/posts/arranmore-sunset.jpg
  description: Arranmore lighthouse, Donegal county, Ireland
commentIssueNumber: ~
---

I haven't been blogging in a while. I was feeling like I was running out of material for my blog posts series, which I would call "Distilled Domain-Driven Design". The conclusion was a presentation at SymfonyCon Amsterdam, [A love story staring Symfony and Domain-Driven Design](https://speakerdeck.com/romaricdrigon/a-love-story-starring-symfony-and-domain-driven-design).  
Before moving to another topic, I wanted to share a quick tip. Sometimes, I forget a `dump()` in my code, and will commit it. It will crash in "prod" (environment), so you want to avoid that. Here is how to configure PhpStorm to trigger a warning.

<!-- more -->

## Rational

You don't want `dump()` (or aliases, such as `dd()`) to be committed. Those are debug tools, for dev only. Moreover, they are disabled in "prod" Symfony environment, so they will crash the page.  

I have been using [PhpStorm](https://www.jetbrains.com/phpstorm/) since a long time, and I quite like it. So let's see how to configure the IDE to detect those. We could also use some static analyzer or CI tool, but let's keep it simple. I just want `dump()` to be highlighted as a "warning". As a bonus, PhpStorm Git tool will tell you if you are committing some code containing warnings, so that's a double safeguard.

## Configuration

PhpStorm inspection is configurable in **Preferences**, **Editor** submenu.  
A little known option is **Structural search inspection**. It allows you to define your own inspection rules based on some pattern matching.

So let's go enable it by checking the checkbox at the end of the row, and select "Warning" severity:

![Configuring PhpStorm Structural search inspection](/assets/images/content/phpstorm-inspection.png)

You can now add some custom rules, under **Options**, let's add a **Search template**.  
I suppose that some AST-matching happens behind the scene, so syntax feels like writing lexer code. You have to indicate a pattern it will look for, a function call in our case, `$func$($args$)`, and then add a filter on the right side of the screen over `$func$`: `dd|dump`. You can enable **Words** option nearby.

![Structural search inspection rule](/assets/images/content/phpstorm-search.png)

Let's now check the result:

![dump() is highlighted](/assets/images/content/phpstorm-result.png)

I hope you will find it useful, and stay tuned for a new article series very soon :)

## Bonus!

As a bonus, a colleague last week made me discover a little-known feature, originally from Visual Studio: you can flag arbitrary code blocks as "foldable" ([reference](https://blog.jetbrains.com/phpstorm/2012/03/new-in-4-0-custom-code-folding-regions/)). In long files or when dealing with legacy code, poorly structured, it helps quite a lot with readability.

To create a code-folding region, surrounds it with `//region` and `//endregion`. I personally like to add some braces and an indentation so it stays structured even outside the IDE, so here's the result:

![Using regions in PhpStorm](/assets/images/content/phpstorm-region.png)

You can see the code folding "button" and the structure on the left of the screenshot.
