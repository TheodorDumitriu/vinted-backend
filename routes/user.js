const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();

const User = require("../models/User");

// TODO create PUT route for the user
// User creation
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const findUser = await User.find({ email: req.body.email });

    // Check if user already exist in database
    if (findUser.length > 0) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists!" });
    }

    // Check if username is entered
    if (req.body.username.length === 0) {
      return res.status(400).json({ message: "No username provided!" });
    }

    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);

    // Upload avatar
    const convertedFile = convertToBase64(req.files.avatar);
    const imgUploadResult = await cloudinary.uploader.upload(convertedFile, {
      folder: "vinted/avatars",
    });

    const user = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: imgUploadResult,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await user.save();

    const clientRes = {
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
      },
    };

    res.status(201).json(clientRes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// User login
router.post("/user/login", async (req, res) => {
  try {
    const userExist = await User.findOne({ email: req.body.email });
    const confirmationHash = SHA256(
      req.body.password + userExist.salt
    ).toString(encBase64);

    // Check if user password is valid
    if (confirmationHash === userExist.hash) {
      const clientRes = {
        _id: userExist._id,
        token: userExist.token,
        account: {
          username: userExist.account.username,
        },
      };
      return res.status(200).json(clientRes);
    } else {
      return res
        .status(400)
        .json({ message: "The email or the password don't exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
