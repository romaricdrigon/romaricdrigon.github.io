---
layout: page
title: About
permalink: /about/
---


Software engineer and trainer at [netinfluence](https://netinfluence.ch) in Lausanne, Switzerland.
Interested in all things Symfony related ; devops ; web development.
Symfony certified expert, consultant.
Available for contracts.

<ul class="social-media-list">
    {%- if site.email -%}<li><a class="u-email" href="mailto:{{ site.email }}">{{ site.email }}</a></li>{%- endif -%}
    {%- if site.twitter_username -%}<li><a href="https://www.twitter.com/{{ site.twitter_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#twitter' | relative_url }}"></use></svg> <span class="username">{{ site.twitter_username| escape }}</span></a></li>{%- endif -%}
    {%- if site.github_username -%}<li><a href="https://github.com/{{ site.github_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#github' | relative_url }}"></use></svg> <span class="username">{{ site.github_username| escape }}</span></a></li>{%- endif -%}
    {%- if site.linkedin_username -%}<li><a href="https://www.linkedin.com/in/{{ site.linkedin_username| cgi_escape | escape }}"><svg class="svg-icon"><use xlink:href="{{ '/assets/minima-social-icons.svg#linkedin' | relative_url }}"></use></svg> <span class="username">{{ site.linkedin_username| escape }}</span></a></li>{%- endif -%}
</ul>
