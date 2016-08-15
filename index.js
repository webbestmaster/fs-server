"use strict";

var http = require('http'),
	path = require('path'),
	ip = require('ip'),
	url = require('url'),
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

		var boundRequest = server.findBoundRequest(req);

		if (boundRequest) {
			boundRequest(req, res);
		} else {
			fileHunter.find(req, res, null, fileHunter.send);
		}

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

Server.prototype.bindRequest = function (typeArg, regExp, callback) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings;

	if (!bindings.hasOwnProperty(type)) {
		throw new Error('Request type ' + type + ' is not supported!')
	}

	bindings[type].push({
		regExp: regExp,
		callback: callback
	});

	return server;

};

Server.prototype.findBoundRequest = function (req) {

	var method = req.method;
	var parsedUrl = url.parse(req.url);
	var pathname = parsedUrl.pathname;
	var callbackList = this.bindings[method] || [];
	var callback;
	var i = callbackList.length;
	var item;

	if (pathname[pathname.length - 1] !== '/') {
		pathname += '/';
	}

	while (!callback && i) {

		i -= 1;

		item = callbackList[i];

		if (item.regExp.test(pathname)) {
			callback = item.callback;
		}

	}

	return callback;

};

module.exports = Server;
