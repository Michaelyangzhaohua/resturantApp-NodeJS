/* Executed on the server side. */
var express = require('express');
var router = express.Router();
// var passport = require('passport');
// var Account = require('../models/account');
// var Order = require('../models/order');
// var Car = require('../models/car');
// var Wishlist = require('../models/wishlist');

var monk = require('monk');
var db = monk('localhost:27017/restaurant');

router.get('/', function(req, res, next) {
  res.redirect('/menus');
});

// router.get('/menus/:id', function(req, res) {
// 	var collection = db.get('menus');
// 	collection.findOne({ _id: req.params.id }, function(err, menus){
// 		if (err) throw err;
// 	  	res.render('show', { menus: menus });
// 	});
// });
router.get('/menus', function(req, res) {

	var collection = db.get('menus');
	collection.find({}, function(err, menus){
		if (err) throw err;
	  	res.render('index', { menus: menus});
	});
});
module.exports = router;
