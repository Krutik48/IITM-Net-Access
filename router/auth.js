const express = require('express');
const router = express.Router();
const app = express()
require("chromedriver");
let swd = require("selenium-webdriver");



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(router);


router.post('/access', async (req, res) => {
    const { rollno, password } = req.body
    let tab = new swd.Builder().forBrowser("chrome").build();
    let Opentab = tab.get("https://netaccess.iitm.ac.in/account/login");
    Opentab
        .then(() => tab.manage().setTimeouts({ implicit: 10000, }))
        .then(() => tab.findElement(swd.By.css("#username")))
        .then((username) => username.sendKeys(rollno))
        .then(() => tab.findElement(swd.By.css("#password")))
        .then((passwordElement) => passwordElement.sendKeys(password))
        .then(() => tab.findElement(swd.By.css("#submit")))
        .then((submit) => submit.click())
        .then(() => tab.get("https://netaccess.iitm.ac.in/account/approve"))
        .then(() => tab.manage().setTimeouts({ implicit: 10000, }))
        .then(() => tab.findElement(swd.By.css("#radios-1")))
        .then((radio) => radio.click())
        .then(() => tab.findElement(swd.By.css("#approveBtn")))
        .then((approveBtn) => approveBtn.click())
        .then(() => tab.close())
        .then(() => {
            res.status(200).json({ success: true, message: 'Net access granted for one day!!' });
        })
        .catch(() => {
            tab.close()
            res.status(400).json({ success: false, message: 'Access denied!!' });
        });
})


module.exports = app;

