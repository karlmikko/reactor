/** @jsx React.DOM */
var Reactor = Reactor || {};

(function(Reactor, window){

	var SwitchView = React.createClass({
		render:function(){
			var child = this.props.else || <span />;
			var ids = {};
			React.Children.forEach(this.props.children, function(c, i){
				ids[i] = c;
				if(c.props.id){
					ids[c.props.id] = c;
				}
			});
			var show = null;
			if(this.props.show !== null){
				show = this.props.show
			}
			else{
				if(!this.props.else){
					show = 0;
				}
			}
			if(ids[show]){
				child = ids[show];
			}
			return React.addons.cloneWithProps(child, this.props.clientProps);
		}
	});

	var Animate = React.createClass({
		getInitialState:function(){
			return {
				show:0
			}
		},
		componentWillMount:function(){
			var children = this.props.children;
			if(children.length){
				this.timer = setInterval(function(){
					var show = this.state.show + 1;
					if(children.length <= show){
						show = 0;
					}

					this.setState({show: show});
				}.bind(this), this.props.interval || 1000);				
			}
		},
		componentWillUnmount:function(){
			clearInterval(this.timer);
		},
		render:function(){
			return <SwitchView show={this.state.show}>{this.props.children}</SwitchView>
		}
	});

	var oldLoadUrl = Backbone.history.loadUrl;
	Backbone.history.loadUrl = function(fragment) {
		fragment = this.fragment = this.getFragment(fragment);
		this.trigger("preroute", fragment);
		return oldLoadUrl.apply(this, arguments);
	};

	function realChild(child){
		return child.__realComponentInstance || child;
	}

	function findChildWithinChildren(child, owner, tree){
		var found = false;
		child = realChild(child);
		if(!owner){
			return found;
		}
		if(owner.props.children){
			React.Children.forEach(owner.props.children, function(ownerChild){
				if(!found){
					ownerChild = realChild(ownerChild);
					if(ownerChild === child){
						found = ownerChild;
					}
					else{
						found = findChildWithinChildren(child, ownerChild, tree);
					}
				}
			}, this);
		}
		else{
			if(child === owner){
				found = child;
			}
		}
		if(found){
			tree.push(owner);
		}
		return found;
	}

	function getParentTree(child){
		var tree = [];
		var owner = child._owner;
		findChildWithinChildren(child, owner._renderedComponent, tree);
		while(owner._mountDepth){
			if(owner._owner){
				owner = owner._owner;
				tree.push(owner);
			}
			else{
				break;
			}
		}
		return tree;
	}

	function getParentRouterContext(child){
		var parentTree = getParentTree(child);
		
		if(parentTree.length){
			for(var i in parentTree){
				var parent = parentTree[i];
				if(parent.isRouter && parent.isRouter()){
					var context = false;
					if(parent.routeHasContext){
						context = parent.currentRoute;
					}
					if(!context){
						context = getParentRouterContext(parent);
					}
					return context;
				}
			}
		}
			
		return "";
	};

	function getRoute(child, keepContext){
		child = realChild(child);
		var parentContext = "";
		if(!child.props.absolute){
			parentContext = getParentRouterContext(child);
		}
		var route = stripContext(parentContext) + "/" + child.props.route;
		route = route.replace("//","/");
		if(!keepContext){
			route = stripContext(route);
		}
		return route;
	};

	function hasContext(route){
		if(route){
			return route.substring(route.length - 1) == "*";
		}
		return false;
	};
	function stripContext(route){
		if(hasContext(route)){
			route = route.substring(0, route.length - 1);
		}
		if(route.length >1 && route.substring(route.length-1) == "/"){
			route = route.substring(0, route.length - 1);
		}
		return route;
	};

	var Router = React.createClass({
		getInitialState:function(){
			return {
				route:null,
				clientProps:{}
			}
		},
		_extractParameters:function(){
			return Backbone.Router.prototype._extractParameters.apply(this, arguments);
		},
		_routeToRegExp:function(){
			return Backbone.Router.prototype._routeToRegExp.apply(this, arguments);
		},
		isRouter:function(){
			return true;
		},
		handleRoute:function(fragment){
			this.currentRoute = null;
			fragment = fragment || Backbone.history.fragment;
			fragment = "/" + fragment;
			var done = false;
			React.Children.forEach(this.props.children, function(child, x){
				if(!done){
					var routeString = null;
					var clientProps = {};
					var contextRoute = false;
					var route = getRoute(child);
					if(!route) return;
					if(_.isString(route)){
						routeString = route;
					}
					if(_.isString(route) && hasContext(getRoute(child, true))){
						//compare only same number of parts of fragment to route
						fragment = fragment.split("/").slice(0, route.split("/").length).join("/");
						contextRoute = true;
					}
					fragment = stripContext(fragment); //remove tailing "/" from fragment
					if(!_.isRegExp(route)){
						route = this._routeToRegExp(route);
					}
					console.log(routeString, fragment)
					if(route.test(fragment)){
						if(_.isString(routeString)){
							var keys = this._extractParameters(route, routeString);
							var args = this._extractParameters(route, fragment);
							if(args.length>0){
								for(var i in args){
									var key = keys[i];
									if(key && (key = key.substring(1))){
										clientProps[key] = args[i];
									}
								}
							}
						}
					}
					else{
						if(fragment !== "" || !["/", ""].indexOf(routeString)){
							return //failed;
						}
					}
					this.routeIndex = x;
					this.routeHasContext = contextRoute;
					this.currentRoute = fragment;
					this.clientProps = clientProps;
					done = true;
				}

			}.bind(this));
			if(!done){
				this.routeIndex = null;
				this.routeHasContext = null;
				this.currentRoute = null;
				this.clientProps = {};
			}
			if(this.isMounted()){
				this.forceUpdate();
			}
		},
		componentDidMount:function(){
			this.routeIndex = null;
			this.routeHasContext = null;
			this.currentRoute = null;
			this.clientProps = {};


			if(!Backbone.History.started){
				var pushState = this.props.pushState || false;
				Backbone.history.start({pushState: pushState});
			}

			Backbone.history.on('preroute', this.handleRoute, this);
			this.handleRoute();
		},
		componentWillUnmount:function(){
			Backbone.history.off('preroute', this.handleRoute, this);
		},
		render:function(){
			return <SwitchView show={this.routeIndex} clientProps={this.clientProps} else={this.props.notFound || <span/>}>{this.props.children}</SwitchView>;
		}
	});

	var Route = React.createClass({
		render:function(){
			React.Children.forEach(this.props.children, function(child){
				for(var i in this.props){
					if(i !== "children"){
						child.props[i] = this.props[i];
					}
				}
			}, this);
			return <span>{this.props.children}</span>;
		}
	});

	var Navigate = React.createClass({
		onClick:function(e){
			e.preventDefault();
			var parentContext = "";
			if(!this.props.absolute){
				parentContext = getParentRouterContext(this);
			}
			Backbone.history.navigate(parentContext + this.props.href, {trigger: true, replace:this.props.silent});
		},
		render:function(){
			var props = _.extend(this.props, {
				onClick:this.onClick
			});
			return React.addons.cloneWithProps(<a/>, props);
		}
	});

	Reactor = {
		SwitchView: SwitchView,
		Animate: Animate,
		Router: Router,
		Route: Route,
		Navigate: Navigate,
	}
	
	//Register in window global for browsers
	if(window){
		for(var i in Reactor){
			window[i] = Reactor[i];
		}
	}

})(Reactor, window);

if(typeof(module) !== "undefined" && module && module.exports) module.exports = Reactor;

if(typeof(define) !== "undefined" && define && define.call){
	define(['Reactor'] , function (Reactor) {
	    return Reactor;
	});
}
