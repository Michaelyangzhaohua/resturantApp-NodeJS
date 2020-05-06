/* Executed on the server side. */
var express = require("express");
var router = express.Router();
var passport = require("passport");
var Account = require("../models/account");
var formidable = require('formidable');
var fs = require('fs');

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

var monk = require("monk");
var db = monk("localhost:27017/restaurant");

// Landing Page
router.get("/", function (req, res, next) {
	res.render("landing");
});

// "Add New Dish" form
router.get("/menus/new", function (req, res) {
	res.render("new", { user: req.user });
});

// Add the new dish
router.post("/menus", function (req, res) {
	var collection = db.get("menus");
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		var oldpath = files.file.path;
		var newpath = 'public/images/' + files.file.name;
		fs.rename(oldpath, newpath, function (err) {
			if (err) throw err;
		});
		collection.insert(
			{
				name: fields.name,
				image: files.file.name,
				type: fields.type,
				price: parseFloat(parseFloat(fields.price).toFixed(2)),
				description: fields.description,
				inventory: parseInt(fields.inventory),
				isDeleted: false,
			},
			function (err, menu) {
				if (err) throw err;
				res.redirect("/menus");
			}
		);
	});
});

// Details of one menu
router.get("/menus/:id", function (req, res) {
	var collection = db.get("menus");
	collection.findOne({ _id: req.params.id }, function (err, menus) {
		if (err) throw err;
		res.render("show", { menus: menus, user: req.user });
	});
});

// To register
router.get("/register", function (req, res) {
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
	} else {
		res.render("register", { user: req.user });
	}
});

// Finish register
router.post("/register", function (req, res) {
	var newAccount = new Account({ username: req.body.username });
	if (req.body.username === "admin") {
		newAccount.isAdmin = true;
	}
	Account.register(newAccount, req.body.password, function (err, account) {
		if (err) {
			console.log(err.message);
			return res.redirect("/register");
		}

		passport.authenticate("local")(req, res, function () {
			res.redirect("/menus");
		});
	});
});

// To login
router.get("/login", function (req, res) {
	res.render("login", { user: req.user });
});

// Finish login
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/menus",
		failureRedirect: "/login",
	}),
	function (req, res) { }
);

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
}

// To logout
router.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/menus");
});

// Search engine
router.get("/menus", async (req, res, next) => {
	var page = parseInt(req.query.page) || 1;
	var collection = db.get("menus");
	var result = [];
	var length = 0;

	if (req.query.search && req.xhr) {
		if (req.query.type != "all") {
			const regex = new RegExp(escapeRegex(req.query.search), "gi");
			var type = new RegExp(escapeRegex(req.query.type), "gi");
			if (req.user && req.user.isAdmin) {
				collection.find({ name: regex, type: type }, function (err, menus) {
					if (err) {
						console.log(err);
					} else {
						res.status(200).json(menus);
					}
				});
			} else {
				collection.find(
					{ name: regex, type: type, isDeleted: false },
					function (err, menus) {
						if (err) {
							console.log(err);
						} else {
							res.status(200).json(menus);
						}
					}
				);
			}
		} else if (req.query.type == "all") {
			const regex = new RegExp(escapeRegex(req.query.search), "gi");
			var type = new RegExp(escapeRegex(req.query.type), "gi");
			if (req.user && req.user.isAdmin) {
				collection.find({ name: regex }, function (err, menus) {
					if (err) {
						console.log(err);
					} else {
						res.status(200).json(menus);
					}
				});
			} else {
				collection.find({ name: regex, isDeleted: false }, function (
					err,
					menus
				) {
					if (err) {
						console.log(err);
					} else {
						res.status(200).json(menus);
					}
				});
			}
		}
	} else if (req.query.search == "" && req.query.type != "all") {
		var type = new RegExp(escapeRegex(req.query.type), "gi");
		if (req.user && req.user.isAdmin) {
			collection.find({ type: type }, function (err, menus) {
				if (err) {
					console.log(err);
				} else {
					res.status(200).json(menus);
				}
			});
		} else {
			collection.find({ type: type, isDeleted: false }, function (err, menus) {
				if (err) {
					console.log(err);
				} else {
					res.status(200).json(menus);
				}
			});
		}
	} else {
		if (req.xhr) {
			if (req.user && req.user.isAdmin) {
				collection.find({}, function (err, menus) {
					if (err) throw err;
					res.status(200).json(menus);
				});
			} else {
				collection.find({ isDeleted: false }, function (err, menus) {
					if (err) throw err;
					res.status(200).json(menus);
				});
			}
		} else {
			if (req.user && req.user.isAdmin) {
				collection.find({}, function (err, menus) {
					if (err) throw err;
					length = menus.length;
					for (var i = 6 * (page - 1); i < 6 * page; i++) {
						if (i < length) {
							result.push(menus[i]);
						}
					}
					var maxPage = Math.ceil(length / 6);
					res.render("index", {
						menus: result,
						currentPage: page,
						numOfPages: maxPage,
						numOfResults: menus.length,
						user: req.user,
					});
				});
			} else {
				collection.find({ isDeleted: false }, function (err, menus) {
					if (err) throw err;
					length = menus.length;
					for (var i = 6 * (page - 1); i < 6 * page; i++) {
						if (i < length) {
							result.push(menus[i]);
						}
					}
					var maxPage = Math.ceil(length / 6);
					res.render("index", {
						menus: result,
						currentPage: page,
						numOfPages: maxPage,
						numOfResults: menus.length,
						user: req.user,
					});
				});
			}
		}
	}
});

