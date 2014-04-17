# Reactor

It's the MC in React! So far it is just a Router, with an Animate component.

See the [example](https://rawgit.com/KingKarl85/reactor/master/example.html) for usage.

## Router

Requires Backbone to do the routing and history watching.

However it doesn't use the Backbone.Router class. Reactor.Router instead listens to route/hash change events and implements the routing logic on it's own route list.

This allows Reactor.Router to have multiple router instances, unlinke Backbone.Router.

This also allows for Reactor.Router to implement a crude "contexual routing" implementation. See the above example.

## Plans Include

* Router
* Model
* Collection
* Components

All designed specifically for React.

## License

The MIT License (MIT)

Copyright (c) 2014 Karl Mikkelsen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.