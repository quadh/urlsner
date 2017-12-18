/**
 * UrlController
 *
 * @description :: Server-side logic for managing urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
const moment = require('moment');
const json_path = path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json');
const auth_json_file = path.join(json_path, 'auth_users.json');
const all_urls_json_file = path.join(json_path, 'all_urls.json');
const all_urls_stats_json_file = path.join(json_path, 'all_urls_stats.json');
const token_json_file = path.join(json_path, 'tokens.json');
const token_age = 2 * 60 * 60;// in seconds

module.exports = {
	getIndex: function (req, res) {
		sails.controllers.url.createJsonFileIfNotExists('tokens.json');
		
		var view_data = {'auth': false,
						 'token': null,
						 'maxAge': token_age / (60*60)};
						 
		var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			
			return {'error' : true, 'message' : 'Error: Could not open token file for authentication.'};
		});				 
						 
		for (var user_id in token_data) {
			var user = token_data[user_id];
			if (user.ip === req.host) {
				if (moment.unix() - user.created >= token_age) {
					// expired
					delete token_data[user_id];
					return {'error' : true, 'message' : 'Error: Token has expired. Please re-authenticate.'};
				} else {
					// ok
					view_data['auth'] = true;
					view_data['token'] = user.token;
				}
			}
		}
		
		return res.view('index', view_data);
	},
	checkAuth: function (token) {
		sails.controllers.url.createJsonFileIfNotExists('tokens.json');
		
		var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			
			return {'error' : true, 'message' : 'Error: Could not open token file for authentication.'};
		});
		
		for (var user_id in token_data) {
			var user = token_data[user_id];
			if (user.token === token) {
				if (moment.unix() - user.created >= token_age) {
					// expired
					delete token_data[user_id];
					return {'error' : true, 'message' : 'Error: Token has expired. Please re-authenticate.'};
				} else {
					// ok
					return true;
				}
			}
		}
		
		return {'error' : true, 'message' : 'Error: Token not found. Please authenticate before accessing API.'};
	},
	auth: function (req, res) {
		var user_id = req.param('user-id');
		var auth_key = req.param('auth-key');
		
		var auth_data = fs.readFileSync(auth_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			
			return res.json({'error' : true, 'message' : 'Error: Could not open json file for authentication.'});
		});
		
		if (auth_data !== '') {
			
			sails.controllers.url.createJsonFileIfNotExists('tokens.json');
			var auth_json = JSON.parse(auth_data);
			var found_user_id = false;
			
			for (var i = 0; i < auth_json['auth_user_list'].length; i++) {
				var cred = auth_json['auth_user_list'][i];
				
				if (cred[user_id]) {
					found_user_id = true;
					
					if (cred[user_id] === auth_key) {
						
						var tk = sha1(user_id + auth_key + new Date().toString());
						
						var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
							if (err) throw err;
							
							return res.json({'error' : true, 'message' : 'Error: Could not open json file for authentication.'});
						});
						
						var token_data_array = [];
						
						if (token_data !== '') {
							var token_data_array = JSON.parse(token_data);
						}
						
						token_data_array[user_id] = {'ip' : req.ip,
													 'token': tk,
													 'created' : moment.unix()};
													 
						fs.writeFile(token_json_file, JSON.stringify(token_data_array), 'utf8', function (err) { 
							if (err) {
								console.log('[write error]: ' + err);
								return res.json({'error' : true, 'message' : 'Error: Could not write to json file.'});
							}
							
							return res.json({'error' : false, 'token' : tk, 'message' : 'Authenticated successfully.'});
						});

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
		if (fs.existsSync(path.join(json_path, filename)) === false) {
			fs.openSync(path.join(json_path, filename), 'w+', (err, fd) => {
				if (err) { throw err; } 
			});
		}
	},
	create: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
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
				   'create_datetime' : moment().unix(),
				   'update_datetime' : null
				   };
		
		sails.controllers.url.createJsonFileIfNotExists('all_urls.json');

		var data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
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
		
		fs.writeFile(all_urls_json_file, JSON.stringify(json_data), 'utf8', function (err) { 
			if (err) {
				console.log('[write error]: ' + err);
				return res.json({'error' : true, 'message' : 'Error: Could not write to json file.'});
			}
			return res.json({'error' : false, 'url' : url, 'message' : 'Your shortened URL was created successfully.'});
		});
		
	},
	update: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		
		
	},
	deleteUrl: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		var hash = req.param('hash');
		var data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
			if (err) throw err;
		});
		
		var json_data = JSON.parse(data);
		if (json_data[hash]) {
			delete json_data[hash];
			fs.writeFile(all_urls_json_file, JSON.stringify(json_data), 'utf8', function (err) { if (err) {console.log('[write error]: ' + err);} });
			return res.json({'error': false, 'message' : 'Hash [' + hash + '] deleted successfully.'});
		}
	},
	getUrl: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		var hash = req.param('hash');
		
		fs.readFileSync(all_urls_json_file, (err, data) => {
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
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		sails.controllers.url.createJsonFileIfNotExists('all_urls.json');

		var data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
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
		
		var return_data = [];
		
		for (var key in json_data) {
			var row = json_data[key];
			var rec = [row.hash, 
						row.actual_url.length >= 25 ? row.actual_url.substring(0, 25) + '...' : row.actual_url,
						row.status == 1 ? 'Active' : 'Inactive',
						moment.unix(row.create_datetime).format('DD/MM/YYYY'),
						row.create_datetime,
						row.update_datetime != null ? moment.unix(row.update_datetime).format('DD MM YYYY') : '---',
						row.update_datetime != null ? row.update_datetime : '---',
						'<input type="hidden" name="hash-val" value="' + row.hash + '"/><button class="btn btn-default btn-edit btn-sm">edit</button> <button class="btn btn-info btn-view-stats btn-sm">view stats</button> <button class="btn btn-danger btn-delete btn-sm">del</button>'];
						
			return_data.push(rec);
		}
		
		return res.json({'error' : false, 'return_data' : return_data, 'message' : ''});
		
	},
	getStats: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.param('token'));
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
	
		
	}
};

