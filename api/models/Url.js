/**
 * Url.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  genHash: function (hash_len) {
	if (!hash_len) {
		hash_len = 6;
	}
	curr_hash_len_count = 1;
	var str = 'aBcDeFgHiJkMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz0123456789', return_hash = '', substr_start = 0;
	
	while (curr_hash_len_count <= hash_len) {
		substr_start = Math.floor(Math.random() * (str.length));
		return_hash = return_hash + str.substring(str, substr_start, substr_start+1);
		curr_hash_len_count++;
	}
	
	return return_hash;
	  
  },

  attributes: {
	hash: {
		type: 'string',
		unique: true,
		required: true,
		defaultsTo: function() {
			return genHash(6);
		}
	},
	actual_url: {
		type: 'string',
		required: true
	},
	created_by: {
		type: 'string',
		required: true
	},
	status: {
		type: 'integer',
		defaultTo: 1
	},
	create_datetime: {
		type: 'datetime',
		required: true
	},
	update_datetime: {
		type: 'datetime'
	}
	
  }
};

