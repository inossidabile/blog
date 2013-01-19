---
layout: post
title: "Dangers of Turbolinks"
date: 2013-01-18 21:35
comments: true
categories: Turbolinks, Rails
---

Turbolinks! This "award-winning" technology earned incredible amount of criticism in such a short time! But it still is on the roadmap of Rails 4. As an evangelist of client frameworks I did not find any interest in that previously. And now suddenly life has brought us together. So let's see if it really is THAT bad. And what are the reasons if it is.

### Part 1. Well-known problems

#### Document ready event

Problems don't keep waiting. [RailsCast #390](http://railscasts.com/episodes/390-turbolinks) starts the marathon with the most popular issue: Turbolinks do not call document's `ready` event.

```coffeescript
$ -> alert '123'
```

This code runs only during direct page loads. Turbolinks fetcher ignores it.

<!-- more -->

It has pretty simple workaround that is already wrapped into a tiny gem called [jquery-turbolinks](https://github.com/kossnocorp/jquery.turbolinks). It solves this problem for the particular jQuery framework (and same can be done same way for any other). Okay. This solution looks transparent. But is it?

#### Global scope does not get cleaned

Turbolinks clames it reduces load time due to the fact browser doesn't have to reevaluate your assets. True. But not only assets remain. The whole global scope saves a state.

Imagine we have a page with the script from previous example. Script is injected into the `body` tag. It could be i.e. some kind of external service inclusion. What happens in this case? It adds one more binding per each load. It evaluates one time for the first page, two times for second and so on. Bindings do not disappear automaticaly like before. You suddenly appear in a locked environment where nobody but you is responsible for page desctruction routines.

There is one sad but real rule: frontend developers do not write idempotent code. They never care.

### Part 2. Going deeper

#### Global scope does not get cleaned 2

The worst side-effect of this behavior however is not in bindings. They are easily catchable in particular case of `ready` event. Let's see what happens if we have heavy backbone application instead that `alert` script. Backbone applications are likely to use `window` as a global namespace to store reachable instances.

We have 2 pages **A** and **B**. **A** is the text-only welcome page. **B** is the page that bootstraps backbone applicaton and therefore links it to particular DOM node. Backbone has:

  * 4 structured views
  * 1 collection
  * 1 model

The collection gets cached to `window` namespace to be shared between views:

```coffeescript
collection: -> window.AppView.currentCollection ||= new AppCollection
```

So we load page **B**. Backbone bootstraps, creates the collection and works seamlesly. Until you go to page **A** and back. What happens in this case? We get _new_ Backbone app. And the _old_ collection. With the state it was left at.

Then things go worse. Imagine it was not a collection that was stored this way. Imagine it was a model or view. And they had bindings to DOM events. As you might forecast – they remain alive. But not the DOM they were binded to. Another point of failure.

#### Intervals and Timeouts

Global page scope includes a lot of different entities you might never think of. Another two popular functions that can raise issues are `setInterval` and `setTimeout`. The problem is mostly the same – whenever you reload a page, timers disappear. But not with Turbolinks. All the intervals will live forever until you stop them manually. Try starting your interval inside a particular page and watch their number growing. Welcome to time ghetto buddy!

### Part 3. Something you might not even think about

I've started studying Turbolinks from reviews. So actually when I got to it's source I was already aware of the described issues. The reason was simple – as an author of browser framework I already faced them at Joosy. And had to solve each of them at the framework level. But there's one thing at sources that shocked me like a lightning bolt.

**Turbolinks store DOM trees of last 10 loaded pages.**

Javascript does not have a way to directly erase an object once it was created. Engine automatically destroys all instances that are not referenced from anywhere. There are two things that make it awkward:

  * It's Javascript. Oppa-lambda-style.
  * Nobody ever cares

It's incredibly easy to drain all the RAM out of client with a large application. But it's affordable and, well, we can live with that since all that stuff is dead as soon as we reload a page. But thanks to Turbolinks it's no more!

Let me explain. Your large JS application is likely to be a huge graph that's INCREDIBLY linked. It's very typical for a JS app to have mostly atomic unload. In theory even with Turbolinks, as soon as we drop the page out and load the next one we are supposed to detach the application. Dereferenced application gets collected and our RAM is free again! But Turbolinks save DOM. And DOM has bindings. And bindings reference you application. So big parts of your application survive at page reload. Therefore in practice there's a HUGE chance that Turbolinks will boost RAM usage up to 10 times.

But... It's not the worst again! Turbolinks don't just store 10 last pages. They are stored for a reason. As soon as you go back – it restores your DOM. Therefore restoring your application parts. Now your application is likely to be broken – remember your botstrap has already been exectued several time for next pages. But some of bindings remain alive. How do you even debug that for god sake?

### What do you need it for?

Most of critics additionaly claim Turbolinks is pretty useless. It's up to you to decide: [https://github.com/steveklabnik/turbolinks_test](https://github.com/steveklabnik/turbolinks_test).

There is however small advantage that Turbolinks could give you – the ability to controll page switch animation. Unfortunately it doesn't have required hooks. If you need animation – you should go use full-stack browser framework.

### Turbolinks is the silent killer

Turbolinks claim that it's the successor to pjax that seamlessly works out of box. As you can see – it's not even close to that. Real problems of Turbolinks are hidden deep inside. Existing MVC frameworks like Ember or Joosy address such problems – they may use different approaches but they face them. Turbolinks silently ignore it. And if it will ever try start fighting – it will turn into another MVC framework.

Remember: with Turbolinks you might easily fix surface issues. But it's an iceberg so think twice. You have to write your code in a very special way to work with that. You are likely to have issues with legacy code. And you get almost nothing for that.