mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 300,
  },
  stars: {
    type: Number,
    required: false,
    min: 1,
    max: 5,
  },
  upvotes: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
  },
})

const Review = mongoose.model("Review", reviewSchema)

module.exports = Review
