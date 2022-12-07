const express = require('express');
const router = express.Router();
const friends = require('../../controllers/friendsController');

router.route('/')
    .post(friends.addFriend)
    .put(friends.acceptFriendReq)

router.route('/:user')
    .get(friends.findFriend)
    .delete(friends.deleteFriend)

module.exports = router