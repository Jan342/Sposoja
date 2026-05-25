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

list: async function (req, res) {
    try {
        let query = { owner: "rekreativec", rented: false };

        if (req.session && req.session.userId && req.session.userType === 'club') {
            const clubPackages = await Package.find({ club: req.session.userId });
            const packageIds = clubPackages.map(p => p._id);

            query = { package: { $in: packageIds } }; 
        }

        var rackets = await racketModel.find(query);
        return res.json(rackets);

    } catch (err) {
        return res.status(500).json({
            message: 'Error when getting rackets.',
            error: err.message
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

                racketModel.aggregate([
                    { $match: { package: { $in: packages.map(function(packageItem) { return packageItem._id; }) } } },
                    { $group: { _id: "$package", racketTotal: { $sum: 1 } } }
                ]).exec(function(err, racketCounts) {
                    if (err) {
                        return res.status(500).json({
                            message: "Error when counting rackets",
                            error: err
                        });
                    }

                    var packageData = packages.map(function(packageItem) {
                        var count = racketCounts.find(function(racketCount) {
                            return String(racketCount._id) === String(packageItem._id);
                        });

                        var packageObject = packageItem.toObject();
                        packageObject.racketTotal = count ? count.racketTotal : 0;
                        return packageObject;
                    });

                    return res.json({
                        packages: packageData,
                        packageCount: club.packageCount,
                        remaining: Math.max(club.packageCount - packages.length, 0)
                    });
                });
            });
        });
    },

    listPackageRackets: function(req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ message: "Only clubs can view package rackets" });
        }

        Package.findOne({ _id: req.params.id, club: req.session.userId }).exec(function(err, packageItem) {
            if (err) {
                return res.status(500).json({
                    message: "Error when getting package",
                    error: err
                });
            }

            if (!packageItem) {
                return res.status(404).json({ message: "Package not found" });
            }

            racketModel.find({ package: packageItem._id })
            .exec(function(err, rackets) {
                if (err) {
                    return res.status(500).json({
                        message: "Error when getting rackets",
                        error: err
                    });
                }

                return res.json({
                    package: packageItem,
                    rackets: rackets
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

        var racketLimit = Number(req.body.racketLimit);

        if (!Number.isInteger(racketLimit) || racketLimit < 0) {
            return res.status(400).json({ message: "Racket limit must be a positive whole number" });
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
                    racketLimit: racketLimit,
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

    updatePackageLimit: function(req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ message: "Only clubs can update packages" });
        }

        var racketLimit = Number(req.body.racketLimit);

        if (!Number.isInteger(racketLimit) || racketLimit < 0) {
            return res.status(400).json({ message: "Racket limit must be a positive whole number" });
        }

        Package.findOne({ _id: req.params.id, club: req.session.userId }).exec(function(err, packageItem) {
            if (err) {
                return res.status(500).json({
                    message: "Error when getting package",
                    error: err
                });
            }

            if (!packageItem) {
                return res.status(404).json({ message: "Package not found" });
            }

            racketModel.countDocuments({ package: packageItem._id }).exec(function(err, racketTotal) {
                if (err) {
                    return res.status(500).json({
                        message: "Error when counting rackets",
                        error: err
                    });
                }

                if (racketLimit < racketTotal) {
                    return res.status(400).json({
                        message: "Racket limit cannot be lower than the number of existing rackets"
                    });
                }

                packageItem.racketLimit = racketLimit;
                packageItem.save(function(err, savedPackage) {
                    if (err) {
                        return res.status(500).json({
                            message: "Error when updating package",
                            error: err
                        });
                    }

                    return res.json({
                        _id: savedPackage._id,
                        name: savedPackage.name,
                        location: savedPackage.location,
                        racketLimit: savedPackage.racketLimit,
                        racketTotal: racketTotal
                    });
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
            owner: req.session.userId
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

            racketModel.countDocuments({ package: package._id }).exec(function(err, racketTotal) {
                if (err) {
                    return res.status(500).json({
                        message: "Error when counting rackets",
                        error: err
                    });
                }

                if (racketTotal >= package.racketLimit) {
                    return res.status(400).json({ message: "Racket limit reached for this package" });
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
            });
        })
    },

    remove: async function (req, res) {
    var id = req.params.id;

    try {
        var racket = await racketModel.findById(id);
        
        if (!racket) {
            return res.status(404).json({
                message: 'Lopar ni bil najden.',
            });
        }

        await racketModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Lopar je bil uspešno izbrisan.',
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Napaka pri brisanju loparja.',
            error: err.message
        });
    }
},

    rent: function (req, res) {
        const userId = req.session.userId;
        const userType = req.session.userType;

        const ActiveModel = (userType === 'club') ? Club : User;

        ActiveModel.findById(userId).exec(function (err, borrower) {
            if (err) {
                return res.status(500).json(err);
            }

            if (!borrower) {
                return res.status(400).json({ message: "Uporabnik ali klub ni bil najden." });
            }

            if (borrower.rented) {
                return res.status(400).json({ message: "Already rented" });
            }

            racketModel.findById(req.body.racket).exec(function (err, r) {
                if (err) {
                    return res.status(500).json(err);
                }

                if (!r) {
                    return res.status(404).json({ message: "Lopar ne obstaja." });
                }

                if (r.rented) {
                    return res.status(400).json({ message: "Racket is rented by someone else" });
                }

                r.rented = true;

                r.save(function (err, updatedRacket) {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    ActiveModel.findByIdAndUpdate(
                        userId,
                        { rented: r._id },
                        { new: true }
                    ).exec(function (err, updatedBorrower) {
                        if (err) {
                            return res.status(500).json(err);
                        }

                        req.session.user = updatedBorrower;
                        return res.status(200).json({
                            racket: updatedRacket,
                            user: updatedBorrower
                        });
                    });
                });
            });
        });
    }
};
