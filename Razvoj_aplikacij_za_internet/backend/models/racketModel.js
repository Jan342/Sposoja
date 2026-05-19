var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema   = mongoose.Schema;

var racketSchema = new Schema({
    'model' : String,
    'description' : String,
    'rated' : Number,
    //comments : [{user: {type: Schema.Types.ObjectId,ref: 'user'},comment: String}]
    /*'postedBy' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},*/
    'path' : String,
    'rented': Boolean,
    'owner': { type: String,
        enum: ['klub', 'rekreativec'],
        default: 'klub' }
});

module.exports = mongoose.model('racket', racketSchema);
