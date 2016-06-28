"use strict";

var path = require('path');
var fs = require('fs');

function walk(dir, done) {

	var results = [];

	fs.readdir(dir, function (err, list) {

		if (err) return done(err);

		var pending = list.length;

		if (!pending) return done(null, results);

		list.forEach(function (file) {
			file = path.resolve(dir, file);
			fs.stat(file, function (err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, function (err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
					});
				} else {
					results.push(file);
					if (!--pending) done(null, results);
				}
			});
		});

	});

}


module.exports = {

	getFilesPath: function (dir) {

		return new Promise(function (resolve, reject) {

			walk(dir, function (err, result) {
				if (err) {
					reject(err);
					return;
				}

				resolve(result);

			});

		});

	},

	readDir: function (dir) {

		var testUtil = this;

		return new Promise(function (resolve, reject) {
			testUtil
				.getFilesPath(path.resolve(process.cwd(), dir))
				.then(function (filesPath) {
					return Promise.all(filesPath.map(function (filePath) {
						return testUtil.readFile(filePath);
					}));
				}, function (err) {
					console.error('Error during get files path.');
					reject(err);
				})
				.then(function (files) {
					resolve(files);
				}, function (err) {
					console.error('Error during read file by path.');
					reject(err);
				});
		});

	},

	readDirs: function () {

		var testUtil = this,
			dirs = testUtil.toArray(arguments);

		return Promise.all(dirs.map(function (dir) {
			return testUtil.readDir(dir);
		}))
		.then(function (dirs) {

			var filesHash = {};

			testUtil.mergeArrays(dirs).forEach(function (fileObj) {
				filesHash[fileObj.path] = fileObj.file;
			});

			return filesHash;

		});

	},

	readFile: function (filePath) {

		return new Promise(function (resolve, reject) {
			fs.readFile(filePath, function (err, file) {
				if (err) {
					reject(err);
					return;
				}
				resolve({
					file: file,
					path: filePath
				});
			});
		});

	},

	toArray: function (likeArray) {

		return Array.prototype.slice.call(likeArray);

	},

	mergeArrays: function (arrays) {

		var testUtil = this,
			firstArray = testUtil.toArray(arrays[0]),
			i, len;

		for (i = 1, len = arrays.length; i < len; i += 1) {
			firstArray = firstArray.concat(arrays[i]);
		}

		return firstArray;

	},

	fileToBase64: function (file) {

		

	}

};
