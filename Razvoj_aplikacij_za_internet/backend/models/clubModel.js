var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var clubSchema = new Schema({
    'firstName': String,
    'lastName': String,
    'username': String,
    'clubName': String,
    'address': String,
    'profileImage': String,
    'packageCount': Number,
    'password': String,
});

clubSchema.pre('save', function(next) {
    var club = this;
    if (!club.isModified('password')) {
        return next();
    }

    bcrypt.hash(club.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }

        club.password = hash;
        next();
    });
});

clubSchema.statics.authenticate = function(username, password, callback) {
    Club.findOne({ username: username })
    .exec(function(err, club) {
        if (err) {
            return callback(err);
        } else if (!club) {
            var err = new Error('Club not found.');
            err.status = 401;
            return callback(err);
        }

        bcrypt.compare(password, club.password, function(err, result) {
            if (result === true) {
                return callback(null, club);
            } else {
                return callback();
            }
        });
    });
};

var Club = mongoose.model('club', clubSchema);
module.exports = Club;
