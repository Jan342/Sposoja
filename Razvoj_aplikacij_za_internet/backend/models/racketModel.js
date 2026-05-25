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
    'package': {
        type: Schema.Types.ObjectId,
        ref: 'package'
    },
    'rented': Boolean,
    'owner': { 
        type: Schema.Types.ObjectId, 
        ref: 'user',
        required: true 
    },
    audienceType: { type: String, enum: ['rekreativec', 'klub'], default: 'rekreativec' }
});

module.exports = mongoose.model('racket', racketSchema);
