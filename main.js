const { app, BrowserWindow, Notification } = require("electron");
const Store = require('electron-store');
const store = new Store();

const path = require("path");


const express = require('express');
const expressApp = express();

const cors = require('cors')
expressApp.use(cors())


let error = ""
const notification_for_success = {
  title: 'Net Access',
  body: 'Net access granted for one day!!',
  icon: __dirname + '/icon.png',
}

const notification_for_error = {
  title: 'Net Access',
  body: 'Something went wrong!!',
  icon: __dirname + '/icon.png',
}
let timer = null;


const child_process = require('child_process');
const chromeDriverPath = path.join(__dirname, 'driver', 'win', 'chromedriver', 'chromedriver.exe');
const edgeDriverPath = path.join(__dirname, 'driver', 'win', 'edgedriver', 'msedgedriver.exe');
const firefoxDriverPath = path.join(__dirname, 'driver', 'win', 'geckodriver', 'geckodriver.exe');

let swd = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const edge = require('selenium-webdriver/edge');

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
  if (!rollno || !password || !browserName) {
    res.status(500).json({ success: false, message: 'Invalid request' });
    return;
  }

  let driverProcess = null;
  if (browserName === 'chrome') {
    driverProcess = child_process.execFile(chromeDriverPath);
  } else if (browserName === 'MicrosoftEdge') {
    driverProcess = child_process.execFile(edgeDriverPath);
  } else if (browserName === 'firefox') {
    driverProcess = child_process.execFile(firefoxDriverPath);
  } else {
    res.status(500).json({ success: false, message: 'Invalid browser' });
  }

  const myVarHandler = {
    set(target, prop, value) {
      if (prop === 'driveStart' && value.includes('started successfully')) {
        console.log(`driveStart changed to ${value}`);

        let chromeOptions = new chrome.Options();
        chromeOptions.addArguments("--headless")

        let edgeOptions = new edge.Options();
        edgeOptions.addArguments("--headless")

        let driver = new swd.Builder()
          .usingServer('http://localhost:9515')
          .forBrowser(browserName)
          .setChromeOptions(chromeOptions)
          .setEdgeOptions(edgeOptions)
          .build();
        
        // driver.manage().window().minimize();        
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
          .then(() => driver.manage().setTimeouts({ implicit: 10000, }))
          .then(() => driver.findElement(swd.By.css("#radios-1")))
          .then((radioBtn) => radioBtn.click())
          .then(() => driver.findElement(swd.By.css("#approveBtn")))
          .then((approveBtn) => approveBtn.click())
          .then(() => driver.close())
          .then(() => driver.quit())
          .then(() => {
            driverProcess.kill()
          })
          .then(() => {
            let date = new Date();
            let time =  date.getHours() + ":" + date.getMinutes();
            let today = date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear();
            let today_time = today + " " + time;
            res.status(200).json({ success: true, message:`Net acceess granted for next 24 hours from ${today_time}`});
            let myNotification = new Notification(notification_for_success)
            myNotification.show()
            store.set('isOneTimeSuccess', true);
            store.set('time', date.getTime());
            setTimeout(() => {
              mainWindow.hide();
            }, 1000);
            if (timer) {
              clearTimeout(timer);
            }
            timer = setTimeout(() => {
              checkForNetAccess();
            }, 1000 * 60 * 60 * 24);
          })
          .catch((err) => {
            driver.close()
            driver.quit()
            driverProcess.kill()
            let myNotification = new Notification(notification_for_error)
            myNotification.show()
            res.status(500).json({ success: false, message: 'Something went wrong!!', error: err });
          })
          target[prop] = value;
          return true;
      }
    }
  };

  const proxy = new Proxy({}, myVarHandler);

  driverProcess.stdout.on('data', (data) => {
    console.log(`Driver stdout: ${data}`);
    proxy.driveStart = data;
  });

  driverProcess.stderr.on('data', (data) => {
    console.log(`Driver stderr: ${data}`);
    error = data;
  });

  driverProcess.on('close', (code) => {
    console.log(`Driver process exited with code ${code}`);
  });


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
      devTools: false
    },
  });

  if (store.get('isOneTimeSuccess')) {
    mainWindow.hide();
  }
  else {
    mainWindow.show();
  }

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL("http://localhost:7000");

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.on("ready", createWindow);

const { Tray, Menu } = require('electron')
let tray = null

app.whenReady().then(() => {
  tray = new Tray(__dirname + '/icon.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App', click: () => { mainWindow.show() }},
    { label: 'Quit', click: () => { 
      mainWindow.destroy()
      app.quit()
    }}
  ])
  tray.setToolTip('Net Access')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show();
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.setLoginItemSettings({
  openAtLogin: true,
});

function checkForNetAccess() {
  mainWindow.webContents.reload();
}