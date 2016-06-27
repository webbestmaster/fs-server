"use strict";

var Server = require('./../');
var testUtil = require('./test-util');
var userConfig = require('./user-config'); // user config with custom 404
var request = require('request');

var server = new Server(userConfig).run();

// prepare files
testUtil.readDir('./').then(function (list) {
	console.log(list);
	console.log(list);
});


/*
request('http://localhost:' + server.get(server.KEYS.CONFIG).port, function(error, response, body) {
	console.log(body);
});
*/





