const express = require('express');
const app = express();
const router =express.Router();
const bodyParser = require("body-parser");
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: false}));

router.get("/", (req,res,next) =>{
    var payload = createPayload(req.session.user)
    res.status(200).render("searchPage",payload);
})
router.get("/:selectedTab", (req,res,next) =>{
    var payload = createPayload(req.session.user)
    payload.selectedTab = req.params.selectedTab;
    res.status(200).render("searchPage",payload);
})
function createPayload(userLoggedIn){
    return{
        pageTitle:"Search Page",
        userLoggedIn: userLoggedIn,
        userLoggedInJS: JSON.stringify(userLoggedIn)
    }
}
module.exports = router;