const allowedOrigns = require('../config/allowedOrigns');

const creditals = (req , res , next) => {
    const origin = req.headers.origin;
    if(allowedOrigns.includes(origin)){
        res.header("Access-Control-Allow-Credentials" , true);
    }
    next();
}

module.exports = creditals 