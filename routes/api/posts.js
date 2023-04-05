const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');


app.use(bodyParser.urlencoded({extended: false}));

router.get("/", (req,res,next) =>{
   Post.find()
   .populate("postedBy")
   .sort({"createdAt":-1})
   .then(results =>{
        res.status(200).send(results);
   })
   .catch(error =>{
        console.log(error);
        res.sendStatus(400);
   })
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

router.put("/", async (req,res,next) =>{
   res.status(200).send("yahoo")
})
module.exports = router;