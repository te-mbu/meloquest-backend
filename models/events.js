const mongoose = require("mongoose");

const timeDetailsSchema = mongoose.Schema({
    timeStart: Date,
    timeEnd: Date,
   });

const addressSchema = mongoose.Schema({
    venue: String,
    street: String,
    city: String,
   });

const eventSchema = mongoose.Schema({
  
  name: String,
  timeDetails: timeDetailsSchema,
  address: addressSchema,
  description: String,
  genre: Array,
  price: Number,
  event_id: String,
  url: String,
  isDone: Boolean,
  profilePicture: String,
  eventLiked: [{ type: mongoose.Schema.Types.String, ref: 'users'}],
  eventPurchased: [{ type: mongoose.Schema.Types.String, ref: 'users' }],
  organiser: [{ type: mongoose.Schema.Types.String, ref: 'users' }],
});

const Event = mongoose.model("events", eventSchema);

module.exports = Event;
