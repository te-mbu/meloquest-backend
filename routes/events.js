var express = require("express");
var router = express.Router();
const Event = require("../models/events");
const moment = require("moment");

const cloudinary = require("cloudinary").v2;
const uniqid = require("uniqid");
const fs = require("fs");

// Get all events
// GET /events/allevents
router.get("/allevents", (req, res) => {
  Event.find().then((city) => {
    res.json({ city });
  });
});

// Récupérer les événements de ce soir
// GET /events/tonight
router.get("/tonight", (req, res) => {
  // date du jour
  const now = moment();
  // date de fin de soirée (23h59m59s)
  const endOfToday = moment().endOf("day").toDate();

  Event.find({
    // dates now et endOfToday pour déterminer la plage de temps à rechercher
    "timeDetails.timeStart": {
      $gte: now.toDate(),
      $lte: endOfToday,
    },
    "timeDetails.timeEnd": {
      $lte: endOfToday,
      $gte: now.toDate(),
    },
  }).then((eventdata) => {
    console.log(eventdata);
    if (eventdata) {
      res.json({ result: true, tonight: eventdata });
    } else {
      res.json({ result: false, error: "Event not find" });
    }
  });
});

// Road for the event of the week
// GET /events/week
router.get("/week", (req, res) => {
  // date du jour
  const now = moment();
  // commence le week à 00h début de journée (pb de fuseau)
  const startOfWeek = moment().startOf("isoweek").subtract(22, "hour").toDate();
  // finis le week à 00h fin de journée
  const endOfWeek = moment(startOfWeek).add(7, "day").toDate(); // plus 1j pour commencer le lendemain matin

  Event.find({
    "timeDetails.timeStart": {
      $gte: now.toDate(), // supérieur ou égale
      $lte: endOfWeek, // inférieur ou égale méthode DB
    },
    "timeDetails.timeEnd": {
      $gte: now.toDate(),
      $lte: endOfWeek,
    },
  }).then((weekdata) => {
    console.log(weekdata);
    if (weekdata) {
      res.json({ result: true, week: weekdata });
    } else {
      res.json({ result: false, error: "Event not find" });
    }
  });
});

// Add organiser token to eventLiked
// POST /events/liked
router.post("/liked", function (req, res, next) {
  Event.updateOne(
    { event_id: req.body.event_id },
    { $push: { eventLiked: req.body.token } }
  ).then((data) => {
    if (data.modifiedCount > 0) {
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  });
});

// Add organiser token to organiser
// POST /events/organiser
router.post("/organiser", function (req, res, next) {
  Event.updateOne(
    { event_id: req.body.event_id },
    { $push: { organiser: req.body.token } }
  ).then((data) => {
    if (data.modifiedCount > 0) {
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  });
});

// Retrieve organiser token from eventLiked
// POST /events/unliked
router.post("/unliked", function (req, res, next) {
  Event.updateOne(
    { event_id: req.body.event_id },
    { $pull: { eventLiked: req.body.token } }
  ).then((data) => {
    console.log(data);
    if (data.modifiedCount > 0 && data.acknowledged) {
      res.json({ result: true });
    } else if (data.modifiedCount === 0 && data.acknowledged) {
      res.json({ result: false, error: "User not found in eventLiked" });
    } else {
      res.json({ result: false });
    }
  });
});

// Add organiser token to eventPurchased
// POST /events/purchased
router.post("/purchased", function (req, res, next) {
  Event.updateOne(
    { event_id: req.body.event_id },
    { $addToSet: { eventPurchased: req.body.token } }
  ).then((data) => {
    if (data.modifiedCount > 0) {
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  });
});

// Get events infos by event_id
// GET /events/:event_id
router.get("/:event_id", function (req, res) {
  Event.findOne({ event_id: req.params.event_id }).then((data) => {
    if (data) {
      res.json({ result: true, event: data });
    } else {
      res.json({ result: false, error: "Event not found" });
    }
  });
});

// Get all events liked by a specific user
// GET /events/liked/:token
router.get("/liked/:token", function (req, res) {
  Event.find({
    $or: [{ eventLiked: { $in: [req.params.token] } }],
  }).then((data) => {
    if (data) {
      res.json({ result: true, data: data });
    } else {
      res.json({ result: false });
    }
  });
});

// Get all events purchased by a specific user
// GET /events/purchased/:token
router.get("/purchased/:token", function (req, res) {
  Event.find({
    $or: [{ eventPurchased: { $in: [req.params.token] } }],
  }).then((data) => {
    if (data) {
      res.json({ result: true, data: data });
    } else {
      res.json({ result: false });
    }
  });
});

// Get organiser informations
router.get("/organiser/:token", function (req, res) {
  Event.find({
    // Find all events with specific token in organiser array
    $or: [{ organiser: { $in: [req.params.token] } }],
  }).then((data) => {
    if (data) {
      let likes = [];
      let purchases = [];
      for (let event of data) {
        // Get nb of likes (length of eventLiked array)
        likes.push(event.eventLiked.length);
        // Get nb of purchases (length of eventPurchased array)
        purchases.push(event.eventPurchased.length);
      }
      res.json({
        result: true,
        data: data,
        likes: likes,
        purchases: purchases,
      });
    } else {
      res.json({ result: false });
    }
  });
});

// Search for a specific event by name/venue/city
// POST /events/search
router.post("/search", function (req, res) {
  const msg = req.body.searchMsg;
  const keywords = msg.split(" ");

  Event.find({
    $and: keywords.map((keyword) => ({
      $or: [
        { name: { $regex: keyword.replace(/[eé]/gi, "[eé]"), $options: "i" } },
        {
          "address.venue": {
            $regex: keyword.replace(/[eé]/gi, "[eé]"),
            $options: "i",
          },
        },
        {
          "address.city": {
            $regex: keyword.replace(/[eé]/gi, "[eé]"),
            $options: "i",
          },
        },
      ],
    })),
  }).then((data) => {
    if (data) {
      res.json({ result: true, data: data });
    } else {
      res.json({ result: false });
    }
  });
});

// Upload a photo to cloudinary
// POST /events/upload
router.post("/upload", async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);

  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
  fs.unlinkSync(photoPath);
});

module.exports = router;
