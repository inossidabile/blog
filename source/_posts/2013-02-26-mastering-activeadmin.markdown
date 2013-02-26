---
layout: post
title: "Mastering ActiveAdmin"
date: 2013-02-26 01:06
comments: true
categories: Rails ActiveAdmin
---

Did you know ActiveAdmin was awesome?

For the last 6 months I tried adapting ActiveAdmin to three projects with pretty different goals. And it was a great success for each of them. However everything comes with a price. ActiveAdmin has excellent DSL but it lacks architectural quality and feature-richness (mainly due to extremely slow development progress).

The main goal of this post is to share my vision of administration frameworks potential we could expect. While ActiveAdmin in my opinion is the first one that finally felt the ground. 

Blog post format is not the best one to gather all the issues (while GitHub definitely is) – so I'll keep it short addressing main of them. After "why I think AA is the true way" introduction I'll do a bit of interface nit-picking. And that's probably the most interesting part for you cause you can grab all that tiny improvements and add them to your own AA integrations. Second part on the other hand describes fundamental architecture lacks and possible alternative implementations.

<!-- more -->

#### So why I think AA is a perfect start

Here are some facts that I would like to set as a baseline:

* Sometimes admin interfaces might look very special. But most of them are okay to have typical layout.
* Most of admin sections are very likely to be CRUD-based (+ filters).
* You still need custom pages and custom actions for something very important and special.
* Admin sections can be based on domain entities (which are not always 1-1 to models).
* Interface features can be based on users' preferences (that sometimes overlap automation defaults).

The important thing to get is that Administration Panel is a totally **separate application**. It concludes your domain business logic into typical administration workflow. So the only thing required to make a perfect tool is to isolate domain-level modifications from basic trunk.

So the correctly formulated task would be:
  
> We need a tool that allows us to comfortably describe differentiations of our particular process from the default one. And the default one should be at its best.

It might sound trivially but most of competitors solve other issues creating their-own-problem-solvers. What can we extract of our formulation? Since our main goal is to describe deviation of one strict business-process we need a small language that works in terms of this business process. Forget configs. Forget class monkey-patching. We need to talk with it using process-specific language.

**And this is exactly what AA does.** Unlike everything else. Yes I do really believe ActiveAdmin is the only available tool that at least formulated the goal correctly.

Okay, to the solution. Ruby is a perfect language to express such a DSL. In fact having tiny DSLs for particular task is so Rubyish. And so awesome. What's more awesome is that AA uses popular gems exposing those DSLs within it's own. So there are not so many things you should learn about new specific language – most of them are already very likely to be familiar.

Unfortunately this is where the success stops. Correct formulation leads to correct paper solution (at least visually). But the quality and the result depend on implementation heavily. At the moment I'm writing this AA does not follow it's own conventions within it's architecture which is sad... But you are reading this to go deeper right? Let's try to change something about it or find another way out.

### In reality things go wild

One of the worst parts of ActiveAdmin is the way it is supported. We all are in debt of open-source. And especially those strong people that lead projects like ActiveAdmin. But this particular task requires constant attention to make a perfect brilliant from a rough diamond. Did you remember I told the default process had to be at its best?

I've gathered all the recipes described below into one repo: [https://github.com/inossidabile/mastering_aa](https://github.com/inossidabile/mastering_aa). Download and start it go live. Note that sometimes I intentionally put patches to the places that are not semantically suitable for them (like `config/initializers/active_admin` folder) to ease grouping. Consider regrouping of that code for a real project.

#### Respect internationalization!

