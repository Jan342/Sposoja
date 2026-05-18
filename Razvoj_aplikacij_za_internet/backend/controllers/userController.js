var UserModel = require('../models/userModel.js');
var bcrypt = require('bcrypt');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    create: function (req, res) {
        var user = new UserModel({
			username : req.body.username,
			password : req.body.password,
            rented : null
        });

        if(req.body.password === req.body.cpassword){
                user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating user',
                        error: err
                    });
                }

                return res.status(201).json(user);
            });
        }
        else{
            return res.status(200).json({error: "Wrong password"});
        }
    },

    login: function(req, res, next){
        UserModel.authenticate(req.body.username, req.body.password, function(err, user){
            if(err || !user){
                var err = new Error('Wrong username or password');
                err.status = 401;
                return next(err);
            }
            else{
                req.session.userId = user._id;
                return res.json(user);
            }
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

        UserModel.findById(req.session.userId).exec(function(err, user) {
            if (err) {
                return res.status(500).json({ error: 'Error when finding user' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            bcrypt.compare(req.body.oldPassword, user.password, function(err, result) {
                if (err) {
                    return res.status(500).json({ error: 'Error when checking password' });
                }

                if (!result) {
                    return res.status(401).json({ error: 'Old password is incorrect' });
                }

                user.password = req.body.newPassword;
                user.save(function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error when changing password' });
                    }

                    return res.status(200).json({ message: 'Password changed successfully' });
                });
            });
        });
    }
};
