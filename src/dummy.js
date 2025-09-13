console.log('Back-end for DevTinder');



const express = require('express');
const app = express();
const { adminAuth, userAuth } = require('./middlewares/auth.js');


// When We use app.use it always gives you all the response for path which includes /user, even if the path is /user/login or anything
// app.use("/user", (req, res) => {
//     res.send('User Path')
// })


// This will only sent the response for path '/user' and that too of Method GET. 
// app.get('/user', (req,res) => {
//     res.send('User Path')
// });


// app.post('/user', (req, res) => {
//     res.send('User Post Path')
// })


// app.get('/user', (req, res) => {
//     console.log(req.query)
//     res.send('User GET Path')
// })


// app.use('/user', (req, res, next) => {// This next() function is given my Express.Js
//     // res.send('User Path Response 1');  // If we didn't pass anything as a response then the api will not hit and it will go into infinite loop.
//     console.log("USer Path Response 1")
//     next(); //But if i write next()...then it will go on the next request handler function.

// }, (req, res) => {
//     res.send('/User Path Response 2')  // It will not reach till this line.
// }
// )

// app.use('/', (req, res, next) => {
//     next();    //------ This is a Middleware
// })

// app.use('/user', (req, res, next) => {
//     console.log("This is the middleware")  //This is also a middleware....Function that lies between the execution of request handler functions are called as Middlewares
//     next();
// },(req, res) => {
//     res.send('User Path Response 2') //--- This is a request Handler function which actually sends the request 
// })


//  Authorization


// app.get('/user/login', (req, res) => {
//     const token = 123;
//     const isAuthorized = token === 123;
//     if (isAuthorized) {
//         res.send("User LoggedIn");     // Only log in when the the token is valid, Its called as protected routes
//     } else {
//         res.send("UnAuthorized User, Maybe you are not an Admin")
//     }
// })

// app.get('/user/getAllData', (req, res) => {
//     const token = 123;
//     const isAuthorized = token === 123;
//     if (isAuthorized) {
//         res.send("Data Got");     // We Cant keep doing this all the time.....so we use middlwares
//     } else {
//         res.send("UnAuthorized User, Maybe you are not an Admin")
//     }
// })


// Authentication Using a middlware

// app.use("/admin", adminAuth)  ///-- Also i can pass the middleware like this

// app.get('/admin/login', (req, res) => {
//     res.send("Admin Login Page")
// })
// app.get('/admin/getAllData', (req, res) => {
//         res.send("Got All Data for Admin");
// })
// app.get('/user', userAuth, (req, res) => {  //---We can also pass the middleware like this 
//     res.send("User Path Response");
// })


app.listen(3000, () => {
    console.log("Listening on 3000");
})