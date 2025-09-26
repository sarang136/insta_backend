const express = require('express');
const User = require('../models/user');
const ConnectionRequest = require('../models/connectionRequests');
const post = require('../models/posts')
const { userAuth } = require('../middlewares/auth');
const notification = require('../models/notificatons');
const user = require('../models/user');
const posts = require('../models/posts');
const { default: mongoose } = require('mongoose');
const upload = require('../utils/cloudinary');
const fs = require('fs'); // For removing temp files if needed
const userRouter = express.Router();

const SAFE_DATA = ["firstName", "lastName", "createdAt", "emailId", "skills", "about", "profileUrl", "gender", "liveIn", "education", "hometown", "languagesKnown", "workingIn", "posts"];

// Get all requests 
userRouter.get('/request/get/all', userAuth, async (req, res) => {
    // const userId = req.params.userId;
    const loggedInUser = req.user;
    // Find all the request of the user by userId

    const allRequests = await ConnectionRequest.find({ toUserId: loggedInUser._id, status: "interested" || "ignored" })
        .populate('fromUserId', "firstName lastName createdAt skills gender about education hometown liveIn languagesKnown wokingIn "); // Or like this also

    // .populate('fromUserId', ["firstName", "lastName"]); i can write this inside a array also   
    // with from fromUserId, i am sending its name and lastname, see model, how i refered the User Model where the fields are firstName and lastName
    console.log(allRequests)
    if (!allRequests) {
        return res.status(404).json({ message: "No requests found" });
    }
    res.status(200).json({ message: "All requests", allRequests: allRequests });
})

userRouter.get('/requests/connections', userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.user._id; // keep as ObjectId from Mongoose

        const connectedUsers = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUserId, status: "accepted" },
                { fromUserId: loggedInUserId, status: "accepted" }
            ]
        })
            .populate('fromUserId', SAFE_DATA)
            .populate('toUserId', SAFE_DATA);

        // checking if the fromUserId is equals to loggedInUser.

        const friends = connectedUsers.map((connection) => {
            if (connection.fromUserId._id.equals(loggedInUserId)) {
                return connection.toUserId;
            } else {
                return connection.fromUserId;
            }
        });

        res.status(200).json({ message: "Your Connections", data: friends });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
userRouter.get('/feed', userAuth, async (req, res) => {
    try {
        "education", "hometown", "languagesKnown", "workingIn"
        // Pagination

        // taking out page and limits from query    /feed?limit=10   == these are called query params
        const page = parseInt(req.query.page) || 1;  // this comes in string so we convert it into integer using parseInt method, sets the default as 1st page
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit /// suppose we are on 3rd page so it will be (3-1)*limit that is 10 === 20....skips first 20 and shows from 21 to 30

        if (limit > 10) {
            return res.status(400).json({ message: "Limit should not be greater than 10" });
        }

        // get the loggedInUser from req.user
        const loggedInUser = req.user;
        console.log(loggedInUser)
        // checking his connections, either he sent requests or recieved some requests
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ],
        }).select("fromUserId toUserId")// I only need a specific key from the response i use .select(); it takes only one argument. This will give only fromUserId from the response.


        const hiddenUsers = new Set();   //this takes an array of some data, which will have unique elements
        connectionRequest.forEach((req) => {
            hiddenUsers.add(req.fromUserId.toString());  // pushing the fromUserId to the set
            hiddenUsers.add(req.toUserId.toString());  // pushing the toUserId to the set
        })

        console.log("hiddenUsers", hiddenUsers)
        // get the posts from the users who are not in the hiddenUsers set
        const users = await User.find({
            $and: [
                { _id: { $nin: Array.from(hiddenUsers) } }, // checking if the users who are not in the hiddenUsers set
                { _id: { $ne: loggedInUser._id } }, // Checking if the id is not equals to the loggedInUser id
                // { skills: {$in: (loggedInUser.skills)}}
            ]
        }).select(SAFE_DATA).skip(skip).limit(limit);
        if (!users) {
            res.status(404).json({ message: "No posts found" })
        }

        // This Api should not return all the users at a time. It should return only 10 users at a time, and then the next 10 users and so on.
        // This is called pagination. We will use that
        // In mongo we have 2 functions to do pagination. They are skip() and limit(). skip(0) means we will start from the first document. limit(10) means we will get only till 10

        res.status(200).send({ message: "Your Feed", data: users });

    } catch (error) {
        res.status(500).send({ error: error.message })
    }


})



userRouter.post('/post-image/:id', upload.single('url'), async (req, res) => {
    // const { _id } = req.user;
    const id = req.params.id;
    const { caption } = req.body;

    // if (id !== _id.toString()) {
    //     return res.status(403).json({ message: "Unauthorized user" });
    // }

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: "Image is required" });
        }

        const newPost = {
            url: req.file.path,   // multer-storage-cloudinary sets 'path' as the secure URL
            caption: caption || ""
        };

        if (!user.posts) user.posts = [];
        user.posts.push(newPost);
        await user.save();

        res.status(200).json({ message: "Post saved successfully", user });
    } catch (error) {
        console.error("Post upload error:", error);
        res.status(500).json({ error: error.message });
    }
});


