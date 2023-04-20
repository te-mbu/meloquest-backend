var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Event = require("../models/events");

const cloudinary = require('cloudinary').v2;
const uniqid = require('uniqid');
const fs = require('fs');

const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

/* POST /users/signup */
router.post("/signup", (req, res) => {
  // Check if all req.body fields are correctly filled
  if (!checkBody(req.body, ["email", "username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email, username: req.body.username }).then(
    (data) => {
      // If the user has not already been registered
      if (data === null) {
        const hash = bcrypt.hashSync(req.body.password, 10);

        const newUser = new User({
          email: req.body.email,
          username: req.body.username,
          password: hash,
          profileType: req.body.profileType,
          token: uid2(32),
        });

        newUser.save().then((data) => {
          res.json({ result: true, token: data.token });
        });
      } else {
        // User already exists in database
        res.json({ result: false, error: "User already exists" });
      }
    }
  );
});

/* POST /users/signin */
router.post("/signin", (req, res) => {


  // Check if all req.body fields are correctly filled
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, profileType: data.profileType });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

/* POST /users/events */
router.post('/eventcreation', (req, res) => {
  if (!checkBody(req.body, ['name', 'timeStart', 'timeEnd', 'street', 'city', 'venue', 'description', 'genre', 'price'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  //mettre les dates au format date avec new Date()
  const newEvent = new Event({
    name: req.body.name,
    timeDetails: {
      timeStart: req.body.timeStart,
      timeEnd: req.body.timeEnd
    },
    address: {
      street: req.body.street,
      city: req.body.city,
      venue: req.body.venue,
    },
    description: req.body.description,
    genre: req.body.genre,
    price: req.body.price,
    event_id: uid2(32),
    url: req.body.url
  });

  newEvent.save()
    .then((data) => {
      res.json({ result: true, event_id: data.event_id });
    });
});

router.delete("/:token", (req, res) => {
  User.deleteOne({ token: req.params.token })
    // if (deletedDoc.deletedCount > 0) ne fonctionne qu'avec deleteMany
    .then(deletedDoc => {
      if (deletedDoc) {
        // document successfully deleted
        User.find().then(user => {
          res.json({ result: true, user }); // le user:user va servir pour le front.
        });
      } else {
        res.json({ result: false, error: "Utilisateur non trouvé" });
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
