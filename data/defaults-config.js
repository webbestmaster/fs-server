var path = require('path');

module.exports = {

	port: process.env.PORT || 3000, // used

	root: __dirname, // used
	
/*
	onRequest: function (req, res) {
		console.log('I am onRequest');
		cb();
	},
*/

	page404: path.join(__dirname, '404', 'index.html') // used

};
