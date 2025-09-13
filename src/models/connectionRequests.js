const mongoose = require('mongoose')

const connectionSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,    // < -- This is mandatory 
        ref: 'User'    // < --- Refering First Name and Last Name to a different model named User
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,    // <-- This is mandatory
        ref: 'User'    // < --- Refering First Name and Last Name to a different
    },
    status: {
        type: String,
        enum: {  /// sending costum messages in enum 
            values: ["ignored", "interested", "accepted", "rejected", "blocked"],
            message: `{VALUE} The status is not defined`
        },
        default: "ignored"
    }
},
    {
        timestamps: true,
    },


);

/// If i will do find({fromUserId : "51645312refa3sd2135fds", toUserId : "51645312refa3sd2135fds"})  this process will be very fast even i have millions of data inside my DB.
connectionSchema.index({ fromUserId: 1, toUserId: 1 })

module.exports = mongoose.model('ConnectionRequest', connectionSchema);