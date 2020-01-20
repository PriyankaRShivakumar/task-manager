const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, //This will setup the name to be a required field. required is a built in validator.
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is Invalid!");
        }
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        //without toLowerCase, Password will get passed so convert all to lowercase and later compare.
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      }
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        //This is a custom validator, value is the number set to age.
        if (value < 0) {
          throw new Error("Age must be a positive number!");
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer
    }
  },
  {
    timestamps: true //Here timestamps is the second argument to the Schema
  }
);

//Create a relation between user and Task. Here localField is user field and foreignField is task field
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner"
});

//Get the public profile
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  //delete fields in the userObject
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

//This is an instance method
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token }); //To add new token to existing array. here token: token becomes token by shorthand
  await user.save();

  return token;
};

//By doing so, the below function can be called directly by User model.
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  //If user is not present below code runs and stops execution.
  if (!user) {
    throw new Error("Unable to Login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  //Below runs if password is wrong and stops execution
  if (!isMatch) {
    throw new Error("Unable to Login");
  }

  return user;
};

//Hash the plain text password before saving
userSchema.pre("save", async function(next) {
  const user = this; //this here will get the current document, in this case current user
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//Delete User Tasks when user is removed
userSchema.pre("remove", async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
