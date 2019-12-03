const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Define the Schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty.']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be linked to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must be linked to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes
/* Unique means there can be only one combination
of tour and user for a review (a user can only leave one review for each tour) */
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE
// Populate the user
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// Define the method to calculate the average rating of a tour
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId } // find the reviews where tour is matching the Id passed to the method
    },
    {
      $group: {
        _id: '$tour', // for this group (all reviews for this tour)
        nRating: { $sum: 1 }, // add 1 for each to get the number of ratings
        avgRating: { $avg: '$rating' } // calculate the average of these ratings
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5 // NOT IDEAL - SHOULD FIND A BETTER WAY WHEN THERE IS NO REVIEW
    });
  }
};

// Update the average rating of a tour when a new review is created
reviewSchema.post('save', function() {
  // this points to the current review
  this.constructor.calcAverageRatings(this.tour);
});

// Update the average rating of a tour when a review is updated or deleted
// note: findByIdAndUpdate and findByIdAndDelete use findOneAnd...
// 'pre' middleware to attach the review on the query
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});
// 'post' middleware to call the method on the constructor using the review attached to the query
reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here because the query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// Export the Model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
