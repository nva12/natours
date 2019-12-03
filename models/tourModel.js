const mongoose = require('mongoose');
const slugify = require('slugify');

// Define the Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // removes whitespace at beginning and end
      maxlength: [
        40,
        'A tour name must be less than or equal to 40 characters'
      ],
      minlength: [4, 'A tour name must be at least 4 characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4, // arbitrary and not ideal SHOULD BE MODIFIED
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // round to 1 digit after the decimal
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation, does not work on update
          return val < this.price;
        },
        message: 'Discount price should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String], // defines type as array of String
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // not passed onto the query response
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes
/* combined index => no need for the indivudual indexes
1: ascending, -1: descending */
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// index necessary for geospatial queries
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property: not stored in the DB
// cannot use arrow functions for virtuals because we need the correct value of 'this'
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtually populate the reviews
tourSchema.virtual('reviews', {
  ref: 'Review', // model to be populated
  foreignField: 'tour', // how is the tour referred to in the review model
  localField: '_id' // how is the tour referred to in the tour model
});

// DOCUMENT MIDDLEWARE
/* runs before .save() and .create() */

// Slugify the name of the tour
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// Remove 'secret tours' from the query results
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// Populate the tour guides in the query results
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// Export the Model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
