const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who triggered it
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who will receive it
    type: { type: String, enum: ["like", "comment", "follow"], required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "User.posts" }, // optional: if it's related to a post
    message: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);