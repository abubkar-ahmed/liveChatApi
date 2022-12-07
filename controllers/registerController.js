const User = require('../model/User');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');





const handleNewUser = async (req , res ) => {
    

    const {fullname , user ,email , pwd , rPwd} = req.body ;


    if (!fullname || !user || !email || !pwd || !rPwd) return res.status(400).json({
        'message' : 'All Fileds Are Required.',
    })
    const duplicatedUser = await User.findOne({username : user}).exec();
    const duplicatedemail = await User.findOne({email : email}).exec();

    if(duplicatedUser) return res.status(409).json({'message' : 'Username is Already Taken'});
    if(duplicatedemail) return res.status(409).json({'message' : 'Email is Already Registerd'});
    if(pwd !== rPwd) return res.status(409).json({
        'message' : 'Password Must Be same As Repeated Password'
    })

    const regularExpression= /^[a-z0-9_-]{3,12}$/i;
    if(!regularExpression.test(user)) return res.status(409).json({
        'message' : 'Invalied User Name'
    })

    try{
        let imgName ;
        if(req.files) {
            const file = req.files.img
            const fileName = file.name
            const filemimeArr = file.mimetype.split('/');
            
            
            if(filemimeArr[0] === 'image'){
                const fileNameArr = fileName.split('.');
                const ext = fileNameArr[fileNameArr.length - 1];
                imgName = `${user}.${ext}` ;
                
                file.mv(`./public/images/${imgName}`, function (err) {
                    if(err) {
                        return res.sendStatus(500)            
                    }
                })
            }else {
               return res.status(400).json({'message' : 'Please Add An Image'}) ;
            }
            
            
        }else {
            imgName = 'defualt.png' ;
        }
        const hashPassword = await bcrypt.hash(pwd , 10);
        const result = await User.create({
            'image' : `/public/images/${imgName}`,
            'fullName' : fullname,
            'username' : user,
            'email' : email,
            'password' : hashPassword
        });
        res.status(201).json({'success' : `New User ${user} Created`})
    }catch (err) {
        console.log(err)
        res.status(500).json({'message' : `${err}`});
    }
}


module.exports = {handleNewUser}