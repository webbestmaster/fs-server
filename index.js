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




/*
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
*/

			boundRequest.callback.apply(boundRequest.context, [req, res].concat(boundRequest.match));

		} else {
			fileHunter.find(req, res, null, fileHunter.send);
		}

	});

	server.set(server.KEYS.HTTP_SERVER, httpServer);
	server.set(server.KEYS.CONFIG, config);

	// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
	server.bindings = {
		GET: [],
		POST: [],
		OPTIONS: [],
		HEAD: [],
		PUT: [],
		DELETE: [],
		TRACE: [],
		CONNECT: []
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

Server.prototype.bindRequest = function (typeArg, routeArg, callback, context) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings,
		route = reduceRouteString(routeArg);

	if (!bindings.hasOwnProperty(type)) {
		// add unknow request type
		bindings[type.toUpperCase()] = [];
	}

	server.unbindRequest(typeArg, route);

	bindings[type].push({
		route: route,
		regExp: routeToRegExp(route),
		callback: callback,
		context: context || null
	});

	return server;

};

Server.prototype.unbindRequest = function (typeArg, routeArg) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings,
		list = bindings[type],
		route = reduceRouteString(routeArg);

	if (list) {

		list.every(function (data, index, arr) {

			if (data.route === route) {
				arr.splice(index, 1);
				return false;
			}

			return true;

		});

	}

	return server;

};

Server.prototype.findBoundRequest = function (req) {

	var method = req.method,
		parsedUrl = url.parse(req.url),
		pathname = parsedUrl.pathname,
		callbackList = this.bindings[method] || [],
		match,
		i = callbackList.length,
		item;

	while (i) {

		i -= 1;

		item = callbackList[i];

		match = pathname.match(item.regExp);

		if (match) {

			return {
				match: match,
				callback: item.callback,
				context: item.context
			};

		}

	}

};

function routeToRegExp(routeArg) {

	var optionalParam = /\((.*?)\)/g,
		namedParam = /(\(\?)?:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
		route = reduceRouteString(routeArg);

	route = route.replace(escapeRegExp, '\\$&')
		.replace(optionalParam, '(?:$1)?')
		.replace(namedParam, function (match, optional) {
			return optional ? match : '([^/?]+)';
		})
		.replace(splatParam, '([^?]*?)');

	return new RegExp('^\/' + route + '\/?(?:\\?([\\s\\S]*))?$');

}

function reduceRouteString(route) {

	return route.trim().replace(/^\/+|\/+$/g, '');

}

module.exports = Server;
