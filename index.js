require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const credintials = require('./middleware/credintals');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const verifyJWT = require('./middleware/verifyJWT') ;
const upload = require('express-fileupload')
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./model/User');
const Chat = require('./model/Chat');
const Online = require('./model/Online');
const moment = require('moment');

const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');

const http = require("http");
const {Server} = require("socket.io");
// const { callbackify } = require('util');


const PORT = process.env.PORT || 3500 ;
const PORT2 = process.env.PORT || 3001 ;

let currentUser ;

connectDB();

app.use(credintials);

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(cookieParser());


app.use('/public/images', express.static("public/images"));




// Routes 
app.use(upload())
app.use('/register' ,require('./routes/register'));
app.use('/login' , require('./routes/login'));
app.use('/refresh' , require('./routes/refresh'));
app.use('/logout' , require('./routes/logout'));

app.use(verifyJWT);

app.use('/edit-user' , require('./routes/api/editUser'));
app.use('/friends' , require('./routes/api/friends'));
app.use('/friends-info' , require('./routes/api/friendsInfo'));


mongoose.connection.once('open' , () => {
    console.log('connect to MongoDB');

})

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const io = new Server(server,{
    cors: {
        origin : "https://abubkar-ahmed.github.io/liveChat/",
        methods : ["GET" , "POST"]
    }
})


io.use((socket, next) => {
    const token = socket?.handshake?.auth?.token;
    try {
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            (err, decoded) => {
                if(err) return next(new Error('Invaled Token'));
                next();
            }
        );
    } catch (err) {
        console.log('err');
    }
    
    
});




const updateStatus = async (username , status) => {
    const onUser = await Online.findOne({username}).exec();
    if(onUser){
        onUser.lastSeen = status;
        await onUser.save();
    } else {
        const onlineStatus = await Online.create({
            username : username,
            lastSeen : status            
        })
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

  const getUnreafMsg = async (data) => {


    const unread = await Chat.find({for : data}).exec();
    
    let arr = [] ;

    for(i in unread){
        arr.push({
            room : unread[i].chatRoom,
            sentBy : unread[i].to,
            msgs : unread[i].unreadMsg.length,
        } 
        )
    }
    
    return arr ;

  }

global.onlineUsers = new Array();
io.on("connection", async (socket) => {
    if(socket?.handshake?.auth?.user){
        global.onlineUsers.push(socket?.handshake?.auth?.user);
        global.onlineUsers = [...new Set(global.onlineUsers)];
        updateStatus(socket?.handshake?.auth?.user , 'online')
         
        socket.emit('unreadMsg' , await getUnreafMsg(socket?.   handshake?.auth?.user).then(res => {
            return res
            }).catch(err => {
            console.log(err)
        }));

        socket.on("join_room" , async (data) => {
            const onUser = await Online.find().exec();
            socket.join(data.room);
            console.log(`User with ID :${socket.id} joined room : ${data.room}`);
            socket.to(data.room).emit('onilne_users' , onUser);
            socket.emit('onilne_users1' , onUser);
        })
    
        socket.on('logout' , async (data) => {
            
            global.onlineUsers = global.onlineUsers.filter(e => {
                return e !== socket?.handshake?.auth?.user ; 
            })
            await updateStatus(socket?.handshake?.auth?.user , getCurrentDate());
            

            const onUser = await Online.find().exec();
            
            if(onUser){
                socket.local.emit('onilne_users' , onUser);
            }
            
    
            
        })
    
        socket.on('get_last_Msg' , async (data) => {
            const chatExicit = await Chat.find({chatRoom : data.room ,for : data.author }).exec();
            socket.emit('get_last_msg' , chatExicit);
        })

    
        socket.on('get_all_messages' , async (data) => {
            const chatExicit = await Chat.findOne({chatRoom : data.room , for : data.author}).exec();    
            if(chatExicit){
                socket.emit("messages", chatExicit);
            }
        })
    
    
        socket.on("send_message", async (data) => {
            if(data){ 
                const chatExicit = await Chat.find({chatRoom : data.room }).exec();
                if(chatExicit.length === 0) {
                    const chat = await Chat.create({
                        chatRoom : data.room,
                        for : data.author,
                        to : data.to,
                        arrayOfMessages : [
                            {
                                sentBy : data.author,
                                msg : data.message,
                                date : data.date
                            },
                        ],
                        unreadMsg : []
                        
                    })
    
                    const chat1 = await Chat.create({
                        chatRoom : data.room,
                        for : data.to,
                        to : data.author,
                        arrayOfMessages : [
                            {
                                sentBy : data.author,
                                msg : data.message,
                                date : data.date
                            },
                        ],
                        unreadMsg : [
                           { sentBy : data.author,
                            msg : data.message,
                            date : data.date},
                        ] 
                    })
                } 
                else {
                    for(i in chatExicit){
                        chatExicit[i].arrayOfMessages.push(
                            {
                                sentBy : data.author,
                                msg : data.message,
                                date : data.date
                            }
                        )

                        if(chatExicit[i].for === data.to){
                            chatExicit[i].unreadMsg.push(
                                {
                                    sentBy : data.author,
                                    msg : data.message,
                                    date : data.date 
                                }
                            )
                        }
                        const result = await chatExicit[i].save();
                    }
                }
                
        }
            socket.to(data.room).emit("receive_message", {
                data : data,
                unreadMsg : await getUnreafMsg(data.to).then(res => {
                        return res
                        }).catch(err => {
                        console.log(err);
                    })
            
            });

            
        });

        socket.on('clear_unread_msg' , async (data , callback) => {

            const user = socket?.handshake?.auth?.user ;

            const unread = await Chat.findOne({for : user , chatRoom : data.room}).exec();

            if(unread?.unreadMsg){
                unread.unreadMsg = [] ;
                const result = await unread.save();
            }

            socket.emit('unreadMsg' , await getUnreafMsg(socket?.handshake?.auth?.user).then(res => {
                return res
                }).catch(err => {
                console.log(err)
            }));
        })

    
        socket.on("clear_chat" , async (data) => {
            const chatExicit = await Chat.findOne({chatRoom : data.room , for : data.author}).exec();
            console.log(chatExicit)
    
            if(chatExicit){
                chatExicit.arrayOfMessages = [];
    
                await chatExicit.save() ;
            }
        } )
    
        socket.on("disconnect" , async () => {
            console.log("User Disconnected");
            global.onlineUsers = global.onlineUsers.filter(e => {
                return e !== socket?.handshake?.auth?.user ; 
            })
            await updateStatus(socket?.handshake?.auth?.user , getCurrentDate());

            const onUser = await Online.find().exec();
            
            if(onUser){
                socket.local.emit('onilne_users' , onUser);
            }
        })
    }

    

})

