"use strict";

var http = require('http'),
	path = require('path'),
	ip = require('ip'),
	FileHunter = require('./data/file-hunter');

function replaceValues(from, to) {

	var merge = {},
		key;

	for (key in to) {
		if (to.hasOwnProperty(key)) {
			merge[key] = from.hasOwnProperty(key) ? from[key] : to[key];
		}
	}

	return merge;

}

function Server(userConfigArg) {

	var server = this;

	server.attr = {
		httpServer: null,
		config: null
	};

	server.initialize(userConfigArg);

}

Server.prototype.initialize = function (userConfigArg) {

	var config, fileHunter, server, httpServer;

	server = this;

	config = replaceValues(userConfigArg || {}, require('./data/defaults-config'));

	fileHunter = new FileHunter({
		root: path.normalize([process.cwd(), config.root].join(path.sep)),
		page404: config.page404
	});

	httpServer = new http.createServer(function (req, res) {
		console.log(req.url);
		fileHunter.find(req, res, null, fileHunter.send);
	});

	server.attr.httpServer = httpServer;
	server.attr.config = config;

};

Server.prototype.run = function () {

	var serverAttr = this.attr;

	serverAttr.httpServer.listen(serverAttr.config.port);

	console.log('Server started:', ip.address() + ':' + serverAttr.config.port);

};

module.exports = Server;
