---
layout: post
title: "Rails acceptance tests coverage"
date: 2012-11-24 23:52
comments: true
categories: RSpec, Rails, Open-Source
---

Most of our banking products share the same architecture. We use Rails as a REST application server and [Joosy](http://www.joosy.ws) application working at browser as a client. One of the greatest advantages we get is the ability to cover the whole Ruby implementation with the acceptance tests. We use **requests** specs that are [part of RSpec Rails](https://github.com/rspec/rspec-rails#request-specs) integration. However it’s easier said then done: our remote banking app-server for instance has near 500 routes to test. And the number of active routes grows constantly.

Managing such a great amount of routes is a real pain no matter how good you organize your specs. To solve that my colleague [Andrew](http://twitter.com/ImGearHead) prepared a small rspec plugin handling exactly this task: counting what’s tested on your behalf.  We spent several days playing with it and increasing it’s functionality. Join us and have some fun with the [rspec-routes_coverage](https://github.com/inossidabile/rspec-routes_coverage) gem.

### Usage

Plugin will add the following stats to your basic RSpec output:

![](http://f.cl.ly/items/3F0G0l1J250j0a392m1O/rspec.png)

<!-- more -->

First line is for the total number of routes you consider “actual”. By default gem will harvest all the routes your application possess. As soon as you don’t want to test some of them you can use the following code to improve the situation:

```ruby
RSpec.configure do |config|
  config.routes_coverage.exclude_namespaces = %w(back)
  config.routes_coverage.exclude_routes = [
    /^\/$/,
    /^POST \/sessions/
  ]
end
```

Second line is for the number of “manually-marked-as-tested” routes. At first sight it may seem that as soon as your route got a request it can be considered tested. But sometimes it’s not. To give you some control over the situation plugin introduces the `describe_request` helper. Use it instead of RSpec’s `describe` passing in the route you want to mark as checked. Here is the tiny sample:

```ruby
require 'spec_helper'
 
describe ItemsController do
 
  describe_request :index, request_path: '/items', method: 'GET' do
    it 'lists items' do
      get '/items'
      # ...
    end
  end
 
  # another style:
  describe_request 'GET /items/:id' do
    it 'shows item' do
      get "/items/#{Item.first.id}"
      # ...
    end
  end
 
end
```

The third line contains the counter of routes that received at least one HTTP request.

And the final line shows you the amount of routes that were not tested in any way. So get ‘em and test ‘em!

### Verbosity

The default output (see the screenshot) will appear at any RSpec call to provide the basic summary. However you definitely require the ability to list routes of each category. To go deeper use the `LIST_ROUTES_COVERAGE=true` option. Also you can use the Rake helper that we prepared for you:

```sh
rake spec:requests:coverage
```

### Workflow

The resulting workflow could look the following way:

* Include Gem
* Exclude useless routes
* Write tests using list of pending routes to cover it all
* Wrap your tests into describe_request blocks to mark specs as manually checked
* Start “green acceptance” party

Enjoy! :)