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
App.prototype.renderTemplate = function (name, obj) {
    var obj = obj || {};
    obj.app = this;

    nunjucks.render(name, obj);

    if (!this.templates[name]) {
        console.error("Failed to find template with name: " + name);
        return "";
    }
    return this.templates[name](obj);
}

// Create a new view on this application
App.prototype.createView = function (name) {
    this.views[name] = new View(this, name);
    return this.views[name];
}

// Called to route the current request to a view
App.prototype.run = function (url) {
    var url = url || ('/' + window.location.pathname.substr(1));

    // Iterate over all routes in all views
    for (view in this.views) {
        var view = this.views[view];

        for (route in this.views[view].routes) {
            var route = this.views[view].routes[route];

            if (route.match(url)) {
                return route.call(url);
            }
        }
    }

    console.error("could not find router handler!");
}

var View = function (app, name) {
    this.app = app;
    this.name = name;
    this.routes = {};
    $(this.app).trigger("viewCreated", [this]);
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

var Route = function (view, func, route, regex) {
    this.app = view.app;
    this.view = view;
    this.func = func;
    this.route = route;
    this.regex = regex || false;

    $(this.view).trigger("routeCreated", [this]);
}

Route.prototype.match = function (url) {
    if (!this.regex && this.route == url) {
        return true;
    }

    return this.extract(url) != null;
}

Route.prototype.extract = function (url) {
    var regMatch = url.match(regEx);
    if (regMatch) {
        regMatch.shift();
        return regMatch;
    }
    return null;
}

Route.prototype.call = function (url) {
    this.func.apply(this, [this.extract(url), url, this]);
}

// Export everything
var module = {};

module.exports = {
    "App": App,
    "View": View,
    "Route": Route
}
