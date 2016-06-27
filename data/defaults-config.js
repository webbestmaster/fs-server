var path = require('path');

module.exports = {

	port: process.env.PORT || 3000, // used

	root: 'www', // used
	
/*
	onRequest: function (req, res) {
		console.log('I am onRequest');
		cb();
	},
*/

	page404: path.normalize([__dirname, '404', 'index.html'].join(path.sep)) // used

};