I18n and ActiveAdmin are old enemies. Main roots of that go deep into architectural bugs (and we'll discuss that later). But first thing you want to monkey-patch after AA inclusion is this: [https://github.com/gregbell/active_admin/issues/1832](https://github.com/gregbell/active_admin/issues/1832). Without this patch AA will break `has_many` forms for models having UTF-8 localization.

Here's how to fix it: [config/initializers/active_admin/fix_form_builder_has_many.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/fix_form_builder_has_many.rb)

#### Chosen

![Chosen](http://f.cl.ly/items/31270T3Z3w3Y3D1K311D/chosen.png)

ActiveAdmin is pretty stylish isn't it? Suddenly is not when it comes to controls. AA has incredible amount of interface mistakes connected to controls. We are going to fix some of them and the first overall step is to include a `Chosen` library. What's funny - Chosen when integrated properly looks like it was initially meant for this design. It improves usability and looks so perfect. I have no idea what makes AA team ignore this fact.

Here are the files required to integrate it as well:

1. [Gemfile](https://github.com/inossidabile/mastering_aa/blob/master/Gemfile#L17) – include chosen assets gem
2. [app/assets/javascripts/active_admin/chosen.js.coffee](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/javascripts/active_admin/chosen.js.coffee) – simple script that will enable Chosen for all selects we intentionally marked
3. [app/assets/javascripts/active_admin.js](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/javascripts/active_admin.js#L2-L3) – include our script and Chosen itself
4. [app/assets/stylesheets/active_admin/chosen.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin/chosen.css.scss) – let's style our inputs a bit
5. [app/assets/stylesheets/active_admin.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin.css.scss#L13-L14) - include our new styles and Chosen styles

That's it. The only thing that is left is to mark required selects with `chosen` HTML class. There are several ways to do that. You can add `:input_html_options => { :class => 'chosen' }` to every select you write. Or you can patch input generation class. I really like Chosen look (and also I'm so lazy) so the latter is definitely a way I recommend: [config/initializers/active_admin/chosen.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/chosen.rb).

#### Numeric range filter

<img src="http://f.cl.ly/items/2l40221S3N0L3E0O3F1w/numeric_range.png" class="liquid" />

ActiveAdmin offers "more/less/equal number" comparison filter for numeric fields. This is not something you should live with. It might be more or less useful for ID navigation but come on! That's not like people are used to navigate through numbers.

The more typical interface is a range. If you want "more then" you fill in the left field. Otherwise you fill the right one. And what's more important you can find values that are in between.

ActiveAdmin has similar interface for dates but still no luck for numbers. Let's fix it:

1. [config/initializers/active_admin/filter_numeric_range_input.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/filter_numeric_range_input.rb) – filter implementation
2. [app/assets/stylesheets/active_admin/numeric_range.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin/numeric_range.css.scss) - nifty styling
3. [ap/assets/stylesheets/active_admin.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin.css.scss#L15) – include our new styles

Now you can use it this way:

```ruby
ActiveAdmin.register Foobar do
  filter :id
  filter :priority, :as => :numeric_range
end
```


#### Multiple selects

<img src="http://f.cl.ly/items/1P35390h3Q1n1i3j1B3m/multiple_selects.png" class="liquid" />

Another serious issue with controls of ActiveAdmin are check boxes. Creating and styling multiple selections (and especially multiple select filters) is a huge pain. It's more or less affordable for cases with 5-6 elements to choose from. But hey, it's not how things work again.

Fortunately we are already saved by Chosen and it's incredible multiple select mode (see the screenshot – it does rock hard). Note that Chosen has in-line search that allows you to navigate through associations so easily. Even through hundreds of them.

Within your forms you can use `:input_html_options => {:multiple => true}` but filters require some magic to start working. I have this magic for you:

1. [config/initializers/active_admin/filter_multiple_select_input.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/filter_multiple_select_input.rb)

And now:

```ruby
ActiveAdmin.register Foo do
  filter :id
  filter :kind, :as => :multiple_select, :collection => ['first', 'second']  
end
```

#### Sorting

<img src="http://f.cl.ly/items/2Z2q38150h0j2m281y3m/sorting.png" class="liquid" />

You can often find perfect ideas and pull requests among long-lasting and rejected AA issues. Adding ability to sort `has_many` entries is definitely one of them. Here is my variation of the same feature. It makes any form aware of nested children sorting. And also adds tiny styling like proper cursor and additional icon for the nested fields header.

Internaly it makes use of jQuery `.sortable` and therefore does not need any external libraries or frameworks.

Add `:sortable` key to your `f.has_many` call like in the following example. You can use any field to sort: they will receive ascending integers of the final order as values on submit.

1. [config/initializers/active_admin/sortable_forms.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/sortable_forms.rb) – the patch itself
2. [app/assets/stylesheets/active_admin/sortable_forms.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin/sortable_forms.css.scss) – a bit of styles
3. [app/assets/stylesheets/active_admin.css.scss](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/stylesheets/active_admin.css.scss#L16) – don't forget to include new styles
4. [app/assets/javascripts/acitve_admin/sortable_forms.js.coffee](https://github.com/inossidabile/mastering_aa/blob/master/app/assets/javascripts/active_admin/sortable_forms.js.coffee) – and a pinch of Javascript

```ruby
form do |f|
  f.inputs do
    f.input :title
    f.has_many :foobars, :sortable => :priority do |ff|
      ff.input :title
    end
  end
  f.actions
end
```

#### DateTime searches

To finalize our hackety session let's improve the way AA seeks through `datetime` fields. The filter itself looks like a range. And a range is supposed to contain the value of right field by default. But what happens if date was given and the column is of a `datetime` type? It cuts it to `00:00:00`. And the last day does not get included into the result set. This annoyed me long enough to patch it the following way:

1. [config/initializers/active_admin/fix_resource_controller.rb](https://github.com/inossidabile/mastering_aa/blob/master/config/initializers/active_admin/fix_resource_controller.rb)

### Bad luck of architecture

Alright wasn't that fun? Now let's get serious and talk about something that can't be fixed/extended so easily and fast. There are several things about ActiveAdmin that are totally wrong.

#### Rails integration

The way ActiveAdmin bootstraps is a huge failure. I'll concentrate on two particular parts of this process and leave the rest to your imagination.

##### ActiveAdmin requires and caches content of `register` blocks

And that breaks I18n support for a devastating number of DSL entries. Let's assume you have the following page:

```ruby
ActiveAdmin.register Foo do
  menu :parent => I18n.t('admin.menu.foo')
end
```

The `menu` call will only occur on bootstrap. And we are not done yet: it's going to occur **before** configuration evaluation. So no matter what locale you setup at `application.rb` – it will always use `:en`. And if only `menu` was the only one... There are some attempts to fix the issue at master at the moment but they cure symptoms and not the source.

A really long time has passed since this fundamental issue was raised. Up until now authors were solving it adding more and more places where you can use `proc` instead of fixed value. But it still can't be used anywhere.

At the moment the only proper solution to get around this is to add the following hack into your AA initialization code:

```ruby
ActiveAdmin.setup do |config|
  I18n.locale = :ru
  I18n.load_path += Dir[File.expand_path("../../locales/**/*.yml", __FILE__)]
  I18n.reload!
```

But! The real problem is that there is no way to change locale on the fly. Even you hack AA to force correct locale usage like described above it will get cached. No mater what locale you set afterwards it will still output Russian names. At the same time forms blocks that evaluate dynamically will get binded to current locale. So you better don't even try setting locale dynamically. And that's really really sad.

##### ActiveAdmin uses it's own require cycle

For some reason that's not quite clear to me (probably historical one) AA hacks Rails integration to not use Engine Eager Loading (tm). So every time you are in development mode it duplicates Rails behavior reloading `admin/` on its own. It breaks `Engine` API and self-extending capabilities.

This leads to one very unpleasant specificity – it's no so easy to split parts of your Admin Panel into subgems. I mean we all love Rails engines right? It's a great way to decompose stuff. And you can't use that with ActiveAdmin for no sensible reason. That's sad again.

I met this weird problem working on Matrioshka and had to hardcode workaround: [matrioshka/lib/generators/matrioshka/templats/engine.rb](https://github.com/inossidabile/matrioshka/blob/master/lib/generators/matrioshka/templates/engine.rb#L17-L20). This is a bad way to achieve modularity but at least an existing one.

#### ARBRE buffers

AA does not generally follow MVC and this is win. MVC is not a holy grail: describing Administration Workflow does not require MVC in most cases. To make mixtures of logic and representation readable it introduces ARBRE – HTML Ruby DSL. Yay! It's a really nice move.

But (I hate this word)! I mentioned earlier that ActiveAdmin plays role of meta DSL. It wraps existing gems like Formtastic and exposes them where possible. Unfortunately they don't play nice together. ARBRE and Formtatstic for example use encapsulated buffers and injecting blocks of one into another often leads to a VERY unpredictable result. Same goes to Rails helpers. Mixing those 3 together is a nightmare.

This is the first issue that can't be solved with a fast patch. It's just something you should consider if you start doing your own ActiveAdmin implementation.

#### Gems isolation and update rate

ActiveAdmin is a Rails Engine (at least mostly). It means it works within your project namespace and you get all the gems it uses internally as a present. Doesn't look like a problem until you get in conflict. ActiveAdmin does not work with fresh CoffeeScript (1.5.0) and jQuery. If you used them – you are in trouble. Same goes to any other gem it uses and there are enough of them.

I can see three strategies that could be used to reduce the harm of such conflicts or eliminate it completely.

1. Update often – watching dependencies is a duty for contributors and it has to be done. At the moment ActiveAdmin is bound to a `metasearch` gem that is deprecated for a year. Year! That's not so good :(.
2. Keep most of integrations in separate gems. Meta DSL should have points of integration that could be used by others to swap `Kaminari` and `will_paginate`. Or at least used to modify integration plug-in separately from the huge DSL core.
3. Do not tie to Rails the way everybody do that. Jump off the train: using `Engine` is not a right way to integrate with admin part. Being a Rack Middleware gives so much more flexibility.

Combination of modularity and possibility to create a real isolation could save us. But current implementation is on the other shore.

#### Heavy framework ties

The last thing I want to discuss is the integration level. We all know it's evil to tie entities. But ActiveAdmin is all about ties. It ties you to Rails, ActiveRecord, zillions of gems, etc. And I'm a real fan of being framework-agnostic. I believe that we finally came pretty close to the epoch where it's Ruby what we call a framework. It has Rake as transport part, Tilt as views, Sprockets as assets etc. Rails/Sinatra/... are just controllers and skeleton. Why would you bind to them explicitly for the god sake?

I did already propose switching to Rack-level integration to solve gems isolation issue. This and proper modularity could make it absolutely agnostic to frameworks. Not from the start of course. But it's freedom degree will be more then enough to achieve that in nearest future. Current AA implementation makes it close to impossible.

There is one downside in that though. It's very likely for a common administration panel to have one or two specific scenarios that require working with controllers and native low-level MVC. Currently you just get down to Rails when you need it. If we use Rack – in theory you can end up with having different type of controllers among one application.

But (this is the positive one)! I've already encouraged you to consider your administration panel a separate application and I still do. I can't see anything *that* bad in having Sinatra controllers for your administration panel while having Rails controllers for the other parts of your site. It's probably a matter of taste and habit.

### Hero! Come and save me!

ActiveAdmin DSL is incredible. But architectural approaches it relies on dispell magic. I constantly hear (and see) another attempt to create **NEW AND AWESOME ADMINISTRATION AUTO PANEL**. Okay folks. You want to make world a better place? Me too. Get ActiveAdmin DSL. Get Sinatra and Rack. Get this article. Mix it up and give us ActiveAdmin 2.

We really need it!

P.S. If you are seriously considering to start such a project in MIT – I'm in.