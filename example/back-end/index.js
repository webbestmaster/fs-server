var Server = require('./../../'); // get server

var serverConfig = {
	root: './../front-end/', // path to front-end part of site
	port: process.env.PORT || 3000, // optional, recommended this, or do not use this field
	page404: 'custom-404-page/index.html' // optional, path to custom 404 page
};

var server = new Server(serverConfig) // create server with config
					.run(); // create server with config and run

server.bindRequest(

	'get', // request's type

	'api/:controller/:action/:params', // request's url mask

	function (req, res, url, controller, action, params) { // callback with matched parameters
		res.end('hi there !!!! ' + [url, controller, action, params].join(' - '));
	},

	this // optional parameter to set callback execution context

);


