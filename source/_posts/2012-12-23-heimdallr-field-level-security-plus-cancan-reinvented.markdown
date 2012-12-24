---
layout: post
title: "Heimdallr: field-level security; CanCan reinvented"
date: 2012-12-23 15:48
comments: true
categories: 
---
Migrating most of web projects, we are working on, to browser-side applications rises a lot of questions. Proper permissions handling without boilerplate is certainly on the top. Thinking about this led us to a real problem: there’s no comfortable way to implement context-based protection of Models and fields of those Models for ActiveRecord-based projects (Egor, say hi ;). And CanCan’s controllers protection is simply too high-level to solve our problems.

Through some experience we’ve figured out something awesome to solve this. Meet Heimdallr and it’s extension Heimdallr::Resource. They will bring you a peace and security.