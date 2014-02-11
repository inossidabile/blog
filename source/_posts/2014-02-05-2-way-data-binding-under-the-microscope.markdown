---
layout: post
title: "2-Way Data Binding under the Microscope"
date: 2014-02-05 23:43
comments: true
categories: [Ember, Angular, Joosy]
---

2-way data binding has entrenched modern front-end development as a tool allowing you to avoid boilerplate code when working with DOM, concentrate on logic and isolate the logic from your templates. All the Angular is built around this piece of technology. Pretty big part of Ember joins that. And for the Backbone framework there are numerous extensions appearing every day. It makes a lot of sense actually: 2-way data binding is pretty awesome. However the technology has its own issues, limitations and mostly important implementation details (within different frameworks). Why not speculate about it a little bit?

<!-- more -->

### What is 2-way data binding after all?

JavaScript allows you to build interaction with a user responding to his actions with visual events. User enters some data into a form, presses "submit" button and a page shows loading indicator. Then (given the input contained some kind of error) invalidated fields get highlighted.

What's happening behind the scenes?

  * values of fields get stored into a variable
  * variable gets serialized into JSON and gets sent onto server with an AJAX query
  * DOM gets modified: loading indicator appears
  * as soon as the request finishes we see that status is not 200, then we parse response body
  * DOM gets modified again: loading indicator disappears, invalidated fields get highlighted

Classical jQuery code could work similarly to this:

  1. a function gets attached to the 'click' event of button
  2. the functon collects fields and puts them into a variable
  3. the variables gets serialized into JSON and goes to server
  4. we mark "request in process" state using another variable (to not react double clicks mainly)
  5. we modify DOM adding indicator
  6. as soon as the request finihes we parse response body and get invalidation data
  7. we modify DOM adding invalidation information and removing the loading indicator

 > Note that step 7 has huge risk of the encapsulation violation: we modify our view heavily. Where should this logic be? How to avoid duplication of code with something that generated the form initially? Basically it's the most popular place for projects to turn into mess.

2-way data binding lets us get rid of steps 2, 5 and 7. It also solves the issue with the encapsulation or – as it's trendy to think now – alows you to completely remove logic from your views.

