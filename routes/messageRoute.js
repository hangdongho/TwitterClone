const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended: false}));

router.get("/", (req,res,next) =>{
    var payload = {
        pageTitle:"Messages",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    res.status(200).render("messagePage",payload);
})
router.get("/new", (req,res,next) =>{
    var payload = {
        pageTitle:"New messages",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    res.status(200).render("newMessagePage",payload);
})
router.get("/:chatId", async (req,res,next) =>{
    var userId= req.session.user._id;
    var chatId = req.params.chatId;
    var isValid = mongoose.isValidObjectId(chatId);

    var payload = {
        pageTitle:"Chat",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    
    if(!isValid){
        payload.errorMessage =" Chat does not exist 1";
        return res.status(200).render("chatPage",payload);

    }

    var chat = await Chat.findOne({
        _id: chatId,
        users: {$elemMatch: {$eq:userId}}
    }).populate("users");

    if(chat == null){
        //check chatid equal to user id
        var userFound = await User.findById(chatId);
        if(userFound != null){
            //get chat use userid
            chat = await getChatByUserId(userFound._id, userId);
        }
    }
    if(chat == null){
        payload.errorMessage ="Chat does not exist 2";
    }
    else{
        payload.chat=chat;
    }
    res.status(200).render("chatPage",payload);
})

function getChatByUserId(userLoggedInId, otherUserId){
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users:{
            $size :2,
            $all:[
                {$elemMatch :{$eq:mongoose.Types.ObjectId(userLoggedInId)}},
                {$elemMatch:{$eq:mongoose.Types.ObjectId(otherUserId)}}
            ]
        }
    },
    {
        $setOnInsert:{
            users:[userLoggedInId, otherUserId]
        }
    },
    {
        new: true, 
        upsert: true
    })
    .populate("users");
}
module.exports = router;