const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');
const authenticate = require('../authenticate');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

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
.post(authenticate.verifyUser, async (req, res, next) => { 
    var count = req.body.length;
    const userId = req.user._id; 
    for (var i=0; i < req.body.length; i++) {
        var dishId = req.body[i]._id;
        await new Promise((resolve, reject) => {
            Favorites.findOne({ user: userId })
                .then((favorite) => {
                    Dishes.findById(dishId)
                        .then((dish) => {
                            // The dish is not a valid dish.
                            if (dish == null) {
                                res.statusCode = 403;
                                res.end('Dish ' + dishId +
                                    ' is not a valid dish.'
                                );
                                return;
                            } else {
                                // The dish is a valid dish.
                                // The user has a list of favorites.
                                if (favorite != null) {
                                    // The dish does not exist in the list of favorites.
                                    if (favorite.dishes.indexOf(dishId) === -1) {
                                        favorite.dishes.push(dishId);
                                        favorite.save((err, favorite) => {
                                            if (err) {
                                                console.log('err');
                                                next(err);
                                                reject();
                                            } else {
                                                if (i === req.body.length - 1) {
                                                    res.statusCode = 200;
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.json(favorite); 
                                                }
                                                resolve();
                                            }
                                        })
                                    } else {
                                        // The dish exists in the list of favorites.
                                        res.statusCode = 403;
                                        res.end('Dish ' + dishId +
                                            ' already exists in the list of favorites.'
                                        );
                                        return;
                                    }
                                } else {
                                    // The user does not have a list of favorites.
                                    var newFavorite = new Favorites();
                                    newFavorite.user = userId;
                                    newFavorite.dishes.push(dishId);
                                    newFavorite.save((err, favorite) => {
                                        if (err) {
                                            next(err);
                                            reject();
                                        } else {
                                            if (i === req.body.length - 1) {
                                                res.statusCode = 200;
                                                res.setHeader('Content-Type', 'application/json');
                                                res.json(favorite); 
                                            } 
                                            resolve();
                                        }
                                    })
                                }
                            }
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }, (err) => next(err))
                .catch((err) => next(err));
        }, (err) => next(err))
        .catch((err) => next(err));
    };
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
        .then((favorite) => {
            if (favorite != null) {
                favorite.remove()
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            } else {
                res.statusCode = 403;
                res.end('The list of favorites does not exist.');
            }
            
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
.post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
        .then((favorite) => {
            Dishes.findById(req.params.dishId)
                .then((dish) => {
                    // The dish is not a valid dish.
                    if (dish == null) {
                        res.statusCode = 403;
                        res.end('Dish ' + req.params.dishId +
                            ' is not a valid dish.'
                        );
                    } else {
                        // The dish is a valid dish.
                        // The user has a list of favorites.
                        if (favorite != null) {
                            // The dish does not exist in the list of favorites.
                            if (favorite.dishes.indexOf(req.params.dishId) === -1) {
                                favorite.dishes.push(req.params.dishId);
                                favorite.save((err, favorite) => {
                                    if (err) {
                                        next(err);
                                    } else {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite);
                                    }
                                })
                            } else {
                                // The dish exists in the list of favorites.
                                res.statusCode = 403;
                                res.end('Dish ' + req.params.dishId +
                                    ' already exists in the list of favorites.'
                                );
                            }
                        } else {
                            // The user does not have a list of favorites.
                            var newFavorite = new Favorites();
                            newFavorite.user = req.user._id;
                            newFavorite.dishes.push(req.params.dishId);  
                            newFavorite.save((err, favorite) => {
                                if (err) {
                                    next(err);
                                } else {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                }
                            })
                        }
                    }
                }, (err) => next(err))
                .catch((err) => next(err));
        }, (err) => next(err))
        .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
        .then((favorite) => {
            var index = favorite.dishes.indexOf(req.params.dishId);
            // If the dish does not exist in the list of favorites.
            if (index === -1) {
                res.statusCode = 403;
                res.end('Dish ' + req.params.dishId +
                    ' does not exist in the list of favorites.'
                );
            } else {
                // If the dish exists in the list of favorites, then delete the dish.
                favorite.dishes.remove(req.params.dishId);
                favorite.save()
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, (err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

module.exports = favoriteRouter;