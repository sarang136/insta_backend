const express = require('express');
const authRouter = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
dotenv.config();

// // import multer from "multer";
// // import { v2 as cloudinary } from "cloudinary";
// // import streamifier from "streamifier";
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');




authRouter.post('/signup', async (req, res) => {
    // Validate the data 
    const { firstName, lastName, emailId, profileUrl, age, password, skills, about, gender, liveIn, hometown, education, languagesKnown, workingIn } = req.body;
    try {
        if (!firstName || !lastName || !emailId || !password || !gender || !hometown || !liveIn || !age ||  !education || !languagesKnown || !workingIn) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }
        // Encrypt the password, there is a package to encrypt the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        // bcrypt.hash is a function which takes password from body and a salt which is the complexity for the password, idealy 10.
        console.log(hashedPassword);

        console.log(req.body) 
        const user = User({
            firstName, //
            lastName,//
            emailId, //
            password: hashedPassword, //
            gender,//
            liveIn,
            hometown,
            profileUrl,
            age, //
            skills, //
            about,
            languagesKnown,
            workingIn,
            education,


        })  // -- saving the new user, creating a new instance of the User, and passing the body, whatever the user puts the inputs. 
        await user.save();   //-- saving that new user
        res.status(200).send("User Saved Successfully")    // -- sending the response.
    } catch (err) {
        res.status(500).send(err.message)
    }
})


// Cloudinary config
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// // Multer setup (memory storage, not saving to disk)
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Signup API with file upload
// authRouter.post("/signup", upload.single("profilePic"), async (req, res) => {
//   try {
//     const { firstName, lastName, emailId, age, password, gender, liveIn, hometown, education, languagesKnown, workingIn, about, skills } = req.body;

//     if (!firstName || !lastName || !emailId || !password || !gender || !hometown || !liveIn || !age || !education || !languagesKnown || !workingIn) {
//       return res.status(400).json({ message: "Please fill in all fields" });
//     }

//     // Upload image to Cloudinary
//     let profileUrl = null;
//     if (req.file) {
//       const result = await new Promise((resolve, reject) => {
//         let cld_upload_stream = cloudinary.uploader.upload_stream(
//           { folder: "profile_pics" },
//           (error, result) => {
//             if (result) resolve(result);
//             else reject(error);
//           }
//         );
//         streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
//       });

//       profileUrl = result.secure_url; // Cloudinary hosted URL
//     }

//     // Encrypt password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Save user
//     const user = new User({
//       firstName,
//       lastName,
//       emailId,
//       password: hashedPassword,
//       gender,
//       liveIn,
//       hometown,
//       profileUrl, // <-- saved from Cloudinary
//       age,
//       skills,
//       about,
//       languagesKnown,
//       workingIn,
//       education,
//     });

//     await user.save();
//     res.status(200).json({ message: "User Saved Successfully", user });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });


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
            res.cookie("token", token, { httpOnly: true, sameSite : 'none', secure: true /* This will run only on http not on https */, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });   ///Can also expire the cookies, 1 day from now. res.cookies will not accept the values like expires : '1d'.
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