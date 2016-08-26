"use strict";

var http = require('http'),
	path = require('path'),
	ip = require('ip'),
	lodash = require('lodash'),
	url = require('url'),
	FileHunter = require('./data/file-hunter');

/**
 * Server constructor
 * @param {object} userConfigArg - optional - config of server
 * @return {Server} - server instance
 */
function Server(userConfigArg) {

	var server = this;

	server.initialize(userConfigArg);

}

/**
 * Public
 * Server keys
 */
Server.prototype.KEYS = {
	CONFIG: 'server:config',
	HTTP_SERVER: 'server:http-server'
};

/**
 * Public
 * @param {string} key - key to save value
 * @param {any} value - value to save
 * @return {undefined} undefined
 */
Server.prototype.set = function (key, value) {
	this.attr[key] = value;
};

/**
 * Public
 * @param {string} key - key to get value
 * @return {any} - saved data or undefined
 */
Server.prototype.get = function (key) {
	return this.attr[key];
};

/**
 * Private
 * @param {object} userConfigArg - optional - config to initialize server
 * @return {undefined} undefined
 */
Server.prototype.initialize = function (userConfigArg) {

	var config, fileHunter, server, httpServer;

	server = this;

	server.attr = {};

	config = lodash.extend({}, require('./data/defaults-config'), (userConfigArg || {}));

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

/**
 * Public
 * Run sever, start listen a port
 * @return {Server} - server
 */
Server.prototype.run = function () {

	var server = this,
		httpServer = server.get(server.KEYS.HTTP_SERVER),
		port = server.get(server.KEYS.CONFIG).port;

	httpServer.listen(port);

	console.log('Server started:', ip.address() + ':' + port);

	return server;

};

/**
 * Public
 * @param {function} callback - execute when server has been stopped
 * @return {undefined} undefined
 */
Server.prototype.destroy = function (callback) {

	var server = this,
		httpServer = server.get(server.KEYS.HTTP_SERVER),
		port = server.get(server.KEYS.CONFIG).port,
		bindings = server.bindings,
		type;

	server.attr = {};

	// server unbind requests
	for (type in bindings) {
		bindings[type] = [];
	}

	httpServer.close(function () {
		console.log('Server destroyed:', ip.address() + ':' + port);
		return callback && callback();
	});

};

/**
 * Public
 * @param {string} typeArg - type of request (GET, POST, PUT and etc.)
 * @param {string} routeArg - mask of route, f.e. 'api', 'api/:page', try to read Backbone Router
 * @param {function} callback - function to execute when route has been matched
 * @param {object} context - optional - function execution context
 * @return {Server} - server
 */
Server.prototype.bindRequest = function (typeArg, routeArg, callback, context) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings,
		route = reduceRouteString(routeArg),
		regExp = routeToRegExp(route);

	server.unbindRequest(typeArg, route);

	bindings[type].push({
		regExp: regExp,
		regExpStr: regExp.toString(),
		callback: callback,
		context: context || null
	});

	return server;

};

/**
 * Public
 * @param {string} typeArg - type of request (GET, POST, PUT and etc.)
 * @param {string} routeArg - mask of route, f.e. 'api', 'api/:page', try to read Backbone Router
 * @return {Server} - server
 */
Server.prototype.unbindRequest = function (typeArg, routeArg) {

	var server = this,
		type = typeArg.toUpperCase(),
		bindings = server.bindings,
		list = bindings[type],
		route = reduceRouteString(routeArg || ''),
		regExp = routeToRegExp(route),
		regExpStr = regExp.toString();

	if (list) {

		list.every(function (data, index, arr) {

			if (data.regExpStr === regExpStr) {
				arr.splice(index, 1);
				return false;
			}

			return true;

		});

	}

	return server;

};

/**
 * Private
 * @param {object} req - native request of httpServer
 * @return {object} - founded callback
 */
Server.prototype.findBoundRequest = function (req) {

	var method = req.method,
		parsedUrl = url.parse(req.url),
		pathname = '/' + reduceRouteString(parsedUrl.pathname) + '/',
		callbackList = this.bindings[method],
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

/**
 * Private
 * Helper
 * Converter user's route to regExp to use it for found needed callback for request
 * @param {string} routeArg - user's route
 * @return {RegExp}
 */
function routeToRegExp(routeArg) {

	var optionalParam = /\((.*?)\)/g,
		namedParam = /(\(\?)?:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
		route;

	route = routeArg.replace(escapeRegExp, '\\$&')
		.replace(optionalParam, '(?:$1)?')
		.replace(namedParam, '([^/?]+)')
		/*
		 .replace(namedParam, function (match, optional) {
		 return optional ? match : '([^/?]+)';
		 })
		 */
		.replace(splatParam, '([^?]*?)');

	return new RegExp('^\/' + route + '\/?(?:\\?([\\s\\S]*))?$');

}

/**
 * Private
 * Helper
 * Remove extra symbols from user's route
 * @param {string} route - user's route
 * @return {string}
 */
function reduceRouteString(route) {

	return route.trim().replace(/^\/+|\/+$/g, '');

}

module.exports = Server;
