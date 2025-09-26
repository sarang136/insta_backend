const express = require('express');
const authRouter = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt')
const dotenv = require('dotenv');
const upload = require('../utils/cloudinary');
dotenv.config();

// // import multer from "multer";
// // import { v2 as cloudinary } from "cloudinary";
// // import streamifier from "streamifier";
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');


authRouter.post('/signup', upload.single('profileImage'), async (req, res) => {
  try {
    const { 
      firstName, lastName, emailId, age, password, skills, about, 
      gender, liveIn, hometown, education, languagesKnown, workingIn 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !emailId || !password || !gender || !hometown || !liveIn || !age || !education || !languagesKnown || !workingIn) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImage = null;
    if (req.file) {
      profileImage = req.file.path;       
      console.log("Cloudinary upload:", req.file);
    }

    // Create and save new user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      gender,
      liveIn,
      hometown,
      profileImage: profileImage,
      age,
      skills,
      about,
      languagesKnown,
      workingIn,
      education,
    });

    await user.save();
    res.status(200).json({ message: "User saved successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


authRouter.post('/login', async (req, res) => {
    const { emailId, password } = req.body;
    try {
        if (!emailId || !password) {
            return res.send("Enter all credentials")
        }
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(401).send("Email does not exist");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // console.log(isPasswordValid);

        if (isPasswordValid) {

            // Create JWT Token

            // const token = user.jwtToken();
            const token = jwt.sign({ _id: user._id }, "NPMNODEV", { expiresIn: '1d' }) // this cookie will be expires in 1 hour, for 1 day '1d'....and the user will need to login again
            console.log(token);

            // Add token to cookie
            res.cookie("token", token, { httpOnly: true, sameSite : 'None', secure: true /* This will run only on http not on https */, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });   ///Can also expire the cookies, 1 day from now. res.cookies will not accept the values like expires : '1d'.
            // to make cookies valid on https we use secure : true
            res.status(200).json({data : user, token: token})
        } else {
            return res.status(401).send("Invalid Password")
        }

    } catch (error) {
        res.send("Error Occured" + error.message);
    }
})
 
authRouter.post('/logout', async (req, res) => {
    try {
        res.cookie('token', null, { expires: new Date(Date.now()) });
        res.status(200).send('logout Successfull')
    } catch (error) {
        res.status(500).send("Error Occured" + error.message);
    }
})




module.exports = authRouter;