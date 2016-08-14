"use strict";

var http = require('http'),
	path = require('path'),
	ip = require('ip'),
	FileHunter = require('./data/file-hunter');

function replaceValues(from, to) {

	var merge = {};

	Object.keys(to).forEach(function (key) {
		merge[key] = from.hasOwnProperty(key) ? from[key] : to[key];
	});

	return merge;

}

function Server(userConfigArg) {

	var server = this;

	server.initialize(userConfigArg);

}

Server.prototype.KEYS = {
	CONFIG: 'server:config',
	HTTP_SERVER: 'server:http-server'
};

Server.prototype.set = function (key, value) {
	this.attr[key] = value;
};

Server.prototype.get = function (key) {
	return this.attr[key];
};

Server.prototype.initialize = function (userConfigArg) {

	var config, fileHunter, server, httpServer;

	server = this;

	server.attr = {};

	config = replaceValues(userConfigArg || {}, require('./data/defaults-config'));

	fileHunter = new FileHunter({
		root: path.join(process.cwd(), config.root),
		page404: config.page404
	});

	httpServer = new http.createServer(function (req, res) {



		fileHunter.find(req, res, null, fileHunter.send);


	});

	server.set(server.KEYS.HTTP_SERVER, httpServer);
	server.set(server.KEYS.CONFIG, config);

	server.bindings = {
		GET: [],
		POST: []
	};

};

Server.prototype.run = function () {

	var server = this,
		httpServer = server.get(server.KEYS.HTTP_SERVER),
		port = server.get(server.KEYS.CONFIG).port;

	httpServer.listen(port);

	console.log('Server started:', ip.address() + ':' + port);

	return server;

};

Server.prototype.destroy = function (cb) {

	var server = this,
		httpServer = server.get(server.KEYS.HTTP_SERVER),
		port = server.get(server.KEYS.CONFIG).port;

	server.attr = {};

	httpServer.close(function () {
		console.log('Server destroyed:', ip.address() + ':' + port);
		return cb && cb();
	});

};

Server.prototype.bindRequest = function (typeArg, route, callback) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings;

	if (!bindings.hasOwnProperty(type)) {
		throw new Error('Request type ' + type + ' is not supported!')
	}

	bindings[type].push({
		route: route,
		callback: callback
	});

	return server;

};

module.exports = Server;
