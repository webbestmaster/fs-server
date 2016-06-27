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
	};

// prepare files
before(function () {
	return testUtil.readDirs('./../test', './../data').then(function (filesData) {
		filesHash.attr = filesData;
	});
});

it('should return index.html from /', function (done) {
	request('http://localhost:' + port, function (error, response, body) {
		assert.equal(filesHash.getAsString('index.html'), body);
		done();
	});
});

it('should return index.html from /index.html', function (done) {
	request('http://localhost:' + port, function (error, response, body) {
		assert.equal(filesHash.getAsString('index.html'), body);
		done();
	});
});

it('should return index.html from /internal-folder', function (done) {
	request('http://localhost:' + port + '/internal-folder', function (error, response, body) {
		assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
		expect(body).to.not.equal(filesHash.getAsString('/index.html'));
		done();
	});
});

it('should return index.html from /internal-folder/', function (done) {
	request('http://localhost:' + port + '/internal-folder/', function (error, response, body) {
		assert.equal(filesHash.getAsString('/internal-folder/index.html'), body);
		expect(body).to.not.equal(filesHash.getAsString('/index.html'));
		done();
	});
});






