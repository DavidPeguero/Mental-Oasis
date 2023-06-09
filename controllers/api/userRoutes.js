const router = require("express").Router();

const { User, Day, Log, Score, Medicine, Wellbeing } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const userData = await User.findAll({include:[Log]});

    if (!userData) {
      res.status(404).json({ error: 404, message: "Cannot find any Users" });
      return;
    }

    res.status(200).json(userData);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/days/:id", async (req, res) => {
  try {
    const userData = await User.findByPk(req.params.id, {
      include: [{ model: Day, include: [Score], }],
      order : [[Day, 'date_created', 'desc']],
    });

    if (!userData) {
      res.status(404).json({ error: 404, message: "Cannot find any Users" });
      return;
    }

    res.status(200).json(userData);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/", async (req, res) => {
  try {
    const userData = await User.create(req.body);

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
    });
    res.status(200).json(userData);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const userData = await User.findOne({ where: { email: req.body.email } });
    console.log(userData);
    if (!userData) {
      res
        .status(400)
        .json({ message: "Incorrect username or password, please try again" });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
      res.json({
        user: userData,
        message: "You are now logged in!",
        user_id: req.session.user_id,
      });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/logout", (req, res) => {
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

//signup to create account
router.post("/signup", async (req, res) => {
  try {
    const userData = await User.create(req.body);
    
    if(!userData){
      res.status(404).json(userData)
      return;
    }

    //Create first day for the user on sign up
    const dayData = await Day.create({
      checklist_complete : false,
      user_id : userData.id,
    })
    //If fails to do so destroy user and end the process
    if(!dayData){
      res.status(404).json(userData)
      await User.destroy({
        where : {
          id : userData.id
        }
      })
      res.status(400).json(dayData)
      return;
    }

    //Create first medicine for the user on sign up
    const medicineData = await Medicine.create({
      medicine_input : [],
      user_id : userData.id,
    })
    //If fails to do so destroy user and end the process
    if(!medicineData){
      res.status(404).json(userData)
      await User.destroy({
        where : {
          id : userData.id
        }
      })
      res.status(400).json(medicineData)
      return;
    }

    //Create first wellbeing for the user on sign up
    const wellbeingData = await Wellbeing.create({
      wellbeing_input : [],
      user_id : userData.id,
    })
    //If fails to do so destroy user and end the process
    if(!wellbeingData){
      res.status(404).json(userData)
      await User.destroy({
        where : {
          id : userData.id
        }
      })
      res.status(400).json(wellbeingData)
      return;
    }

    console.log(dayData)
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
      res.status(200).json({
        user: userData,
        message: "You are now logged in!",
        user_id: req.session.user_id,
        day: dayData,
        medicine : medicineData,
        wellbeing : wellbeingData
      });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