// To edit a menu
router.get("/menus/:id/edit", function (req, res) {
	var collection = db.get("menus");
	collection.findOne({ _id: req.params.id }, function (err, menus) {
		if (err) throw err;
		res.render("edit", { menus: menus, user: req.user });
	});
});

// Update the page
router.put("/menus/:id", function (req, res) {
	var collection = db.get("menus");
	var form = new formidable.IncomingForm();
	var url = "/menus/" + req.params.id;

	form.parse(req, function (err, fields, files) {
		var oldpath = files.file.path;
		var newpath = 'public/images/' + files.file.name;
		fs.rename(oldpath, newpath, function (err) {
			if (err) throw err;
		});
		collection.findOneAndUpdate({ _id: req.params.id }, {
			$set: {
				name: fields.name,
				image: files.file.name,
				type: fields.type,
				price: parseFloat(parseFloat(fields.price).toFixed(2)),
				description: fields.description,
				inventory: parseInt(fields.inventory),
			},
		}).then((updatedDoc) => { });
		res.redirect(url);
	});
});

// Delete the menu
router.post("/menus/:id/delete", function (req, res) {
	var collection = db.get("menus");
	var url = "/menus/" + req.params.id;
	collection
		.findOneAndUpdate(
			{ _id: req.params.id },
			{
				$set: {
					isDeleted: true,
				},
			}
		)
		.then((updatedDoc) => { });
	res.redirect(url);
});

// Recover the menu
router.post("/menus/:id/recover", function (req, res) {
	var collection = db.get("menus");
	var url = "/menus/" + req.params.id;
	collection
		.findOneAndUpdate(
			{ _id: req.params.id },
			{
				$set: {
					isDeleted: false,
				},
			}
		)
		.then((updatedDoc) => { });
	res.redirect(url);
});

/******************************************************************************************************
 * Wishlist: Yinglue's part
 * ":id" is the user's id
 */
// Add to wishlist
router.post("/:id/wishlist", function (req, res) {
	var menus_collection = db.get("menus");
	var wl_collection = db.get("wishlist");

	menus_collection.findOne({ _id: req.body.like }, function (err, menu) {
		if (err) throw err;
		var url = "/menus/" + req.body.like;

		wl_collection.findOne(
			{
				userid: req.user._id,
				menuObject: menu,
			},
			function (err, result) {
				if (err) throw err;
				if (result) {
					console.log("Duplicate in wishlist.");
					res.redirect(url);
				} else {
					wl_collection.insert(
						{
							menuObject: menu,
							menuid: menu._id,
							menuname: menu.name,
							userid: req.user._id,
							username: req.user.username,
						},
						function (err, wishlist) {
							if (err) throw err;
							res.redirect(url);
						}
					);
				}
			}
		);
	});
});

