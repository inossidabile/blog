---
layout: post
title: "The Protector!"
date: 2013-06-04 22:00
comments: true
categories: [Security, Heimdallr, ORM, Sequel, ActiveRecord]
---

More than a year ago me and [Peter Zotov](http://whitequark.org/) released [Heimdallr](https://github.com/inossidabile/heimdallr) – gem allowing to control models' security using shiny DSL. It was an extraction from a huge API backend project where it was used to consolidate access control, ease testing and DRY controllers.

Heimdallr was a proof-of-concept release and while I really like DSL part I never had a chance to seriously use it anywhere else. It appeared to be **way** too paranoid, difficult, slow and sometimes even buggy – it was so stubborn it didn't feel Ruby way at all. But what's even worse – it was incompatible with almost anything trying to work with ActiveRecord besides really basic interaction. Even with things like [Kaminari](https://github.com/amatsuda/kaminari).

Heimdallr as a proof-of-concept could afford having technical issues. And what's good about having technical issues is that usually they can be solved. So I decided to make a Ruby-way clone of Heimdallr propagating the same idea (with similar DSL) but with really different implementation base and ideology. 

And the first thing I fixed was the name: meet [Protector](https://github.com/inossidabile/protector).

<!-- more -->

### Usage

**This post is not meant to describe how to use Protector – instead it's here to explain possible use-cases and future possibilities. If you are after the API and general description, please refer to [its README](https://github.com/inossidabile/protector#protector).**

### Evolution

If you ever used Heimdallr before you might be interested in particular differences. So here are the key changes that make Protector totally another story:

  * Unlike Heimdallr that was trying to act as a duck-type compatible proxy, Protector works as an extension. It carefully modifies ORM from inside and theoretically should not affect any other gems.
  * Heimdallr was trying to protect a model like a black box. Protector is after persistence process. It doesn't interrupt attributes modification but instead injects creation and updation security validations.
  * Protector trusts you a bit more. Heimdallr puts hands on everything even custom SQL queries. Protector doesn't act that agressive – it only works at object level.

And the improvements that I always wanted to have at Heimdallr:

  * It has support for several adapters! There are only two of them for the moment – AR and Sequel. But two beats one. And I'm after Mongoid and DataMapper as well.
  * It supports custom actions. Besides basic `readable?`, `updateable?`, etc actions it lets you to define your own.
  * It works well with both strategies of eager loading (yay yay).
  * It has perf tests! ^_^

### The reason

We have `CanCan` and we have `Strong Parameters`. Why would we need Protector then? Well, there are several reasons why.

#### Comfort

Unlike `CanCan` and `Strong Parameters`, Protector is model-based. And therefore is easily and directly accessible from any part of your software where you use models. You can use it at controllers, queues, tests and even console in straightforward and handsome way. You can achieve close behavior with `Ability`, but you have to think about proper includes and additional entities which is not always good. Even if we reduce it by 3 LoC – okay, why not?

#### Centralized security management

Another and probably the most important thing is that since we are working on model level – we can manage fields. `CanCan` operates with entities and you are supposed to manage fields on your own. Here comes `Strong Parameters` functionality but it's heavily bound to controllers (at least if you use it in comfortable way). So you get your security scope smeared. With Protector you get all your security logic at one place. Easily-readable. Easily-testable. Easily-maintainable. At all levels.

Rails and most of Ruby web apps are Data-centric. We are used to the fact that it's models' duty to control data integrity. Could one consider security restrictions being a part of the integrity? I believe the answer is yes. And Protector gives you a way to implement that layer of integrity check seamlessly.

#### DRYing your code

Initial reason for Heimdallr to appear was not clarifying security restrictions though. It was an additional task. We required this kind of domain description to DRY the code. As I mentioned previously it was an extraction from a big Rails-based JSON API backend. Typically such backends mostly consist of basic CRUD implementations. And with Protector this code can be mostly inherited from base controller. It requires even less code comparing to things like `Inherited Resources` or (again) `CanCan`.

#### Accessible rules reflections

Another bonus you get having centralized security management is having security reflections for every model (or even data source relation). It's not that noticeable for classic web applications but it hits when you come to APIs. Especially when it comes to Hypermedia APIs. Having ability to predict what exactly can be accessible and manageable for particular client might be saving.

### Roadmap

I'm approaching three main goals at the moment: more adapters, better controllers, wider DSL.

#### Adapters

Additionally to AR and Sequel I'm after Mongoid and DataMapper. However three days before I finished the first implementation of Protector, the DataMapper team has announced that DataMapper 2 has been renamed to ROM. I'm not quite sure if somebody might want to use it with the first version of DataMapper so I guess it will be delayed until the arrival of ROM.

#### Controllers automation

Heimdallr was packed with CanCan-like controllers extension called [Heimdallr::Resource](https://github.com/inossidabile/heimdallr-resource/). Protector will get the same. And again I'm not completely sure if it will try to mimic `CanCan` like Heimdallr::Resource did. But it will greatly reduce the size of controllers for sure.

#### DSL extensions

Protector gives you basic points of control over CRUD. But as long as we work with both, instances and scopes, we can extend the possibilities. For example one thing I'm thinking about is the `limit` rule that could control maximum per-query selection limit.

The balance is very important here – Data-centric design is often the most suitable pattern for web application but it doesn't make models the only member of the orchestra: models are already claimed for being too heavy. So this point will be developed with caution.

### Post Scriptum

I'm currently migrating the initial service that Heimdallr was extracted from to Protector. It's not production-tested yet but it's approaching it. It has performance tests and it's 99% covered with specs. If you like the idea – try it and let me know if it works for you.

Thank you! :bow: