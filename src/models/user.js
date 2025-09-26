
const mongoose = require('mongoose');
const validator = require('validator');


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        maxLength: 20
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
        unique: true,
        required: true,    
        trim: true,
        lowercase: true,
        validate(value) {    
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email');
            }
        }
    },
    profileImage: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRptUn6vdvMnIn_1Ks_TM-6C8uui1dZtxUvqQ&s",
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error('Invalid URL');
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error('Password is not strong');
            }
        }
    },
    confirmPassword: {
        type: String,
    },
    age: {
        type: Number,
        min: 18
    },
    gender: {
        type: String,
        validate(value) {
            if (!["male", "female", "others"].includes(value)) {
                throw new Error("Gender Not Valid");
            }
        }
    },
    skills: {
        type: [String],
    },
    about: {
        type: String,
        default: "Hi! This is new user ",
        maxLength: 50,
    },
    liveIn: {
        type: String,
    },
    hometown: {
        type: String,
    },
    education: {
        type: String,
    },
    languagesKnown: {
        type: [String],
    },
    workingIn: {
        type: String,
        default: "Currently Not Occupied"
    },
    posts: [
        {
            url: { type: String, required: true },
            likes: { type: [String], default: [] },
            comments: { type: [String], default: [] },
            caption: { type: String, default: "**" },
            postedOn: { type: Date, default: Date.now }
        }
    ]
},
    {
        timestamps: true,
    }
)

userSchema.index({ firstName: 1, lastName: 1 })
// I can send the token from here also 
// userSchema.methods.jwtToken = function () {    /// always use normal functions, not arrow functions
//     const user = this;
//     const token = jwt.sign({ _id: user._id }, "NPMNODEV", { expiresIn: '1d' })
//     return token;
// }
// module.exports = jwtToken;
// Please see login api how can i implement   
// How to create Modal of the Schema that we created (userSchema)
// UserModel should always starts with a capital letter to define that this is a model
// const UserModel = mongoose.model('User', userSchema);
// module.exports = UserModel;

// can also export like this
module.exports = mongoose.model("User", userSchema);