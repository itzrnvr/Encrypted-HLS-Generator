const electron = require('electron')
const ipc = electron.ipcRenderer
const {listbox_remove, renderListItems} = require('./handleList')

const droparea = document.querySelector(".droparea");
const listArea = document.querySelector(".list-area")
const importBtn = document.getElementById("btn-import")
const deleteBtn = document.getElementById("btn-delete")

showDropArea()

importBtn.addEventListener('click', ()=>{
    pickFiles()
})

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
    droparea.style.display = 'block'
    listArea.style.display = 'none'
}

