var Server = require('./../../'); // get server
var userConfig = require('./user-config'); // get config

var server = new Server(userConfig).run(); // create server with config and run

server.bindRequest('get', 'api', function (req, res) {

	res.asdas.dad

	// throw new Error('pizda!');

	res.end('hi there !!!!');

});

server.bindRequest('get', 'api/:dd/ss', function (req, res, match) {

	res.end('hi dd !!!!      ' + match.join('---'));

});

server.bindRequest('get', 'hapi/:input', function (req, res) {

	res.end('hi hh !!!!');

});





