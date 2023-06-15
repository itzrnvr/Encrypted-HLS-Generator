const electron = require('electron')
const { app, BrowserWindow} = electron
const path = require('path');
const fs = require('fs');
const url = require('url')
const ipc = electron.ipcMain
const dialog = electron.dialog 
const ProgressBar = require('electron-progressbar');

const processVideo = require('./utils/processVideo')

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
        defaultPath: "C:\\Users\\username",
        properties: ['openFile', 'multiSelections'],
        filters: [,
            { name: 'MP4', extensions: ['mp4'] },
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
    startSaveDialog(args)
})


function startSaveDialog(data){
    console.log('data', data)
    dialog.showOpenDialog({
        title: 'Select select a location',
        defaultPath: path.join(__dirname, `../assets`),
        properties: ['openDirectory'],
        buttonLabel: 'Pick',
    }).then((result)=> {
        //event.sender.send('startedGeneration')
        homeWindow.webContents.send('startedGeneration')
        const progressBar = makeProgressBar()
        processVideo.generateEncryptedHLS(data.files[0].name, 
            data.files[0].path, 
            result.filePaths[0], 
            (event, data) => {
                switch(event){
                    case 'progress':
                        console.log('progress', data)
                        console.log('progress', data.progress)
                        console.log('progress', Math.round(data.percent))
                        
                        if(!progressBar.isCompleted()){
                            progressBar.value = Math.round(data.percent);
                          }
                        break
                    case 'end':
                        console.log("ended")
                        homeWindow.webContents.send('generationComplete')
                        break
                    case 'error':
                        progressBar.close()
                        homeWindow.webContents.send('generationComplete')
                    default:
                        console.log("default")
                }
            })
        console.log('result', result.filePaths)
       //openSuccessDialog(filePath)
    }).catch(err => {
        console.log(err)
    })

}

// function generateBundle(data, filePath){
//     const output = fs.createWriteStream(filePath);
  
//     let archive = archiver.create('zip-encrypted', {zlib: {level: 8}, encryptionMethod: 'aes256', password: 'XDF8sgeLD,29/J5'});
//     archive.pipe(output);
    
//     data.files.forEach(file => {
//         archive.file(file.path, { name: file.name });
//     });

//     archive.finalize();

//     openSuccessDialog(filePath)
   
// }

function makeProgressBar(){
    const progressBar = new ProgressBar({
        indeterminate: false,
        browserWindow: {
            parent: homeWindow,
            modal: true
        },
        text: 'Generating Encrypted Stream...',
        detail: 'Please do not close the window'
      });

      progressBar
      .on('completed', function() {
        console.info(`completed...`);
        progressBar.detail = 'Task completed. Exiting...';
      })
      .on('aborted', function(value) {
        console.info(`aborted... ${value}`);
      })
      .on('progress', function(value) {
        progressBar.detail = `Progress: ${value}%`;
      });
    
    // launch a task and increase the value of the progress bar for each step completed of a big task;
    // the progress bar is set to completed when it reaches its maxValue (default maxValue: 100);
    // ps: setInterval is used here just to simulate the progress of a task
    // setInterval(function() {
    //   if(!progressBar.isCompleted()){
    //     progressBar.value += 1;
    //   }
    // }, 1000);

    return progressBar
}

function openSuccessDialog(filePath){
    const options = {
        type: 'info',
        icon: path.join(__dirname, `/assets/check3.png`),
        title: 'Success',
        message: 'Files encrypted and exported successfully',
        detail: `Exported to: ${filePath}`,
      };
    
      dialog.showMessageBox(homeWindow, options).then((res)=>{
        console.log('closed')
      });
}

