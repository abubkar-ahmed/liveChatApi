const User = require('../model/User');
const bcrypt = require('bcrypt');
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


    const {newName , type , newPwd} = req.body;

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
            image : result.userImgPath,
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
        if(req?.files?.img){
            try{
                const acceptedType = ['image/png', 'image/jpg', 'image/jpeg' , 'image/webp'] ;
                if(!acceptedType.includes(req?.files?.img?.mimetype)) return res.status(409).json({
                    'message' : 'invalied Image Type'
                })
                
                saveImage(currentUserDB, req.files.img);
                function saveImage(currentUserDB, imgEncoded) {
                    const img = imgEncoded;
                    currentUserDB.img = new Buffer.from(img.data, "base64");
                    currentUserDB.imgType = img.mimetype;
                }
                await currentUserDB.save() ;
                res.sendStatus(201) ;
            } catch(err) {
                console.log(err);
                res.sendStatus(500);
                
            }

        }
    }    
}

module.exports = {handleEditUser}