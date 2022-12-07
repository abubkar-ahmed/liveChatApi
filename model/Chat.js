const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const chatSchema = new Schema({
    chatRoom : {
        type : String,
        required : true
    },
    for : {
        type : String,
        required : true
    },
    to : {
        type : String,
        required : true
    },
    arrayOfMessages : {
        type : Array,
        require:true
    },unreadMsg : {
        type : Array
    }


    
});

module.exports = mongoose.model('Chat' , chatSchema);