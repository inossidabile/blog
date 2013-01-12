---
layout: post
title: "Redistributable Rails applications"
date: 2013-01-12 22:48
comments: true
categories: [Rails, Matrioshka]
---

Imagine you have a large Rails application that you are going to distribute. That's might be a new world-crashing CMS or incredibly modern Redmine fork. Every separate installation produced by a consumer requires different configs. Or maybe even some code that will adapt your product for particular needs using amazing internal API.

Clever consumer will also want to store such a "deployment" in his own git repository. And as the last point – he will definitely require a nice way to maintain ability to upgrade your product within required version branch.

**How do you achieve that?**

Let me share my story first. I manage two banking products: Roundbank and Smartkiosk. They are Rails applications. Every time bank wants to deploy Roundbank-based internet banking I need a way to:

  1. Get my core and using internal API create a nice new look that will match bank's design.
  2. Extend core with the transport methods that are required to integrate with bank's core banking platform.
  3. Support it.

First two steps are pretty easy. It can even be a fork on the Github. And then comes third. Release management crashes. Especially if bank has own team that's involved. Another downside of forks is that your consumer has the whole codebase inside his project. You might not think so but... damn! So provocative! You remember he's not supposed to change anything right?

<!-- more -->

### Gems

The solution to the dependency management is wide-known – Ruby Gems. Gems have nice versioning system that will solve the issue. You have a Rails application – can it be a gem at the same time? Answer is yes. 

I wrote [a tiny gem called Matrioshka](http://github.com/inossidabile/matrioshka/tree/master/lib/generators/matrioshka/templates). It contains the set of generators that will make everything on your behalf. Following sections will describe it's internals. You can skip it safely to the end of the article to read about gem itself.

So what exactly do we need to allow another Rails application include the whole application as a gem?

##### 1. gemspec, init.rb

Every gem starts with a gemspec and initialization routines. You will need the following files: `$application.gemspec`, `lib/$application.rb` and `init.rb`. Here is what Roundbank contains (patched a bit :):

```ruby
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'roundbank'

Gem::Specification.new do |gem|
  gem.name          = 'roundbank'
  gem.version       = Roundbank::VERSION
  gem.authors       = ['']
  gem.email         = ['']
  gem.description   = %q{Write a gem description}
  gem.summary       = %q{Write a gem summary}
  gem.homepage      = ''
  gem.files         = `git ls-files`.split($/)

  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ['lib']
end
```

```ruby
module Roundbank
  VERSION = '0.0.1'
end
```

```ruby
require 'roundbank'
```

##### 2. Models/Controllers

Rails has out-of-box solution called Rails Engines. All you have to do is to extend your `lib/$application.rb` a bit.

```ruby
require 'rails/engine'

module Roundbank
  VERSION = '0.0.1'

  class Engine < ::Rails::Engine
  end
end
```

Rails Engines system was created to make Rails applications extendible by gems. But it's abilities are underestimated. It will even run `config/initializers` and `config/environments` for you. In fact it will transparently include most of your project with just the following code.

##### 3. I18n, autoload_path, migrations

Mot of your project. Excluding some options. We need to help it a bit with a clever initializer.

```ruby 
require 'rails/engine'

module Roundbank
  VERSION = '0.0.1'

  class Engine < ::Rails::Engine
    initializer 'matrioshka', :before => :set_autoload_paths do |app|
      app.class.configure do
        config.i18n.load_path += Dir[Roundbank::Engine.root.join(*%w(config locales *.{rb,yml})).to_s]
        config.autoload_paths += %W(#{Roundbank::Engine.root.join 'lib'})
        config.paths['db/migrate'] += Roundbank::Engine.paths['db/migrate'].existent
      end
    end
  end
end
```

This will proxy your locales, autoloadable pathes and even migrations! Note that there is popular approach to copy migrations from gems. Two words: NO WAY. Described initializer will allow you to seamlessly run migrations from both sources. They will stay ordered.

##### 4. Seeds

Seeds are not handled by Rails Engines too. And moreover you can't improve your situation from within your gem. However all you need to do is to extend `db/seeds.rb` of descendant project with the following line:

```ruby
load Roundbank::Engine.root.join(*%w(db seeds.rb))
```

##### 5. Gemfile

This is the worst part. Ruby Gems are great. However some parts of it do not hold water. 

**You can not use gems from git**

Okay it might be a strange requirement. But did you never use it with the Bundler itself? It's extremely comfortable and useful. Are you ready to abandon it? I am not.

**You can not split gems for platforms**

Roundbank can work at MRI and JRuby. And it uses slightly different set of gems for different platforms. What am I supposed to do with that? There are some workarounds that invoke proper dependencies of a particular platform from within compilation hooks – don't even try those. They will not work with Bundler well. They will stay ignored for `:path =>` inclusion and even `:git => ` inclusion. The worst thing is that new Ruby Gems 2.0 are ought to be released. And still no progress.

The best option I was able to come up with is to copy host project `Gemfile` to every descendant project. Put it to, say, `Gemfile.roundbank` and then require:

```ruby
eval_gemfile 'Gemfile.roundbank'
```

##### Summary

As soon as these 5 steps are done – you can pack your new gem and use it from any other Rails application. At the same time host application will remain runable from itself also.

But why do all that steps manually if [Matrioshka](https://github.com/inossidabile/matrioshka/) can do that for you?

### Matrioshka

I tested this approach at Roundbank and fell in love. To extend it to other products and ease 5th step I created the Matrioshka gem. It will do every described step for you within it's generator.

##### Host Application (Gem)

Inject the following to your host application Gemfile:

```ruby
gem 'matrioshka'
```

Run Matrioshka install generator

```bash
rails g matrioshka:install
```

It will generate all the required additions and patches. For a typical application they will just work. However you probably should edit `$application.gemspec` to set proper meta information for your future gem.

##### Client Application (Consumer)

As soon as your gem is ready to rumble we can procceed to the consumer. Let's make it work within a new rails application:

```bash
rails new marakash
```

Add your application gem to the new Gemfile:

```ruby
gem '$application'
```

Run `bundle install` and then 

```bash
rake $application:link
```

Ta-dam. You are done here. Time to party hard!

Love.