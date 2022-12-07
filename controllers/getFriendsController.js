const User = require('../model/User');
const jwt = require('jsonwebtoken');

let currentUser;

const getLoggedInUserInfo = (req , res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.sendStatus(403);
            currentUser = decoded.username ;
        }
    );
}


const getYourFriends = async (req , res) => {
    getLoggedInUserInfo(req,res);
    // get the Current User Info From DB
    const currentUserDB = await User.findOne({ username : currentUser }).exec();
    if(!currentUserDB) return res.sendStatus(401);
    let frindArr = [] ;
    let waitingArr = [] ;
    let requestArr = [] ;
    
    // for(i in currentUserDB.friendsList){
    for(let i = 0 ; i < currentUserDB.friendsList.length ; i++){
        const friend = await User.findOne({username : currentUserDB.friendsList[i].username});
        if(currentUserDB.friendsList[i]?.status === 3){
            const resFriend = {
                id : friend?._id,
                username : friend?.username ,
                fullname : friend?.fullName ,
                image : friend?.image,
                email : friend?.email,
                room : currentUserDB.friendsList[i].room
            }
            frindArr.push(resFriend);
        }else if(currentUserDB.friendsList[i]?.status === 2){
            const resFriend = {
                id : friend._id,
                username : friend.username ,
                fullname : friend.fullName ,
                image : friend.image
            }
            requestArr.push(resFriend);
        } else if(currentUserDB.friendsList[i]?.status === 1){
            const resFriend = {
                id : friend._id,
                username : friend.username ,
                fullname : friend.fullName ,
                image : friend.image
            }
            waitingArr.push(resFriend);
        }

    }
    // console.log(currentUserDB.friendsList)
    res.json({frindArr , waitingArr , requestArr})

}

module.exports = { getYourFriends};