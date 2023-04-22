function listbox_remove(sourceID) {

    const items = document.querySelectorAll('.list-item')
    items.forEach((item)=> {
        if(item.classList.contains('active')){
            item.remove()
        }
    })

    // var src = document.getElementById('list-items');
 
    // for(var count= src.options.length-1; count >= 0; count--) {

    //     if(src.options[count].selected == true) {
 
    //             try {
    //                      src.remove(count, null);
                        
    //              } catch(error) {
                        
    //                      src.remove(count);
    //             }
    //     }
    // }
}



function renderListItems(files){
    const container = document.getElementById("list-box")
    files.forEach((file, index) => {
        const item = makeListItem(file, index)
        container.appendChild(item)
    });
}

function makeListItem(file, value){
    const li = document.createElement('li')
    li.innerText = file.name
    li.classList.add('list-item')
    li.id = 'list-item'
    li.setAttribute('path', file.filePath)

    li.addEventListener('click', ()=> {
        if(li.classList.contains('active')){
            li.classList.remove('active')
        } else {
            li.classList.add('active')
        }
    
    })
   

    return li
}

module.exports = {listbox_remove, renderListItems}