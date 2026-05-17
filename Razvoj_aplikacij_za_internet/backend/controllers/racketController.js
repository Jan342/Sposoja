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
    }
};
