const mongoose = require('mongoose');
// mongoose.set('useNewUrlParser',true);
// mongoose.set('useUnifiedTopology',true);
// mongoose.set('useFindAndModify',false);
// mongoose.set('useUnifiedTopology',true);
class Database{
    constructor(){
        this.connect();
    }
    connect(){
        mongoose.connect("mongodb+srv://donghohang3011:123@twitterclonecluster.qbeti48.mongodb.net/?retryWrites=true&w=majority")
        .then(() =>{
            console.log("DB connection successfully");
        })
        .catch((err) =>{
            console.log("DB connection error "+err);
        })
    }
}

module.exports = new Database();
