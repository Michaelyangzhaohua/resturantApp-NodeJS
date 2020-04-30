/* Executed on the server side. */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var Account = require('../models/account');
// var Order = require('../models/order');
var Menus = require('../models/menus');
// var Wishlist = require('../models/wishlist');

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
var monk = require('monk');
var db = monk('localhost:27017/restaurant');

//Landing Page
router.get('/', function (req, res, next) {
	res.render('landing');
});

//Add New Dish
router.get('/menus/new', function (req, res) {
	res.render('new', { user: req.user });
});
//Home Page
router.post('/menus', function (req, res) {
	var collection = db.get('menus');
	collection.insert({
		name: req.body.name,
		image: req.body.image,
		type: req.body.type,
		price: parseFloat(req.body.price),
		description: req.body.description,
		inventory: parseInt(req.body.inventory)
	}, function (err, menu) {
		if (err) throw err;
		res.redirect('/menus');
	});
});

//Details of One Dish
router.get('/menus/:id', function (req, res) {
	var collection = db.get('menus');
	collection.findOne({ _id: req.params.id }, function (err, menus) {
		if (err) throw err;
		res.render('show', { menus: menus, user: req.user });
	});
});

//Register
router.get('/register', function (req, res) {
	if (req.query.username && req.xhr) {
		console.log(req.query.username);
		Account.findOne({ username: req.query.username }, function (err, user) {
			if (err) {
				console.log(err);
			}
			var message;
			if (user) {
				message = "user exists";
			} else {
				message = "user doesn't exist";
			}
			res.json({ message: message });
		});
	}
	else {
		res.render('register', { user: req.user });
	}
});

router.post('/register', function (req, res) {
	var newAccount = new Account({ username: req.body.username });
	if (req.body.username === "admin") {
		newAccount.isAdmin = true;
	}
	Account.register(newAccount, req.body.password, function (err, account) {
		if (err) {
			console.log(err.message);
			return res.redirect('/register');
		}

		passport.authenticate('local')(req, res, function () {
			res.redirect('/menus');
		});
	});
});

router.get('/login', function (req, res) {
	res.render('login', { user: req.user });
});

router.post("/login", passport.authenticate("local", {

	successRedirect: "/menus",
	failureRedirect: "/login",
}), function (req, res) {

});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");

}

router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/menus');
});

router.get('/ping', function (req, res) {
	res.send("pong!", 200);
});

//Search Engine
router.get('/menus', async (req, res, next) => {
	// const foundMenus =await Menus.find({})

	var page = parseInt(req.query.page) || 1;
	var collection = db.get('menus');
	var result = [];
	var length = 0;


	if (req.query.search && req.xhr) {

		if (req.query.type != "all") {
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			var type = new RegExp(escapeRegex(req.query.type), 'gi');
			collection.find({ name: regex, type: type }, function (err, menus) {
				if (err) {
					console.log(err);
				} else {
					res.status(200).json(menus);
				}
			});
		} else if (req.query.type == "all") {
			// Get all campgrounds from DB
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			var type = new RegExp(escapeRegex(req.query.type), 'gi');
			collection.find({ name: regex }, function (err, menus) {
				if (err) {
					console.log(err);
				} else {
					res.status(200).json(menus);
				}
			});
		}
	} else if (req.query.search == "" && req.query.type != "all") {
		var type = new RegExp(escapeRegex(req.query.type), 'gi');
		collection.find({ type: type }, function (err, menus) {
			if (err) {
				console.log(err);
			} else {
				res.status(200).json(menus);
			}
		});
	} else {
		if (req.xhr) {
			collection.find({}, function (err, menus) {
				if (err) throw err;
				res.status(200).json(menus);
			});
		} else {
			collection.find({}, function (err, menus) {
				if (err) throw err;
				length = menus.length;
				for (var i = 6 * (page - 1); i < 6 * page; i++) {
					if (i < length) {

						result.push(menus[i]);
					}
				}
				var maxPage = Math.ceil(length / 6);
				res.render('index', {
					menus: result,
					currentPage: page,
					numOfPages: maxPage,
					numOfResults: menus.length,
					user: req.user
				});
			});
		}
	}
});


//Menu Edit Page
router.get('/menus/:id/edit', function (req, res) {
	var collection = db.get('menus');
	collection.findOne({ _id: req.params.id }, function (err, menus) {
		if (err) throw err;
		res.render('edit', { menus: menus, user: req.user });
	});
});

//Update The Page
router.put('/menus/:id', function (req, res) {
	var collection = db.get('menus');
	collection.findOneAndUpdate({ _id: req.params.id },
		{
			$set: {
				name: req.body.name,
				description: req.body.description,
				image: req.body.image,
				type: req.body.type,
				inventory: parseInt(req.body.inventory),
				// inventory: req.body.inventory,
				price: parseFloat(req.body.price)
			}
		}).then((updatedDoc) => { });
	res.redirect('/menus');
});

