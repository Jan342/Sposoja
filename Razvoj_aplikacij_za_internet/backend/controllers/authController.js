var UserModel = require('../models/userModel.js');
var ClubModel = require('../models/clubModel.js');
var bcrypt = require('bcrypt');

/**
 * authController.js
 *
 * @description :: Shared authentication logic for clubs and person users.
 */
module.exports = {

    login: function(req, res, next){
        ClubModel.authenticate(req.body.username, req.body.password, function(clubErr, club){
            if(club){
                req.session.userId = club._id;
                req.session.userType = 'club';
                return res.json({
                    _id: club._id,
                    username: club.username,
                    clubName: club.clubName,
                    accountType: 'club'
                });
            }

            if(clubErr && clubErr.status !== 401){
                return next(clubErr);
            }

            UserModel.authenticate(req.body.username, req.body.password, function(userErr, user){
                if(userErr || !user){
                    var err = new Error('Wrong username or password');
                    err.status = 401;
                    return next(err);
                }

                req.session.userId = user._id;
                req.session.userType = 'person';
                req.session.user = user;
                return res.json({
                    _id: user._id,
                    username: user.username,
                    role: user.role,
                    rented: user.rented,
                    accountType: 'person'
                });
            });
        });
    },

    logout: function(req, res, next){
        if(req.session){
            req.session.destroy(function(err){
                if(err){
                    return next(err);
                } else{
                    return res.status(201).json({});
                }
            });
        }
    },

    changePassword: function(req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'User is not logged in' });
        }

        if (!req.body.oldPassword || !req.body.newPassword || !req.body.confirmPassword) {
            return res.status(400).json({ error: 'All password fields are required' });
        }

        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        var AccountModel = req.session.userType === 'club' ? ClubModel : UserModel;

        AccountModel.findById(req.session.userId).exec(function(err, account) {
            if (err) {
                return res.status(500).json({ error: 'Error when finding account' });
            }

            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            bcrypt.compare(req.body.oldPassword, account.password, function(err, result) {
                if (err) {
                    return res.status(500).json({ error: 'Error when checking password' });
                }

                if (!result) {
                    return res.status(401).json({ error: 'Old password is incorrect' });
                }

                account.password = req.body.newPassword;
                account.save(function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error when changing password' });
                    }

                    return res.status(200).json({ message: 'Password changed successfully' });
                });
            });
        });
    }
};
