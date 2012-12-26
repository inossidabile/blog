---
layout: post
title: "Rails + REST: views nightmare"
date: 2012-03-24 20:56
comments: true
categories: [Rails, REST, Presenter, Pattern, JSON]
---

Rails is rapidly getting more and more popular as a comfortable platform for REST services. And it really is. We do Rails in this way for quite a long time already. There is however a real problem: **JSON views are unmanageable!**

At first it may look like everything’s just fine. All you need is <s>love</s> `.to_json` or [RABL](https://github.com/nesquena/rabl) is some particular cases. But then things go wild. And you start switching JSON Builders one after another.

### The problem

Let’s say you have a banking service. That’s like 30 models. Each has extended CRUD endpoint (extensions are maybe 3 or 4 methods per endpoint). Each model has like 10 or 12 fields which are quite common to be large strings. And off course all that stuff is insanely linked up to like 4 or 5 levels of `belongs_to`.

The another thing to remember is that in real life your JSON entities are not just dumps of your ActiveRecord attributes. Two very common things are conditions (whether an attribute should appear) and custom methods.

**The problem is that consumer often wants unique set of fields for EVERY method among EVERY endpoint. Set of relations' fields can differ too!** 

<!-- more -->

Imagine that, you have `Post` and `Comment` CRUDs. Every CRUD has 5 methods and potentially different field sets to otput. That's already 10. Also when you otput `Post` you might want to inline serialized `Comment` relation. This will give you even more potential field sets for `Comment`. Imagine potential number of field sets for deeply nested entity. And every different field set has its own conditions and custom methods. We gonna die, aren't we?

### Life with pain

The first thing we came with to was to leave the RABL alone. It looks fun and effective at first but you simply can not do anything complex and custom enough with that. And in real life RABL did not really go far away from basic `.to_json`. It's a pitty but when it comes to serialization straight declaration is the best declaration. And RABL was built upon magic.

We’ve tried a lot of different builders and finally stopped with [Jbuilder](http://github.com/rails/jbuilder). It’s both straightforward and allows boilerplate-less.

But the nightmare hasn’t gone. What do you do to keep your view DRY? Use partials, right. In a very short term that gave us 10-15 partials for each model. That’s **30 models * 15 partials = 450 files** at your `app/views` folder. Unmanageable. Again.

### The Presenter pattern

Another approach to solve this problem with better organization is the Presenter pattern. Since our views are just ruby code it’s a good step forward to fulfill it with OOP.

``` ruby
# example taken from http://quickleft.com/blog/presenters-as-a-solution-to-asjson-woes-in-rails-apis

class Api::V1::ResourcePresenter

  attr_reader :resource

  def initialize( resource )
    @resource = resource
  end

  def as_json( include_root = false )
    data_hash = {
      :attr1 => @resource.attr1,
      :attr2 => @resource.attr2
    }
    data_hash = { :resource => data_hash } if include_root
    data_hash
  end

end
```

So we reduced the number of files and grouped similar sets into the one method with parameters. It's 1-1 number of models presenters declaring sets of fields. Time to refactor around with [Draper](https://github.com/jcasimir/draper) gem. With help of Draper, our code turns into:

``` ruby
# app/decorators/article_decorator.rb
class ArticleDecorator < ApplicationDecorator
  decorates :article
 
  def the_very_important_fields_set( include_root = false )
    data_hash = {
      :attr1 => att1,
      :attr2 => attr2
    }
    data_hash = { :resource => data_hash } if include_root
    data_hash
  end
end
```

But now again we stuck into the DRY problem that was initially solved by JSON builders. It should be noted that we don’t really need to work with hashes internally. We can build our response from a set of strings using Jbuilder internally at our presenters.

At the moment I write this Jbuilder does not allow us to inject raw JSON string into response. There is another approach to get the required result though. There is a [nice fork](https://github.com/rails/jbuilder/pull/23) (pull request was approved so this is expected to be supported by Jbuilder very soon).

With help of this fork we can turn our presenter into following:

``` ruby
# app/decorators/article_decorator.rb
class ArticleDecorator < ApplicationDecorator
  decorates :article
 
  def the_very_important_fields_set( include_root = false )
    data = Jbuilder.encode do |j|
      j.(self, :attr1, :attr2)
    end
    data = { :resource => data } if include_root
  end
 
  def another_set
    Jbuilder.encode do |j|
      j.(self, :attr1, :attr2, :attr3)
      j.cards card.basic_fields(:include_transactions)
    end
  end
end
```

So here is the final look:

![](http://media.tumblr.com/tumblr_m1ebls2GWl1r9yc7i.png)

This strategy is expensive and useless for small services. But as soon as you start operating massive entities and large amounts of custom methods – this is the way. It makes your REST providers exact (serving minimum required amount fields), DRY and supportable.

### Keep on reading

You can find some real-life experience within this post: <http://blog.alerticus.ru/post/20183094648/rails-rest-avoiding-the-views-nightmare-practice>. If you think it's worth trying, keep on reading :).