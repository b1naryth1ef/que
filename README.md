## Example

```
var myApp = new App("test");

var view = myApp.createView("home");

view.route("/", function () {
  $("body").html(this.app.renderTemplate("index.html", {user: "jeff"}));
});

