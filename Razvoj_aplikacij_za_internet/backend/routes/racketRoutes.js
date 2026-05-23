var express = require('express');
var router = express.Router();
var racketController = require('../controllers/racketController.js');
var multer = require('multer');
var upload = multer({dest: 'public/images/'});

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

function isClubOwner(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'klub') {
        return next();
    } else {
        var err = new Error("Samo lastniki klubov lahko izvajajo to operacijo.");
        err.status = 403;
        return next(err);
    }
}

router.get('/',racketController.list);
router.get('/packages', requiresLogin, racketController.listPackages);
router.get('/packages/:id/rackets', requiresLogin, racketController.listPackageRackets);
router.post('/packages', requiresLogin, racketController.createPackage);
router.put('/packages/:id/limit', requiresLogin, racketController.updatePackageLimit);
router.post('/addRacket', requiresLogin, upload.single('image'), racketController.create);
router.delete('/:id', requiresLogin, isClubOwner, racketController.remove);

router.post('/rentRacket', requiresLogin, racketController.rent);



module.exports = router;
