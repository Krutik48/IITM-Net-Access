// const express = require('express');
// const path = require('path');
// const app = express();
// const auth = require('./router/auth');
// const cors = require('cors')


// app.use(cors())
// app.use(auth);


// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.listen(7000, () => {
//     console.log("server is running");
// })

// console.log("server is running");

// module.exports = app;


const express = require('express');
const auth = require('./router/auth');
const path = require("path");
const cors = require('cors')
const expressApp = express();

expressApp.use(cors())
auth.init(expressApp);


expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

expressApp.listen(7000, () => {
    console.log("server is running");
})