userRouter.post('/post/comment/:postId/:userId', userAuth, async (req, res) => {
    const loggedInUser = req.user
    try {
        const postId = req.params.postId
        const userId = req.params.userId
        const comments = req.body.comments

        console.log("postId", postId)
        console.log("userId", userId)
        console.log(comments)

        if (!comments) {
            return res.status(409).json({ message: "Comment is Required" })
        }

        if (!postId || !userId) {
            return res.status(400).json({ message: "Unauthorized" })
        }
        const user = await User.findById({ _id: userId });
        // console.log(user?.posts)

        if (!user) {
            return res.status(303).json({ message: "No User Found" })
        }

        const post = user.posts.id(postId)
        console.log("post", post)

        post.comments.push(comments)

        const noti = new notification({
            sender: loggedInUser._id,
            receiver: user._id,
            message: `${loggedInUser.firstName} commented on your post`,
            postId: postId,
            type: 'comment'
        })
        await noti.save();

        res.send({ data: user, comments: comments })
        await user.save();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})
userRouter.post('/read-comment/:postId', userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(postId)

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const covertIsRead = await notification.findOneAndUpdate(
      { postId: postId },   // no ObjectId conversion yet
      { $set: { isRead: true } },
      { new: true }
    );

    if (!covertIsRead) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Comment Read", data: covertIsRead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
userRouter.get('/get-all-comments/:id/:postId', userAuth, async (req, res) => {
    try {

        const id = req.params.id;
        console.log(id)
        const postId = req.params.postId;
        console.log(postId)
        if (!id) {
            return res.status(400).json({ message: "No User Found" })
        }
        if (!postId) {
            return res.status(400).json({ message: " No post Id found" })
        }
        const user = await User.findById(id);
        console.log(user.posts)
        if (!user) {
            return res.status(407).json({ message: "no user found" })
        }
        const post = user.posts.id(postId)
        if (!post) {
            return res.status(406).json({ message: "no post found" })
        }
        const comment = post.comments
        console.log(comment)

        res.status(200).json({ data: comment })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
userRouter.post('/like/:postId/:userId', userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.user._id
        const { userId, postId } = req.params
        // const {comments} = req.body;
        console.log(postId)


        const user = await User.findById(userId)
        console.log(user)

        if (!user) {
            res.status(403).json({ message: "invalid user" });
        }

        const post = user.posts.id(postId)
        console.log(post)

        if (!post) {
            return res.status(400).json({ message: "post not found" })
        }
        const isLiked = post.likes.includes(loggedInUserId);

        if (isLiked) {
            post.likes = post.likes.filter(
                (like) => like.toString() !== loggedInUserId.toString()
            );
        } else {
            if (!post.likes.some((like) => like.toString() === loggedInUserId.toString())) {
                post.likes.push(loggedInUserId);

                const loginUser = await User.findById(loggedInUserId);
                console.log(loginUser)

                const noti = new notification({
                    sender: loggedInUserId,
                    receiver: user._id,
                    message: `${loginUser.firstName} liked your post`,
                    postId: postId,
                    type: 'like'
                })
                await noti.save();
            }
        }
        await user.save();
        res.status(200).json({ message: "liked", post })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})
userRouter.post('/delete-post/:id', userAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const loggedInUser = req.user;
        // if (!id) {
        //     return res.status(403).json({ message: "Post not found" })
        // }
        const post = loggedInUser.posts.id(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.deleteOne();
        await loggedInUser.save()
        res.status(200).json({ message: "Post Deleted Sucessfully" });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})
userRouter.get('/timeline', userAuth, async (req, res) => {
    try {

        const loggedInUserId = req.user._id

        if (!loggedInUserId) {
            res.status(407).json({ message: "unauthorized user" });
        }

        const data = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUserId, status: "accepted" },
                { fromUserId: loggedInUserId, status: "accepted" }
            ]
        }).populate('toUserId', SAFE_DATA)
            .populate('fromUserId', SAFE_DATA)

        if (!data) {
            res.status(303).json({ message: "no users found" })
        }


        // console.log("data.posts", data.posts)

        const friends = data.map((data) => {
            if (data.fromUserId._id.equals(loggedInUserId)) {
                return data.toUserId;
            } else {
                return data.fromUserId;
            }
        });
        res.status(200).json({ message: "fetched", data: friends })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
userRouter.get("/get-like-notifications", userAuth, async (req, res) => {
    try {
        const Notification = await notification.find({ receiver: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ Notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
userRouter.get('/get-comments-notifications', userAuth, async (req, res) => {
    const loggedInUserId = req.user._id;
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 2
    const skip = (page - 1) * limit
    try {
        const getAllNotifications = await notification.find({ receiver: loggedInUserId })
            .sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.json({ getAllNotifications });
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
// userRouter.post('/post-image', userAuth, async (req, res) => {
//     const onUserId = req.body.onUserId
//     const loggedInUser = req.user
//     const posts = req.body.posts
//     try {

//         const user = User.findById(onUserId)

//         if (!user) {
//             return res.status(403).json({ message: "Unauthorized User" })
//         }
//         // if (user._id !== loggedInUser._id) {
//         //     return res.status(400).json({ message: "You are trying to post on another's profile" })
//         // }
//         if (!posts) {
//             return res.status(407).json({ message: "No posts" })
//         }
//         const postedData = await post({ 
//             posts : posts,
//             onUserId : loggedInUser._id
//          })
//         await postedData.save()
//         res.status(200).json({ message: "Posted Successfully", postedData })
//     } catch (error) {

//         res.status(500).json({error : error.message})

//     }



// });



module.exports = userRouter;