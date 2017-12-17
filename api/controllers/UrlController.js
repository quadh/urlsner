/**
 * UrlController
 *
 * @description :: Server-side logic for managing urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const fs = require('fs');

module.exports = {
	checkAuth: function (req, res) {
		if (!req.session.authenticated) {
			return res.json(500, { error: 'message' });
		}
	},
	auth: function (req, res) {
		var auth_json_file = require('fs').readFileSync(require('path').resolve(__dirname,'../config/json/auth_users.json'));
		

		
	},
	create: function (req, res) {
		
	},
	update: function (req, res) {
		
	},
	delete: function (req, res) {
		var hash = req.param('hash');
		
		fs.readFileSync(require('path').resolve(__dirname,'../config/json/all_urls.json'), (err, data) => {
			if (err) throw err;
			
			var json_data = JSON.parse(data);
			if (json_data[hash]) {
				delete json_data[hash];
				var json_str = JSON.stringify(json_data);
				fs.writeFile('message.txt', json_str, 'utf8', function (err) { if (err) {console.log('[write error]: ' + err);} });
			}
		});
	},
	getUrl: function (req, res) {
		var hash = req.param('hash');
		
		fs.readFileSync(require('path').resolve(__dirname,'../config/json/all_urls.json'), (err, data) => {
			if (err) throw err;
			console.log(JSON.parse(data));
		});
		
		// check hash against local url json file
		
		// if found
			// get data about user
			// browser
			// location
			// then redirect
		// else
			// prompt error
	},
	getAllUrls: function (req, res) {
		var all_urls = require('fs').readFileSync(require('path').resolve(__dirname,'../config/json/all_urls.json'));
		
		
	},
	getInfo: function (req, res) {
		var url_info = require('fs').readFileSync(require('path').resolve(__dirname,'../config/json/all_url_info.json'));
		
	}
};

