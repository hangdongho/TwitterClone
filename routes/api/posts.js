const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');


app.use(bodyParser.urlencoded({extended: false}));

router.get("/", async (req,res,next) =>{
    var searchObject = req.query;
    if(searchObject.isReply !== undefined){
        var isReply = searchObject.isReply == "true";
        searchObject.replyTo = {$exists: isReply};
        delete searchObject.isReply;
        console.log(searchObject);
    }
    if(searchObject.followingOnly !== undefined){
        var followingOnly = searchObject.followingOnly === "true";
        if(followingOnly){
            var objectId = [...req.session.user.following];
            objectId.push(req.session.user._id);
            searchObject.postedBy = {$in:objectId};
        }
        delete searchObject.followingOnly;
    }
    var result = await getPosts(searchObject);
    res.status(200).send(result);
})
router.get("/:id", async (req,res,next) =>{
    var postId= req.params.id;

    var postData = await getPosts({ _id:postId});
    postData = postData[0];
    var result = {
        postData: postData
    }
    if(postData.replyTo !== undefined){
        result.replyTo = postData.replyTo;
    }
    result.replies = await getPosts({replyTo: postId});
    res.status(200).send(result);
})
router.post("/", async (req,res,next) =>{
    if(!req.body.content){
        console.log("Content param is not send with request");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo;
    }
    Post.create(postData)
    .then(async (newPost) =>{
        newPost = await User.populate(newPost,{path: "postedBy"})
        newPost = await Post.populate(newPost,{path:"replyTo"})
        if(newPost.replyTo !== undefined){
            await Notification.insertNotification(newPost.replyTo.postedBy,req.session.user._id,"reply",newPost._id);
        }
        res.status(201).send(newPost);
    })
    .catch((error) => {
        console.log(error);
        res.sendStatus(400);
    })

    //res.status(200).send("it works");
})

router.put("/:id/like", async (req,res,next) =>{
   //console.log(req.params.id);
   var postId= req.params.id;
   var userId = req.session.user._id;
   var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);
   
    var option = isLiked ? "$pull" : "$addToSet";
    console.log("is liked: "+isLiked);
    console.log("option : "+option);
    console.log("UserID: "+userId);
    //insert user like
    req.session.user = await User.findByIdAndUpdate(userId,{ [option]:{likes:postId}}, {new :true})
    .catch(error =>{
        console.log(error);
        res.sendStatus(400);
    })
   //insert post like
   var post = await Post.findByIdAndUpdate(postId,{ [option]:{likes:userId}}, {new :true})
    .catch(error =>{
        console.log(error);
        res.sendStatus(400);
    })
    if(!isLiked){
        await Notification.insertNotification(post.postedBy,userId,"postLike",post._id);
    }
    res.status(200).send(post)
})
router.post("/:id/retweet", async (req,res,next) =>{
   
    var postId= req.params.id;
    var userId = req.session.user._id;
    //try and delete retweet
    var deletedPOst = await Post.findOneAndDelete({postedBy: userId , retweetData: postId})
    .catch(error =>{
        console.log(error);
        res.sendStatus(400);
    })
    var option = deletedPOst != null ? "$pull" : "$addToSet";
    var repost = deletedPOst;

    if(repost == null){
        repost = await Post.create({postedBy:userId,retweetData: postId})
        .catch(error =>{
            console.log(error);
            res.sendStatus(400);
        })
    }


    //insert user retweet
    req.session.user = await User.findByIdAndUpdate(userId,{ [option]:{retweets:repost._id}}, {new :true})
    .catch(error =>{
        console.log(error);
        res.sendStatus(400);
    })
    //insert post like
    var post = await Post.findByIdAndUpdate(postId,{ [option]:{retweetUsers:userId}}, {new :true})
     .catch(error =>{
         console.log(error);
         res.sendStatus(400);
    })
    if(!deletedPOst){
        await Notification.insertNotification(post.postedBy,userId,"retweet",post._id);
    }
    res.status(200).send(post)
 })

router.put("/:id",async(req,res,next) =>{
    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy:req.session.user}, {pinned:false})
        .catch(error =>{
            console.log(error);
            res.sendStatus(400);
        })
        Post.findByIdAndUpdate(req.params.id, req.body)
        .then(() => res.sendStatus(204))
        .catch(error =>{
            console.log(error);
            res.sendStatus(400);
        })
    }
})
router.delete("/:id",(req,res,next) =>{
    Post.findByIdAndDelete(req.params.id)
    .then(() =>{
        res.sendStatus(202);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})
 async function getPosts(filter){
    var result = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({"createdAt":-1})
    .catch(error => console.log(error))
    result = await User.populate(result,{path:"replyTo.postedBy"});
    return await User.populate(result,{path:"retweetData.postedBy"});

 }
module.exports = router;