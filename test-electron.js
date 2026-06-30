const electron = require("electron");

console.log("electron module loaded:", typeof electron);
console.log("electron.app:", typeof electron.app);
console.log("electron.app.isPackaged:", electron.app ? electron.app.isPackaged : 'undefined');

if (electron.app) {
  electron.app.whenReady().then(() => {
    console.log("Electron app is ready!");
  }).catch((error) => {
    console.error("Error waiting for app to be ready:", error);
  });
} else {
  console.error("electron.app is undefined!");
}