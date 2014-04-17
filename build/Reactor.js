/** @jsx React.DOM */
var Reactor = Reactor || {};

(function(Reactor, window){

	var SwitchView = React.createClass({displayName: 'SwitchView',
		render:function(){
			var child = this.props.else || React.DOM.span(null );
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

	var Animate = React.createClass({displayName: 'Animate',
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
			return SwitchView( {show:this.state.show}, this.props.children)
		}
	});

	var oldLoadUrl = Backbone.history.loadUrl;
	Backbone.history.loadUrl = function(fragment) {
		this.trigger("preroute", this.getFragment(fragment));
		return oldLoadUrl.apply(this, arguments);
	};

	var Router = React.createClass({displayName: 'Router',
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
		getRoute:function(child){
			var route = "";
			if(this.isRouter() && this.hasContext(this.props.route)){
				route+= this.stripContext(this.props.route);
			}
			route+= child.props.route;
			return this.stripContext(route);
		},
		handleRoute:function(fragment){
			var done = false;
			React.Children.forEach(this.props.children, function(child, x){
				if(!done){
					var clientProps = {};
					var route = this.getRoute(child);
					if(_.isString(route) && this.hasContext(child.props.route)){
						fragment = fragment.substring(0, route.length);
					}
					fragment = this.stripContext(fragment);
					if(!route) return;
					if(!_.isRegExp(route)){
						route = this._routeToRegExp(route);
					}
					if(route.test(fragment)){
						var keys = this._extractParameters(route, this.getRoute(child));
						var args = this._extractParameters(route, fragment);
						if(args.length>0){
							for(var i in args){
								var key = keys[i];
								if(key && (key = key.substring(1))){
									clientProps[key] = args[i];
								}
							}
						}
					}else{
						if(fragment !== "" || this.getRoute(child) !== "/"){
							return //failed;
						}
					}
					this.route = x;
					this.clientProps = clientProps;
					done = true;
				}

			}.bind(this));
			if(!done){
				this.route = null;
				this.clientProps = {};
			}
			if(this.isMounted()){
				this.forceUpdate();
			}
		},
		componentDidMount:function(){
			Backbone.history.on('preroute', this.handleRoute, this);

			if(!Backbone.History.started){
				Backbone.history.start();
			}

			Backbone.history.loadUrl();
		},
		componentWillUnmount:function(){
			Backbone.history.off('preroute', this.handleRoute, this);
		},
		render:function(){
			return SwitchView( {show:this.route, clientProps:this.clientProps, else:this.props.notFound || React.DOM.span(null)}, this.props.children);
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
