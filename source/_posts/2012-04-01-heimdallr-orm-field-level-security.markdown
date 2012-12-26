---
layout: post
title: "Heimdallr: ORM field-level security"
date: 2012-04-01 23:02
comments: true
categories: [Rails, Security, CanCan, Heimdallr]
---

We are currently migrating most of our products to browser-side application. One of the worst issues it raises is proper permissions handling. There are no comfortable ways to implement context-based protection of models (and their fields) within ActiveRecord (Egor, say hi ;). `attr_acessible` is too weak. CanCan is too abstract (doesn't go down to fields).

We’ve figured out something awesome to solve this issue. Meet [Heimdallr](https://github.com/roundlake/heimdallr/) and it’s extension [Heimdallr::Resource](https://github.com/roundlake/heimdallr-resource). They will bring you a peace and security.

### Heimdallr

Let’s start from the deeper problem investigation though. Large part of Rails projects equates security to a REST restriction. The bigger projects sometimes fall down to a model to keep code DRY. And to keep your controllers/actions number from getting wild you may fall down to fields.

![](http://media.tumblr.com/tumblr_m1tdm3wF8m1r9yc7i.png)

<!-- more -->

For properly designed RESTful applications, 1st and 2nd levels are same. So we are left with:

1. Entity access level
2. Entity fields separate restrictions

Field-level management gets more and more important while your application grows. And Github’s discreditation is a great example of what you can get if you go “fields? Who cares?..” way.

To take a long story short, here’s what `Heimdallr` allows to define inside a model:

```ruby
class Article < ActiveRecord::Base
  include Heimdallr::Model
 
  belongs_to :owner, :class_name => 'User'
 
  restrict do |user, record|
    if user.admin?
      # Administrator or owner can do everything
      scope :fetch
      scope :delete
      can [:view, :create, :update]
    else
      # Other users can view only their own or non-classified articles...
      scope :fetch,  -> { where('owner_id = ? or secrecy_level < ?', user.id, 5) }
      scope :delete, -> { where('owner_id = ?', user.id) }
 
      # ... and see all fields except the actual security level
      # (through owners can see everything)...
      if record.try(:owner) == user
        can :view
        can :update, {
          secrecy_level: { inclusion: { in: 0..4 } }
        }
      else
        can    :view
        cannot :view, [:secrecy_level]
      end
 
      # ... and can create them with certain restrictions.
      can :create, %w(content)
      can :create, {
        owner_id:      user.id,
        secrecy_level: { inclusion: { in: 0..4 } }
      }
    end
  end
end
```

Using straightforward DSL inside your models you define both, model and field-level restrictions. `Heimdallr` will extend all required models with `.restrict` method. It will wrap your model class into the Proxy that can be used in a default manner.

```ruby
Article.restrict(current_user).where(:typical => true)
```

Note that an entity (second) parameter is not always available during evaluation. Therefore **all the checks depending on inner fields state should be wrapped with** `.try(:field)`.

These restrictions can be used anywhere in your project. Not only in your controllers. And that’s damn important. If you try to get anything that is protected – you get an exception. This makes the behavior predictable. But it’s so uncomfortable for the views! 

To avoid this `Heimdallr` has two restriction strategies. By default it will follow the first one, explicit strategy that raises an exception. However this is how you can switch:

```ruby
article = Article.restrict(current_user).first
article.protected_thing # exception!

@article = article.implicit
@article.protected_thing # => nil
```

### CanCan

For the most Rails projects the Security term is often an alias for the CanCan gem. While CanCan was really an epoch and it still is superb it has some problems:

* CanCan was designed to interfere with models as least as possible. It proposes architecture where you get your REST implementation protected but models are plain and unrestricted. By itself this plan is sometimes good and sometimes not. The fact is that it can not get to fields whatever you do.
* 1.x branch is dead and unsupported. It has some awful bugs for complex cases with namespaces and 2.x takes so much time to appear.

We’ve started `Heimdallr` as a tool to maintain security on a model level but it appeared that we have enough info to restrict controller among our DSL. So it took just a few moment to come up with `Heimdallr::Resource`.

The resource part of `Heimdallr` mimics CanCan as much as possible. You still get your `load_and_authorize filter` and this is how it works:

* If you don’t have your :create scope defined (and therefore can not create any entity) you are considered to not be able to request new and create.
* If you don’t have your :update scope, you can not request edit and update.
* Same goes for :destroy scope.
* Inside your actions you get protected entities so you can’t forget explicit restrict call.

Here is the example:

```ruby
class ArticlesController < ApplicationController
  include Heimdallr::Resource
 
  load_and_authorize_resource
 
  # or set the name explicitly:
  #
  # load_and_authorize_resource :resource => :article
 
  # if nested:
  #
  # routes.rb:
  #   resources :categories do
  #     resources :articles
  #   end
  #
  # load_and_authorize_resource :through => :category
 
  def index
    # @articles is loaded and restricted here
  end
 
  def create
    # @article is loaded and restricted here
  end
end
```

### REST API Providers

I’ve started my narrative from the roots of these gems, the restriction sync between client applications and server-side REST-based APIs. Let me tell you a bit about conventions we came up with.

Imagine you have simple role-based CRUD interface that you want to implement on a browser side. You have index/create/update/destroy REST endpoint. Restrictions give us following questions:

* Which entities am I able to get through index?
* Which entities of those are modifiable?
* Which entities of those are destroyable?
* Am I able to create a new entity?
* Which fields am I able to modify for one of those entities I’m able to edit?
* Which fields am I able to fill while creating a new entity if I’m able to?

The first question is already addressed by `Heimdallr` itself. You get your scope and you simply can’t get anything besides what you are allowed to.

To get further with 2nd and 3d we should use meta-magic provided by `Heimdallr` proxy:

```ruby
{modifiable: @model.modifiable?, destroyable: @model.destroyable?}
```

`@model` is supposed to be resricted. Add this fields to your serialization and you know the capabilities of current user.

#### Am I able to create? And which fields?

`new` method is a rare guest among REST APIs. And it’s a perfect place to determine if we are able to create entity and how exactly. Here is the code to list fields we can modify:

```ruby
Article.restrictions(current_user).allowed_fields[:create]
```

Within `Heimdallr::Resource` you’ll get restriction error if you can not create it at all. `Heimdallr` either defines `.creatable?` method so you can pass it on too.

#### Which fields am I able to update

The idea behind modification is quite the same. Just use `edit` method and `:update` keyword to retrieve fields that are accessible.

```ruby
Article.restrictions(current_user).allowed_fields[:update]
```

### Summary

Using `Heimdallr` and `Heimdallr::Resource` you can get your application protected quite well with no boilerplate. And what’s not really hot: you get amazing magic for your REST APIs. So use it and be happy. Remember, Homakov is [watching you](http://homakov.blogspot.com/2012/03/egor-stop-hacking-gh.html)!

ಠ_ಠ