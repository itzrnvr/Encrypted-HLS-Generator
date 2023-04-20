const electron = require('electron')
const { app, BrowserWindow} = electron
const path = require('path');
// const { electron } = require('process');
const url = require('url')
const ipc = electron.ipcMain
const dialog = electron.dialog 

let homeWindow, winTwo;

function createWindow(){
    homeWindow = new BrowserWindow({ 
        width: 800, 
        height: 600, 
        minHeight:400,
        minWidth:600,
        maxHeight:600,
        maxWidth:800,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          },
    });


    homeWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/frontend/src/html/index.html'),
        protocol: 'file',
        slashes: true
    }))

   
    homeWindow.on('closed', ()=>{
        homeWindow = 'null'
    })

}

app.on('ready', createWindow);
app.on('window-all-closed', ()=>{
    if(process.platform !== 'darwin'){
        app.quit()
    }
})
app.on('activate', ()=>{
    if(homeWindow === null){
        createWindow()
    }
})

ipc.on('open-filepicker', (event)=>{
    dialog.showOpenDialog(homeWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [,
            { name: 'OVPN', extensions: ['ovpn'] },
          ]
      }).then(result => {
        console.log(result.canceled)
        const files = result.filePaths.map((f) => {
          return {  
                name: path.parse(f).base,
                filePath: f
            }
        })
        event.sender.send('opened-filepicker', files)
        console.log(files)
      }).catch(err => {
        console.log(err)
      })
})
