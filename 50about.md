---
layout: page
title: About
permalink: /about/
---

<img src="/assets/images/romaric.jpg" class="profile-img" />

I'm a software engineer at [ASIT VD](https://www.asitvd.ch/) in Lausanne, Switzerland.
I focus mostly on web development, and Symfony framework (certified expert).
I do some Javascript and devops regularly, too.

I blog here, in English. I also blogged in French on [netinfluence's blog](https://blog.netinfluence.ch).  
I attend a few conferences every year and occasionally do public speaking.
More informations on [Talks]({% link 20talks.md %}) page.


## Contact details

<ul class="social-media-list">
    {%- if site.email -%}<li><a class="u-email" href="mailto:{{ site.email }}">{{ site.email }}</a></li>{%- endif -%}
    {%- if site.twitter_username -%}<li><a href="https://www.twitter.com/{{ site.twitter_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#twitter' | relative_url }}"></use></svg> <span class="username">{{ site.twitter_username| escape }}</span></a></li>{%- endif -%}
    {%- if site.github_username -%}<li><a href="https://github.com/{{ site.github_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#github' | relative_url }}"></use></svg> <span class="username">{{ site.github_username| escape }}</span></a></li>{%- endif -%}
    {%- if site.linkedin_username -%}<li><a href="https://www.linkedin.com/in/{{ site.linkedin_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#linkedin' | relative_url }}"></use></svg> <span class="username">{{ site.linkedin_username| escape }}</span></a></li>{%- endif -%}
</ul>
