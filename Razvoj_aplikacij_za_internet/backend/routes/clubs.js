var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
var clubController = require('../controllers/clubController.js');
var authController = require('../controllers/authController.js');
const { route } = require('./racketRoutes.js');

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

router.get('/clubRackets',requiresLogin,clubController.getclubRackets)
router.get('/', requiresLogin, clubController.list);
router.post('/joinClub', requiresLogin, clubController.joinClub);

module.exports = router;
