var express = require("express");
var router = express.Router();
const Event = require("../models/events");
const User = require("../models/users");


router.get('/cities', (req, res) => {
    Event.find({}, "address.city")
        .then(data => {
            let allCities = []
            for (let el of data) {
                if (!allCities.includes(el.address.city)) {
                    allCities.push(el.address.city)
                }
            }
            let result = []
            for (let i = 0; i < allCities.length; i++) {
                let value = i + 1
                result.push({ city: allCities[i], value: value.toString() })
                console.log(result);
            }
            res.json({ cities: result });
        });
});


router.get('/allevents', (req, res) => {
    Event.find()
        .then(city => {
            res.json({ city });
        });
});

router.get('/id', (req, res) => {
    Event.findOne({ event_id: req.body.event_id })
        .then(data => {
            if (data) {
                res.json({ result: true, event: data })
            } else {
                res.json({ result: false, error: "Event not find" })
            }
        });
});



// route filtre event pour récupérer les événements de ce soir//
router.get('/tonight', (req, res) => {
    // date du jour
    const now = new Date();
    // date d'aujourd'hui à minuit
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log('start of the day ->', startOfToday)
    // date de fin de soirée (23h59m59s)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    console.log('end of today ->', endOfToday)
    console.log('now date ->', now.getDate())
    console.log(endOfToday)


    Event.find({
        // dates startOfToday et endOfToday pour déterminer la plage de temps à rechercher
        'timeDetails.date':
        {
            $gte: startOfToday,
            $lte: endOfToday
        },

        'timeDetails.timeStart': {
            $gte: now,
            $lte: endOfToday
        }

    })
        .then(eventdata => {
            console.log(eventdata)
            if (eventdata) {
                res.json({ result: true, tonight: eventdata })
            } else {
                res.json({ result: false, error: "Event not find" })
            }
        })
});



// Road for the event of the week 
router.get('/week', (req, res) => {
    // date du jour
    const now = new Date();
    console.log(now)
    // variable which get the date of the begginning of the week à partir de Lundi
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 2);
    console.log(startOfWeek)
    // Get the date of the end of the week
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    console.log(endOfWeek)
    // $gte sélectionner tous les événements ayant lieu à partir du début de la semaine ; 
    //$lte pour sélectionner tous les événements ayant lieu jusqu'à la fin de la semaine
    Event.find({
        'timeDetails.date':
        {
            $gte: startOfWeek,
            $lte: endOfWeek
        }
    })
        .then(weekdata => {
            console.log(weekdata)
            if (weekdata) {
                res.json({ result: true, week: weekdata })
            } else {
                res.json({ result: false, error: "Event not find" })
            }
        })
})


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
        if (data.acknowledged) {
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
    )
    .then((data) => {
        if (data.modifiedCount > 0) {
            res.json({ result: true });
        } else {
            res.json({ result: false });
        }
    });
});

router.get('/:clientId', function (req, res) {
      const { clientId } = req.params;
      Event.findOne({ _id: clientId })
        .then(data => {
            if (data) {
                res.json({result: true, event: data})
            } else {
                res.json({result: false, error: "Event not found"})
            }
        })
  });


module.exports = router;
