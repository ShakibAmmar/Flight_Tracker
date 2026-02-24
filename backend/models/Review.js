const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  airline: { type: String, required: true, lowercase: true },
  user: String,
  rating: Number,
  date: String,
  review: { type: String, unique: true }, // 'unique' prevents duplicates
});

module.exports = mongoose.model('Review', reviewSchema);