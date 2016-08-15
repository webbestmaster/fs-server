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




			// TODO: refactor this to more beautiful
			// bind 500 error
			function onUncaughtException(err) {
				console.log(err.message);
				res.end('500 !!!');
			}

			process.on('uncaughtException', onUncaughtException);

			console.log(process.listeners('uncaughtException'));

			res.on('finish', function resFinish() {
				console.log('res - destory');
				process.removeListener('uncaughtException', onUncaughtException);
				console.log(process.listeners('uncaughtException'));
				this.removeListener('finish', resFinish);
			});

			boundRequest.callback.apply(null, [req, res].concat(boundRequest.match));

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

Server.prototype.bindRequest = function (typeArg, route, callback) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings;

	if (!bindings.hasOwnProperty(type)) {
		throw new Error('Request type ' + type + ' is not supported!')
	}

	bindings[type].push({
		regExp: routeToRegExp(route),
		callback: callback
	});

	return server;

};

Server.prototype.findBoundRequest = function (req) {

	var method = req.method,
		parsedUrl = url.parse(req.url),
		pathname = parsedUrl.pathname,
		callbackList = this.bindings[method] || [],
		result,
		match,
		i = callbackList.length,
		item;

	while (!result && i) {

		i -= 1;

		item = callbackList[i];

		match = pathname.match(item.regExp);

		if (match) {
			result = {
				match: match,
				callback: item.callback
			};
		}

	}

	return result;

};

function routeToRegExp(route) {

	var optionalParam = /\((.*?)\)/g,
		namedParam = /(\(\?)?:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	route = route.replace(escapeRegExp, '\\$&')
		.replace(optionalParam, '(?:$1)?')
		.replace(namedParam, function (match, optional) {
			return optional ? match : '([^/?]+)';
		})
		.replace(splatParam, '([^?]*?)');

	return new RegExp('^\/' + route + '\/?(?:\\?([\\s\\S]*))?$');

}

module.exports = Server;
