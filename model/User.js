const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const userSchema = new Schema({
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
    lastSeen : String,
    img: {
        type: Buffer,
    },
    imgType: {
        type: String,
    }
});

userSchema.virtual('userImgPath').get(function (){
    if(this.img != null && this.imgType != null){
        return `data:${this.imgType};charset=utf-8;base64,${this.img.toString('base64')}`;
    }
})

module.exports = mongoose.model('User' , userSchema);