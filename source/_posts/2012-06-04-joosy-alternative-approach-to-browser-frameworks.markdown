---
layout: post
title: "Joosy: alternative approach to browser frameworks"
date: 2012-06-04 23:42
comments: true
categories: [Rails, REST, Joosy]
---

### Long story short

We created a new JS framework that doesn’t clone anything existing but uses slightly different approach. Joosy we call it.

* [Joosy website](http://www.joosy.ws)
* [Getting started guide](http://guides.joosy.ws/guides/basics/getting-started.html)
* [Github Repo](https://github.com/joosy/joosy)

### Real introduction

Ourdays even a lazy and his grandmother is doing his own JS MVC framework. The reason is simple: we really need it. The problem, on the other side, is that everyone is just cloning Backbone. There is also Knockout and Ember that went a different way. Still not enough to satisfy sophisticated audience. The problems are different. Some may dislike Handlebars. The others won’t fit general API. It’s a matter of taste after all. The options are always good if you choose between something different.

<!-- more -->

Half of year ago during some of new projects we started a tiny experiment. We took generally another approach to this problem: to consider JS Framework an extension to your backend. It should not be abstracted but exactly the opposite: binded to the server side as tightly as possible. It should replace your backend’s view layer. And be the View, just a View. What you usually call “model” is just a data set binded to the template. And JS logic is simply an extension to the template that makes it sophisticated but doesn’t make it a standalone application. We used Rails as a backend.

To make it real we had to implement all the common things Rails people are used to and properly extend them with the abilities that Rails lack. Better organization of code, new conventions for statefull environment and so on. With that we’ve reproduced forms, helpers and even the HAML everything working right in your browser.

Now that the time has passed and some of that projects are in production, we are ready to release this experiment as a mature feature-rich framework. Called “[Joosy](http://www.joosy.ws/)”.

Joosy is based on View terms. Pages, Layouts, Helpers and templates. Inside, it uses [CoffeScript](http://coffeescript.org) possibilities massively. To make Coffee better, Joosy includes awesome [Sugar.JS](http://sugarjs.com) library that feels like ActiveSupport. So you have better language that is sweetened.

Joosy has everything you are used to within another frameworks but with slightly another sause. It has routing, “models” with identity map, nice structure and much more. Like ActiveSupport, ActiveResource-compatible interface, background generators, preloaders, etc.

The practice shown: it’s very easy to jump in if you are used to Rails. It either does what other claims to do: it definitely saves your time. So no matter if you need this or not, please read through “[Getting Started](http://guides.joosy.ws/guides/basics/getting-started.html)” guide. At least we have something new to offer and it won’t be dull. And then, maybe, you’ll find a great use for it :).

Feel free to ask any questions at Stack Overflow using `joosy` tag. I will be there :)