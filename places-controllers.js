
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaces = async(req, res, next) => {
  let places
  try {
   places = await Place.find()
  } catch (err) {
    const error = new HttpError('Cant get place', 404);
    next(error)
  }
  res.json({
      place: places.map(p => p.toObject({getters: true}))
  })
}


const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'Fetching places failed, please try again later',
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
}

const getPlaceById =  async(req, res, next) => {
  const placeID = req.params.pid;
  let place
  try {
      place = await Place.findById(placeID).exec()
      
  } catch (err) {
      const error  = new HttpError('Could not find place because of database problems', 500)
      return next(error);
  }
  if (!place) {
      const error =  new HttpError('Could not find place for the provided id', 404);
      return next(error);
  }
  res.json({place: place.toObject({getters: true})})
}


const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, image, coordinates, address, creator } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failedd, please try again",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace.toObject({getters: true}) });
}

const updatePlace = async(req, res, next) => {
  const {title, description} = req.body;
  const error = validationResult(req);
  if (!error.isEmpty()) {
      // console.log(error);
      return next(new HttpError ("Pls enter valid infomation", 404))
  }
  const placeId = req.params.pid;
  let place 
  try {
      place = await Place.findById(placeId);
  } catch (err) {
      const error = new HttpError("Something went wrong could with database", 500)
      return next(error);
  }
  
  place.title = title;
  place.description = description;
  try {
      await place.save()
  } catch (err) {
      const error = new HttpError("Failed to store new data to the database", 500)
      return next(error);
  }
  res.status(200).json({place: place.toObject( {getters: true} )});
}

const deletePlace = async(req, res , next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
}

exports.getPlaces = getPlaces
exports.getPlaceById = getPlaceById;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
