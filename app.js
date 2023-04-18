const express = require('express');
const app = express();
const port = 3003;
const middleware = require('./middleware');
const path = require('path')
const bodyParser = require("body-parser");
const mongoose = require('./database');
const session = require('express-session');



const server = app.listen(port,() => console.log("server listening on port "+port));

app.set("view engine","pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,"public")))

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
//api routes
const postsApiRoute = require('./routes/api/posts');


app.use("/login",loginRoute);
app.use("/register",registerRoute);
app.use("/logout",logOutRoute);
app.use("/posts",middleware.requireLogin,postRoute);
app.use("/profile",middleware.requireLogin,profileRoute);
app.use("/explore",middleware.requireLogin,exploreRoute);

app.use("/api/posts",postsApiRoute);

app.get("/",middleware.requireLogin, (req,res,next) =>{

    var payload = {
        pageTitle:"Home",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    }
    res.status(200).render("home",payload);
})