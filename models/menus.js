var mongoose = require('mongoose');

var MenusSchema = new mongoose.Schema({
   name:String,
   description:String,
   image:String,
   type:String,
   inventory:Number,
   price:String,
});

// Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Menus', MenusSchema);