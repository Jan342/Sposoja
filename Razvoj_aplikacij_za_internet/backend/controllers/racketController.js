const racketModel = require('../models/racketModel.js');
const User = require('../models/userModel.js');
const Club = require('../models/clubModel.js');
const Package = require('../models/packageModel.js');

/**
 * photoController.js
 *
 * @description :: Server-side logic for managing rackets.
 */
module.exports = {

    list: function (req, res) {
    var targetOwner = 'rekreativec';

    if (req.session && req.session.userType === 'club') {
        targetOwner = 'klub';
        fetchRackets(targetOwner, res);
    } else if (req.session && req.session.userId) {
        User.findById(req.session.userId, function (err, user) {
            if (user && user.role === 'clan') {
                targetOwner = 'klub';
            }
            fetchRackets(targetOwner, res);
        });
    } else {
        fetchRackets(targetOwner, res);
    }

    function fetchRackets(ownerType, res) {
        racketModel.find({ rented: false, owner: ownerType })
        .exec(function (err, rackets) {
            if (err) {
                return res.status(500).json({ message: 'Error when getting racket.', error: err });
            }
            return res.json(rackets);
        });
    }
},
    listPackages: function(req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ message: "Only clubs can view packages" });
        }

        Package.find({ club: req.session.userId })
        .exec(function(err, packages) {
            if (err) {
                return res.status(500).json({
                    message: "Error when getting packages",
                    error: err
                });
            }

            Club.findById(req.session.userId).exec(function(err, club) {
                if (err) {
                    return res.status(500).json({
                        message: "Error when getting club",
                        error: err
                    });
                }

                if (!club) {
                    return res.status(404).json({ message: "Club not found" });
                }

                return res.json({
                    packages: packages,
                    packageCount: club.packageCount,
                    remaining: Math.max(club.packageCount - packages.length, 0)
                });
            });
        });
    },

    createPackage: function(req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ message: "Only clubs can add packages" });
        }

        if (!req.body.name || !req.body.location) {
            return res.status(400).json({ message: "Package name and location are required" });
        }

        Club.findById(req.session.userId).exec(function(err, club) {
            if (err) {
                return res.status(500).json({
                    message: "Error when getting club",
                    error: err
                });
            }

            if (!club) {
                return res.status(404).json({ message: "Club not found" });
            }

            Package.countDocuments({ club: club._id }).exec(function(err, packageTotal) {
                if (err) {
                    return res.status(500).json({
                        message: "Error when counting packages",
                        error: err
                    });
                }

                if (packageTotal >= club.packageCount) {
                    return res.status(400).json({ message: "Package limit reached" });
                }

                var package = new Package({
                    name: req.body.name,
                    location: req.body.location,
                    club: club._id
                });

                package.save(function(err, savedPackage) {
                    if (err) {
                        return res.status(500).json({
                            message: "Error when creating package",
                            error: err
                        });
                    }

                    return res.status(201).json(savedPackage);
                });
            });
        });
    },

    create: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ message: "Only clubs can add rackets" });
        }

        if (!req.body.packageId) {
            return res.status(400).json({ message: "Package is required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        var racket = new racketModel({
			model : req.body.name,
			path : "/images/"+req.file.filename,
            description: req.body.description,
            rated: 0,
            rented: false,
            package: req.body.packageId,
            owner: 'klub'
        });

        Package.findOne({ _id: req.body.packageId, club: req.session.userId }).exec(function(err, package){
            if (err) {
                return res.status(500).json({
                    message: "DB error",
                    error: err
                });
            }
            
            if (!package) {
                return res.status(404).json({ message: "Package not found" });
            }

            racket.save(function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating racket',
                    error: err
                });
            }

            return res.status(201).json(racket);
        });
        })
    },

    remove: async function (req, res) {
        var id = req.params.id;

        try{
            var racket = await racketModel.findByIdAndDelete(id);
            if (!racket) {
                return res.status(404).json({
                    message: 'No such racket found in database.',
                });
            }
                return res.status(200).json({
                    message: 'Successfully deleted racket.',
                });
        }
        catch(err){
            return res.status(500).json({
                message: 'Error when deleting racket.',
                error: err.message
            });
        }
    },

    rent: function (req,res){
        User.findById(req.session.userId).exec(function(err, u){
            if(err){
                return res.status(500).json(err);
            }

            if(u.rented){
                return res.status(400).json({ message: "Already rented" });
            }

            else{
                return racketModel.findById(req.body.racket).exec(function(err,r){
                if (err) {
                    return res.status(500).json(err);
                }
                
                if(!r.rented){
                    r.rented = true;
                    
                    return r.save(function (err, updatedRacket) {
                        if (err) {
                            return res.status(500).json(err);
                        }

                        User.findByIdAndUpdate(
                            req.session.userId, 
                            { rented: r._id }, 
                            { new: true }
                        ).exec(function (err, updatedUser) {
                            if (err) {
                                return res.status(500).json(err);
                            }

                            req.session.user = updatedUser;
                            return res.status(200).json({
                                racket: updatedRacket,
                                user: updatedUser
                            });
                        });
                    });
                }
                    return res.status(400).json({ message: "Racket is rented by someone else" });
                })
            }
        })
    }
};
