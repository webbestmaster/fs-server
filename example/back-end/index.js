var Server = require('./../../'); // get server
var userConfig = require('./user-config'); // get config

var server = new Server(userConfig).run(); // create server with config and run


server.bindRequest('get', /^\/api\/$/, function (req, res) {

	res.end('hi there !!!!');

});

server.bindRequest('get', /hapi/, function (req, res) {

	res.end('hi hh !!!!');

});





