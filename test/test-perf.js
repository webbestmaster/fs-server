"use strict";

var cluster = require('cluster'),
	loadtest = require('loadtest'),
	Server = require('./../'),
	userConfig = require('./user-config'),
	server,
	options,
	numWorkers,
	i;

if(cluster.isMaster) {

	numWorkers = require('os').cpus().length;

	for(i = 0; i < numWorkers; i++) {
		// worker = cluster.fork();
		cluster.fork();
	}

	console.log('Master cluster setting up ' + numWorkers + ' workers...');

	cluster.on('online', function(worker) {
		console.log('Worker ' + worker.process.pid + ' is online');
	});

/*
	cluster.on('exit', function(worker, code, signal) {
		console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
		console.log('Starting a new worker');

		// restart cluster if needed
		cluster.fork();
	});
*/

} else {

	server = new Server(userConfig).run();
	options = {
		url: 'http://localhost:' + server.get(server.KEYS.CONFIG).port,
		maxRequests: 1e3
	};

	loadtest.loadTest(options, function (error, result) {

		if (error) {
			console.error('Got an error: %s', error);
		} else {
			console.log('\n-= Perf test result =-\n');
			console.log(result);
		}

		server.destroy(function () {
			setTimeout(function () {
				process.exit(0);
			}, 1000);
		});

	});

}
