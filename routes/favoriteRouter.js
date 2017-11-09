const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');
const authenticate = require('../authenticate');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

var verifyDishIdArray = async function (req, res, next) {
    if (req.body.length > 0) {
        for (var i=0; i<req.body.length; i++) {
            var err = new Error('Dish ' + req.body[i]._id +
                ' is not a valid dish.');
            await new Promise((resolve, reject) => {
                if (mongoose.Types.ObjectId.isValid(req.body[i]._id)) {
                    Dishes.findById(req.body[i]._id)
                        .then((dish) => {
                            if (dish != null) {
                                resolve();
                            } else {
                                err.status = 403;
                                return next(err);
                            }
                        }, (err) => next(err))
                } else {
                    err.status = 403;
                    return next(err);                    
                }
            }).catch((err) => next(err));
        }
        next();
    } else {
       var err = new Error('Empty request body.');
       err.status = 403;
       return next(err);
    }
}

var verifyDishId = function (req, res, next) {
    var err = new Error('Dish ' + req.params.dishId +
        ' is not a valid dish.');
    if (!mongoose.Types.ObjectId.isValid(req.params.dishId)) {
        err.status = 403;
        return next(err);
    }
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            // The dish is not a valid dish.
            if (dish == null) {
                err.status = 403;
                return next(err);
            } else {
                next();
            }
        }, (err) => next(err))
}

favoriteRouter.route('/')
.get(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
        .populate('user')
        .populate('dishes') 
        .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }, (err) => next(err))
        .catch((err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.post(authenticate.verifyUser, verifyDishIdArray, (req, res, next) => { 
    Favorites.findOneAndUpdate({ user: req.user._id }, {
        $set: { user: req.user._id },
        $addToSet: { dishes: {$each: req.body} }
    }, { upsert: true, new: true })
        .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }, (err) => next(err))
        .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user._id })
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
        .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.get(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.post(authenticate.verifyUser, verifyDishId, (req, res, next) => {
    Favorites.findOneAndUpdate({ user: req.user._id }, {
        $set: { user: req.user._id },
        $addToSet: { dishes: req.params.dishId } 
    }, { upsert: true, new: true })
        .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);     
        }, (err) => next(err))
        .catch((err) => next(err));
})
.delete(authenticate.verifyUser, verifyDishId, (req, res, next) => {
    Favorites.findOneAndUpdate({ user: req.user._id },
        { $pull: { dishes: req.params.dishId} },
        { new: true })
        .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }, (err) => next(err))
        .catch((err) => next(err));
});

module.exports = favoriteRouter;
