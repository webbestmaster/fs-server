var loadtest = require('loadtest'),
	Server = require('./../'),
	userConfig = require('./user-config'),
	server = new Server(userConfig).run(),
	options = {
		url: 'http://localhost:' + server.get(server.KEYS.CONFIG).port,
		maxRequests: 1e4
	};

loadtest.loadTest(options, function (error, result) {

	if (error) {
		console.error('Got an error: %s', error);
	} else {
		console.log('\n-= Perf test result =-\n');
		console.log(result);
	}

	server.destroy();

});