//Delete The Menu
router.delete('/menus/:id', function (req, res) {
	var collection = db.get('menus');
	collection.remove({ _id: req.params.id }, function (err, menus) {
		if (err) throw err;
		res.redirect('/menus');
	});
});


/******************************************************************************************************
 * Wishlist: Yinglue's part
 * ":id" is the user's id
 */
// Add to wishlist
router.post('/:id/wishlist', function (req, res) {
	var menus_collection = db.get('menus');
	var wl_collection = db.get('wishlist');

	menus_collection.findOne({ _id: req.body.like }, function (err, menu) {
		if (err) throw err;
		var url = '/menus/' + req.body.like;

		wl_collection.findOne({
			userid: req.user._id,
			menuObject: menu
		}, function (err, result) {
			if (err) throw err;
			if (result) {
				console.log("Duplicate in wishlist.");
				res.redirect(url);
			} else {
				wl_collection.insert({
					menuObject: menu,
					menuid: menu._id,
					menuname: menu.name,
					userid: req.user._id,
					username: req.user.username
				}, function (err, wishlist) {
					if (err) throw err;
					res.redirect(url);
				});
			}
		});
	});
});
// Delete from wishlist
router.delete('/:id/wishlist', function (req, res) {
	// TODO!!!

	// var collection = db.get('wishlist');
	// var wlmenuid = req.body.wlmenuid;
	// var url = '/' + req.params.id + '/wishlist';

	// Menus.findById(wlmenuid, function (err, foundMenu) {
	// 	if (err) throw err;
	// 	collection.remove({ userid: req.params.id, menuname: foundMenu.name }, function (err, wl) {
	// 		if (err) throw err;
	// 	});
	// 	res.redirect(url);
	// });
});
// Go to wishlist
router.get('/:id/wishlist', function (req, res) {
	var wl_collection = db.get('wishlist');

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}
		wl_collection.find({ username: foundUser.username }, function (err, wls) {
			if (err) {
				res.redirect("/menus");
			}
			res.render("wishlist", { user: foundUser, wishlists: wls });
		});
	});
});
/**
 * Wishlist: the end
 ******************************************************************************************************/


/******************************************************************************************************
 * Shopping cart: Yinglue's part
 * ":id" is the user's id
 */
// Go to shopping cart
router.get('/:id/cart', function (req, res) {
	var cart_collection = db.get('cart');

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}
		cart_collection.find({ username: foundUser.username }, function (err, items) {
			if (err) {
				res.redirect("/menus");
			}
			res.render("cart", { user: foundUser, items: items });
		})
	})
});
// Add to shopping cart
router.post('/:id/cart', function (req, res) {
	var menus_collection = db.get('menus');
	var cart_collection = db.get('cart');

	menus_collection.findOne({ _id: req.body.buy }, function (err, menu) {
		if (err) throw err;

		cart_collection.findOne({
			userid: req.user._id,
			menuObject: menu
		}, function (err, result) {
			if (err) throw err;
			if (result) {
				cart_collection.findOneAndUpdate({
					userid: req.user._id,
					menuObject: menu
				}, {
					$inc: {
						menucount: parseInt(req.body.quantity)
					}
				}).then((updateDoc) => { });
				res.redirect('/menus');
			} else {
				cart_collection.insert({
					menuObject: menu,
					menuid: menu._id,
					menuname: menu.name,
					menucount: parseInt(req.body.quantity),
					userid: req.user._id,
					username: req.user.username
				}, function (err, oneCartItem) {
					if (err) throw err;
					res.redirect('/menus');
				});
			}
		});
	});
});
// Delete from the cart.
router.delete('/:id/cart', function (req, res) {
	// TODO!!!

	// var cart_collection = db.get('cart');
	// var itemid = req.body.itemid;
	// var url = '/' + req.params.id + '/cart';
	// var deduct = parseInt(req.body.quantity);

	// Menus.findById(itemid, function (err, foundMenu) {
	// 	if (err) throw err;
	// 	cart_collection.findOne({ userid: req.user._id, menuObject: foundMenu }, function (err, result) {
	// 		if (err) throw err;
	// 		console.log(result);

	// 		if (result.menucount > deduct) {
	// 			cart_collection.findOneAndUpdate({ userid: req.user._id, menuObject: foundMenu }, {
	// 				$inc: {
	// 					menucount: (-1 * deduct)
	// 				}
	// 			}).then((updateDoc) => { });
	// 		} else {
	// 			cart_collection.remove({ userid: req.user._id, menuObject: foundMenu }, function (err, ans) {
	// 				if (err) throw err;
	// 			});
	// 		}

	// 		res.redirect(url);
	// 	});
	// });
});
/**
 * Shopping cart: the end
 ******************************************************************************************************/

module.exports = router;
