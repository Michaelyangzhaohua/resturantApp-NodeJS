var express = require('express');
var router = express.Router();
// var Menus = require('../models/menus');

var monk = require('monk');
var db = monk('localhost:27017/restaurant');

router.get('/', function(req, res) {
	var collection = db.get('menus');
	
	collection.find({}, function(err, menus){
		if (err) throw err;
	  	res.json(menus);
	});
});

router.get('/:id', function(req, res) {
	var collection = db.get('menus');
	collection.findOne({ _id: req.params.id }, function(err, menus){
		if (err) throw err;
	  	res.json(menus);
	});
});

module.exports = router;