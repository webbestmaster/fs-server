var userConfig = require('./user-config'),
	Server = require('./../');

module.exports = new Server(userConfig).run();
