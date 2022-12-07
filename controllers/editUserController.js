const User = require('../model/User');
const bcrypt = require('bcrypt');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
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


const handleEditUser = async (req , res) => {
    getLoggedInUserInfo(req,res);
    const currentUserDB = await User.findOne({ username : currentUser }).exec();

    
    // console.log(req.files)

    const {newName , type , newPwd} = req.body;

    // console.log(type)
    if(!type) return res.sendStatus(400);

    if(type === 'name'){
        if(!newName) return res.status(400).json({"message" : 'Please Enter Valied Name'});
        currentUserDB.fullName = newName ;

        const result = await currentUserDB.save();

        const accessToken = jwt.sign(
            {"username" : currentUserDB.username},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn : '50min'}
        )
         
        res.json({
            id : result._id,
            username : result.username,
            fullname : result.fullName,
            image : result.image,
            email : result.email,
            friendsList : result.friendsList,
            accessToken : accessToken
        })

    }else if (type === 'pwd'){
        if(newPwd.oldPwd === '' || newPwd.newPwd === '' || newPwd.rNewPwd === ''){
            return res.status(400).json({"message" : 'All Fields Are Required'});
        }
        const match = await bcrypt.compare(newPwd.oldPwd , currentUserDB.password);
        if(match){
            if(newPwd.newPwd !== newPwd.rNewPwd) return res.status(409).json({
                'message' : 'Password Must Be same As Repeated Password'
            });
            const hashPassword = await bcrypt.hash(newPwd.newPwd , 10);
            currentUserDB.password =  hashPassword ;
            const result = currentUserDB.save();
            res.sendStatus(201);
        }else {
        res.status(401).json({"message" : 'Bad Caredials'})
        }
    }else if (type === 'img-update'){
        try {
            let imgName ;
            if(req.files) {
                const file = req.files.img
                const fileName = file.name
                const filemimeArr = file.mimetype.split('/');
                
                
                if(filemimeArr[0] === 'image'){
                    const fileNameArr = fileName.split('.');
                    const ext = fileNameArr[fileNameArr.length - 1];
                    imgName = `${currentUserDB.username}.${ext}` ;

                    if(fs.existsSync(`./public/images/${imgName}`)){
                        await fsPromises.unlink(`./public/images/${imgName}`, function(err){
                            console.log(err)
                            if(err) res.sendStatus(500) ;
                        })
                    }
                    
                    file.mv(`./public/images/${imgName}`, function (err) {
                        if(err) {
                            return res.sendStatus(500)            
                        }
                    })
                    currentUserDB.image = `/public/images/${imgName}`;
                    const result = await currentUserDB.save();
                    
                    res.sendStatus(201);
                }else {
                   return res.status(400).json({'message' : 'Please Add An Image'}) ;
                }
                
                
            }

        }catch (err){
            console.log(err);
        }
    }    
}

module.exports = {handleEditUser}