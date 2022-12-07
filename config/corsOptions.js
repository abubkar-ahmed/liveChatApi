const allowedOrigns = require('./allowedOrigns');


const corsOptions = {
    origin : (origin , callback) => {
        if(allowedOrigns.indexOf(origin) !== -1 || !origin){
            callback(null , true)
        } else {
            callback(new Error('Not Allowed By Cors'));
        }
    },
    optionSuccessStatus: 200,    
}

module.exports = corsOptions;