// Delete from wishlist
router.delete("/:id/wishlist", function (req, res) {
	var wl_collection = db.get("wishlist");
	var url = "/" + req.params.id + "/wishlist";
	wl_collection.remove(
		{ username: req.body.wlusername, menuname: req.body.wlmenuname },
		function (err, wl) {
			if (err) throw err;
			res.redirect(url);
		}
	);
});

// Go to wishlist
router.get("/:id/wishlist", function (req, res) {
	var wl_collection = db.get("wishlist");

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
router.get("/:id/cart", function (req, res) {
	var cart_collection = db.get("cart");

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}
		cart_collection.find({ username: foundUser.username }, function (
			err,
			items
		) {
			if (err) {
				res.redirect("/menus");
			}
			res.render("cart", { user: foundUser, items: items });
		});
	});
});

// Add to shopping cart
router.post("/:id/cart", function (req, res) {
	var menus_collection = db.get("menus");
	var cart_collection = db.get("cart");

	menus_collection.findOne({ _id: req.body.buy }, function (err, menu) {
		if (err) throw err;
		var url = "/menus/" + menu._id;

		cart_collection.findOne(
			{ userid: req.user._id, menuObject: menu },
			function (err, result) {
				if (err) throw err;
				if (result) {
					var inventory = parseInt(menu.inventory);
					var originalMenucount = parseInt(result.menucount);
					var add = parseInt(req.body.quantity);
					cart_collection
						.findOneAndUpdate(
							{ userid: req.user._id, menuObject: menu },
							{
								$set: {
									menucount: originalMenucount + add,
									isEnough: originalMenucount + add <= inventory,
								},
							}
						)
						.then((updateDoc) => { });
					res.redirect(url);
				} else {
					var inventory = parseInt(menu.inventory);
					var menucount = parseInt(req.body.quantity);
					cart_collection.insert(
						{
							menuObject: menu,
							menuid: menu._id,
							menuname: menu.name,
							menucount: menucount,
							userid: req.user._id,
							username: req.user.username,
							isEnough: menucount <= inventory,
						},
						function (err, oneCartItem) {
							if (err) throw err;
						}
					);
					res.redirect(url);
				}
			}
		);
	});
});

// Delete from the cart.
router.post("/:id/cart/remove", function (req, res) {
	var cart_collection = db.get("cart");
	var menus_collection = db.get("menus");
	var url = "/" + req.params.id + "/cart";
	var deduct = parseInt(req.body.removeQuantity);
	var query = { menuname: req.body.itemname, username: req.body.username };

	menus_collection.findOne({ name: req.body.itemname }, function (err, menu) {
		cart_collection.findOne(query, function (err, result) {
			if (err) throw err;

			var inventory = parseInt(menu.inventory);
			var originalMenucount = parseInt(result.menucount);

			if (originalMenucount > deduct) {
				cart_collection
					.findOneAndUpdate(query, {
						$set: {
							menucount: originalMenucount - deduct,
							isEnough: originalMenucount - deduct <= inventory,
						},
					})
					.then((updateDoc) => { });
				res.redirect(url);
			} else {
				cart_collection.remove(query, function (err, ans) {
					if (err) throw err;
				});
				res.redirect(url);
			}
		});
	});
});

// Delete all from shopping cart
router.post("/:id/cart/removeAll", function (req, res) {
	var cart_collection = db.get("cart");
	var url = "/" + req.params.id + "/cart";
	var query = { menuname: req.body.itemname, username: req.body.username };

	cart_collection.remove(query, function (err, ans) {
		if (err) throw err;
		res.redirect(url);
	});
});

// Add more from the cart.
router.post("/:id/cart/add", function (req, res) {
	var cart_collection = db.get("cart");
	var menus_collection = db.get("menus");
	var url = "/" + req.params.id + "/cart";
	var add = parseInt(req.body.addQuantity);
	var query = { menuname: req.body.itemname, username: req.body.username };

	menus_collection.findOne({ name: req.body.itemname }, function (err, menu) {
		cart_collection.findOne(query, function (err, result) {
			if (err) throw err;

			var inventory = parseInt(menu.inventory);
			var originalMenucount = parseInt(result.menucount);

			cart_collection
				.findOneAndUpdate(query, {
					$set: {
						menucount: originalMenucount + add,
						isEnough: originalMenucount + add <= inventory,
					},
				})
				.then((updateDoc) => { });
			res.redirect(url);
		});
	});
});
/**
 * Shopping cart: the end
 ******************************************************************************************************/

