var React =  require('react');  
var Router = require('react-router');  
var Route = Router;
var DefaultRoute = Router;
var RouteHandler = Router;
var Link = Router;

var Home = require('./components/Home/Home.js');
var Notifications = require('./components/Account/Login.js');
var Account = require('./components/Account/Account.js');
var Help = require('./components/Account/Login.js');
var Administration = require('./components/Account/Login.js');
var Login = require('./components/Account/Login.js');

var App = React.createClass({  
  render: function () {
      return (
        <div>
          <ul className="nav pull-left" style={{"paddingRight": "75px"}}>
            <li>
              <Link to="app">Home</Link>
            </li>
            <li>
              <Link to="notifications">Notifications</Link>
            </li>
            <li>
              <Link to="account">Account</Link>
            </li>
            <li>
              <Link to="help">Help</Link>
            </li>
            <li>
              <Link to="admin">Admin</Link>
            </li>
            <li>
              <Link to="login">Login</Link>
            </li>
          </ul>
          {/* this is the importTant part */}
          <RouteHandler/>
        </div>
    );
  }
});

var routes = (  
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={Home}/>
    <Route name="notifications" path="/notifications" handler={Notifications}/>
    <Route name="account" path="/account" handler={Account}/>
    <Route name="help" path="/help" handler={Help}/>
    <Route name="admin" path="/admin" handler={Administration}/>
    <Route name="login" path="/account/login" handler={Login}/>
  </Route>
);

Router.run(routes, function (Handler) {  
  React.render(<Handler/>, document.body);
});
