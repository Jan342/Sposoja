var ClubModel = require('../models/clubModel.js');
var UserModel = require('../models/userModel.js');
var Package = require('../models/packageModel.js');
const racketModel = require('../models/racketModel.js');
const LockerLog = require('../models/lockerLogModel.js');
const fs = require('fs');
const path = require('path');

const BOX_ASSIGNMENTS_PATH = path.resolve(
    __dirname,
    '../../../Osnove_racunalniskega_vida/scripts/member2_cv_model/artifacts/box_assignments.json'
);

function loadBoxAssignments() {
    try {
        if (!fs.existsSync(BOX_ASSIGNMENTS_PATH)) return {};
        return JSON.parse(fs.readFileSync(BOX_ASSIGNMENTS_PATH, 'utf8'));
    } catch (e) {
        console.error('[BOX_ASSIGNMENTS] Napaka pri branju:', e.message);
        return {};
    }
}

function saveBoxAssignments(data) {
    try {
        fs.mkdirSync(path.dirname(BOX_ASSIGNMENTS_PATH), { recursive: true });
        fs.writeFileSync(BOX_ASSIGNMENTS_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log('[BOX_ASSIGNMENTS] Shranjeno:', JSON.stringify(data));
    } catch (e) {
        console.error('[BOX_ASSIGNMENTS] Napaka pri pisanju:', e.message);
    }
}

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

    leaveClub: function (req, res) {
        if (!req.session || !req.session.userId || req.session.userType === 'club') {
            return res.status(401).json({ error: "Only users can leave a club" });
        }

        UserModel.findById(req.session.userId).exec(function (err, user) {
            if (err) {
                return res.status(500).json({ error: "Error fetching user" });
            }

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (user.role !== 'clan' || !user.joinedClub) {
                return res.status(400).json({ error: "User is not a club member" });
            }

            user.role = 'rekreativec';
            user.joinedClub = undefined;
            user.assignedPackage = undefined;

            user.save(function (err, savedUser) {
                if (err) {
                    return res.status(500).json({ error: "Could not leave club" });
                }

                return res.status(200).json({
                    _id: savedUser._id,
                    username: savedUser.username,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    role: savedUser.role,
                    rented: savedUser.rented,
                    profileImage: savedUser.profileImage,
                    accountType: 'person'
                });
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

    getClubPackagesForMember: function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: "Niste prijavljeni" });
        }

        UserModel.findById(req.session.userId).exec(function (err, user) {
            if (err) return res.status(500).json({ error: "Napaka pri iskanju uporabnika" });
            if (!user || !user.joinedClub) {
                return res.status(400).json({ error: "Niste član nobenega kluba" });
            }

            Package.find({ club: user.joinedClub }).exec(function (err, packages) {
                if (err) return res.status(500).json({ error: "Napaka pri pridobivanju paketnikov" });

                racketModel.aggregate([
                    { $match: { package: { $in: packages.map(p => p._id) } } },
                    { $group: {
                        _id: "$package",
                        racketTotal: { $sum: 1 },
                        freeTotal: { $sum: { $cond: [{ $ne: ["$rented", true] }, 1, 0] } }
                    }}
                ]).exec(function (err, racketCounts) {
                    if (err) return res.status(500).json({ error: "Napaka pri štetju loparjev" });

                    var packageData = packages.map(function (pkg) {
                        var count = racketCounts.find(rc => String(rc._id) === String(pkg._id));
                        var pkgObj = pkg.toObject();
                        pkgObj.racketTotal = count ? count.racketTotal : 0;
                        pkgObj.freeTotal = count ? count.freeTotal : 0;
                        return pkgObj;
                    });

                    return res.status(200).json({ packages: packageData });
                });
            });
        });
    },

    getClubPackageRacketsForMember: function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: "Niste prijavljeni" });
        }

        UserModel.findById(req.session.userId).exec(function (err, user) {
            if (err) return res.status(500).json({ error: "Napaka pri iskanju uporabnika" });
            if (!user || !user.joinedClub) {
                return res.status(400).json({ error: "Niste član nobenega kluba" });
            }

            Package.findOne({ _id: req.params.id, club: user.joinedClub }).exec(function (err, pkg) {
                if (err) return res.status(500).json({ error: "Napaka pri iskanju paketnika" });
                if (!pkg) return res.status(404).json({ error: "Paketnik ni najden" });

                racketModel.find({ package: pkg._id }).exec(function (err, rackets) {
                    if (err) return res.status(500).json({ error: "Napaka pri pridobivanju loparjev" });
                    return res.status(200).json({ package: pkg, rackets: rackets });
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
            .populate('rentedPackage', 'name location')
            .populate({
                path: 'rented',
                model: 'racket',
                populate: { path: 'package', model: 'package', select: 'name location' }
            })
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

    removeMember: function (req, res) {
        if (!req.session || req.session.userType !== 'club') {
            return res.status(401).json({ error: "Samo klubi lahko odstranijo clane" });
        }

        const { userId } = req.params;

        UserModel.findOne({ _id: userId, joinedClub: req.session.userId }).exec(function (err, user) {
            if (err) return res.status(500).json({ error: "Napaka pri iskanju clana" });
            if (!user) return res.status(404).json({ error: "Clan ni najden ali ne pripada temu klubu" });

            user.role = 'rekreativec';
            user.joinedClub = undefined;
            user.assignedPackage = undefined;

            user.save(function (err) {
                if (err) return res.status(500).json({ error: "Napaka pri odstranjevanju clana" });
                return res.status(200).json({ message: "Clan odstranjen iz kluba" });
            });
        });
    },

    rentPackage: function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: "Niste prijavljeni" });
        }

        UserModel.findById(req.session.userId).exec(function (err, user) {
            if (err) return res.status(500).json({ error: "Napaka na strežniku" });
            if (!user) return res.status(404).json({ error: "Uporabnik ni najden" });
            if (user.role !== 'clan') return res.status(403).json({ error: "Samo člani kluba si lahko izposodijo paketnik" });

            if (user.rentedPackage) {
                return res.status(400).json({ error: "Že imate izposojen paketnik" });
            }

            const { packageId } = req.body;
            if (!packageId) {
                return res.status(400).json({ error: "Manjka ID paketnika" });
            }

            Package.findOne({ _id: packageId, club: user.joinedClub }).exec(function (err, pkg) {
                if (err) return res.status(500).json({ error: "Napaka pri iskanju paketnika" });
                if (!pkg) return res.status(404).json({ error: "Paketnik ne obstaja ali ne pripada vašemu klubu" });

                if (pkg.rentedBy) {
                    return res.status(400).json({ error: "Ta paketnik je že izposojen." });
                }

                pkg.rentedBy = user._id;
                pkg.save(function (err) {
                    if (err) return res.status(500).json({ error: "Napaka pri označevanju paketnika" });

                    user.rentedPackage = pkg._id;
                    user.save(function (err, savedUser) {
                        if (err) return res.status(500).json({ error: "Napaka pri shranjevanju izposoje paketnika" });

                        if (pkg.boxId) {
                            const assignments = loadBoxAssignments();
                            assignments[user.username] = String(pkg.boxId);
                            saveBoxAssignments(assignments);
                            console.log(`[BOX_ASSIGNMENTS] ${user.username} -> paketnik ${pkg.boxId} (${pkg.name})`);
                        } else {
                            console.warn(`[BOX_ASSIGNMENTS] Paketnik "${pkg.name}" nima nastavljenega boxId!`);
                        }

                        UserModel.findById(savedUser._id).populate('rentedPackage').exec(function (popErr, fullyPopulatedUser) {
                            if (popErr || !fullyPopulatedUser) {
                                fullyPopulatedUser = savedUser;
                            }
                            req.session.user = fullyPopulatedUser;

                            var log = new LockerLog({
                                user: user._id,
                                racket: null,
                                package: pkg._id,
                                club: pkg.club,
                                action: 'izposoja'
                            });
                            log.save(function (logErr) {
                                if (logErr) console.error('Napaka pri shranjevanju loga:', logErr);
                            });

                            return res.status(200).json(fullyPopulatedUser);
                        });
                    });
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
