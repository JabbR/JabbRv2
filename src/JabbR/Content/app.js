import React from 'react';  
import Router from 'react-router';  
import { DefaultRoute, Link, Route, RouteHandler, NotFoundRoute } from 'react-router';

import Home from './components/Home/Home.js';
import Lobby from './components/Room/Lobby.js';
import Room from './components/Room/Room.js';
import Notifications from './components/Account/Login.js';
import Account from './components/Account/Account.js';
import Help from './components/Account/Login.js';
import Administration from './components/Account/Login.js';
import Login from './components/Account/Login.js';
import Logout from './components/Account/Login.js';

let App = React.createClass({  
  render() {
      return (
        <div>
          <ul className="nav pull-left" style={{"paddingRight": "75px"}}>
            <li><Link to="app">Home</Link></li>
            <li><Link to="notifications">Notifications</Link></li>
            <li><Link to="account">Account</Link></li>
            <li><Link to="help">Help</Link></li>
            <li><Link to="administration">Administration</Link></li>
            <li><Link to="login">Sign In</Link></li>
            <li><Link to="logout">Logout</Link></li>
          </ul>
          {/* this is the importTant part */}
          <RouteHandler/>
        </div>
    );
  }
});

let routes = (  
  <Route name="app" path="/" handler={App}>
    <Route name="room" path="/rooms/:roomName" handler={Room}/>
    <Route name="notifications" path="/notifications" handler={Notifications}/>
    <Route name="account" path="/account" handler={Account}/>
    <Route name="login" path="/account/login" handler={Login}/>
    <Route name="logout" path="/account/logout" handler={Logout}/>
    <Route name="help" path="/help" handler={Help}/>
    <Route name="administration" path="/administration" handler={Administration}/>
    <DefaultRoute handler={Lobby}/>
    <NotFoundRoute handler={Lobby}/>
  </Route>
);

Router.run(routes, function (Handler) {  
  React.render(<Handler/>, document.body);
});
