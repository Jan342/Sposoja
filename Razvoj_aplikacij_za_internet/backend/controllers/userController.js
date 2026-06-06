var UserModel = require('../models/userModel.js');
var ClubModel = require('../models/clubModel.js');
var racketModel = require('../models/racketModel.js');
const Club = require('../models/clubModel.js');
const User = require('../models/userModel.js');
const Package = require('../models/packageModel.js');
const LockerLog = require('../models/lockerLogModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing person users.
 */
module.exports = {

    create: async function (req, res) {
        if (req.body.password !== req.body.cpassword) {
            return res.status(400).json({ error: "Wrong password" });
        }

        if (!req.body.username) {
            return res.status(400).json({ error: "Username is required" });
        }

        try {
            var existingUser = await UserModel.findOne({ username: req.body.username }).exec();
            var existingClub = await ClubModel.findOne({ username: req.body.username }).exec();

            if (existingUser || existingClub) {
                return res.status(409).json({ error: "Username already exists" });
            }
            if (req.body.registerType === 'club') {
                var club = new ClubModel({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    clubName: req.body.username,
                    address: req.body.address,
                    packageCount: req.body.packageCount ? Number(req.body.packageCount) : 0,
                    password: req.body.password
                });
                var savedClub = await club.save();
                return res.status(201).json({
                    _id: savedClub._id,
                    username: savedClub.username,
                    accountType: 'club'
                });
            }
            else {
                var user = new UserModel({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    address: req.body.address,
                    password: req.body.password,
                    role: 'rekreativec',
                    rented: null
                });

                var savedUser = await user.save();
                return res.status(201).json({
                    _id: savedUser._id,
                    username: savedUser.username,
                    accountType: 'person'
                });
            }
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating user',
                error: err
            });
        }
    },

    uploadProfileImage: async function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: "Nisi prijavljen." });
        }
        const base64Image = req.body.image;

        if (!base64Image) {
            return res.status(400).json({ error: "Slika ni bila prejeta." });
        }

        try {
            let updatedUser = await UserModel.findByIdAndUpdate(
                req.session.userId,
                { profileImage: base64Image },
                { new: true }
            ).exec();

            if (!updatedUser) {
                updatedUser = await ClubModel.findByIdAndUpdate(
                    req.session.userId,
                    { profileImage: base64Image },
                    { new: true }
                ).exec();
            }

            if (!updatedUser) {
                return res.status(404).json({ error: "Uporabnik ali klub ni najden." });
            }

            return res.json(updatedUser);
        } catch (err) {
            return res.status(500).json({
                error: "Napaka pri shranjevanju slike.",
                details: err.message
            });
        }
    },

    returnRacket: function (req, res) {
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

            // Handle direct package return
            if (borrower.rentedPackage) {
                const packageId = borrower.rentedPackage;
                ActiveModel.findByIdAndUpdate(
                    userId,
                    { $unset: { rentedPackage: "" } },
                    { new: true }
                ).exec(function (err, updatedBorrower) {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    req.session.user = updatedBorrower;

                    Package.findById(packageId).exec(function (err, pkg) {
                        if (!err && pkg) {
                            var log = new LockerLog({
                                user: userType === 'club' ? null : userId,
                                racket: null,
                                package: pkg._id,
                                club: pkg.club,
                                action: 'vrnitev'
                            });
                            log.save(function (logErr) {
                                if (logErr) console.error('Napaka pri shranjevanju loga:', logErr);
                            });
                        }
                    });

                    return res.status(200).json(updatedBorrower);
                });
                return;
            }

            if (!borrower.rented) {
                return res.status(400).json({ message: "Nimate izposojenega nobenega loparja ali paketnika." });
            }

            const racketId = borrower.rented;

            racketModel.findByIdAndUpdate(racketId, { rented: false }, { new: true }).exec(function (err, updatedRacket) {
                if (err) {
                    return res.status(500).json(err);
                }

                ActiveModel.findByIdAndUpdate(
                    userId,
                    { $unset: { rented: "" } },
                    { new: true }
                ).exec(function (err, updatedBorrower) {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    req.session.user = updatedBorrower;

                    if (updatedRacket && updatedRacket.package) {
                        Package.findById(updatedRacket.package).exec(function (err, pkg) {
                            if (!err && pkg) {
                                var log = new LockerLog({
                                    user: userType === 'club' ? null : userId,
                                    racket: updatedRacket._id,
                                    package: updatedRacket.package,
                                    club: pkg.club,
                                    action: 'vrnitev'
                                });
                                log.save(function (logErr) {
                                    if (logErr) console.error('Napaka pri shranjevanju loga:', logErr);
                                });
                            }
                        });
                    }

                    return res.status(200).json(updatedBorrower);
                });
            });
        });
    }
};

