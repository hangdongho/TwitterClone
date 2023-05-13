const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: false}));

router.get("/", (req,res,next) =>{
    var payload = {
        pageTitle:"Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    res.status(200).render("notificationPage",payload);
})

module.exports = router;