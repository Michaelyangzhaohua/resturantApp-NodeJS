/* Executed on the server side. */
var express = require('express');
var router = express.Router();
// var passport = require('passport');
// var Account = require('../models/account');
// var Order = require('../models/order');
// var Menus = require('../models/menus');
// var Wishlist = require('../models/wishlist');

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
var monk = require('monk');
var db = monk('localhost:27017/restaurant');

router.get('/', function(req, res, next) {
  res.render('landing');
});
router.get('/menus/new',function(req,res){
	res.render('new');
});
/////insert a new dish
router.post('/menus', function(req, res) {
    var collection = db.get('menus');
    collection.insert({
    name: req.body.name,
    image: req.body.image,
    type: req.body.type,
    price: parseFloat(req.body.price), 
    description: req.body.description,
    inventory: parseInt(req.body.inventory)
    }, function(err, menu){
        if (err) throw err;
       res.redirect('/menus');
    });
});


router.get('/menus/:id', function(req, res) {
	var collection = db.get('menus');
	collection.findOne({ _id: req.params.id }, function(err, menus){
		if (err) throw err;
		res.render('show', { menus: menus });
	});
});
/////get main page
// router.get('/menus', function(req, res) {

// 	var collection = db.get('menus');
// 	collection.find({}, function(err, menus){
// 		if (err) throw err;
// 	  	res.render('index', { menus: menus});
// 	});
// });

router.get('/menus', async(req, res, next)=> {
	// const foundMenus =await Menus.find({})

	var page = parseInt(req.query.page)||1;
	var collection = db.get('menus');
	var result = [];
	var length = 0;


	if(req.query.search && req.xhr) {
	  
		if(req.query.type != "all"){
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			var type = new RegExp(escapeRegex(req.query.type), 'gi');
			collection.find({name: regex, type : type}, function(err, menus){
				if(err){
					console.log(err);
				} else {
					res.status(200).json(menus);
				}
			});
		}else if(req.query.type == "all"){
		// Get all campgrounds from DB
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			var type = new RegExp(escapeRegex(req.query.type), 'gi');
			collection.find({name: regex}, function(err, menus){
				if(err){
					console.log(err);
				}else{
					res.status(200).json(menus);
				}
			});
		}
	} else if(req.query.search =="" && req.query.type != "all"){
		var type = new RegExp(escapeRegex(req.query.type), 'gi');
		collection.find({type: type}, function(err, menus){
			if(err){
				console.log(err);
			} else {
				res.status(200).json(menus);
			}
		});
	}else{
		if(req.xhr) {
			collection.find({}, function(err, menus){
				if (err) throw err;
				res.status(200).json(menus);
			});
		} else {
			collection.find({}, function(err, menus){
				if (err) throw err;
        		length = menus.length;
				for(var i = 6 * (page-1); i < 6*page; i++ ) {
					if(i<length){

            			result.push(menus[i]);
					}
        		}
        		var maxPage = Math.ceil(length/6);
				res.render('index', { 
					menus: result,
					currentPage:page,
					numOfPages:maxPage,
					numOfResults:menus.length
				});
			});
		}
	} 
});


///menu edit page
router.get('/menus/:id/edit', function(req, res) {
	var collection = db.get('menus');
	collection.findOne({ _id: req.params.id}, function(err, menus){
		if (err) throw err;
	   res.render('edit', { menus: menus});
	});
});
////update the page
router.put('/menus/:id', function(req, res) {
	var collection = db.get('menus');
	collection.findOneAndUpdate({_id: req.params.id}, 
			{ $set: {name: req.body.name,
						  description: req.body.description,
						  image: req.body.image,
						  type: req.body.type,
						  inventory: parseInt(req.body.inventory),
						  // inventory: req.body.inventory,
						  price: parseFloat(req.body.price)} }).then((updatedDoc) => {});
	res.redirect('/menus');
});
////delete the menu
router.delete('/menus/:id',function(req,res){
	var collection = db.get('menus');
	collection.remove({ _id: req.params.id }, function(err, menus){
		if (err) throw err;
		res.redirect('/menus');
	});
});

module.exports = router;
