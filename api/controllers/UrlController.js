/**
 * UrlController
 *
 * @description :: Server-side logic for managing urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
const moment = require('moment-timezone');
const json_path = path.join(__dirname, '..' + path.sep + '..' + path.sep + 'json');
const auth_json_file = path.join(json_path, 'auth_users.json');
const all_urls_json_file = path.join(json_path, 'all_urls.json');
const all_urls_stats_json_file = path.join(json_path, 'all_urls_stats.json');
const token_json_file = path.join(json_path, 'tokens.json');
const token_age = 2 * 60 * 60;// in seconds
moment.tz.setDefault("Asia/Singapore");

module.exports = {
	getIndex: function (req, res) {
		sails.controllers.url.createJsonFileIfNotExists('tokens.json');
		
		var view_data = {'auth': false,
						 'token': null,
						 'maxAge': token_age / (60*60)};
						 
		var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			//return {'error' : true, 'message' : 'Error: Could not open token file for authentication.'};
		});
		
		try {
			token_data = JSON.parse(token_data);
		} catch (e) {
			return res.json({'error' : true, 'message' : 'Error: Unable to parse JSON in token file.'});
		}
		
		for (var user_id in token_data) {
			var user = token_data[user_id];
			if (user.ip === req.host || (user.ip == "::1" && req.host == "localhost")) {
				if (moment().unix() - user.created >= token_age) {
					// expired
					delete token_data[user_id];
					//return res.json({'error' : true, 'message' : 'Error: Token has expired. Please re-authenticate.'});
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
		token = token.replace('Basic ', '');
		sails.controllers.url.createJsonFileIfNotExists('tokens.json');
		
		var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			
			return {'error' : true, 'message' : 'Error: Could not open token file for authentication.'};
		});
		
		try {
			token_data = JSON.parse(token_data);
		} catch (e) {
			return {'error' : true, 'message' : 'Error: Could not open parse token file contents.'};
		}
		
		for (var user_id in token_data) {
			var user = token_data[user_id];
			if (user.token === token) {
				console.log(moment().unix());
				console.log(moment().unix() - user.created);
				console.log(token_age);
				if (moment().unix() - user.created >= token_age) {
					// expired
					delete token_data[user_id];
					return {'error' : true, 'message' : 'Error: Token has expired. Please re-authenticate.'};
				} 
				return true;
			}
		}
		
		return {'error' : true, 'message' : 'Error: Token not found. Please authenticate before accessing API.'};
	},
	getUserId: function (token) {
		token = token.replace('Basic ', '');
		sails.controllers.url.createJsonFileIfNotExists('tokens.json');
		
		var token_data = fs.readFileSync(token_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			
			return {'error' : true, 'message' : 'Error: Could not open token file for authentication.'};
		});
		
		try {
			token_data = JSON.parse(token_data);
		} catch (e) {
			return {'error' : true, 'message' : 'Error: Could not open parse token file contents.'};
		}
		
		for (var user_id in token_data) {
			var user = token_data[user_id];
			if (user.token === token) {
				return user_id;
			}
		}
		
		return '';
	},
	auth: function (req, res) {
		var user_id = req.param('user-id');
		var auth_key = req.param('auth-key');
		
		var auth_data = fs.readFileSync(auth_json_file, 'utf8', (err, data) => {
			if (err) throw err;
			//return res.json({'error' : true, 'message' : 'Error: Could not open json file for authentication.'});
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
							//return res.json({'error' : true, 'message' : 'Error: Could not open json file for authentication.'});
						});
						
						var token_data_array = {};
						
						if (token_data !== '') {
							try {
								var token_data_array = JSON.parse(token_data);
							} catch (e) {
								return res.json({'error' : true, 'message' : 'Error: Could not parse json file.'});
							}
						}
						
						token_data_array[user_id] = {'ip' : req.ip,
													 'token': tk,
													 'created' : moment().unix()};
												 
						fs.writeFileSync(token_json_file, JSON.stringify(token_data_array), 'utf8', function (err) { 
							if (err) {
								console.log('[write error]: ' + err);
								return res.json({'error' : true, 'message' : 'Error: Could not write to json file.'});
							}
						});
						
						return res.json({'error' : false, 'token' : tk, 'message' : 'Authenticated successfully.'});

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
		var check_auth = sails.controllers.url.checkAuth(req.headers.authorization);
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		var user_id = sails.controllers.url.getUserId(req.headers.authorization);
		var actual_url = req.param('actual_url');
		var n = actual_url.search(/http(s)*(:)\/\/(www\.)*[a-zA-Z0-9\-]+(\.)*[a-zA-Z]{2,6}.*/i);
		
		if (n < 0) {
			return res.json({'error' : true, 'message' : 'URL entered is invalid.<br/>Required format: http(s)://www.google.com/abc'});
		}
		
		var url = {'hash': Url.genHash(),
				   'actual_url' : actual_url,
				   'created_by' : user_id,
				   'status' : 1,
				   'create_datetime' : moment().unix(),
				   'update_datetime' : null
				   };
		
		sails.controllers.url.createJsonFileIfNotExists('all_urls.json');
		sails.controllers.url.createJsonFileIfNotExists('all_urls_stats.json');

		var data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
			if (err) {
				throw err;
			}
			
			return res.json({'error' : true, 'message' : 'Error: Could not open json file for writing.'});
		});
		
		var json_data = {};
		var stats_data = {};
		
		try {
			if (data !== '') {
				json_data = JSON.parse(data);
			}
		} catch (e) {
			return res.json({'error': false, 'message': 'Error: Could not parse url data.'});
		}
		
		var stats_json_data = fs.readFileSync(all_urls_stats_json_file, 'utf8', (err, data) => {
			if (err) {
				throw err;
			}
			
			return res.json({'error' : true, 'message' : 'Error: Could not open stats json file for writing.'});
		});
		
		try {
			if (stats_json_data !== '') {
				stats_data = JSON.parse(stats_json_data);
			}
		} catch (e) {
			return res.json({'error': false, 'message': 'Error: Could not parse url data.'});
		}
		
		stats_data[url.hash] = [];
		json_data[url.hash] = url;
		
		fs.writeFile(all_urls_stats_json_file, JSON.stringify(stats_data), 'utf8', function (err, url) { 
			if (err) {
				console.log('[write error]: ' + err);
				return res.json({'error' : true, 'message' : 'Error: Could not write to stats json file.'});
			}
		});
		fs.writeFile(all_urls_json_file, JSON.stringify(json_data), 'utf8', function (err) { 
			if (err) {
				console.log('[write error]: ' + err);
				return res.json({'error' : true, 'message' : 'Error: Could not write to json file.'});
			}
			return res.json({'error' : false, 'url' : url, 'message' : 'Your shortened URL was created successfully.'});
		});
		
	},
	deleteUrl: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.headers.authorization);
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		var hash = req.param('hash');
		var data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
			if (err) throw err;
		});
		
		var stats_data = fs.readFileSync(all_urls_stats_json_file, 'utf8', (err, data) => {
			if (err) throw err;
		});
		
		// check hash against local url json file
		try {
			stats_data = JSON.parse(stats_data);
		} catch (e) {
			return res.json({'error': true, 'message': 'Error: Could not parse stat data.'});
		}
		
		try {
			json_data = JSON.parse(data);
		} catch (e) {
			return res.json({'error': true, 'message': 'Error: Could not parse URL data.'});
		}
		
		if (json_data[hash]) {
			delete json_data[hash];
			delete stats_data[hash];
			fs.writeFile(all_urls_json_file, JSON.stringify(json_data), 'utf8', function (err) { if (err) {console.log('[write error]: ' + err);} });
			fs.writeFile(all_urls_stats_json_file, JSON.stringify(stats_data), 'utf8', function (err) { if (err) {console.log('[write error]: ' + err);} });
			return res.json({'error': false, 'message' : 'Hash [' + hash + '] deleted successfully.'});
		}
	},
	getUrl: function (req, res) {
		var hash = req.param('hash');
		
		var url_data = fs.readFileSync(all_urls_json_file, 'utf8', (err, data) => {
			if (err) throw err;
		});
		
		// check hash against local url json file
		try {
			url_data = JSON.parse(url_data);
		} catch (e) {
			return res.json({'error': true, 'message': 'Error: Could not parse URL data.'});
		}
		
		if (url_data[hash]) {
			// capture header
			sails.controllers.url.createJsonFileIfNotExists('all_urls_stats.json');
			var stats_data = fs.readFileSync(all_urls_stats_json_file, 'utf8', (err, data) => {
				if (err) throw err;
			});
			
			try {
				stats_data = JSON.parse(stats_data);
			} catch (e) {
				return res.json({'error': true, 'message': 'Error: Could not parse stats data.'});
			}
			
			var user_agent = req.headers['user-agent'];
			var user_ip = req.ip;
			var req_dt = moment().unix();
			
			stats_data[hash].push({'user_agent': user_agent, 'ip': user_ip, 'req_dt': req_dt});
			
			fs.writeFile(all_urls_stats_json_file, JSON.stringify(stats_data), 'utf8', function (err) { 
				if (err) {
					console.log('[write error]: ' + err);
				}
			});
			
			return res.redirect(url_data[hash].actual_url);
		}
		
	},
	getAllUrls: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.headers.authorization);
		
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
						'<input type="hidden" name="hash-val" value="' + row.hash + '"/><a class="btn btn-sm" href="/' + row.hash + '">visit link</a> <button class="btn btn-info btn-view-stats btn-sm">view stats</button> <button class="btn btn-danger btn-delete btn-sm">del</button>'];
						
			return_data.push(rec);
		}
		
		return res.json({'error' : false, 'return_data' : return_data, 'message' : ''});
		
	},
	getStats: function (req, res) {
		var check_auth = sails.controllers.url.checkAuth(req.headers.authorization);
		
		if (check_auth !== true) {
			return res.json(check_auth);
		}
		
		var hash = req.param('hash');
		
		sails.controllers.url.createJsonFileIfNotExists('all_urls_stats.json');
		var stats_data = fs.readFileSync(all_urls_stats_json_file, 'utf8', (err, data) => {
			if (err) throw err;
		});

		try {
			stats_data = JSON.parse(stats_data);
		} catch (e) {
			return res.json({'error': true, 'message': 'Error: Could not parse stats data.'});
		}
		
		var return_data = [];
		
		for (var j = 0; j < stats_data[hash].length; j++) {
			var rec = [stats_data[hash][j].user_agent,
							stats_data[hash][j].ip,
							moment.unix(stats_data[hash][j].req_dt).format('DD/MM/YYYY HH:mm:ss'),
							stats_data[hash][j].req_dt];
			return_data.push(rec);			
		}
		
		if (stats_data[hash]) {
			return res.json({'error': false, 'stats': return_data});
		} else {
			return res.json({'error': true, 'message': 'Error: Hash not found.'});
		}
	}
};

