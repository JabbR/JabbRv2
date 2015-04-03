import React from 'react';  
import Router from 'react-router';  
import { DefaultRoute, Link, Route, RouteHandler } from 'react-router';

import NotificationHandler from './components/Account/Login.js';
import AccountHandler from './components/Account/Account.js';
import HelpHandler from './components/Account/Login.js';
import AdminHandler from './components/Account/Login.js';
import LoginHandler from './components/Account/Login.js';

let App = React.createClass({  
  render() {
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

let routes = (  
  <Route name="app" path="/" handler={App}>
    <Route name="notifications" path="/notifications" handler={NotificationHandler}/>
    <Route name="account" path="/account" handler={AccountHandler}/>
    <Route name="help" path="/help" handler={HelpHandler}/>
    <Route name="admin" path="/admin" handler={AdminHandler}/>
    <Route name="login" path="/login" handler={LoginHandler}/>
  </Route>
);

Router.run(routes, function (Handler) {  
  React.render(<Handler/>, document.body);
});
