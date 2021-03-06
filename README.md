# Reactor

This is a little experiment I did when first looking at React.

For a complete Router look at [React-Nested-Router](https://github.com/rpflorence/react-nested-router), Ryan has done a stella job on this! 

Please only consider this an experiment.

See the [example](https://rawgit.com/karlmikk/reactor/master/example.html) for usage.

## Router

Requires Backbone.History history/pushState monitoring and borrows from Backbone.Router for routing logic.

Reactor.Router listens to route/hash change events and implements the routing logic on it's own route list.

This allows Reactor.Router to have multiple router instances, unlinke Backbone.Router.

This also allows for Reactor.Router to implement a crude "contexual routing" implementation. A context route is represented by a tailing `/*`.

Any child of a Reactor.Router is considered a route destination if it has the `prop` `route`. All routes are considered contextual to parent React.Routers. To define an "Absoulte" route, add the `prop` `absolute`.

React.Navigate is a wrapper around `<a/>` where the `href` is the location to navigate to. This `href` is considered contextual to the parent React.Routers. To define an "Absoulte" route, add the `prop` `absolute`.

React.Navigate will also let you pass `prop` `silent` to route without placing a history event.

If you have `props` conflict, Reactor.Route is provided as a wrapper. React.Route will pass and derived fragments to all children.

React.Router is built on top of Reactor.SwitchView.

**Props**
`notFound` - Is passed to `SwitchView` as `else`. I.E. `notFound` is the 404 of the router (default `<span />`).
`pushState` - If true will tell Backbone.history.start to use `{pushStart:true}`.

React.Router will start Backbone.History automatically if not already started. To use custom Backbone.history.start() options unsure Backbone.history.start is called before any React.Router components are rendered.

**Example**
```
React.renderComponent(
	<Router>
		<p route="/">Hello World!</p>
		<p route="/moon">Hello Moon!</p>
	</Router>
, domNode);
```
Route `/moon` will render `<p>Hello Moon!</p>`.

**Example Props Passed / Dynamic Routes**
```

var HelloWho = React.renderComponent({
	render:function(){
		return <p>Hello {this.props.who}!</p>
	}
});

React.renderComponent(
	<Router>
		<p route="/">Hello World!</p>
		<HelloWho route="/hello/:who" />
	</Router>
, domNode);
```
Route `/hello/Moon` will render `<p>Hello Moon!</p>`.

**Example Contextual**
```
React.renderComponent(
	<Router>
		<p route="/">Hello World!</p>
		<Router route="hello/*">
			<p route="/moon">Hello Moon!</p>
			<p route="/sun">Hello Sun!</p>
		</Router>
	</Router>
, domNode);
```
Route `/hello/moon` will render `<p>Hello Moon!</p>`.

## Components

### SwitchView

This is core of most Reactor components. SwitchView allows you to change what is being rendered by index or id.

**Props**

* `show` - Select what child to render (default 0 or else if supplied). If `null` supplied, then else will be rendered.
* `else` - ReactComponent to render when `show` is now found. (default to <span />)

Warning: `else` default will change in future version to not render anything, React currenlty doesn't support rendering nothing.

**Example index**
```
React.renderComponent(
	<SwitchView show="1">
		<p>Hello World!</p>
		<p>Hello Moon!</p>
	</SwitchView>
, domNode);
```
Will render `<p>Hello Moon!</p>`.

**Example id**
```
React.renderComponent(
	<SwitchView show="moon">
		<p id="world">Hello World!</p>
		<p id="moon">Hello Moon!</p>
	</SwitchView>
, domNode);
```
Will render `<p>Hello Moon!</p>`.

## Plans Include

* Router - done!
* Route - done!
* Navigate - done!
* LoaderView - done!
* Animate - done!
* SwitchView - done!
* Model
* Collection
* Better Documentation
* Better Build tools
* NPM module
* ServerSide rendering made easy

## TODO
* Make Router use it's own instance of Backbone.History not the default on or pass a history object.
* All child routers to use top Router history.
* Set history on top Router. throw if history set twice.
* on instanciate create new history if not given.

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