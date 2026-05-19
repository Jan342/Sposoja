var ClubModel = require('../models/clubModel.js');
var UserModel = require('../models/userModel.js');

/**
 * clubController.js
 *
 * @description :: Server-side logic for managing clubs.
 */
module.exports = {

    create: async function (req, res) {
        var username = req.body.clubName;

        if(req.body.password !== req.body.cpassword){
            return res.status(400).json({error: "Wrong password"});
        }

        if(!username){
            return res.status(400).json({error: "Club name is required"});
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
    }
};
