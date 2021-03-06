var productModel = require('../models/productModel');
var orderModel = require('../models/orderModel');
var redis = require('redis').createClient();
var constants = require('../config/constants');
var stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);
var amqp = require('amqplib/callback_api');

module.exports = {

  getOrderStatus: function(req, res, next){
    var orderId = req.params.orderId;
    orderModel.getOrderStatus(orderId, function(status){
      res.status(200).json(status);
    });
  },

  charge: function(req, res, next){
    var stripeToken = req.body.stripeToken;
    var amount = req.body.amount;

    stripe.charges.create({
      card: stripeToken,
      currency: 'usd',
      amount: amount
    },
    function(err, charge) {
      if (err) {
        console.log(err);
        res.sendStatus(500, err);
      } else {
        //TODO: update Order table status as paid
        res.sendStatus(202);
      }
    });
  },

  checkout: function(req, res, next){
    var request = req.body;
    productModel.checkout(request, function(err, order){
      if (err){
        console.log('error from checkout', err);
        res.sendStatus(400);
      } else {
        amqp.connect('amqp://localhost', function(err, conn) {
          conn.createChannel(function(err, ch) {
            var q = 'q_in';
            var msg = JSON.stringify({ x: request.x, y: request.y, id: order.id, storeId: request.storeId });
            ch.assertQueue(q, {durable: true});
            ch.sendToQueue(q, new Buffer(msg), {persistent: true});
            console.log(" [x] Sent '%s'", msg);
            res.status(201).json(order);
          });
        });
      }
    });
  }
};
