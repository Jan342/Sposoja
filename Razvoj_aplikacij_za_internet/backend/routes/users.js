var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');


router.post('/register', userController.create);
router.post('/login',userController.login);
router.get('/logout', userController.logout);

module.exports = router;
