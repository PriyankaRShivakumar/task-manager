const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const {
  sendWelcomeEmail,
  sendCancellationEmail
} = require("../emails/account");
const router = new express.Router();

// Creating a post request with for the route /users. Here we are trying to create a user.
//This is for signup
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  //Instead of then and catch we can use try catch with await.
  try {
    await user.save(); //If this throws an error, catch is called
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//For a User login Scenario
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

//For a User Logout scenario
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//For LogoutAll
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// To fetch users we use app.get with /users route
// router.get("/users", auth, async (req, res) => {
//   //To fetch data from mongodb through mongoose, we have set of methods like find and findOne which is used directly on the Model.
//   //{} means empty object. passing this to find will fetch all the data from db. find() also returns a promise.

//   try {
//     const users = await User.find({});
//     res.send(users);
//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

//to fetch single user
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

//For Dynamic fetch. This is no longer needed as user should not have access to other users id and to fetch his own, we have /users/me

// router.get("/users/:id", async (req, res) => {
//   const _id = req.params.id;

//   try {
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).send();
//     }
//     res.send(user);
//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

//For Updating Users

router.patch("/users/me", auth, async (req, res) => {
  //The following code will return 404, if we try to update any fields that are not present in the Model.
  const updates = Object.keys(req.body); //Object.keys will return an array of values.
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Updates!" });
  }
  try {
    updates.forEach(update => (req.user[update] = req.body[update])); //Here we use bracket notation, as we don't know which field of user is updated.

    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Deleting a User. User should be able to only delete his profile. so instead of /users/:id we use /users/me here
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancellationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    //req.user.avatar = req.file.buffer; //Here uploaded file we get here
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id); // Here id is user id
    //If the User is not present or if the avatar is not present
    if (!user || !user.avatar) {
      throw new Error();
    }
    //Set the content type
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
