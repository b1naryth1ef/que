/*
    Que is an overly simple JS view/route controller.

    Author: Andrei (github.com/b1naryth1ef)
    Version: v0.0.1
*/


var nunjucks = require('nunjucks');

// The app is the base entry point for usage. It contains views, routes and templates.
var App = function (name, templatesRoute) {
    this.name = name;
    this.views = {};
    this.currentView = null;

    nunjucks.configure(templatesRoute || "/static/views", {
        autoescape: true,
    });
}

// Bind to events on this app
App.prototype.on = function (eventName, func) {
    $(this).on(eventName, func);
}

// Render a template with this app in context
App.prototype.render = function (name, obj) {
    var obj = obj || {};
    obj.app = this;
    obj.window = window;

    return nunjucks.render(name, obj);
}

// Create a new view on this application
App.prototype.createView = function (name) {
    return this.addView(new View(name));
}

// Add a view to this application
App.prototype.addView = function (view) {
  view.app = this;
  this.views[view.name] = view;

  // Update any previously added routes
  for (var route in view.routes) {
    view.routes[route].app = this;
  }

  $(this).trigger("viewAdded", [this, view]);
  return view;
}

// Called to route the current request to a view
App.prototype.run = function (url) {
    var url = url || ('/' + window.location.pathname.substr(1));

    // Iterate over all routes in all views
    for (view in this.views) {
        var view = this.views[view];

        for (route in view.routes) {
            var route = view.routes[route];

            if (route.match(url)) {
                return route.call(url);
            }
        }
    }

    console.error("could not find router handler!");
}

var View = function (name) {
    this.name = name;
    this.routes = {};
}

// Bind to events on this view
View.prototype.on = function (eventName, func) {
    $(this).on(eventName, func);
}

// Create a new route based on a full-path
View.prototype.route = function (route, f) {
    this.routes[route] = new Route(this, f, route);
}

// Create a new route based on a regex
View.prototype.routeRegex = function (regex, f) {
    this.routes[regex] = new Route(this, f, regex, true);
}

View.prototype.call = function (route) {
    $(this.view).trigger("viewCall", [this, route, arguments]);
    return this.routes[route].apply(this, arguments);
}

View.prototype.render = function () {
  return this.app.render.apply(this.app, arguments);
}

var Route = function (view, func, route, regex) {
    this.app = view.app;
    this.view = view;
    this.func = func;
    this.route = route;
    this.regex = regex || false;

    $(this.view).trigger("routeCreated", [this]);
}

Route.prototype.render = function () {
  return this.view.render.apply(this.view, arguments);
}

Route.prototype.match = function (url) {
    if (!this.regex && this.route == url) {
        return true;
    }

    return this.extract(url) != null;
}

Route.prototype.extract = function (url) {
    var regMatch = url.match(this.regex);
    if (regMatch) {
        regMatch.shift();
        return regMatch;
    }
    return null;
}

Route.prototype.call = function (url) {
    this.func.apply(this, [this.extract(url), url, this]);
}

module.exports = {
    "App": App,
    "View": View,
    "Route": Route
}