/******************************************************************************************************
 * Checkout page
 * ":id" is the user's id
 */
// Confirm page before checking out.
router.get("/:id/checkout", function (req, res) {
	var menu_collection = db.get("menus");
	var cart_collection = db.get("cart");
	var total = 0.0;
	var canCheckout = true;

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}

		cart_collection.find({ username: foundUser.username }, function (
			err,
			items
		) {
			if (err) {
				res.redirect("/menus");
			}

			for (var i = 0; i < items.length; i++) {
				total +=
					parseFloat(items[i].menucount) *
					parseFloat(items[i].menuObject.price);
				if (!items[i].isEnough) {
					canCheckout = false;
				}
			}

			res.render("checkout", {
				user: foundUser,
				items: items,
				total: total.toFixed(2),
				canCheckout: canCheckout,
			});
		});
	});
});

// Success.
router.post("/:id/success", function (req, res) {
	var cart_collection = db.get("cart");
	var order_collection = db.get("orders");
	var menus_collection = db.get("menus");

	var timeStamp = new Date().toLocaleString();
	var orderId = new Date().getTime().toFixed(0).toString();

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}

		var oneOrder = {
			menus: [],
			userid: req.params.id,
			username: foundUser.username,
			orderid: orderId,
			ordertime: timeStamp,
			totalPrice: req.body.totalPrice,
		};

		cart_collection.find({ username: foundUser.username }, function (
			err,
			items
		) {
			if (err) throw err;

			// Removing coresponding items from inventory
			for (var i = 0; i < items.length; i++) {
				menus_collection
					.findOneAndUpdate(
						{ name: items[i].menuname },
						{
							$inc: {
								inventory: -1 * items[i].menucount,
							},
						}
					)
					.then((updateDoc) => { });
			}

			// Making the order object to put in the database
			for (var i = 0; i < items.length; i++) {
				var oneMenu = {
					menuObject: items[i].menuObject,
					menuid: items[i].menuid,
					menuname: items[i].menuname,
					menucount: items[i].menucount,
				};
				oneOrder.menus.push(oneMenu);
			}

			order_collection.insert(oneOrder, function (err, records) {
				if (err) throw err;
			});
		});

		cart_collection.remove({ username: foundUser.username }, function (
			err,
			items
		) {
			if (err) {
				throw err;
			}
			res.render("success", { user: foundUser });
		});
	});
});
/**
 * Checkout page: the end
 ******************************************************************************************************/

/******************************************************************************************************
 * Profile page: Yinglue's part
 * ":id" is the user's id
 */
// Get order history.
router.get("/:id/profile", function (req, res) {
	var order_collection = db.get("orders");
	var sortedOrder = [];

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}

		if (foundUser.isAdmin) {
			order_collection.find({}, function (err, orders) {
				if (err) throw err;
				for (var i = orders.length - 1; i >= 0; i--) {
					sortedOrder.push(orders[i]);
				}
				res.render("profile", { user: foundUser, orders: sortedOrder });
			});
		} else {
			order_collection.find({ username: foundUser.username }, function (
				err,
				orders
			) {
				if (err) throw err;
				for (var i = orders.length - 1; i >= 0; i--) {
					sortedOrder.push(orders[i]);
				}
				res.render("profile", { user: foundUser, orders: sortedOrder });
			});
		}
	});
});

// Get order detail.
router.get("/:id/profile/:orderId", function (req, res) {
	var order_collection = db.get("orders");

	Account.findById(req.params.id, function (err, foundUser) {
		if (err) {
			res.redirect("/login");
		}

		order_collection.findOne({ _id: req.params.orderId }, function (
			err,
			oneOrder
		) {
			res.render("orderdetail", {
				user: foundUser,
				order: oneOrder,
				items: oneOrder.menus,
			});
		});
	});
});
/**
 * Profile page: the end
 ******************************************************************************************************/
module.exports = router;
