---
layout: post
title: "Incredibly convenient testing of front-end Javascript with Node.js"
date: 2013-08-17 23:28
comments: true
categories: [Testem, Node.js, Grunt, Mincer, Joosy]
---

You do have automated testing for your front-end Javascript application / library / framework don't you? And tests work equally well at console, browsers and Travis aren't they? And you run them in every possible browser on each release (or even push) right? If the answer is no, you might be doing it wrong. Let's see if can do something about it!

This article briefly describes a little piece of theory behind testing of standalone front-end projects, issues that you are likely to meet and the solution I came up with. Here's the shortcut [https://github.com/inossidabile/grunt-contrib-testem](https://github.com/inossidabile/grunt-contrib-testem) if you are already bored so far ;).

<!-- more -->

### Part 1. Introduction

 > If you know what Jasmine, Mocha, PhantomJS and Grunt are, skip to Part 2.

When it comes to testing, the first question is &mdash; which framework are we going to use? There are numerous articles on the Internet that describe pros and cons of those. Read this for example: [http://www.netmagazine.com/features/essential-javascript-top-five-testing-libraries](http://www.netmagazine.com/features/essential-javascript-top-five-testing-libraries).

I personally prefer [Jasmine](http://pivotal.github.io/jasmine/) and [Mocha](http://visionmedia.github.io/mocha/) (coupled with CoffeeScript and [Chai](http://chaijs.com) they feel so much like RSpec). But it's only a matter of taste in fact. Their capabilities are more or less equal.

Let's say we have a framework. Then we can manually create HTML file, include JS we want to test, open it in a browser and, well, test. It's certainly a kind of automatic testing already but still so far away from something reasonable. And the first thing to think about is Continuous Integration. You can only run such tests manually and see the results with your eyes. No "on-commit runs", no Travis integration. Sadness.

#### PhantomJS

[Phantom](http://phantomjs.org) is a thing that solves that. It's a headless invisible browser that you can control programmatically. Like this for example: [https://github.com/ariya/phantomjs/blob/master/examples/colorwheel.js](https://github.com/ariya/phantomjs/blob/master/examples/colorwheel.js). **Phantom** will play the role of our eyes and hands &mdash; it will open a page, check the results and pass them back to a "script runner". The "script runner" that can run on commit or at Travis.

#### Grunt

<img src="http://gruntjs.com/img/grunt-logo.png" style="float: right; margin-left: 10px; height: 80px">

And the "script runner" in its turn is [Grunt](http://gruntjs.com). Did you use **Grunt** before? [Go and try](http://gruntjs.com/getting-started) if you did not &mdash; it's incredible. **Grunt** comes with [sample project](https://github.com/cowboy/jquery-tiny-pubsub/) showing its main features. And guess what? It has testing section! The sample project uses [QUnit](http://qunitjs.com). Here we see: 

  * [hand-made HTML testing playground](https://github.com/cowboy/jquery-tiny-pubsub/blob/master/test/tiny-pubsub.html)
  * [single test file](https://github.com/cowboy/jquery-tiny-pubsub/blob/master/test/tiny-pubsub_test.js)
  * [external plug-in **grunt-contrib-qunit**...](https://github.com/cowboy/jquery-tiny-pubsub/blob/master/Gruntfile.js#L80)
  * [...and its configuration](https://github.com/cowboy/jquery-tiny-pubsub/blob/master/Gruntfile.js#L37-L39)

Unlike this one, most of real projects do not keep HTML playground manually crafted. They use another (more powerful) **Grunt** plug-ins allowing to generate that on the fly. Combining all that we have a **Grunt** task that:

  1. generates page with test
  2. runs **Phantom**
  3. grabs the result
  4. prints it to console
  5. exits with proper code (whether test succeeded)

That's pretty much it. This is exactly how Javascript front-end testing works basically. And it has some issues that you either experienced already or are going to experience.

### Part 2. Basic stuff and issues

> Have you already automated tests that run in both, console and browsers? If you already know the pains and just want a cure &mdash; pass on to the Part 3.

It's pretty easy to organize tests like its described in Part 1. It's a common way to solve the issue and there are tons of ready-made **Grunt** plug-ins for any framework no matter which one you use. Seriously, take a look at these for example:

  * [grunt-contrib-jasmine](https://github.com/gruntjs/grunt-contrib-jasmine) (I used this one before)
  * [grunt-mocha](https://github.com/kmiyashiro/grunt-mocha)
  * [grunt-contrib-qunit](https://github.com/gruntjs/grunt-contrib-qunit)

Alright! Isn't that simple? Install the plug-in, drop couple lines into a config, add proper runner to `.travis.yml`. That's it. Flawless victory. Victory? Doh...

#### Development mode

Single runs are working now. But that's just a start. To keep development process away from the "switch a window" game runners are supposed to watch modifications of the test files and restart tests automatically. Here comes [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch)! Right? Another entry to config and we are done &mdash; **Grunt** keeps process running and every time you save a file it runs test runner from scratch.

In simple cases (if we forgive **watch** its bugginess) it saves indeed. Let's just keep it in mind for now: we have the development mode and it utilizes **watch** internally.

#### Bundling

Libraries happen to be big. And sometimes even huge. But even mid-sized libraries typically use more then one file. And as you know front-end JS can't bundle itself, something has to help it (and this "something" probably runs from **Grunt** as well).

It means that before we actually test our code we have to bundle it. No probs you say, **Grunt** can hook tasks. We just make it run bundling task before the tests run. And now do you remember we have a development mode with **watch**? So we have to bundle code every single time we press Save in the editor and/or file changes. How long does it take to bundle your code once? ;)

With such approach **watch** really starts to drive crazy. It misses saves, crashes and every time you look at the console with the results of tests you have literally no idea &mdash; WHAT are you looking at. Are those results of the latest tests? Or is it bundling right now and the new run is yet to come? Did it even catch the last save? Finally you end up switching back to manual runs.

#### CoffeeScript

But even if you don't we are still not there yet. If your application is in CoffeeScript or another dialect, you probably use the same language for specs. So you have to compile them too. Now you have to compile both &mdash; your app and EVERY test file you have on EACH test run. Should I say there are can be MUCH more test files than application files? So how long did you say it takes to bundle your code?

Wait. Can't we only recompile files that actually changed? Not really. **watch** simply can't do that. And none of existing workarounds help with modern version unfortunately. The only thing that works (if you can call that _works_) is full recompilation on each change.

#### Run with something else but Phantom

In the real life nobody is going to use your code in **PhantomJS**. From time to time you have to check it with real browsers anyway. To do that we should manually open HTML that was generated by runner in the browser we target. If you are unlucky enough to deal with things that behave differently in different browsers you get back to the start. To the "switch a window" game.

It's not a 100% of cases for sure. Not even 50% of them. Is that what you might be thinking. At least so did I before I experienced it for the first time. And the circle has closed.

### Part 3. Testem, Mincer and the way they integrate

[Testem](github.com/airportyh/testem/) is simply awesome. Really. It's so incredible I can't even describe what I felt when I tried it first. Just watch this:

<iframe width="560" height="315" src="//www.youtube.com/embed/-1mjv4yk5JM" frameborder="0" allowfullscreen style="margin-top: 20px; margin-bottom: 20px;"></iframe>

**Testem** completely removes the difference between headless console runs and real browsers. Things just get bundled into a big ecosystem with single large green "CHECK" button. And I was happy until I tried to use it with a real project...

The marketing lies! Well... A little bit at least. **Testem** says it supports preprocessing. No it does not. I mean it does in some way &mdash; it allows you to run custom bash command before each test run and after that. It states it's possible to do anything from command line. Well... Technically it is. It's also technically possible to cross an ocean riding a dolphin.

---

But I didn't give up! Despite this limitation **Testem** still has a lot of stuff to support. At least we are going to solve the problem with manual browsers checking. This alone is a huge step forward. Yet another disappointment &mdash; **Testem** absolutely is (was!) not adapted for external programmatic integration. It's all kinda selfish and independent. So I did this:

**I wrote a Grunt task that was running Testem that was running bash script that was running Grunt that was compiling Coffee.**

We need to go deeper!.. This approach appeared to work even worse then before. So I took scalpel and forked **Testem**.

#### Resulting solution

**Testem** is perfect when it comes to:

1. Support of different testing frameworks
2. Headless runs using ready JS files
3. Watching set of files to rerun tests automatically
4. Integration with real browsers of your OS

We simply have to make it work through some kind of an API and make it include Javascript files from some kind of storage that handles preprocessing (handles incredibly fast and efficiently by splitting code in atomic parts and recompiling only things that changed).

In couple days me and [Toby](github.com/airportyh/) approved and introduced all the required API modifications. New version of **Testem** can:

  * Accept configuration from API calls. Config file is not required anymore.
  * Accept hooks as JS functions (instead of bash strings that run X that runs Y that runs...)
  * Pass data to hooks
  * Run `on_change` event when **Testem** notices file modification
  * Include JS from URLs not just paths
  * Override forced process destruction in the end of tests

And as a bonus new version supports Javascript configuration files (testem.js).

Okay then. Here I come, storage. At 1.2 branch of [Joosy](http://joosy.ws) we have adapted [Mincer](https://github.com/nodeca/mincer) to manage internal dependencies. And that's exactly the storage we need in fact. It suits us simply perfect. Here is the resulting workflow:

<img src="https://github-camo.global.ssl.fastly.net/800e21517caf421200ca027c0bd50da0a5b913f1/687474703a2f2f662e636c2e6c792f6974656d732f30513275327632633143316531333252334c33332f636c6f75642e706e67" style="float: left; margin-right: 40px;">

<ol style="clear: none;">
  <li>Start <a href="http://www.senchalabs.org/connect/">connect.js</a> on the port X and serve Mincer middleware</li>
  <li>Take a list of paths including paths to Coffee, CoCo (anything Mincer can handle), expand UNIX masks and build the resulting list of files that <b>Testem</b> should watch modifications for</li>
  <li>Map list of files to the list of URLs: http://localhost:X/path</li>
  <li>Pass watch and serve lists to <b>Testem</b> and run it.</li>
</ol>

<br style="clear: both">

As the result **Testem** watches modification of original files but it doesn't include them directly. Instead it includes them through **Mincer** that is listening the neighbor port. And **Mincer** in its turn handles all compilations and caching.

I have to say here that **Mincer** isn't just fast. It's incredibly smart when it comes to caching. You can rest assured that at any moment you get actual code for any file. But what's really important it has nothing to do with **Testem**. Even if it takes a while to compile all your code (which happens on the first run) &mdash; it's browser that waits. It makes **Testem** watcher feel relaxed and work well. It also means that at any time you open console &mdash; you can be sure you see the latest results. You'll just see zero progress if it's compiling right now.

All this stuff is wrapped into a Grunt plug-in. All you have to do to start using it is to install [https://github.com/inossidabile/grunt-contrib-testem](https://github.com/inossidabile/grunt-contrib-testem) and list files you want to test at the config like this:

```coffeescript
grunt.initConfig
  testem:
    basic:
      src: [
        'bower_components/jquery/jquery.js',
        'spec/spec_helper.coffee',
        'app/**/*.coffee',
        'spec/**/*_spec.coffee'
      ]
      options:
        # Run 8 browsers at parallel
        parallel: 8
```

<img src="http://f.cl.ly/items/0p3P3G0P2t2Y2g0O0G0e/Image%202013.08.18%205%3A00%3A15%20AM.gif" style="float: left; margin-right: 20px;">

And this time it is finally likely to work well. In my case it made me run out of issues with front-end tests completely. I even had to start enjoying this process in fact. What about you?

---

Please send kudos to incredible authors of **Testem** and **Mincer**: [Toby Ho](http://github.com/airportyh/), [Vitaly Puzrin](https://github.com/puzrin) and [Alex Zapparov](https://github.com/ixti). Not only they created something valuable but also keep maintaining it so well. I had a chance to interact closely with both of projects. They really deserve it :).