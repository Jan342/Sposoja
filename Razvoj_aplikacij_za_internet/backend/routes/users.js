var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
var clubController = require('../controllers/clubController.js');
var authController = require('../controllers/authController.js');

router.post('/register', function(req, res) {
    if (req.body.registerType === 'club') {
        return clubController.create(req, res);
    }

    return userController.create(req, res);
});
router.post('/login', authController.login);
router.post('/changePassword', authController.changePassword);
router.get('/logout', authController.logout);

module.exports = router;
