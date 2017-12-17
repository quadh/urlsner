/**
 * UrlController
 *
 * @description :: Server-side logic for managing urls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	auth: function (req, res) {
		var auth_json_file = require('fs').readFileSync(require('path').resolve(__dirname,'../config/json/auth_users.json'));
		

		
	},
	create: function (req, res) {
		
	},
	getUrl: function (req, res) {
		var hash = req.param('hash');
		
		
	},
	getAll: function (req, res) {
		
	}
};

