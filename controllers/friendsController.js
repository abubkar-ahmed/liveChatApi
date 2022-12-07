const User = require('../model/User');
const jwt = require('jsonwebtoken');
const {v4:uuidv4} = require('uuid');

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


const updatingList = async (user , currentUserDB) => {
    var searchUser = new RegExp(user, "i");
    const users = await User.find({ username : searchUser}).exec();
    
    const userNames = users.map(friend => {
        // console.log(friend.friendsList);
        let status 
        
        const ab = friend.friendsList.map((e) => {
            if(e.username === currentUserDB.username){
                if(e.status === 2) {
                    status = 1 ;
                }else if(e.status === 1){
                    status = 2
                } else if (e.status === 3) {
                    status = 3
                } 
            }
        })
        if(status) {
            return {
                username : friend.username ,
                id : friend._id,
                image : friend.image,
                fullname : friend.fullName,
                status : status
            }
        }else {
            return {
                username : friend.username ,
                id : friend._id,
                image : friend.image,
                fullname : friend.fullName
            }
        }
        
    })
    return userNames ;
}

const findFriend = async (req , res) => {
    getLoggedInUserInfo(req,res);
    // get the Current User Info From DB
    const currentUserDB = await User.findOne({ username : currentUser }).exec();
    if(!currentUserDB) return res.sendStatus(401);

    const {user} = req.params ;
    if(!user) return res.sendStatus(400);
    const result = await updatingList(user , currentUserDB);
    

    res.status(200).json(result);
}



const addFriend = async (req , res) => {
    getLoggedInUserInfo(req,res);
    // get the Current User Info From DB
    const currentUserDB = await User.findOne({ username : currentUser }).exec();
    if(!currentUserDB) return res.sendStatus(401);

    const {user } = req.body ;
     
    if(!user) return res.sendStatus(400);

    // get the other User Info From DB
    const foundUser = await User.findOne({ username : user}).exec();
    if(!foundUser) return res.sendStatus(400);


    // check if user sending freind req to him self or a flready freind user 

    if(currentUserDB.username === foundUser.username){
        return res.status(400).json({"message" : "can not be friend with your self"});
    }


    // statusCode === 1 requst send and waiting to be accepted
    // statusCode === 2 requst recieved and waiting to be accepted
    // statusCode === 3 new Friend and room is created


    for(let i = 0 ; i < currentUserDB.friendsList.length ; i++){
        if(currentUserDB.friendsList[i]?.username === foundUser.username){
            return res.status(400).json({'message' : 'already Frinds accepted or requst is sent'});
        }
    }

    currentUserDB.friendsList.push(
        {
            user_id : foundUser._id,
            username : foundUser.username,
            status : 1
        }
    )
    const result1 = currentUserDB.save();

    foundUser.friendsList.push(
        {
            user_id : currentUserDB._id,
            username : currentUserDB.username,
            status : 2
        }
    )

    const result2 = await foundUser.save();

    
    
    res.status(201).json({'message' : 'Done'});


}

const acceptFriendReq = async (req , res) => {
    try {
        getLoggedInUserInfo(req,res);
        const currentUserDB = await User.findOne({ username : currentUser }).exec();
        if(!currentUserDB) return res.sendStatus(401);
    
        const {user} = req.body ;
        if(!user) return res.sendStatus(400);
    
        const foundUser = await User.findOne({ username : user}).exec();
        if(!foundUser) return res.sendStatus(400);
    
        let a = false;
        let b = false;
        for(let i = 0 ; i < currentUserDB.friendsList.length ; i++) {
            if(currentUserDB.friendsList[i].username === foundUser.username ){
                a = true;
                if(currentUserDB.friendsList[i].status === 1 || currentUserDB.friendsList[i].status === 3){
                    b = true ;
                }
            }
        }


        
        if(!a) return res.status(400).json({'message' : 'no requst sent ti this user'});

        if(b) return res.status(400).json({'message' : 'waitng for response from other user or already frinds'});

        const roomId = uuidv4() ;

        
        const map1 = currentUserDB.friendsList.map(x =>{
            if(x.username === foundUser.username ){
                return {...x , status : 3 , room : roomId}
            }else {
                return x
            }
        });


        const map2 = foundUser.friendsList.map(x =>{
            if(x.username === currentUserDB.username ){
                return {...x , status : 3 , room : roomId}
            }else {
                return x
            }
        });

        currentUserDB.friendsList = map1 ;
        const result = await currentUserDB.save();

        foundUser.friendsList = map2 ;
        const result1 = await foundUser.save();

        res.status(200).json({username : result1.username , email : result1.email});

    }catch (err) {
        res.status(500)
    }  
}

const deleteFriend = async (req,res) => {
    try {
        getLoggedInUserInfo(req,res);
        const currentUserDB = await User.findOne({ username : currentUser }).exec();
        if(!currentUserDB) return res.sendStatus(401);
    
        const {user } = req.params ;
        
        if(!user) return res.sendStatus(400);
    
        const foundUser = await User.findOne({ username : user}).exec();
        if(!foundUser) return res.sendStatus(400);

        const map1 = currentUserDB.friendsList.filter(x =>{
            return x.username !== foundUser.username;
        });

        const map2 = foundUser.friendsList.filter(x =>{
            return x.username !== currentUserDB.username;
        });


        currentUserDB.friendsList = map1 ;
        const result = await currentUserDB.save();

        
        foundUser.friendsList = map2 ;
        const result1 = await foundUser.save();


        res.status(200).json({'message' : `You Are No Longer Friend With ${foundUser.username}`});

    } catch(err) {
        res.sendStatus(500);
    }
}



module.exports = {findFriend , addFriend , acceptFriendReq , deleteFriend };