const express = require('express');
const router = express.Router();
const registerCntroller = require('../controllers/registerController');


router.post('/' , registerCntroller.handleNewUser);


module.exports = router ;