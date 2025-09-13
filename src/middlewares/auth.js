// Middleware for User 
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const user = require('../models/user');
const userAuth = async (req, res, next) => {

    // Read the token from the request.cookies

    try {
        const { token } = req.cookies
        console.log("req.cookies", req.cookies)
        console.log(token)
        // Validate the token
        const decodedToken = await jwt.verify(token, "NPMNODEV");
        console.log(decodedToken);
        // Find The User
        if (!decodedToken) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const { _id } = decodedToken;
        const user =  await User.findById(_id);
        if(!user){
            return res.status(401).json({ message: "User Not Found" })
        }

        req.user = user;  //// sending the user directly to the request handler function, once it is authenticated, now this user can be directly be recieved in request handler functions by const user = req.user 
        next();
    } catch (error) {
        res.status(500).send("Error" + error.message)
    }

}
module.exports = { userAuth };

