"use strict";

var testUtil = require('./test-util'),
	Server = require('./../'),
	userConfig = require('./user-config'), // user config with custom 404
	request = require('request'),
	assert = require('chai').assert,
	expect = require('chai').expect,
	path = require('path'),
	filesHash = {
		attr: {},
		getFullPath: function (serverPath) {
			return path.join(process.cwd(), userConfig.root, serverPath);
		},
		get: function (path) {
			return this.attr[this.getFullPath(path)]
		},
		getAsString: function (path) {
			return this.attr[this.getFullPath(path)].toString('utf-8');
		}
	};

// prepare files
before(function () {
	return testUtil.readDirs('./../test', './../data').then(function (filesData) {
		filesHash.attr = filesData;
	});
});

describe('fs-server: automatic tests - user config', function () {

	var server, port, serverUrl;

	before(function () {
		server = new Server(userConfig).run();
		port = server.get(server.KEYS.CONFIG).port;
		serverUrl = 'http://localhost:' + port;
	});

	after(function () {
		server.destroy();
	});

	it('should return /index.html', function (done) {
		request(serverUrl, function (error, response, body) {
			assert.equal(filesHash.getAsString('index.html'), body);
			assert.equal(response.statusCode, 200);
			done();
		});
	});

	it('should return /index.html', function (done) {
		request(serverUrl + '/index.html', function (error, response, body) {
			assert.equal(filesHash.getAsString('index.html'), body);
			done();
		});
	});

	it('should return /internal-folder/index.html by 302 to \'path + \/\'', function (done) {
		var requestPath = '/internal-folder';
		request(serverUrl + requestPath, function (error, response, body) {
			// test redirect
			assert.equal(response.req.path.replace(requestPath, ''), '/');
			// test requested file
			assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
			// check for other file
			expect(body).to.not.equal(filesHash.getAsString('/index.html'));
			done();
		});
	});

	it('should return /internal-folder/index.html', function (done) {
		request(serverUrl + '/internal-folder/', function (error, response, body) {
			assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
			expect(body).to.not.equal(filesHash.getAsString('/index.html'));
			done();
		});
	});

	it('should return /internal-folder/index.html', function (done) {
		request(serverUrl + '/internal-folder/index.html', function (error, response, body) {
			assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
			expect(body).to.not.equal(filesHash.getAsString('/index.html'));
			done();
		});
	});

	it('should return /internal-folder/test-image-2.jpg', function (done) {
		request(serverUrl + '/internal-folder/test-image-2.jpg', function (error, response, body) {
			assert(body.toString('utf-8') === filesHash.getAsString('/internal-folder/test-image-2.jpg'));
			assert(body.toString('utf-8') !== filesHash.getAsString('/test-image-2.jpg'));
			done();
		});
	});

	it('user page 404', function (done) {
		request(serverUrl + '/' + Math.random(), function (error, response, body) {
			var bodyString = body.toString(),
				page404 = filesHash.getAsString(server.get(server.KEYS.CONFIG).page404);
			expect(bodyString).to.equal(page404);
			assert.equal(response.statusCode, 404);
			done();
		});
	});

	it('default page 404 as not html mime type', function (done) {
		request(serverUrl + '/' + Math.random() + '.jpg', function (error, response, body) {
			expect(body).to.equal('');
			assert.equal(response.statusCode, 404);
			done();
		});
	});

	it('browser\'s cache control', function (done) {
		request(serverUrl, function (error, response, body) {
			var options = {
				url: serverUrl,
				headers: {
					'if-modified-since': response.headers['last-modified']
				}
			};
			request(options, function (error, response, body) {
				assert.equal(response.statusCode, 304);
				assert.equal(body, '');
				done();
			});
		});
	});

});

describe('fs-server: test server destroy callback', function () {

	var server, port, serverUrl;

	before(function () {
		server = new Server().run();
		port = server.get(server.KEYS.CONFIG).port;
		serverUrl = 'http://localhost:' + port;
	});

	it('destroy server', function (done) {
		server.destroy(done);
	});

});

describe('fs-server: test encoding', function () {

	var server, port, serverUrl;

	before(function () {
		server = new Server(userConfig).run();
		port = server.get(server.KEYS.CONFIG).port;
		serverUrl = 'http://localhost:' + port;
	});

	after(function () {
		server.destroy();
	});

	it('accept-encoding deflate', function (done) {
		var options = {
			url: serverUrl,
			headers: {
				'accept-encoding': 'deflate'
			}
		};
		request(options, function (error, response, body) {
			assert.equal(response.headers['content-encoding'], 'deflate');
			done();
		});
	});

	it('accept-encoding gzip', function (done) {
		var options = {
			url: serverUrl,
			headers: {
				'accept-encoding': 'gzip'
			}
		};
		request(options, function (error, response, body) {
			assert.equal(response.headers['content-encoding'], 'gzip');
			done();
		});
	});

	it('accept-encoding non exist encoding', function (done) {
		var options = {
			url: serverUrl,
			headers: {
				'accept-encoding': Math.random()
			}
		};
		request(options, function (error, response, body) {
			assert.isUndefined(response.headers['content-encoding']);
			assert.equal(filesHash.getAsString('index.html'), body);
			done();
		});
	});

});

describe('fs-server: request binding', function () {

	var server, port, serverUrl,
		boundUrl = '/api/i-class/i-method';

	before(function () {
		server = new Server(userConfig).run();
		port = server.get(server.KEYS.CONFIG).port;
		serverUrl = 'http://localhost:' + port;
	});

	after(function () {
		server.destroy();
	});

	it('add first request binding', function (done) {

		server.bindRequest('get', 'api/:class/:method', function (req, res, url, className, methodName) {
			res.end([className, methodName].join('+'));
		}, server);

		var options = {
			url: serverUrl + boundUrl
		};

		request(options, function (error, response, body) {
			assert.equal(['i-class', 'i-method'].join('+'), body);
			done();
		});

	});

	it('add second request binding', function (done) {

		server.bindRequest('get', 'api/i-:class/', function (req, res, url, className) {
			res.end(className);
		});

		var options = {
			method: 'get',
			url: serverUrl + '/api/i-url'
		};

		request(options, function (error, response, body) {
			assert.equal('url', body);
			done();
		});

	});

	it('remove not exist request type and not exist route', function () {
		server.unbindRequest('I am not exist request type');
		server.unbindRequest('get', 'I am not exist route');
	});

	it('remove first request binding', function (done) {

		server.unbindRequest('get', 'api/:class/:method');

		var options = {
			url: serverUrl + boundUrl
		};

		request(options, function (error, response, body) {
			assert.equal(response.statusCode, 404);
			done();
		});

	});

	it('bind not exist request type', function () {
		assert.throws(function () {
			server.bindRequest('I am not exist ' + Math.random(), 'api/?:query', function () {
			})
		}, TypeError);
	});

	it('context', function (done) {

		var needeContext = {},
			callbackContext,
			options = {
				url: serverUrl + '/context'
			};

		server.bindRequest('get', 'context', function (req, res, url, className, methodName) {
			callbackContext = this;
			res.end();
		}, needeContext);

		request(options, function (error, response, body) {
			assert(needeContext === callbackContext);
			done();
		});

	});


});
