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

	function getOwner(child){
		if(child._owner){
			return child._owner;
		}
		var rComp = child._renderedComponent;
		if(rComp){
			var children = rComp._renderedChildren;
			if(children){
				return children['.0'];
			}
		}
		return false;
	}

	function findChildWithinChildren(child, owner, tree){
		var found = false;
		if(child.__realComponentInstance){
			child = child.__realComponentInstance;
		}
		if(owner.props.children){
			React.Children.forEach(owner.props.children, function(ownerChild){
				if(!found){
					if(ownerChild.__realComponentInstance){
						ownerChild = ownerChild.__realComponentInstance;
					}
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

		var owner = child._owner._renderedComponent;
		var tree = [];
		findChildWithinChildren(child, owner, tree);
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
		hasContext:function(route){
			if(route){
				return route.substring(route.length - 2) == "/*";
			}
			return false;
		},
		stripContext:function(route){
			if(this.hasContext(route)){
				route = route.substring(0, route.length - 2);
			}
			if(route.length >1 && route.substring(route.length-1) == "/"){
				route = route.substring(0, route.length - 1);
			}
			return route;
		},
		isRouter:function(){
			return true;
		},
		getRoute:function(child, keepContext){
			var route = getParentRouterContext(child) + child.props.route;
			if(!keepContext){
				route = this.stripContext(route);
			}
			return route;
		},
		handleRoute:function(fragment){
			this.currentRoute = null;
			fragment = fragment || Backbone.history.fragment;
			var done = false;
			React.Children.forEach(this.props.children, function(child, x){
				if(!done){
					var routeString = null;
					var clientProps = {};
					var contextRoute = false;
					var route = this.getRoute(child);
					if(!route) return;
					if(_.isString(route)){
						routeString = route;
					}
					if(_.isString(route) && this.hasContext(this.getRoute(child, true))){
						fragment = fragment.substring(0, route.length);
						contextRoute = true;
					}
					fragment = this.stripContext(fragment); //remove tailing "/" from fragment
					if(!_.isRegExp(route)){
						route = this._routeToRegExp(route);
					}
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
						if(fragment !== "" || this.getRoute(child) !== "/"){
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

	Reactor = {
		SwitchView: SwitchView,
		Animate: Animate,
		Router: Router,
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
