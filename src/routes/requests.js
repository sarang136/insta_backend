const express = require('express')
const requestRouter = express.Router();
const User = require('../models/user');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequests');

// Its only for either ignored or interested
requestRouter.post('/request/:status/:toUserId', userAuth, async (req, res) => {
    const { status, toUserId } = req.params
    const fromUserId = req.user._id

    try {
        const checkIds = await User.findById(toUserId);
        if (!checkIds) {
            return res.status(404).send({ message: "The user you are trying to send request is not prrsent inside DB." })
        }

        if (fromUserId == toUserId) {
            return res.status(400).send({ message: "You cant send request to yourself." })
        }


        if (status === "interested" || status === "ignored") {

            const existingConnectionRequests = await ConnectionRequest.findOne({
                $or: [
                    { fromUserId, toUserId },
                    { fromUserId: toUserId, toUserId: fromUserId }
                ]
            })
            console.log("fromUserId", fromUserId)
            console.log("toUserId", toUserId)

            if (!existingConnectionRequests) {
                const data = await ConnectionRequest({
                    status,
                    toUserId,
                    fromUserId
                })

                // await ConnectionRequest.create({ status, toUserId, fromUserId });
                // I can either do this.

                await data.save();
                const toName = await User.findById(toUserId);
                console.log("name", toName)

 
                // res.status(200).send({ message: `Your Request was successfully sent to ${toId}` })
                res.status(200).json({ message: `You have done ${status} on ${toName.firstName}'s profile.` })
                // `Your Request was successfully sent to ${toName.firstName}`
            }
            else {
                res.status(405).json({ message: "Cant send request again once sent, Either they have sent you a request." })
            }
        }
        else {
            return res.status(400).json({ message: "Invalid status", error: error.message })
        }
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})
// Accept or Reject Requests
requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user._id;
        const { status, requestId } = req.params;

        // Allowed status
        const isAllowedStatus = ["accepted", "rejected"];
        if (!isAllowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        console.log("requestId:", requestId);
        console.log("loggedInUser._id:", loggedInUser);

        console.log({ toUserId: loggedInUser })
        // Find connection request
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser,
            status: "interested"
        });
        if (!connectionRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Update status
        connectionRequest.status = status;
        const data = await connectionRequest.save();

        res.status(200).json({ message: `Connection request ${status}`, data });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = requestRouter;