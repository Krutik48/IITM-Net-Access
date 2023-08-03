const express = require('express');
require("chromedriver");
let swd = require("selenium-webdriver");
let chrome = require("selenium-webdriver/chrome");
let edge = require("selenium-webdriver/edge");



exports.init = (app) => {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());


    app.post('/access', async (req, res) => {
        const { rollno, password, browserName} = req.body
        console.log(rollno, password, browserName)
        let optionsChrome = new chrome.Options().excludeSwitches(["enable-logging"]);   
        let optionsEdge = new edge.Options().excludeSwitches(["enable-logging"]);
        let tab = new swd.Builder().forBrowser(browserName).setChromeOptions(optionsChrome).setEdgeOptions(optionsEdge).build();

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
            .catch((err) => {
                console.log(err);
                res.status(500).json({ success: false, message: 'Access denied!!',error:err });
            }
            )
    })
}
