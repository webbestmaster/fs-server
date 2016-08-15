var Server = require('./../../'); // get server
var userConfig = require('./user-config'); // get config

var server = new Server(userConfig).run(); // create server with config and run

server.bindRequest('get', 'api', function (req, res) {

	res.asdas.dad

	// throw new Error('pizda!');

	res.end('hi there !!!!');

});

server.bindRequest('get', 'api/:dd/ss/p:ee', function (req, res, url, dd, ee) {

	res.end('hi dd !!!!      ' + dd + '--' + ee);

});

server.bindRequest('get', 'hapi/:input', function (req, res) {

	res.end('hi hh !!!!');

});





