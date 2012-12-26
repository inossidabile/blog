---
layout: post
title: "Conventions! I kill you!"
date: 2012-04-08 23:31
comments: true
categories: [Management]
---

For the development speed and quality there are a lot of factors like motivation, management style and all that stuff. It is important indeed. But they are quite common. I’ve seen a lot of SCRUMified happy teams that spend years to create large but straightforward projects. Why is this happening over and over? The wrong points of motivation and incorrect tasks prioritization are the roots. But besides project organization these roots also have an inner reason: the conventions problem.

To take a long story short, here are three rules I encourage you follow:

* If you have the requirement for a project-level convention, run away, you are doing something wrong.
* All the things you can not solve with the existing tools and conventions should be turned into libraries and released publicly.
* Release should be fair. It should be available on GitHub and you should notify the community about what you did.

The years of “keep your code reusable” paradigm make this sound so trivially. But there’s a great difference between just organizing your code into reusable blocks (inner project conventions) and creating the open-source libraries with public promotion. The latter is the key to success.

<!-- more -->

For the years new projects start from the same thing: we come up with coding style conventions and basic rules about how we are going to do what we have to do. Modern times improved that approach bringing us a ready set of conventions from your framework or even language. Let’s take the Rails framework as a baseline since it is well known for its “conventions over configuration” propaganda. So it appeared that conventions help you avoid thinking and concentrate on development.

Great! Now we start quickly and go deep into the problem we solve. While the project grows we meet the problem that framework doesn’t address. We search for extensions and what happens if there’s nothing that can help us? No probs, we address it ourselves and create new inner project “convention”. Yay! Code is DRY and everyone’s happy.

I tell you something provocative but that won’t allow your project turn into a mess. 

#### If you have the requirement for a project-level convention, run away, you are doing something wrong.

No matter how motivated and experienced your team is, the conventions of a project will never match conventions of a framework or its’ extensions. The reason is simple: there’s no community pressure. The deadline is scary. We come up with concessions and do only something we have a reason to do. There’s totally no need in updating conventions description. They just work. Everyone on the team is familiar. There’s nothing that can harm. But…

1. Newcomers. The project team can change. The worst part is not even the fact newcomers will spend time trying to learn your custom conventions. The problem is that they can get them wrong. If your convention is not documented and covered with samples enough people will distort it.
2. Project went to a hold/slow/support state. And you start another one. And suddenly discover you need something similar. You just need to adapt it a bit. The chances you don’t remember your own solution well enough are very high. The chances you’ll need to modify it a bit to adapt are even higher. Together with convention distortion this leads to the only option: fork it.

Fork will break the main idea, the code portability and independency. And it will greatly increase support costs. So to avoid ending up like this we can add another rule:

#### All the things you can not solve with the existing tools and conventions should be turned into libraries and released publicly.

Sit, relax and try to come up with a solution to your problem like it was typical. Forget about your project. Library is your project for now. You should try to address problems that are out your project’s problem but are neighbors of that.

As soon as you encourage this rule your development process will be split into two parts:

* Thinking part. You decide which dependencies you need. If you don’t have some of them you spend time creating them as external dependencies.
* NEVER decide on anything inside a project. If you don’t have a ready answer, you go to Thinking Part.

But the quality of the solution you get is just a first step. The main problem is still the lack of motivation to provide the support and develop your solution properly. Here comes the open-source.

#### Release should be fair. It should be available on GitHub and you should notify the community about what you did.

If you were not able to find the correct solution among existing you are 100% to not be alone. Help people and they will help you back. With the pressure to keep your library organized. 

Open-Source miracle is greatly underestimated in large companies. The classical benefits are the brand popularization and community cooperation. And the truth is that you get those only for successful libraries that are required by a large amount of people. Which simply is not true for a typical problem you address within your projects day-to-day. However open-sourcing has another incredible benefit, it pushes your team to care. Even 2 or 3 other consumers of your library will make your team work on it, support it and make it fresh, easy to learn and use in new projects.

So you should not only perceive your problem as a separate from your project. You should release it to a GitHub and shout everywhere: “I did a cute thing! This is no more a problem!”. Sometimes people will poke you into a nicer alternative which is good too: you still can drop your bicycle and use the right solution inside your project.

### So what do you finally get?

You get a set of nicely described libraries/framework dependencies which address exact problems. Newcomers can easily learn those and you can reuse it completely (no cheating) inside your new projects.

On the other side you get slim and VERY simple projects that only consist of a project-level business-logic. They are so easy and cheap to maintain.

Your people grow their names and experience. No training can replace live experience with community. And you should know your organization is just your team. Always.

I really like pictures. So I drawn this thing:

![](http://media.tumblr.com/tumblr_m25z70HE9e1r9yc7i.png)

Print it out and pin to your wall. I will make you one step closer to a great maintainable result among projects you create.

### P.S. Following this rules we’ve created:

* [WashOut](https://github.com/inossidabile/wash_out) (116 followers)
* [Heimdallr](https://github.com/roundlake/heimdallr) (76 followers)
* [Styx](https://github.com/inossidabile/styx) (17 followers)
* [Hashbang](https://github.com/inossidabile/hashbang) (15 followers)
* [Joosy](https://github.com/joosy/joosy) (276 followers)

Every project on this list got at least on issue. Half of them even got pull request. Even the simplest and craziest ideas appear to be required by society. Be the part of it, don’t miss your chance.