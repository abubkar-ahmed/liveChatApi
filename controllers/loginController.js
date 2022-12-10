const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req , res) => {
    const { user , pwd} = req.body ;
    
    if(!user || !pwd ) return res.status(400).json({"message" : 'Username And Password Are Required'});

    const foundUser = await User.findOne({ username : user }).exec();
    if(!foundUser) return res.sendStatus(401);

    const match = await bcrypt.compare(pwd , foundUser.password);

    if(match) {
        const accessToken = jwt.sign(
            {"username" : foundUser.username},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn : '50min'}
        )

        const refreshToken = jwt.sign(
            {"username" : foundUser.username},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn : '1d'}
        )

        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();

       res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 });
        
        res.json({ 
            id : result._id,
            username : result.username,
            fullname : result.fullName,
            image : result.userImgPath,
            email : result.email,
            friendsList : result.friendsList,
            accessToken : accessToken
         });
    } else {
        res.status(401).json({"message" : 'Bad Caredials'})
    }
}

module.exports = { handleLogin }