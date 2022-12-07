const express = require('express');
const router = express.Router();
const friends = require('../../controllers/getFriendsController');

router.route('/')
    .get(friends.getYourFriends)



module.exports = router