var Server = require('./../../'); // get server
var userConfig = require('./user-config'); // get config

new Server(userConfig).run(); // create server with config and run
