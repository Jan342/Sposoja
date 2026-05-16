const racketModel = require('../models/racketModel.js');

/**
 * photoController.js
 *
 * @description :: Server-side logic for managing rackets.
 */
module.exports = {

    list: function (req, res) {
        racketModel.find()
        .exec(function (err, rackets) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting racket.',
                    error: err
                });
            }
            var data = [];
            data.rackets = rackets;
            console.log(rackets)
            return res.json(rackets);
        });
    },

    create: function (req, res) {
        var racket = new racketModel({
			model : req.body.name,
			path : "/images/"+req.file.filename,
            description: req.body.description,
            rated: 0,
        });

        racket.save(function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating racket',
                    error: err
                });
            }

            return res.status(201).json(racket);
        });
    },
};
