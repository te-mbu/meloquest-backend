var express = require("express");
var router = express.Router();
const Event = require("../models/events");
const User = require("../models/users");
const moment = require("moment");

const cloudinary = require('cloudinary').v2;
const uniqid = require('uniqid');
const fs = require('fs');

router.get("/cities", (req, res) => {
  Event.find({}, "address.city").then((data) => {
    let allCities = [];
    for (let el of data) {
      if (!allCities.includes(el.address.city)) {
        allCities.push(el.address.city);
      }
    }
    let result = [];
    for (let i = 0; i < allCities.length; i++) {
      let value = i + 1;
      result.push({ city: allCities[i], value: value.toString() });
      console.log(result);
    }
    res.json({ cities: result });
  });
});

router.get("/allevents", (req, res) => {
  Event.find().then((city) => {
    res.json({ city });
  });
});

router.get("/id", (req, res) => {
  Event.findOne({ event_id: req.body.event_id }).then((data) => {
    if (data) {
      res.json({ result: true, event: data });
    } else {
      res.json({ result: false, error: "Event not find" });
    }
  });
});

// route filtre event pour récupérer les événements de ce soir//
router.get("/tonight", (req, res) => {
  // date du jour
  // const now = new Date();
  const now = moment();
  console.log(now);
  // date d'aujourd'hui à minuit
  // const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 01, 59, 59, 999);
  // const startOfToday = moment().startOf('isoday').add(2,'hour' ).toDate();
  const startOfToday = moment().startOf("day").toDate();
  console.log("start of the day ->", startOfToday.toString());
  // date de fin de soirée (23h59m59s)
  // const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 25, 59, 59, 999);
  const endOfToday = moment().endOf("day").toDate();
  console.log("end of today ->", endOfToday.toString());
  // console.log('now date ->', now.getDate())

  Event.find({
    // dates startOfToday et endOfToday pour déterminer la plage de temps à rechercher
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
router.get("/week", (req, res) => {
  // date du jour
  const now = moment();
  console.log(now);

  // commence le week à 00h début de journée (pb de fuseau)
  const startOfWeek = moment().startOf("isoweek").subtract(22, "hour").toDate();
  console.log(startOfWeek.toString());

  // finis le week à 00h fin de journée
  const endOfWeek = moment(startOfWeek).add(7, "day").toDate(); // plus 1j pour commencer le lendemain matin
  console.log(endOfWeek.toString());

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

router.get("/allevents", (req, res) => {
  Event.find().then((city) => {
    res.json({ city });
  });
});

router.get("/id", (req, res) => {
  Event.findOne({ event_id: req.body.event_id }).then((data) => {
    if (data) {
      res.json({ result: true, event: data });
    } else {
      res.json({ result: false, error: "Event non trouvé" });
    }
  });
});

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

router.get("/:event_id", function (req, res) {
  Event.findOne({ event_id: req.params.event_id }).then((data) => {
    if (data) {
      res.json({ result: true, event: data });
    } else {
      res.json({ result: false, error: "Event not found" });
    }
  });
});

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

router.get("/organiser/:token", function (req, res) {
  Event.find({
    $or: [{ organiser: { $in: [req.params.token] } }],
  }).then((data) => {
    if (data) {
      let likes = []
      let purchases = []
      for (let event of data) {
        likes.push(event.eventLiked.length)
        purchases.push(event.eventPurchased.length)
      }
      res.json({ result: true, data: data, likes: likes, purchases: purchases });
    } else {
      res.json({ result: false });
    }
  });
});


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


router.post('/upload', async (req, res) => {
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
