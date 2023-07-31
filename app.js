const express = require('express');
const path = require('path');
const app = express();
const auth = require('./router/auth');
const cors = require('cors')

app.use(express.static(path.join(__dirname, '../client/public')));
app.use(cors())
app.use(auth);


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.listen(7000, () => {
    console.log("server is running");
})