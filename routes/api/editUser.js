const express = require('express');
const router = express.Router();
const editUser = require('../../controllers/editUserController');

router.route('/')
    .put(editUser.handleEditUser)


module.exports = router