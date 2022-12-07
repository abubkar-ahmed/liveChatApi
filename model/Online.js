const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const onlineSchema = new Schema({
    username : {
        type : String,
        required : true
    },
    lastSeen : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('Online' , onlineSchema);