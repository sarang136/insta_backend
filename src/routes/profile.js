const express = require('express');
const { userAuth } = require('../middlewares/auth');
const profileRouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');


profileRouter.get('/getmy-profile', userAuth, async (req, res) => {
    try {
        const user = req.user
        if (!user) {
            return res.status(404).send("User Not Found")
        }
        res.status(200).send(user);
    }
    catch (error) {
        res.status(500).send("Error Occured" + error.message);  
    }
})

profileRouter.patch('/updatemy-profile/:id', userAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        const onlyAllowed = [
            "profileUrl",
            "age",
            "skills",
            "about",
            "liveIn",
            "education",
            "hometown",
            "languagesKnown",
            "workingIn"
        ];

        const isAllowed = Object.keys(data).every(field => onlyAllowed.includes(field));

        if (!isAllowed) {
            return res.status(400).send("Invalid Fields");
        }

        const updatedData = await User.findByIdAndUpdate(
            id,
            { $set: data }, // safer update
            { runValidators: true, new: true }
        );

        if (!updatedData) {
            return res.status(404).send("User Not Found");
        }

        res.status(200).send({
            message: `${updatedData.firstName}, your profile has been updated successfully.`,
            updatedData
        });

    } catch (error) {
        res.status(500).send({
            message: "Some error occurred",
            error: error.message
        });
    }
});


profileRouter.patch('/changemy-password/:id', userAuth, async (req, res) => {
    const { id } = req.params
    const password = req.user.password
    console.log(password)
    const { emailId, confirmPassword } = req.body;
    try {
        if (!emailId || !confirmPassword) {
            throw new Error("Enter All Credentials")
        }
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(404).send("User Not Found");
        }
        const newHashedPassword = await bcrypt.hash(confirmPassword, 10);
        console.log(newHashedPassword)
        const isPasswordTrue = await bcrypt.compare(confirmPassword, password);

        if (isPasswordTrue) {
            return res.status(400).send("Please use a new password");
        }
        else {
            await User.findByIdAndUpdate(id, { password: newHashedPassword, runValidators: true })
            res.send({ message: `${user.firstName} your password has been updated` })
        }

    } catch (error) {
        res.status(500).send({ message: "Some error occurred", error: error.message })
    }
})





module.exports = profileRouter;