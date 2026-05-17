var UserModel = require('../models/userModel.js');

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
    }
};
