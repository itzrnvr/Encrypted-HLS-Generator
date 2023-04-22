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
  e.preventDefault()
  if(validateExport()){
    const files = []
  document.querySelectorAll('.list-item').forEach((item)=> {
    files.push({
      name: item.innerText,
      path: item.getAttribute('path')
    })
  })
  const data = {
    bundleName: document.getElementById('input-filename').value,
    files: files
  }
  ipc.send("generateBundle", data)
  }
})

function validateExport(){
  let res = false;
  if(document.getElementById('input-filename').value != ""){
    if(document.querySelectorAll('list-item').length > 0){
      res = true
    } else {
      ipc.send("show-error", "Please add at least one OVPN file")
    }
  } else {
    ipc.send("show-error", "Bundle file name cannot be empty!")
  }

  return res
}




function pickFiles(){
   ipc.send('open-filepicker')
}


ipc.on('opened-filepicker', (event, args)=> {
  console.log('files from main',args)
  const ovpnFiles = getOvpnFiles(args);
  console.log(ovpnFiles)
  if(ovpnFiles.length > 0){
    hideDropArea();
    renderListItems(ovpnFiles)
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
  const ovpnFiles = getOvpnFiles(files);
  console.log(ovpnFiles)
  if(ovpnFiles.length > 0){
    hideDropArea();
    renderListItems(ovpnFiles)
  }
});

deleteBtn.addEventListener('click', ()=>{
    listbox_remove('list-box')
})

const getOvpnFiles = (fileArr) => {
    return fileArr.filter((file)=> getFileExtension(file.name) == "ovpn")
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