Given we have a variable called `entity` holding JavaScript object. Each field of the form is associated with the attribute of the object (i.e. `<input name='name'>` with `entity.name`). At the same time the variable can include inlined object `entity.errors` containing invalidations list (it's empty by default). Then if we want to invalidate field `entity.name` we are doing something similar to `entity.errors.name = 'The field is too short'`. Additionally we set `entity.loading` to `true` when our AJAX is in progress.

To turn such object into required form we could use a template looking like this ([Underscore Template](http://underscorejs.org/#template) notation):

```html
<% if (entity.errors.name) { %>
<div class="error">
<% } %>
  <input name="name" value="<%= entity.name %>">
<% if (entity.errors.name) { %>
<%= entity.errors.name %>
</div>
<% } %>
<% if (entity.loading) { %>
Sending form...
<% } else {
<button>Send!</button>
<% } %>
```

Now if any change of form input automatically got delivered to `entity.name` and vice versa any change of any attribute at `entity` caused automatic refresh of DOM according to template definition – that would be the 2-way data binding. Your template completely describes the display logic corresponding to possible states. The application in its turn simply changes states.

All we have to do now is to bind form submission to button click event and work with `entity` variable. When the server responds – we put all the validation errors into `entity.errors`. That's it. Much easier isn't it?

### Actually no. It is not.

Unfortunately it is just an example. In real-life it misses a vast amount of meta-inforation that it simply can't work without. To make it work universally we have to solve the following problems:

  * we have to find a way to monitor `entity` modifications recursively. You remember it's still plain old JavaScript right?
  * we can't monitor all the modifications for all the variables and constantly redraw the whole DOM of the page. In best case it will end up being extremely slow. Otherwise it can lead to the loss of state of DOM parts. DOM should be modified as atomically as possible.
  * even if we section our page in zones, what's going to happen if we need to replace the part of text content not touching its siblings? Or how do you update (including the tag itself) two `<tr>`s out of 10?
  * sometimes we might want to animate automatic modifications instead of changing DOM instantly
  * we don't currently have the reflection of `input` to `entity.name`. We imagined having that but how do we actually implement that? Where is this logic supposed to be situated? At the application code with `bind` or at the view itself where the reverse binding is described?

To solve all that every framework offers its own unique solutions that add fly in the ointment to a beautiful theory. So let's dive in and see how 2-way data binding actually works internally and where do all those weird limitations come from?

We are going to dig into 3 examples: [Angular](http://angularjs.org) as a canonical sample of "new and better HTML", [Ember](http://emberjs.com) as a sample of more classical JS paradigm attached to the new tool. And certainly [Joosy](http://joosy.ws) as a demonstration of my subjective vision of experimental 2-way data binding that doesn't require declarative templating language.

### Object modifications monitoring

Sadly there are no good univeral ways to track objects modifications in JavaScript. All the existing solutions impose some restrictions on how you work with the object. There actually exactly two solutions: wrapping with setters/getters and external monitoring.

#### Setters/Getters (Ember, Joosy)

Properties working through getters and setters are the classic of programming. All the required data types get wrapped into extending classes (types) definining two methods: `get` and `set` (or two methods per property). Every call to the `set` method makes object generate "something has changed" event. The solution is very simple technically and for obvious reasons quite efficient. However instead of `entity.field = 'value'` you have to write `entity.set('field', 'value')`. The latter is not only less readable by a human being but also can affect some basic tools like [JavaScript Lint](http://www.javascriptlint.com) and code highlighting.

##### Ember

Getters and setters are the root of Ember's properties system. Not only they allow to monitor object modifications but also allow you to subscribe to the modifications of particular fields. Basically it looks exactly as described:

```javascript
entity.set('field', 'value')             // Object field
entity.set('field.subfield', 'value')    // Subobject field
```

On the other hand when we get to arrays (that Ember generalizes into `Enumerable`) everything gets a little bit more complicated and confusing. Now we have to additionally watch the length of array and also provide the ability to monitor changes of particular fied of every entry (Ember allows doing that using meta property called `@each`: for instance `@each.field` to monitor change of `field` for every array entry).

> If you watch the history of how frameworks evolve you will see one funny repeating loop. Complicated frameworks a-la Rails appear, take over the market and then get split into separate independent components. Components that can be used separately. That is often used to build variety of similar frameworks based on similar technologies. Watchable objects library could be the perfect candidate to become an independent library with a separate API.

##### Joosy

Getters and setters for objects work identically in Joosy. Excluding the fact that Joosy doesn't have inline fields monitoring. That's why arrays work simpler:

```coffeescript
collection = new Joosy.Resources.Array
collection.set(0, 'value')                # Index-based
collection.push('another value')          # Basic array actions
```

Besides that Joosy mimics Ruby allowing you to additionaly define direct accessors for properties.

```coffeescript
class Entity extends Joosy.Resources.Hash
  @attrAccessor 'field1', {'field2': ['subfield1', 'subfield2']}
```

Such definition will force Joosy to create JavaScrpipt object properties with [`defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) allowing you to work with them as if they were normal attributes: `entity.field1`. Therefore you can get back to `entity.field1 = 'value'` instead of `entity.set('field1', 'value')` – these are now equal. With this you have to manually define the list of fields, yes, but you get your proper JavaScript syntax back.

#### External monitoring (Angular)

Angular took its own approch. Instead of attempts to catch attributes modifications from the internals of the object it introduces the global monitoring system. The famous `$watch` method that is overabused in every second Angular application.

Angular architecture introduces "drawing cycle". One of its step is the check against the list of watchers if there are any changes. Every element of the list can refer to one or more functions that are called upon every change. Such solition allows you to transparently work with any way of attributes modifications (no need to know the list of fields or use the `set` method). This however is not a silver bullet as well.

  1. **Performance**

    If you used to work with Angular you probably noticed that after the particular amount of active `$watch` assignments everthing slows down critically. The more mobile your client is (and we are living in the mobile technologies epoch) the faster you get to this amount. Performance is the first payment for universalism.

  2. **Non-scalars**

    By default the modification check is being held by reference. It means that no matter how you change your array or object Angular is not going to see the change. One of the solutions to this problem is additional mode of `$watch` that allows you to force value-based comparison. It however is even slower. The other problem is that it still might not always work with complicated structures. On the other hand it's not a normal case when you need to monitor something like that in Angular: its architecture tries to avoid the need to monitor non-scalar data as much as possible.

Protip: try to search for `angular watch` [at StackOverflow.com](http://stackoverflow.com/search?q=angular+watch) to understand the scale of the disaster.

###  Page sectioning

Now that we can catch objects modifications the time has come to decide how we segment the page. What exactly are we going to update when object changes? Clearly if we output `entity.name` field for instance – we only have to update that value and only when it's changed. What if we output a table in cycle though?

#### Declarative templates (Angular, Ember)

This is one of the reasons making Angular to have "the other HTML" and making Ebmer to have Handlebars. Declarative description that is being parsed by their own internal parsers provides information about contexts of the bindings.

When we output `{% raw %}{{person.first_name}}{% endraw %}`, Ember creates a region and attaches that to the updae of `first_name` field from the `person` object. Angular works similarly: `<ng_repeat ...` creates a common region for the whole array and additionaly one inner region per each array element. If the array changes – the bigger region redraws. If one of the elements changes – the inner region redraws.

The conditional declarations (`ng_if` and `{% raw %}{{if}}{% endraw %}`) work in the same way. As soon as value is changed all the region redraws].

 > This by the way is one of the reasons that makes Angular recomdend to prefer `ng_show` hiding the region instead of rerendering it.

Devise of this approach is: "templates should not contain logic!". This however looks more like a consequence than a rule. Integration of full logical language into such declarative notation would be extremely expensive. So the wolves are fed and the sheep kept safe. We don't need language and we achieve the ultimate theoretical goal. Isn't that great?

Reality is tough though. Logic can't just disappear, it has to move somewhere. If it's not at template in any way – it should be defined somewhere as a state. It means that every little feature will add one more virtual state to your application. Loading indicators, accessibility rules, selection marks, each tiny switcher. The understanding of how serious this tax can be can come too late since you normally add tiny visual features at the very end of the project when you can't just switch the approach.

#### Manual sectioning (Joosy)

I always wanted to keep my beloved HAML (mixed [with CoffeeScript](https://github.com/netzpirat/haml-coffee)) and at the same time to keep all the abilities of 2-way data binding. To achieve that Joosy implements manual sectioning. Instead of declarative definitions we use classical helpers. One of them for instance allows you to define dynamic region and pass it the local data that this region will watch for.

E.g. to get the behavior similar to `ng_repeat` of Angular or to `each` of Ember you can do something like this:

```haml
%ul
  != @renderInline {projects: @projects}, ->
    - for project in @projects
      %li= project.name
```

As soon as the `@projects` array or any of its elements change the modification immediately applies to DOM. Note that region watchers expressly implemented to monitor collections with all the nested values. That's why you only need one segment in this case.

Besides inlining Joosy allows you to render a partial (just like in Rails) as a region. This case is even more common.

This approach gives you ability to work with any templating language you want. Any notation is fine (Joosy currently supports any templating language compilable by JST). The other benefit is ability to control rendering manually (for instance you can bind a region to the resource that is not outputed explicitly) which might sound destructive but can be useful rarely.

The cons of this approach are the flip side of pros. Not only you can control everything – you actually have to. No regions defined – no 2-way data binding. The other problem is the case with _huge_ regions (1000 rows per table). Since Joosy registeres just one region per array, any modification will alway redraw the whole table. Even worse – you can't really define a region depending on a particular field. It only accepts a whole resource. This can be painfull when it comes to complicated forms.

### Partial DOM updates

Now that we have sections with binding to proper local sets of objects that redraw automatically. Life is getting better. There's however a new problem to solve:

```html
Text
<!-- region -->Another Text<!-- /region -->
And some more text
```

What if our region is not entirely a tag content and it can't be modified with the usage of `.innerHTML`?

#### Metamorph (Ember, Joosy)

Ember and Joosy are on the same page here. We wrote separate solution initialy but ended up using the library [Metamorph](https://github.com/tomhuda/metamorph.js/) created by Ember team. And Metamorph works pretty well.

When working in modern browsers Metamorph relies on [W3C Ranges](http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html). For the old browsers everything gets much more interesting. Region gets wrapped into two `script` tags that, according to specification, can be part of any other tags. To update content Metamorph replaces the content between these two tags.

#### Angular

Since Angular's approach is based on the "better HTML" – it's task is a little bit different. In most cases we simply bind to a particular tag so Angular basicly doesn't have this problem. The only similar case it has is the interpolation. During interpolation Angular binds everything to the closest parent tag and turns it into a region. Thus Angular alway modifies only tags and attributes of tags. No magic.

#### Another interesting approach

There's one more interesting approach that I saw implemented by tiny frameworks (mostly implementing just the binding itself). This approach was also mentioned by Yehuda Katz to become a replacement for Metamorph. Instead of interpreting HTML as a text it makes you to parse it and convert it into direct DOM statements:

```javascript
// Taken from: https://gist.github.com/wycats/8116673
var output = dom.createDocumentFragment();
var a = dom.createElement('a');
dom.RESOLVE_ATTR(context, a, 'href', 'url');
var text = dom.createTextNode();
dom.RESOLVE(context, text, 'textContent', 'link');
a.appendChild(text);
output.appendChild(a);
```

### Animations

#### CSS-classes (Angular)

Since Angular always works on a tag level – it always has a container to interact with. This is a huge advantage when it comes to animations. During the modificaiton of DOM Angular sets special CSS classes to the changing tag. This allows you to easily add CSS-based transitions and animations with no additional code.

Angular also contains additional tools allowing you to bind JS animations to particular CSS classes. Seriously, Angular is amazing when it comes to animations. Some limitations in other areas seriously simplify everything here.

#### Numerous issues (Ember, Joosy)

Metamorph is on the other page. Everything is much more sad – our regions are not bound to DOM in any way and it's unclear what should be animated during modification. There are numerous proposals for Ember syntax like `{% raw %}{{if flag transition='fade'}}{% endraw %}`. However they don't look realistic with the current implementation of Handlebars. You simply can't animate random DOM region having no single root.

You could probably explicitly pass the ID of element to animate as addition to the animation style. This however seriously breaks conventions of Ember declarative language. I'm really excited to monitor all the discussions regarding this topic but it doesn't look like it's on the priority list of Ember right now.

Joosy is in the similar situation here. It has a little advantage with the fact we work with JS code straightly (CoffeScript code to be more correct). That's why it's not limited to strings and can pass JS function directly. So basically we can hook into the rendering internals.

```haml
!= @renderInline {entity: @entity}, @animation, ->
```

I don't think it's a proper solution as well but at least it works. We are currently considering allowing you to pass in the selector and animation keyword as described before:

```haml
!= @renderInline {entity: @entity}, ['#selector', 'fade'], ->
```

### Reverse binding (inputs to fields of objects)

The last step to bright future is the reverse binding. Automatically changing the fields of objects during the modifications of form fields. Having all our experience it's a piece of cake. Angular and Ember having declarative templates simply add another attribute specifying which field should be mapped:

```html
<input ng-model='entity.field'>                      <!-- Angular -->
{% raw %}{{input value=entity.field}}{% endraw %}    <!-- Ember -->
```

Joosy implements the same with set of helpers:

```haml
!= @formFor @entity, (f) ->
  != @f.input 'field'
```

Finally we got the 2-way binding working!

### Instead of conclusion

As you can see there are numerous ways to implement 2-way data binding. While declarative languages (including separate languages like Handlebars and HTML extensions) masterfully dominate, there are other options as well. None of them works perfectly though. Generally this is what all the "modern" tools go through and I'm sure we will come up with more elegant ways of solving the described issues. We are still waiting for tons of exciting HTML features to get accessible and even more to be defined (like [Node.bind()](http://www.polymer-project.org/platform/node_bind.html)).

Be careful until we there though. 2-way data binding is an amazing tool. But the drawbacks can be essential. Make sure to discover them as soon as possible: hopefully you just got one step closer to this.