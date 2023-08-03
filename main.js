const { app, BrowserWindow } = require("electron");
const path = require("path");

const express = require('express');
const expressApp = express();

const cors = require('cors')
expressApp.use(cors())

let error = ""

const child_process = require('child_process');
const chromeDriverPath = path.join(__dirname,'driver','win', 'chromedriver', 'chromedriver.exe');
const edgeDriverPath = path.join(__dirname,'driver','win', 'edgedriver', 'msedgedriver.exe');
const firefoxDriverPath = path.join(__dirname,'driver','win','geckodriver', 'geckodriver.exe');

let swd = require("selenium-webdriver");

expressApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

expressApp.listen(7000, () => {
  console.log("server is running");
})

expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.json());


expressApp.post('/access', (req, res) => {
  const { rollno, password, browserName } = req.body

  let driverProcess;
  if (browserName === 'chrome') {
    driverProcess = child_process.execFile(chromeDriverPath);
  } else if (browserName === 'MicrosoftEdge') {
    driverProcess = child_process.execFile(edgeDriverPath);
  } else if (browserName === 'firefox') {
    driverProcess = child_process.execFile(firefoxDriverPath);
  } else {
    res.status(500).json({ success: false, message: 'Invalid browser name' });
  }

  driverProcess.stdout.on('data', (data) => {
    console.log(`Driver stdout: ${data}`);
  });

  driverProcess.stderr.on('data', (data) => {
    console.log(`Driver stderr: ${data}`);
    error = data;
  });

  driverProcess.on('close', (code) => {
    console.log(`Driver process exited with code ${code}`);
  });

  if (error.length > 0) {
    res.status(500).json({ success: false, message: 'Problem with chrome-driver', error: error });
  }
  let driver = new swd.Builder()
    .usingServer('http://localhost:9515')
    .forBrowser(browserName)
    .build();
  
  let url = "https://netaccess.iitm.ac.in/account/login";
  let Opentab = driver.get(url);
  Opentab
    .then(() => driver.manage().setTimeouts({ implicit: 10000, }))
    .then(() => driver.findElement(swd.By.css("#username")))
    .then((username) => username.sendKeys(rollno))
    .then(() => driver.findElement(swd.By.css("#password")))
    .then((passwordElement) => passwordElement.sendKeys(password))
    .then(() => driver.findElement(swd.By.css("#submit")))
    .then((submit) => submit.click())
    .then(() => driver.get("https://netaccess.iitm.ac.in/account/approve"))
    .then(() => driver.findElement(swd.By.css("#approveBtn")))
    .then((approveBtn) => approveBtn.click())
    .then(() => driver.close())
    .then(() => {
      driverProcess.kill();
      res.status(200).json({ success: true, message: 'Net access granted for one day!!' });
    })
    .catch((err) => {
      driverProcess.kill();
      res.status(500).json({ success: false, message: 'Access denied!!', error: err });
    })
})



let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 700,
    autoHideMenuBar: true,
    title: 'Net Access',
    icon: __dirname + '/icon.png',
    webPreferences: {
      nodeIntegration: true,
      devTools: true
    },
  });

  mainWindow.show();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL("http://localhost:7000");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})





