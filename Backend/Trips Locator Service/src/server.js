const App = require("./app");

// Launch only one instance of the app.
(() => {
    var app = new App();
    app.run();
})();