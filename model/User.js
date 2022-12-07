const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const userSchema = new Schema({
    image : {
        type : String,
        default : '/default-img'
    },
    fullName : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
    },
    password : {
        type : String,
        required : true
    },
    friendsList : {
        type : Array,
        default : []
    },
    refreshToken : String,
    lastSeen : String 
});

module.exports = mongoose.model('User' , userSchema);