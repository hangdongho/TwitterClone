const express = require('express');
const app = express();
const port = 3003;
const middleware = require('./middleware');
const path = require('path')
const bodyParser = require("body-parser");
const mongoose = require('./database');
const session = require('express-session');
const cors = require('cors');


const server = app.listen(port,() => console.log("server listening on port "+port));
const io = require("socket.io")(server,{pingTimeout:7000, allowEIO3:true});


app.set("view engine","pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,"public")))
app.use(cors({
    origin:"http://localhost:3003"
}));

app.use(session({
    secret: "japanese",
    resave: true,
    saveUninitialized:false
}))
//routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logOutRoute = require('./routes/logout');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const exploreRoute = require('./routes/exploreRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const notificationRoute = require('./routes/notificationRoutes');
const messageRoute = require('./routes/messageRoute');

//api routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const messageApiRoute = require('./routes/api/messages');

app.use("/login",loginRoute);
app.use("/register",registerRoute);
app.use("/logout",logOutRoute);
app.use("/posts",middleware.requireLogin,postRoute);
app.use("/profile",middleware.requireLogin,profileRoute);
app.use("/explore",middleware.requireLogin,exploreRoute);
app.use("/uploads",uploadRoute);
app.use("/search",middleware.requireLogin, searchRoute);
app.use("/notifications",middleware.requireLogin,notificationRoute);
app.use("/messages",middleware.requireLogin,messageRoute);

app.use("/api/posts",postsApiRoute);
app.use("/api/users",usersApiRoute);
app.use("/api/chats",chatsApiRoute);
app.use("/api/messages",messageApiRoute);

app.get("/",middleware.requireLogin, (req,res,next) =>{

    var payload = {
        pageTitle:"Home",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    res.status(200).render("home",payload);
})

io.on("connect",socket => {
    socket.on("setup", userData =>{
        socket.join(userData._id);
        socket.emit("connected");
        console.log("user connected");
    })

    socket.on("join room", room => socket.join(room));
    socket.on("typing", room =>  socket.in(room).emit("typing"));
    socket.on("stop typing", room => socket.in(room).emit("stop typing"));

    socket.on("new message", newMessage =>{
        var chat = newMessage.chat;
        if(!chat.users) return console.log("Chat users are not defined");

        chat.users.forEach(user => {
            if(user._id ==  newMessage.sender._id) return;
            console.log(user);
            socket.in(user._id).emit("message received", newMessage);
        })
    })
})