export function newCard(parent,content,mustAppend=true){
    this=document.createElement("article");
    this.textContent=content;
    if(mustAppend){
       parent.appendChild(this);
    }else{
       parent.prependChild(this);
    };
     return dom;
    }