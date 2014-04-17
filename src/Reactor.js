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

	var Router = React.createClass({
		getInitialState:function(){
			return {
				route:null,
				clientProps:null
			}
		},
		_extractParameters:function(){
			return Backbone.Router.prototype._extractParameters.apply(this, arguments);
		},
		_routeToRegExp:function(){
			return Backbone.Router.prototype._routeToRegExp.apply(this, arguments);
		},
		handleRoute:function(fragment){
			var done = false;
			React.Children.forEach(this.props.children, function(child, i){
				if(!done){
					var keys = null;
					var route = child.props.route;
					if(!route) return;
					if(!_.isRegExp(route)){
						route = this._routeToRegExp(route);
						keys = this._extractParameters(route, child.props.route);
					}
					if(route.test(fragment)){
						var clientProps = null;
						var args = this._extractParameters(route, fragment);
						if(args.length>0){
							clientProps = {};
							for(var i in args){
								var key = keys[i];
								if(key && (key = key.substring(1))){
									clientProps[key] = args[i];
								}
							}
						}
						this.setState({
							route:i,
							clientProps:clientProps
						});
						done = true;
					}
				}
			}.bind(this));
			if(!done){
				this.setState({
					route:null,
					clientProps:null
				});
			}
		},
		componentWillMount:function(){
			Backbone.history.on('preroute', this.handleRoute, this);
		},
		componentWillUnmount:function(){
			Backbone.history.off('preroute', this.handleRoute, this);
		},
		render:function(){
			return <SwitchView show={this.state.route} clientProps={this.state.clientProps} else={this.props.notFound || <span/>}>{this.props.children}</SwitchView>;
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
