const User = require('../model/User');
const bcrypt = require('bcrypt');
const Online = require('../model/Online');
const moment = require('moment');






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
        const newUser = new User({});
        if(req?.files?.img){
            const acceptedType = ['image/png', 'image/jpg', 'image/jpeg' , 'image/webp'] ;
            if(!acceptedType.includes(req?.files?.img?.mimetype)) return res.status(409).json({
                'message' : 'invalied Image Type'
            })
            
            saveImage(newUser, req.files.img);
            function saveImage(newUser, imgEncoded) {
                const img = imgEncoded;
                newUser.img = new Buffer.from(img.data, "base64");
                newUser.imgType = img.mimetype;
            }
        }


        const hashPassword = await bcrypt.hash(pwd , 10);

        newUser.fullName = fullname;
        newUser.username = user;
        newUser.email = email ;
        newUser.password = hashPassword

        const result = await newUser.save();

        const onlineStatus = await Online.create({
            username : user,
            lastSeen : getCurrentDate()           
        }) ; 

        res.status(201).json({'success' : `New User ${user} Created`})
      }catch (err){
        console.log(err); 
        res.status(500).json({'message' : `${err}`});   
      }


}

const getCurrentDate = () => {
    const hour = () => {
      let h = moment().hour();
        if(h >= 0 && h <= 9){
          h = `0${h}`;
        }
        return h ;
    }

    const min = () => {
      let m = moment().minute();
      if(m >= 0 && m <= 9){
        m = `0${m}`;
      }
      return m ;
    }
    const date = `${moment().month() + 1}/${moment().date()} ${hour()}:${min()}`

    return date ;
  }


module.exports = {handleNewUser}