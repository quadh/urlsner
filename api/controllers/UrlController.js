/**
 * UrlController
 *
 * @description :: Server-side logic for managing urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');

module.exports = {
	getIndex: function (req, res) {
		var view_data = {'auth': false,
						 'token': null,
						 'maxAge': sails.config.session.cookie.maxAge/(60*60*1000)};
						 
		if (req.session.token) {
			view_data['auth'] = true;
			view_data['token'] = req.session.token;
		}
		
		return res.view('index', view_data);
	},
	checkAuth: function (token) {
		return (typeof token !== 'undefined');
	},
	auth: function (req, res) {
		var user_id = req.param('user-id');
		var auth_key = req.param('auth-key');
		
		var auth_data = fs.readFileSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'auth_users.json'), 'utf8', (err, data) => {
			if (err) throw err;
			
			return res.json({'error' : true, 'message' : 'Error: Could not open json file for authentication.'});
		});
		
		if (auth_data !== '') {
			var auth_json = JSON.parse(auth_data);
			var found_user_id = false;
			
			for (var i = 0; i < auth_json['auth_user_list'].length; i++) {
				var cred = auth_json['auth_user_list'][i];
				
				if (cred[user_id]) {
					found_user_id = true;
					
					if (cred[user_id] === auth_key) {
						req.session.token = sha1(user_id + auth_key + new Date().toString());
						
						return res.json({'error' : false, 'token' : req.session.token, 'message' : 'Authenticated successfully.'});
					} else {
						return res.json({'error' : true, 'message' : 'Error: Invalid password.'});
					}
					
				} else {
					return res.json({'error' : true, 'message' : 'Error: Credentials could not be found.'});
				}
			}
			
			
		} else {
			return res.json({'error' : true, 'message' : 'Error: Authentication credentials have not been defined in json file.'});
		}
	},
	createJsonFileIfNotExists: function (filename) {		
		if (fs.existsSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', filename)) === false) {
			fs.openSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', filename), 'w+', (err, fd) => {
				if (err) { throw err; } 
			});
		}
	},
	create: function (req, res) {
		if (!sails.controllers.url.checkAuth(req.session.token)) {
			return res.json({'error': true, 'message' : 'Error: Please authenticate and obtain a token before continuing.'});
		}
		
		var actual_url = req.param('actual_url');
		var n = actual_url.search(/http(s)*(:)\/\/(www)*\.[a-zA-Z0-9\-]+(\.)*[a-zA-Z]{2,6}.*/i);
		
		if (n < 0) {
			return res.json({'error' : true, 'message' : 'URL entered is invalid.<br/>Required format: http(s)://www.google.com/abc'});
		}
		
		var url = {'hash': Url.genHash(),
				   'actual_url' : actual_url,
				   'created_by' : '',
				   'status' : 1,
				   'create_datetime' : new Date(),
				   'update_datetime' : null
				   };
		
		sails.controllers.url.createJsonFileIfNotExists('all_urls.json');

		var data = fs.readFileSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'all_urls.json'), 'utf8', (err, data) => {
			if (err) {
				throw err;
			}
			
			return res.json({'error' : true, 'message' : 'Error: Could not open json file for writing.'});
		});
		
		if (data !== '') {
			var json_data = JSON.parse(data);
		} else {
			var json_data = {};
		}
		
		json_data[url.hash] = url;
		
		fs.writeFile(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'all_urls.json'), JSON.stringify(json_data), 'utf8', function (err) { 
			if (err) {
				console.log('[write error]: ' + err);
				return res.json({'error' : true, 'message' : 'Error: Could not write to json file.'});
			}
			return res.json({'error' : false, 'url' : url, 'message' : 'Your shortened URL was created successfully.'});
		});
		
	},
	update: function (req, res) {
		if (!sails.controllers.url.checkAuth(req.session.token)) {
			return res.json({'error': true, 'message' : 'Error: Please authenticate and obtain a token before continuing.'});
		}
		
	},
	delete: function (req, res) {
		if (!sails.controllers.url.checkAuth(req.session.token)) {
			return res.json({'error': true, 'message' : 'Error: Please authenticate and obtain a token before continuing.'});
		}
		var hash = req.param('hash');
		
		fs.readFileSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'all_urls.json'), (err, data) => {
			if (err) throw err;
			
			var json_data = JSON.parse(data);
			if (json_data[hash]) {
				delete json_data[hash];
				fs.writeFile(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'all_urls.json'), JSON.stringify(json_data), 'utf8', function (err) { if (err) {console.log('[write error]: ' + err);} });
			}
		});
	},
	getUrl: function (req, res) {
		var hash = req.param('hash');
		
		fs.readFileSync(path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json', 'all_urls.json'), (err, data) => {
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
		if (!sails.controllers.url.checkAuth(req.session.token)) {
			return res.json({'error': true, 'message' : 'Error: Please authenticate and obtain a token before continuing.'});
		}
		var all_urls = require('fs').readFileSync(path.resolve(__dirname,'../config/json/all_urls.json'));
		
		
	},
	getInfo: function (req, res) {
		if (!sails.controllers.url.checkAuth(req.session.token)) {
			return res.json({'error': true, 'message' : 'Error: Please authenticate and obtain a token before continuing.'});
		}
		var url_info = require('fs').readFileSync(path.resolve(__dirname,'../config/json/all_url_info.json'));
		
	}
};

