const electron = require('electron')
const { app, BrowserWindow} = electron
const path = require('path');
const archiver = require('archiver');
const fs = require('fs');
const url = require('url')
const ipc = electron.ipcMain
const dialog = electron.dialog 

archiver.registerFormat('zip-encrypted', require("archiver-zip-encrypted"));


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
        show: false,
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

    homeWindow.on('ready-to-show', ()=>{
        homeWindow.show()
    })

}

ipc.on('show-error', (event, args) => {
    dialog.showErrorBox('Error', args) 
})

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

ipc.on('minimize', () => {
    homeWindow.minimize()
    // or depending you could do: win.hide()
})

ipc.on('close', () => {
    homeWindow.close()
    // or depending you could do: win.hide()
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

ipc.on('generateBundle', (event, args)=>{
    generateBundle(args)
})

function generateBundle(data){
    const filePath = getPathFromDialog()
    const output = fs.createWriteStream(filePath + '/'+data.bundleName+'.ovpnb');
  
    let archive = archiver.create('zip-encrypted', {zlib: {level: 8}, encryptionMethod: 'aes256', password: 'XDF8sgeLD,29/J5'});
    archive.pipe(output);
    
    data.files.forEach(file => {
        archive.file(file.path, { name: file.name });
    });

    archive.finalize();
}

async function getPathFromDialog(){
    const file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '../assets/newbundle.ovpnb'),
        
        buttonLabel: 'Save',
        filters: [
            {
                name: 'OVPN Encrypted Bundle',
                extensions: ['ovpnb']
            }, ],
        properties: []
    })


    return file.filePath.toString()
}