const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Define the Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email address seems to be invalid']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A confirmation of the password is required'],
    validate: {
      // This validator only works on CREATE and SAVE
      validator: function(el) {
        return el === this.password;
      },
      message: 'The two passwords do not match'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// DOCUMENT MIDDLEWARE
// Encrypt the password
userSchema.pre('save', async function(next) {
  // this function only runs if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12 (higher cost: more secure but takes longer)
  /* never store a password in 'clear' in a DB */
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  /* This field is not encrypted and we only need it to run the validator */
  this.passwordConfirm = undefined;
  next();
});

// Record when a password is updated
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  /* the '-1000 ms' is a trick to avoid bugs 
  where the new token is issued before the update is recorded */
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// QUERY MIDDLEWARE
// Hide users that are not active (profile deleted) but not deleted from the DB
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// SCHEMA METHODS
// Compare input password with encrypted password stored
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if the password has been modified since the token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      // JWTTimestamp expressed in s while passwordChangedAt in ms
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

// Create a token to be used to reset the password
/* It needs to be encrypted because it actually acts as a password */

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // set to expire in 10 min
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Export the Model
const User = mongoose.model('User', userSchema);

module.exports = User;
