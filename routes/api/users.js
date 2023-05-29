const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const multer = require("multer");
const path =  require("path");
const fs = require("fs");
const upload = multer({dest:"uploads/"});


app.use(bodyParser.urlencoded({extended: false}));
router.get("/", async (req, res, next) => {
    var searchObj = req.query;

    if(req.query.search !== undefined) {
        searchObj = {
            $or: [
                { firstName: { $regex: req.query.search, $options: "i" }},
                { lastName: { $regex: req.query.search, $options: "i" }},
                { username: { $regex: req.query.search, $options: "i" }},
            ]
        }
    }
    // if(searchObj.followingOnly !== undefined){
    //     var followingOnly = searchObj.followingOnly === "true";
    //     if(followingOnly){
    //         var objectId = [...req.session.user.following];
    //         objectId.push(req.session.user._id);
    //         searchObj.postedBy = {$in:objectId};
    //     }
    //     delete searchObj.followingOnly;
    // }
    await User.find(searchObj)
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});
router.put("/:userId/follow", async (req,res,next) =>{
    let userId = req.params.userId;
    let user = await User.findById(userId);
    if(user === null){
        return res.sendStatus(404);
    }
    var isFollowing = user.followers && user.followers.includes(req.session.user._id);
    var option =isFollowing ?"$pull" : "$addToSet";

    //insert new user following
    req.session.user = await User.findByIdAndUpdate(req.session.user._id, {[option]:{following : userId}},{new:true})
    .catch((error) => {
        console.log(error)
        res.sendStatus(400);
    
    });
    await User.findByIdAndUpdate(userId,{
        [option]:{followers:req.session.user._id},
    }).catch((error) => {
        console.log(error);
        res.sendStatus(400);
    });
    res.status(200).send(req.session.user);
});
router.get("/:userId/following", async (req,res,next) =>{
    User.findById(req.params.userId)
        .populate("following")
        .then((results) =>{
            res.status(200).send(results);
        })
        .catch((error) =>{
            console.log(error);
            res.sendStatus(400);
        });
})

router.get("/:userId/followers", async (req,res,next) =>{
    User.findById(req.params.userId)
        .populate("followers")
        .then((results) =>{
            res.status(200).send(results);
        })
        .catch((error) =>{
            console.log(error);
            res.sendStatus(400);
        });
})

router.post("/profilePicture", upload.single("croppedImage"), async(req,res,next)=>{
    if(!req.file){
        console.log("not get file");
        return res.sendStatus(400);
    }
    var filePath = `/uploads/images/${req.file.filename}.jpg`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname,`../../${filePath}`);

    fs.rename(tempPath, targetPath, async(err)=>{
        if(err != null){
            console.log(err);
            return res.sendStatus(400);
        }
        req.session.user = await User.findByIdAndUpdate(req.session.user._id, {profilePic: filePath}, {new:true});
        res.sendStatus(204);
    })
})

router.post("/coverPhoto", upload.single("croppedImage"), async(req,res,next)=>{
    if(!req.file){
        console.log("not get file");
        return res.sendStatus(400);
    }
    var filePath = `/uploads/images/${req.file.filename}.jpg`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname,`../../${filePath}`);

    fs.rename(tempPath, targetPath, async(err)=>{
        if(err != null){
            console.log(err);
            return res.sendStatus(400);
        }
        req.session.user = await User.findByIdAndUpdate(req.session.user._id, {coverPhoto: filePath}, {new:true});
        res.sendStatus(204);
    })
})

module.exports = router;