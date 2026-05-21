var UserModel = require('../models/userModel.js');
var ClubModel = require('../models/clubModel.js');
var racketModel = require('../models/racketModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing person users.
 */
module.exports = {

    create: async function (req, res) {
        if(req.body.password !== req.body.cpassword){
            return res.status(400).json({error: "Wrong password"});
        }

        if(!req.body.username){
            return res.status(400).json({error: "Username is required"});
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
            else{
                var user = new UserModel({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username : req.body.username,
                    address: req.body.address,
                    password : req.body.password,
                    role: 'rekreativec',
                    rented : null
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

    uploadProfileImage: async function(req, res) {
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

    returnRacket: async function (req, res) {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: "Nisi prijavljen." });
        }

        const userId = req.session.userId;
        const user = await UserModel.findById(userId); 
        
        if (!user) {
            return res.status(404).json({ error: "Uporabnik ni najden." });
        }

        if (user.rented) {
            await racketModel.findByIdAndUpdate(user.rented, { rented: false });
        }
        user.rented = null;
        await user.save();

        if (req.session.user) {
            req.session.user = user;
        }

        return res.json(user);

    } catch (err) {
        console.error("Točna napaka na backendu:", err);
        return res.status(500).json({ error: "Napaka na strežniku pri vračanju loparja." });
    }
}
};

