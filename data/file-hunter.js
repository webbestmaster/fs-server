"use strict";

var url = require('url');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var zlib = require('zlib');
var defaultsConfig = require('./defaults-config');

function FileHunter(options) {

	var fileHunter = this;

	fileHunter.pathSep = path.sep;
	fileHunter.root = options.root;

	if (defaultsConfig.page404 === options.page404) {
		fileHunter.page404 = options.page404;
	} else {
		fileHunter.page404 = path.normalize(options.root + path.sep + options.page404);
	}

	fileHunter.send = fileHunter.send.bind(fileHunter);

}

FileHunter.prototype.fakeFileInfo = {
	mtime: Date.now().toString()
};

FileHunter.prototype.find = function (req, res, err, cb) {

	// FIXME: add here check for err if needed
	var fileHunter = this,
		reqUrl = url.parse(req.url),
		pathSep = fileHunter.pathSep,
		pathName = path.normalize(fileHunter.root + pathSep + reqUrl.pathname);

	// detect file or folder
	fs.stat(pathName, function (err, fileInfo) {

		if (err) {

			// if file nor found try to find relative req.referer
			if (req.headers.referer) {
				var referer = url.parse(req.headers.referer).pathname,
					refPathName = path.normalize(fileHunter.root + pathSep + referer + pathSep + reqUrl.pathname);

				fs.stat(refPathName, function (err, fileInfo) {

					if (err) {
						return cb(req, res, err, pathName);
					}

					// if path walk to directory - add /index.html to end ot the path
					if (fileInfo.isDirectory()) {
						refPathName = path.normalize(refPathName + pathSep + 'index.html');
					}

					cb(req, res, null, refPathName, fileInfo);

				});

			} else {
				cb(req, res, err, pathName);
			}

			return;

		}

		// if path walk to directory - add /index.html to end ot the path
		if (fileInfo.isDirectory()) {
			pathName = path.normalize(pathName + pathSep + 'index.html');
		}

		cb(req, res, null, pathName, fileInfo);

	});

};

FileHunter.prototype.send = function (req, res, err, path, fileInfo) {

	var fileHunter = this,
		lastModified,
		file,
		acceptEncoding;

	if (err) {
		fileHunter.send404(req, res, err, path);
		return;
	}

	// set mime type
	res.setHeader('Content-Type', mime.lookup(path));

	lastModified = fileInfo.mtime.toString();

	if (req.headers['if-modified-since'] === lastModified) {
		res.statusCode = 304;
		res.end();
		return;
	}

	res.setHeader('Last-Modified', lastModified);
	res.setHeader('Cache-Control', 'private, max-age=300');

	file = 	new fs.ReadStream(path);
	acceptEncoding = req.headers['accept-encoding'] || '';

	// Note: this is not a conformant accept-encoding parser.
	// See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
	if ((/\bdeflate\b/).test(acceptEncoding)) {
		res.setHeader('Content-Encoding', 'deflate');
		file.pipe(zlib.createDeflate()).pipe(res);
	} else if ((/\bgzip\b/).test(acceptEncoding)) {
		res.setHeader('Content-Encoding', 'gzip');
		file.pipe(zlib.createGzip()).pipe(res);
	} else {
		file.pipe(res);
	}

	file.on('error', function (err) {
		res.statusCode = 404;
		res.end();
		// fileHunter.send404(req, res, err);
	});

	// client close connection
	// close - this is error for res
	// finish - is normal for res
	res.on('close', function () {
		file.destroy();
	});

};

FileHunter.prototype.send404 = function (req, res, err, path) {

	var fileHunter = this,
		mimeType = mime.lookup(path);

	res.statusCode = 404;

	if (!mimeType || mimeType === mime.types.html) {
		fileHunter.send(req, res, null, fileHunter.page404, fileHunter.fakeFileInfo);
	} else {
		res.end();
	}

};

module.exports = FileHunter;
