const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');


app.use(bodyParser.urlencoded({extended: false}));

router.get("/", async (req,res,next) =>{
    var result = await getPosts({});
    res.status(200).send(result);
})
router.get("/:id", async (req,res,next) =>{
    var postId= req.params.id;

    var result = await getPosts({ _id:postId});
    result = result[0];
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
    Post.create(postData)
    .then(async (newPost) =>{
        newPost = await User.populate(newPost,{path: "postedBy"})
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
    res.status(200).send(post)
 })

 async function getPosts(filter){
    var result = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .sort({"createdAt":-1})
    .catch(error => console.log(error))

    return await User.populate(result,{path:"retweetData.postedBy"});

 }
module.exports = router;