const electron = require('electron')
const { app, BrowserWindow} = electron
const path = require('path');
const fs = require('fs');
const url = require('url')
const ipc = electron.ipcMain
const dialog = electron.dialog 
const ProgressBar = require('electron-progressbar');

const processVideo = require('./utils/processVideo');
const { createConnection } = require('net');

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
        filters: [
            { name: 'Mp4 Media files', extensions: ['mp4'] },
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


ipc.on('showErr', (event, {type, err})=>{
    if(type == 'MissingField') {
        showNewErrorDialog(type,  'Required Field Empty', err)
    } else if (type == 'NoImplementation') {
        showNewErrorDialog(type,  'Feature Pending', err)
    } else if (type == 'InvalidURL'){
        showNewErrorDialog(type, "Key Url seems invalid", err)
    }
})


function startSaveDialog(data){
    console.log('data', data)
    dialog.showOpenDialog({
        title: 'Select select a location',
        properties: ['openDirectory'],
        buttonLabel: 'Pick',
    }).then( async (result) => {
        for (let i = 0; i < data.files.length; i++) {
            homeWindow.webContents.send('startedGeneration')
            const progressBar = makeProgressBar()
            await generateEncryptedStream({
                name: data.files[i].name, 
                path: data.files[i].path, 
                outputDir: result.filePaths[0], 
                keyData: data.keyData
            }, (progress) => {
                if(!progressBar.isCompleted()){
                    progressBar.value = progress
                }
            }).catch(err => {
                homeWindow.webContents.send('generationComplete')
                showErrorDialog(err)
                progressBar.close()
            })
            homeWindow.webContents.send('generationComplete')
        }
        
        //openSuccessDialog()
    }).catch(err => {
        console.log(err)
        homeWindow.webContents.send('generationComplete')
    })

}




const generateEncryptedStream = (fileDat, progress) => {
    return new Promise((resolve, reject) => {
        try{
            processVideo.generateEncryptedHLS(fileDat.name, 
                fileDat.path, 
                fileDat.outputDir,
                fileDat.keyData, 
                (event, data) => {
                    switch(event) {
                        case 'progress':
                            progress(Math.round(data.percent))
                            break
                        case 'end':
                            resolve('success')
                            break
                        case 'error':
                            reject(data)
                        default:
                            console.log("default")
                    }
                }
            )
        } catch(err){
            reject(err)
        }
    })
}


// const generateEncryptedStream = () => {
//     processVideo.generateEncryptedHLS(data.files[0].name, 
//         data.files[0].path, 
//         result.filePaths[0], 
//         (event, data) => {
//             switch(event){
//                 case 'progress':
                    // if(!progressBar.isCompleted()){
                    //     progressBar.value = Math.round(data.percent);
                    //   }
//                     break
//                 case 'end':
//                     console.log("ended")
//                     break
//                 case 'error':
//                     reject(data)
//                 default:
//                     console.log("default")
//             }
//         })
// }

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

    return progressBar
}

function openSuccessDialog(){
    const options = {
        type: 'info',
        icon: path.join(__dirname, `/assets/check3.png`),
        title: 'Success',
        message: 'Files encrypted and exported successfully',
      };
    
      dialog.showMessageBox(homeWindow, options).then((res)=>{
        console.log('closed')
      });
}

function showNewErrorDialog(title, message, err){
    const options = {
        type: 'error',
        title: title,
        message: message,
        detail: `Error: ${err}`,
      };
      homeWindow.webContents.send('generationComplete')
      dialog.showMessageBox(homeWindow, options).then((res)=>{
        console.log('closed')
      });
}



function showErrorDialog(err){
    const options = {
        type: 'error',
        title: 'Something went wrong!',
        message: 'An application error occured, please report to developer.',
        detail: `Error: ${err}`,
      };
      homeWindow.webContents.send('generationComplete')
      dialog.showMessageBox(homeWindow, options).then((res)=>{
        console.log('closed')
      });
}


// electron-packager . Encrypted-Stream-Generator --platform-win32 --asar  pack . app.asar --unpack-dir "node_modules" && rd "app.asar.unpacked" /s /q

