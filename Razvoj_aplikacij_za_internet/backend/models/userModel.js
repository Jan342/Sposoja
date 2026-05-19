var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema   = mongoose.Schema;

var userSchema = new Schema({
	'firstName' : String,
	'lastName' : String,
	'username' : String,
	'address' : String,
	'password' : String,
	'rented' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'racket'
	},
});

userSchema.pre('save', function(next){
	var user = this;
	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.hash(user.password, 10, function(err, hash){
		if(err){
			return next(err);
		}
		user.password = hash;
		next();
	});
});

userSchema.statics.authenticate = function(username, password, callback){
	User.findOne({username: username})
	.exec(function(err, user){
		if(err){
			return callback(err);
		} else if(!user) {
			var err = new Error("User not found.");
			err.status = 401;
			return callback(err);
		} 
		bcrypt.compare(password, user.password, function(err, result){
			if(result === true){
				return callback(null, user);
			} else{
				return callback();
			}
		});
		 
	});
}

var User = mongoose.model('user', userSchema);
module.exports = User;
