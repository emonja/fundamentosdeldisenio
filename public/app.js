'use strict';
const dialog=document.getElementById('info-dialog');
const content=document.getElementById('dialog-content');
let returnFocus=null;
for(const trigger of document.querySelectorAll('[data-dialog]')){
  trigger.addEventListener('click',()=>{
    const template=document.getElementById(trigger.dataset.dialog);
    if(!template)return;
    returnFocus=trigger;
    content.replaceChildren(template.content.cloneNode(true));
    dialog.showModal();dialog.scrollTop=0;
    document.body.style.overflow='hidden';
  });
}
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';content.replaceChildren();returnFocus?.focus();});
