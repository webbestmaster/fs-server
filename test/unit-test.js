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

	it('user page 404',function (done) {
		request(serverUrl + '/' + Math.random(), function (error, response, body) {
			var bodyString = body.toString(),
				page404 = filesHash.getAsString(server.get(server.KEYS.CONFIG).page404);
			expect(bodyString).to.equal(page404);
			assert.equal(response.statusCode, 404);
			done();
		});
	});

	it('browser\'s cache control',function (done) {
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

describe('fs-server: automatic tests - default config', function () {

	var server, port, serverUrl;

	before(function () {
		server = new Server().run();
		port = server.get(server.KEYS.CONFIG).port;
		serverUrl = 'http://localhost:' + port;
	});

	after(function () {
		server.destroy();
	});

	it('default page 404',function (done) {

		request(serverUrl + '/' + Math.random(), function (error, response, body) {

			var bodyString = body.toString(),
				serverConfig = server.get(server.KEYS.CONFIG),
				page404Path = serverConfig.page404,
				root = serverConfig.root,
				page404FilePath = path.join('..', '..', 'data', page404Path.replace(root, '')),
				page404 = filesHash.getAsString(page404FilePath);

			expect(bodyString).to.equal(page404);
			assert.equal(response.statusCode, 404);

			done();

		});

	});

});
