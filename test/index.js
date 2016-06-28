"use strict";

var Server = require('./../'),
	testUtil = require('./test-util'),
	userConfig = require('./user-config'), // user config with custom 404
	request = require('request'),
	assert = require('chai').assert,
	expect = require('chai').expect,
	server = new Server(userConfig).run(),
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


it('headers.referer -> should return /internal-folder/test-image-2.jpg ', function (done) {

	var options = {
		url: serverUrl + '/test-image-2.jpg',
		headers: {
			referer: 'internal-folder'
		}
	};

	request(options, function (error, response, body) {
		assert.equal(body.toString(), filesHash.getAsString('/internal-folder/test-image-2.jpg'));
		done();
	});
	
});




