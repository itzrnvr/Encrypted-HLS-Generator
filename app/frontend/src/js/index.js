const { BrowserView } = require('electron');
const electron = require('electron')
const {remote } = electron
const ipc = electron.ipcRenderer
const {listbox_remove, renderListItems} = require('./handleList')

const droparea = document.querySelector(".droparea");
const listArea = document.querySelector(".list-area")
const importBtn = document.getElementById("btn-import")
const selectAllBtn = document.getElementById("btn-select")
const unselectAllBtn = document.getElementById("btn-unselect")
const exportBtn = document.getElementById("btn-export")
const browseBtn = document.querySelector('.span-browse')
const deleteBtn = document.getElementById("btn-delete")
const minimizeBtn = document.getElementById("btn-minimize")
const closeBtn = document.getElementById("btn-close")
const keyDataBtn = document.getElementById("btn-keyData")

const inputKeyUrl = document.getElementById('inputKeyUrl')
const inputKeyPath = document.getElementById('inputKeyPath')
const inputIV = document.getElementById('inputIV')
const cbRandomizeKeys = document.getElementById('cbRandomizeKeys')
const addKeyInfoBtn = document.getElementById('addKeyInfoBtn')

const keyData = {
  keyUrl: '',
  keyPath: '',
  keyIV: ''
}

const modalKeyInfo = new HystModal();

keyDataBtn.addEventListener('click', () => {
  modalKeyInfo.open('#modalKeyInfo')
})

addKeyInfoBtn.addEventListener('click', (e) => {
  e.preventDefault()
  const data = validateAddKeyForm()
  if(data.status == 'complete'){
    keyData.keyUrl = data.keyUrl
    keyData.keyPath = data.keyPath
    keyData.keyIV = data.keyIV
    console.log(keyData)
  }
})

const showErr = (type, err) => {
  ipc.send('showErr', {
    type,
    err
  })
}

const validateAddKeyForm = () => {
  const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
  const data = {status: 'incomplete'}
  if(!cbRandomizeKeys.checked){
    if(!inputKeyUrl.value == '' && !(typeof inputKeyPath.files[0] === 'undefined')) {
      if(urlPattern.test(inputKeyUrl.value)){
        data['keyUrl'] = inputKeyUrl.value
        data['keyPath'] = inputKeyPath.files[0].path
        data['keyIV'] = inputIV.value
        data.status = 'complete'
      } else {
        showErr("InvalidURL", "Please enter a valid URL")
      }
    } else {
      showErr('MissingField', "Please fill all the required fields.")
    }
  } else {
    showErr('NoImplementation', 'This functionality has not been implemented in this version of the software. Please uncheck to continue.')
  }
  return data
}


const myModal = new HystModal({
  linkAttributeName: 'data-hystmodal',
    closeOnOverlay: false,
    closeOnEsc: false, 
    backscroll: false,
    catchFocus: true,
    waitTransitions: true,
    closeOnEsc: false,
    beforeOpen: function(modal){
        console.log('Message before opening the modal');
        console.log(modal); //modal window object
    },
    afterClose: function(modal){
        console.log('Message after modal has closed');
        console.log(modal); //modal window object
    },
});


ipc.on('startedGeneration', (event, args)=> {
  myModal.open('#myModal')
})

ipc.on('generationComplete', (event, args)=> {
  myModal.close()
})

showDropArea()

window.onkeyup = function(e){
  var pressed = "";
  if(e.ctrlKey){
      pressed += "Ctrl";
  } 
  pressed += e.keyCode;
  console.log(pressed);

  if(pressed == 'Ctrl65'){
    selectAll()
  } else if(pressed == '46'){
    listbox_remove('list-box')
  }
}

closeBtn.addEventListener('click', ()=>{
  ipc.send('close',)
})

minimizeBtn.addEventListener('click',()=>{
  ipc.send('minimize')
})

selectAllBtn.addEventListener('click', ()=>{
  selectAll()
})

unselectAllBtn.addEventListener('click', ()=>{
  document.querySelectorAll('.list-item').forEach((item)=>{
    item.classList.remove('active')
  })
})

function selectAll(){
  document.querySelectorAll('.list-item').forEach((item)=> {
    item.classList.add('active')
  })
}


importBtn.addEventListener('click', ()=>{
    pickFiles()
})

browseBtn.addEventListener('click', ()=>{
    pickFiles()
})

exportBtn.addEventListener('click', (e)=>{
  console.log('export clicked')
  if(!keyData.keyUrl == ''){
    if(validateExport()){
      const files = []
    document.querySelectorAll('.list-item').forEach((item)=> {
      files.push({
        name: item.innerText,
        path: item.getAttribute('path')
      })
    })
    const data = {
      files: files,
      keyData: keyData
    }
      ipc.send("generateBundle", data)
    }
  } else {
    modalKeyInfo.open('#modalKeyInfo')
  }
})

function validateExport(){
  let res = false;
  if(document.querySelectorAll('.list-item').length > 0){
    res = true
  } else {
    ipc.send("show-error", "Please add at least one .mp4 file")
  }

  return res
}




function pickFiles(){
   ipc.send('open-filepicker')
}


ipc.on('opened-filepicker', (event, args)=> {
  console.log('files from main',args)
  const mp4Files = getMp4Files(args);
  console.log(mp4Files)
  if(mp4Files.length > 0){
    hideDropArea();
    renderListItems(mp4Files)
  }
})


droparea.addEventListener("dragover", (e) => {
  e.preventDefault();
  droparea.classList.add("hover");
});

droparea.addEventListener("dragleave", () => {
  droparea.classList.remove("hover");
});

droparea.addEventListener("drop", (e) => {
  e.preventDefault();
//   const file = e.dataTransfer.files[0];
//   const ext = getFileExtension(file.name)
//   console.log(file)
//   console.log(ext)

  const files = Array.from(e.dataTransfer.files);
  const mp4Files = getMp4Files(files);
  console.log(mp4Files)
  if(mp4Files.length > 0){
    hideDropArea();
    renderListItems(mp4Files)
  }
});

deleteBtn.addEventListener('click', ()=>{
    listbox_remove('list-box')
})

const getMp4Files = (fileArr) => {
    return fileArr.filter((file)=> getFileExtension(file.name) == "mp4")
}


const getFileExtension = (fileName)=>{
    return fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
}


const render = (file) => {
  droparea.setAttribute("class", "droparea valid");
  droparea.innerText = "Added " + file.name;
};

function hideDropArea(){
    droparea.style.display = 'none'
    listArea.style.display = 'block'
}

function showDropArea(){
    droparea.style.display = 'flex'
    listArea.style.display = 'none'
}

