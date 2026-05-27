var ClubModel = require('../models/clubModel.js');
var UserModel = require('../models/userModel.js');
var Package = require('../models/packageModel.js');
const racketModel = require('../models/racketModel.js');
const LockerLog = require('../models/lockerLogModel.js');

/**
 * clubController.js
 *
 * @description :: Server-side logic for managing clubs.
 */
module.exports = {

    list: function (req, res) {
        ClubModel.find().exec(function (err, c) {
            if (err) {
                return res.status(500).json({ error: "Server Error" });
            }

            return res.status(200).json(c);
        })
    },

    create: async function (req, res) {
        var username = req.body.clubName;

        if (req.body.password !== req.body.cpassword) {
            return res.status(400).json({ error: "Wrong password" });
        }

        if (!username) {
            return res.status(400).json({ error: "Club name is required" });
        }

        try {
            var existingClub = await ClubModel.findOne({ username: username }).exec();
            var existingUser = await UserModel.findOne({ username: username }).exec();

            if (existingClub || existingUser) {
                return res.status(409).json({ error: "Username already exists" });
            }

            var club = new ClubModel({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: username,
                clubName: req.body.clubName,
                address: req.body.address,
                packageCount: req.body.packageCount,
                password: req.body.password
            });

            var savedClub = await club.save();
            return res.status(201).json({
                _id: savedClub._id,
                username: savedClub.username,
                clubName: savedClub.clubName,
                accountType: 'club'
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating club',
                error: err
            });
        }
    },

    settings: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Only clubs can view club settings" });
        }

        ClubModel.findById(req.session.userId).exec(function (err, club) {
            if (err) {
                return res.status(500).json({ error: "Error when finding club" });
            }

            if (!club) {
                return res.status(404).json({ error: "Club not found" });
            }

            Package.countDocuments({ club: club._id }).exec(function (err, packageTotal) {
                if (err) {
                    return res.status(500).json({ error: "Error when counting packages" });
                }

                return res.json({
                    packageCount: club.packageCount,
                    currentPackageCount: packageTotal
                });
            });
        });
    },

    updateSettings: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Only clubs can update club settings" });
        }

        var packageCount = Number(req.body.packageCount);

        if (!Number.isInteger(packageCount) || packageCount < 0) {
            return res.status(400).json({ error: "Package count must be a positive whole number" });
        }

        ClubModel.findById(req.session.userId).exec(function (err, club) {
            if (err) {
                return res.status(500).json({ error: "Error when finding club" });
            }

            if (!club) {
                return res.status(404).json({ error: "Club not found" });
            }

            Package.countDocuments({ club: club._id }).exec(function (err, packageTotal) {
                if (err) {
                    return res.status(500).json({ error: "Error when counting packages" });
                }

                if (packageCount < packageTotal) {
                    return res.status(400).json({
                        error: "Package count cannot be lower than the number of existing packages"
                    });
                }

                club.packageCount = packageCount;
                club.save(function (err, savedClub) {
                    if (err) {
                        return res.status(500).json({ error: "Error when updating club settings" });
                    }

                    return res.json({
                        _id: savedClub._id,
                        username: savedClub.username,
                        clubName: savedClub.clubName,
                        profileImage: savedClub.profileImage,
                        packageCount: savedClub.packageCount,
                        accountType: 'club'
                    });
                });
            });
        });
    },

    joinClub: function (req, res) {
        UserModel.findById(req.session.userId).exec(function (err, user) {
            if (err) {
                return res.status(500).json({
                    error: "Error fetching user"
                });
            }

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            if (user.role !== 'rekreativec') {
                return res.status(403).json({
                    error: "You are already in a club"
                });
            }

            UserModel.findByIdAndUpdate(req.session.userId, { role: 'clan', joinedClub: req.body.club_id }, { new: true }).select('-password').exec(function (err, u) {
                if (err) {
                    return res.status(500).json({
                        error: "Couldn't join to the club"
                    });
                }

                return res.status(200).json(u);
            });
        });
    },

    getclubRackets: function (req, res) {

        UserModel.findById(req.session.userId).exec(function (err, user) {

            if (err) {
                return res.status(500).json(err);
            }

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            Package.find({ club: user.joinedClub }).exec(function (err, packages) {

                if (err) {
                    return res.status(500).json(err);
                }

                const packageIds = packages.map(p => p._id);

                racketModel.find({ package: { $in: packageIds } }).exec(function (err, rackets) {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    return res.status(200).json(rackets);
                });
            });
        });
    },

    getMembers: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Samo klubi lahko vidijo člane" });
        }

        UserModel.find({ joinedClub: req.session.userId })
            .select('-password')
            .populate('assignedPackage', 'name location')
            .exec(function (err, members) {
                if (err) {
                    return res.status(500).json({ error: "Napaka pri pridobivanju članov" });
                }
                return res.status(200).json(members);
            });
    },

    assignPackage: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Samo klubi lahko dodeljujejo paketnike" });
        }

        const { userId } = req.params;
        const { packageId } = req.body;

        UserModel.findOne({ _id: userId, joinedClub: req.session.userId }).exec(function (err, user) {
            if (err) return res.status(500).json({ error: "Napaka pri iskanju člana" });
            if (!user) return res.status(404).json({ error: "Član ni najden ali ne pripada temu klubu" });

            if (!packageId) {
                user.assignedPackage = undefined;
                user.save(function (err, saved) {
                    if (err) return res.status(500).json({ error: "Napaka pri odstranjevanju paketnika" });
                    return res.status(200).json({ message: "Dodelitev paketnika odstranjena", user: saved });
                });
                return;
            }

            Package.findOne({ _id: packageId, club: req.session.userId }).exec(function (err, pkg) {
                if (err) return res.status(500).json({ error: "Napaka pri iskanju paketnika" });
                if (!pkg) return res.status(404).json({ error: "Paketnik ni najden ali ne pripada temu klubu" });

                user.assignedPackage = pkg._id;
                user.save(function (err, saved) {
                    if (err) return res.status(500).json({ error: "Napaka pri dodeljevanju paketnika" });
                    return res.status(200).json({ message: "Paketnik uspešno dodeljen", user: saved });
                });
            });
        });
    },

    getHistory: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Samo klubi lahko vidijo zgodovino" });
        }

        const filter = { club: req.session.userId };
        if (req.query.packageId) {
            filter.package = req.query.packageId;
        }

        LockerLog.find(filter)
            .populate('user', 'username firstName lastName')
            .populate('racket', 'model')
            .populate('package', 'name location')
            .sort({ timestamp: -1 })
            .limit(200)
            .exec(function (err, logs) {
                if (err) {
                    return res.status(500).json({ error: "Napaka pri pridobivanju zgodovine" });
                }
                return res.status(200).json(logs);
            });
    }
};
