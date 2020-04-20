/* Executed on the server side. */
var express = require('express');
var router = express.Router();
var passport = require('passport');
// var Account = require('../models/account');
// var Order = require('../models/order');
// var Car = require('../models/car');
// var Wishlist = require('../models/wishlist');

var monk = require('monk');
// var db = monk('localhost:27017/rental');

module.exports = router;