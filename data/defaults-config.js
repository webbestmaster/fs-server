var path = require('path');

module.exports = {

	root: __dirname, 					// path to front-end part of site

	port: process.env.PORT || 3000, 	// default port

	page404: path.join(__dirname, '404', 'index.html') // optional, path to 404 page

};
