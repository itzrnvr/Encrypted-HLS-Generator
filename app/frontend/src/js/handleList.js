function listbox_remove(sourceID) {

    //get the listbox object from id.
    var src = document.getElementById(sourceID);
 
    //iterate through each option of the listbox
    for(var count= src.options.length-1; count >= 0; count--) {

         //if the option is selected, delete the option
        if(src.options[count].selected == true) {
 
                try {
                         src.remove(count, null);
                        
                 } catch(error) {
                        
                         src.remove(count);
                }
        }
    }
}

function renderListItems(files){
    const container = document.getElementById("list-box")
    files.forEach((file, index) => {
        const item = makeListItem(file.name, index)
        container.appendChild(item)
    });
}

function makeListItem(fileName, value){
    const option = document.createElement('option')
    const h1 = document.createElement('h1')
    h1.innerText = fileName
    option.value = value
    option.appendChild(h1)
    option.classList.add('list-item')

    return option
}

module.exports = {listbox_remove, renderListItems}