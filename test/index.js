"use strict";

var testUtil = require('./test-util'),
	userConfig = require('./user-config'), // user config with custom 404
	request = require('request'),
	assert = require('chai').assert,
	expect = require('chai').expect,
	server = require('./server'),
	path = require('path'),
	port = server.get(server.KEYS.CONFIG).port,
	filesHash = {
		attr: {},
		getFullPath: function (serverPath) {
			return path.join(process.cwd(), userConfig.root, serverPath);
		},
		get: function (path) {
			return this.attr[this.getFullPath(path)]
		},
		getAsString: function (path) {
			return this.attr[this.getFullPath(path)].toString();
		}
	},
	serverUrl = 'http://localhost:' + port;

// prepare files
before(function () {
	return testUtil.readDirs('./../test', './../data').then(function (filesData) {
		filesHash.attr = filesData;
	});
});

it('should return /index.html ', function (done) {
	request(serverUrl, function (error, response, body) {
		assert.equal(filesHash.getAsString('index.html'), body);
		done();
	});
});

it('should return /index.html', function (done) {
	request(serverUrl + '/index.html', function (error, response, body) {
		assert.equal(filesHash.getAsString('index.html'), body);
		done();
	});
});

it('should return /internal-folder/index.html', function (done) {
	request(serverUrl + '/internal-folder', function (error, response, body) {
		assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
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

		var bodyString = body.toString(),
			requestFileString = filesHash.getAsString('/internal-folder/test-image-2.jpg'),
			extraFileString = filesHash.getAsString('/test-image-2.jpg');

		expect(bodyString).to.equal(requestFileString);
		expect(bodyString).to.not.equal(extraFileString);

		done();

	});

});

it('404',function (done) {

	request(serverUrl + '/' + Math.random(), function (error, response, body) {

		var bodyString = body.toString(),
			page404 = filesHash.getAsString(server.get(server.KEYS.CONFIG).page404);

		expect(bodyString).to.equal(page404);

		done();

	});

});


