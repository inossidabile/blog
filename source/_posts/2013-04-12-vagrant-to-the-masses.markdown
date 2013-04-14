---
layout: post
title: "Vagrant to the masses!"
date: 2013-04-12 21:06
comments: true
categories: [Hospice, Rove, Vagrant, Sinatra]
---

If you ever tried to unify development environments across project teams you probably heard of [Vagrant](http://vagrantup.com/). It integrates into a development process like a charm and works flawlessly. The chances that you stay with that as soon as you won an epic fight against provisioning are pretty high.

**But unfortunately the chances to win provisioning are not high at all.**

> There are two feature-rich options for provisioning: Chef and Puppet. Hereinafter I will intend Chef (as the most popular option) whenever I say "provisioning".

Setting up a virtual environment with Chef is NOT an easy task. Chef lacks centralized repository of recipes and this results into a huge mess. There are at least ten Redis recipes with different configurations for example. Top 5 Google results are outdated and will not even start. So while in general Chef is a great piece of technology, you better be a qualified DevOps with a set of ready and tested recipes to navigate nicely in its world.

What's for us as developers? Recently I had a chance to help with the development of something that sorts naughty provisioning out. On behalf of its author, Andrey Deryabin, let me present you **[Rove](http://rove.io)** &mdash; the Vagrant configuration service.

<!-- more -->

### How to use

We've gathered some working recipes for typical configurations and wraped them into a visual interface. Use a form to select packages you need, fill in required options and, ta-dam, you have a new and shiny environment.

![Rove](http://f.cl.ly/items/2z19450w3u1O1Y14011c/hospice.png)

Rove will generate a ZIP-archive containing two files: Vagrantfile and Cheffile.

1. **Vagrantfile** is a main Vagrant configuration. Typically it is supposed to be placed at the root of your project. Just put it whenever you want your box root should be. Additional documentation can be found [here](http://docs.vagrantup.com/v2/vagrantfile/index.html).

2. **Cheffile** describes sources of cookbooks we use to provision packages you demanded. It's used by [Librarian](https://github.com/applicationsonline/librarian) to download all the cookbooks you need including referenced dependencies. Unless you already have it install it using `gem install librarian` command.

To finalize the setup and run your box you should:

* put both of files to the root of your project (it will be the root of a virtual box)
* run `librarian-chef install` to grab required cookbooks
* run `vagrant up` to download, provision and start your brand new box environment.

### The goal

There is something more behind Rove than just a web interface. The interface itself is based on a small DSL that allows you to help us make the service better. Currently it consists of 12 recipes but we hope it's just a start. Rove sources are hosted at [Github](https://github.com/aderyabin/) and you are free to extend the whole service with new recipes by using [pull requests](https://github.com/aderyabin/hospice/pulls).

That's said: Chef recipes' reality is a big mess at the moment. We hope to separate the wheat from the chaff. And if you can help &mdash; you are very very welcome.

We have prepared a [nice introduction to the DSL at README](https://github.com/aderyabin/hospice#dsl-description). Duplicating it here would not make a lot of sense. Let met introduce you a real package to demonstrate how easy it is instead:

```ruby
# :redis is an id of package
# It will also set default title to 'Redis'
Rove.package :redis do

  # Let's assign it to the proper category
  category 'Databases'

  # And activate required cookbook and recipe
  cookbook 'redis', github: 'ctrabold/chef-redis'
  recipe 'redis'

  # This is a typical configuration option
  # It will appear as a textual input field within web interface
  input :bind do

    # And as a required value it has to have a default value
    default '127.0.0.1'

    # This block will influence resulting provisioning config
    # All the hashes returning from `config` methods will be merged deeply
    config {|value| {redis: {bind: value}}}
  end

  input :port do
    default '6379'
    config {|value| {redis: {port: value}}}
  end
end
```

You can found another bunch of live samples here: [/packages](https://github.com/aderyabin/hospice/blob/master/packages/).

---

Personally I'm pretty excited about Rove. It's something that made Vagrant affordable for me &mdash; I don't have to spend days seeking for a proper recipe anymore. And I really hope Rove will get a chance to save a bit of your time too <img class="icon" src="https://a248.e.akamai.net/assets.github.com/images/icons/emoji/bow.png" height="20" />.