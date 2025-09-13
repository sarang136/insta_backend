// const mongoose = require('mongoose')

// const connectDB = async () => {
//     try {
//         await mongoose.connect('mongodb+srv://sarang:x9ye8VZyMhMayYn7@cluster0.xa4bkck.mongodb.net/DevTinder')// <-- like this
//         // To create a new collection pass that name of the collection you want to put on the last of the url
//         console.log('😍 MongoDB Connected...');
//     } catch (error) {
//         console.log("🍌 Mongo DB not connected");
//     }
// };

// connectDB()

// module.exports = {connectDB}



// Another technique...

const mongoose = require('mongoose');

const connectDb = async () => {
   await  mongoose.connect('mongodb+srv://sarang:x9ye8VZyMhMayYn7@cluster0.xa4bkck.mongodb.net/DevTinder');
}

module.exports = {connectDb} 