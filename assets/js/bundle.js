!function(){const e={showElement:e=>{e.classList.remove("is-hidden")},hideElement:e=>{e.classList.add("is-hidden")},swapElements:(t,a)=>{t instanceof Array||t instanceof NodeList?t.forEach(t=>{e.hideElement(t)}):e.hideElement(t),a instanceof Array||a instanceof NodeList?a.forEach(t=>{e.showElement(t)}):e.showElement(a)},setRequest:(e,t)=>({headers:{"Content-Type":"application/json; charset=utf-8"},method:e,body:JSON.stringify(t)}),rgbToHex:e=>{if(/#[a-zA-Z0-9]{6}/.test(e))return e;let t=e.match(/\d{1,3}/g);return console.log(t),t=t.map(e=>{let t=Number(e).toString(16);return 1===t.length&&(t="0"+t),t}),console.log(t),"#"+t.join("")},formToJson:e=>{const t=new FormData(e),a=t.keys(),o={};for(const l of a)o[l]=t.get(l);return o},checkType:(e,t)=>e.target.classList.contains(t.toLowerCase()+"Main"),triggerModal:(e,t={})=>{console.log("running");const a=document.getElementById(`add${e}Modal`),o=a.getElementsByTagName("form")[0];if(console.log(o),t)for(const l in t)o.querySelector("#"+l).value=t[l];a.classList.add("is-active")},killModal:()=>{const e=document.querySelectorAll(".modal.is-active");console.log(e),e.forEach(e=>{e.classList.remove("is-active")})},deleteFromDOM:(e,t)=>{const a=document.querySelector(`[data-${e.toLowerCase()}-id="${t}"]`);a.parentElement.removeChild(a)},globalDraggable:e=>{const t=document.querySelectorAll(".listMain,.cardMain,.labelMain");console.log(e,t.length),t.forEach(t=>{t.setAttribute("draggable",e)})}};var t={tools:e},b={restRoot:"http://localhost:1664/rest"};const o=t["tools"],l=b["restRoot"],r={makeLabelInDOM:(e,t)=>{const a=document.getElementById("labelTemplate"),o=document.importNode(a.content,!0),l=o.querySelector(".labelMain");l.setAttribute("data-label-id",e.id),l.style.setProperty("background-color",e.color);const n=o.querySelector(".labelName");n.textContent=e.name,n.addEventListener("dblclick",r.showEditLabel),o.querySelector(".deleteLabel").addEventListener("click",r.deleteLabel);const s=o.querySelector(".editLabel");s.addEventListener("submit",r.editLabel),s.querySelector(".colorInput").value=e.color,l.addEventListener("dragstart",r.onDragStart),t.appendChild(o)},onDragStart:e=>{console.log("startDrag");var t={id:e.target.getAttribute("data-label-id"),type:"label"};e.dataTransfer.setData("text/plain",JSON.stringify(t)),console.log(e.dataTransfer.getData("text/plain"))},onDragEnd:e=>{console.log(e.dataTransfer.getData("text/plain"))},showEditLabel:e=>{if(console.log(e.target.closest("#labelDictionary")),e.target.closest("#labelDictionary")){console.log("try to edit");const t=e.target.parentElement.querySelector(".editLabel");t.querySelector(".nameInput").value=e.target.textContent;const a=t.querySelector(".colorInput"),l=o.rgbToHex(a.value);a.value=l,o.swapElements(e.target,t)}},editLabel:async e=>{e.preventDefault();try{const t=o.formToJson(e.target),a=e.target.closest(".labelMain").getAttribute("data-label-id");let r=await fetch(l+"/label/"+a,o.setRequest("PATCH",t));if(r=await r.json(),console.log(r),1===r[0]){document.querySelectorAll(`[data-label-id="${a}"]`).forEach(e=>{e.querySelector(".labelName").textContent=t.name,e.style.setProperty("background-color",t.color)});const l=e.target.closest(".labelMain").querySelector(".labelName");console.log("LABELS",l),o.swapElements(e.target,l)}}catch(e){console.error(e)}},deleteLabel:async e=>{try{var t=e.target.closest(".labelMain").getAttribute("data-label-id");if(e.target.closest("#labelDictionary")){console.log("delete label from dict");let e=await fetch(l+"/label/"+t,o.setRequest("DELETE"));1===(e=await e.json())&&r.deleteEverywhere(t)}else if(e.target.closest(".labelContainer")){console.log("delete assoc");const t=e.target.closest(".cardMain").getAttribute("data-card-id"),a=e.target.parentElement.getAttribute("data-label-id");r.deleteAssociation(t,a)}}catch(e){console.error(e)}},deleteEverywhere:e=>{document.querySelectorAll(`[data-label-id="${e}"]`).forEach(t=>{o.deleteFromDOM("Label",e)})},createAssociation:async(e,t)=>{try{let a=await fetch(l+`/card/${e}/label/`+t,o.setRequest("POST"));a=await a.json();let n=await fetch(l+"/label/"+t);if(labelObj=await n.json(),a){const t=document.querySelector(`[data-card-id="${e}"]`).querySelector(".labelContainer");r.makeLabelInDOM(labelObj,t)}}catch(a){console.error(a)}},deleteAssociation:async(e,t)=>{try{let a=await fetch(l+`/card/${e}/label/`+t,o.setRequest("DELETE"));(a=await a.json())&&r.deleteLabelFromCardDOM(e,t)}catch(a){console.error(a)}},deleteLabelFromCardDOM:(e,t)=>{const a=document.querySelector(`[data-card-id="${e}"]`).querySelector(`[data-label-id="${t}"]`);a.parentElement.removeChild(a)},drawLabelsInDictionnary:async()=>{try{const e=document.getElementById("labelDictionary");let t=await fetch(l+"/label");(t=await t.json()).forEach(t=>{r.makeLabelInDOM(t,e)})}catch(e){console.error(e)}},addListeners:()=>{document.getElementById("addLabelButton").addEventListener("click",()=>{o.triggerModal("Label")});const e=document.getElementById("addLabelModal"),t=e.getElementsByTagName("form")[0],a=e.getElementsByClassName("close");for(const l of a)l.addEventListener("click",e=>{o.killModal()});t.addEventListener("submit",async t=>{t.preventDefault();t=o.formToJson(t.target);console.log(t);let a=await fetch(l+"/label",o.setRequest("POST",t));if(a=await a.json(),console.log(a[0]),a){const e=document.getElementById("labelDictionary");r.makeLabelInDOM(a[0],e)}o.killModal()})}};var n={labelModule:r};const s=t["tools"],c=b["restRoot"],d=n["labelModule"],i={makeCardInDOM:e=>{const t=document.getElementById("cardTemplate"),a=document.importNode(t.content,!0),o=a.querySelector(".cardMain");console.log(e.color),o.style.setProperty("background-color",e.color),o.setAttribute("data-card-id",e.id),o.setAttribute("data-card-position",e.position);const l=a.querySelector(".cardContent");console.log(l),l.textContent=e.content;const r=document.querySelector(`[data-list-id="${e.list_id}"]`);console.log(r);const n=a.querySelector(".triggerPatchCard"),s=a.querySelector(".triggerDeleteCard"),c=a.querySelector(".modifyCard");n.addEventListener("submit",i.handleShowHidePatchForm),o.addEventListener("drop",i.onDrop),o.addEventListener("dragover",i.onDragOver),o.addEventListener("dragstart",i.onDragStart),s.addEventListener("submit",i.handleDeleteCard),c.addEventListener("submit",t=>{t.preventDefault(),i.handlePatchCard(t,e)}),r.querySelector(".listContent").appendChild(a),e.labels&&e.labels.forEach(e=>{d.makeLabelInDOM(e,o.querySelector(".labelContainer"))})},onDragStart:e=>{s.checkType(e,"card")&&(e.dataTransfer.setData("text/plain",JSON.stringify({id:e.target.getAttribute("data-card-id"),type:"card"})),console.log(JSON.parse(e.dataTransfer.getData("text/plain"))))},onDragEnd:e=>{e.preventDefault()},onDrop:async e=>{e.preventDefault(),console.log("drop",e);const{id:t,type:a}=JSON.parse(e.dataTransfer.getData("text/plain"));if(console.log("drop data",a,t),"label"===a){const a=t;if(!e.target.querySelector(`[data-label-id="${a}"]`)){const t=e.target.closest(".cardMain").getAttribute("data-card-id");e.dataTransfer.clearData("text/plain"),d.createAssociation(t,a)}}else if("card"===a){const a=t,o=document.querySelector(`[data-card-id="${a}"]`),l=e.target.closest(".cardMain"),r=l.closest(".listMain");if(o&&o!==l)if(l.parentNode===o.parentNode){let e=o.getAttribute("data-card-position")-l.getAttribute("data-card-position")<0?"after":"before";const t=o.parentElement.removeChild(o);l[e](t),i.saveCardsPositions(r)}else{const t=l.getBoundingClientRect(),n=(t.bottom+t.top)/2;l[e.clientY<n?"before":"after"](o);const s=l.closest(".listMain"),c=r.dataset.listId,d=s.dataset.listId,u=l.dataset.cardId;i.changeListOfCard(a,c),i.changeListOfCard(u,d),i.saveCardsPositions(r),i.saveCardsPositions(s)}}},changeListOfCard:(e,t)=>{fetch(c+"/card/"+e,s.setRequest("PATCH",{list_id:t}))},saveCardsPositions:e=>{console.log("save ?");const t=e.querySelectorAll(".cardMain");let a=0;t.forEach(l=>{l.setAttribute("data-card-position",a++);var t=l.dataset.cardId,l={position:a},l=s.setRequest("PATCH",l);fetch(c+"/card/"+t,l)})},onDragEnter:e=>{e.preventDefault()},handleShowHidePatchForm:r=>{r.preventDefault();const t=r.target.closest(".cardMain"),a=t.querySelector(".modifyCard"),o=t.querySelector(".cardContent");a.querySelector(".modifyCardInput").value=o.textContent;const l=t.querySelector(".modifyColorInput");console.log("COLOR",t.style.getPropertyValue("background-color"));r=t.style.getPropertyValue("background-color");l.value=s.rgbToHex(r),console.log(l.value),console.log(a.classList.contains("is-hidden")),a.classList.contains("is-hidden")?(s.swapElements(o,a),s.globalDraggable("false")):(s.swapElements(a,o),s.globalDraggable("true"))},handlePatchCard:async(e,t)=>{let a,o;e.preventDefault();try{console.log("patching");const l=s.formToJson(e.target);let r=l.labels;delete l.labels;var n=c+"/card/"+t.id;cardDOM=e.target.closest(".cardMain"),o=cardDOM.querySelector(".cardContent"),a=e.target.closest(".cardMain").querySelector(".modifyCard"),console.log(l),await fetch(n,s.setRequest("PATCH",l)),o.textContent=l.content,cardDOM.style.setProperty("background-color",l.color),r=r.split(";");let i=document.getElementById("labelDictionary").querySelectorAll(".labelMain");i=Array.from(i),r.forEach(e=>{const a=i.find(t=>t.querySelector(".labelName").textContent===e);if(a){const e=a.getAttribute("data-label-id");d.createAssociation(t.id,e)}})}catch(e){console.error(e)}finally{s.swapElements(a,o)}},handleDeleteCard:t=>{t.preventDefault();t=t.target.closest(".cardMain").dataset.cardId;fetch(c+"/card/"+t,s.setRequest("DELETE",{id:t})),s.deleteFromDOM("card",t)},addListeners:()=>{const e=document.getElementById("addCardModal"),t=e.getElementsByClassName("close");for(const a of t)a.addEventListener("click",e=>{s.killModal()});e.getElementsByTagName("form")[0].addEventListener("submit",async e=>{try{console.log("modal submit"),e.preventDefault();const t=s.formToJson(e.target);let a=document.querySelectorAll(`.${"Card".toLowerCase()}Main`).length;a=a||0,t.position=a,console.log(a,t.position),console.log(t);let o=await fetch(c+"/"+"Card".toLowerCase(),s.setRequest("POST",t));o=await o.json(),console.log(o),o&&i.makeCardInDOM(o),s.killModal()}catch(e){console.log(e)}})}};var u={cardModule:i};const g=t["tools"],m=b["restRoot"],y=u["cardModule"],f={drawLists:async()=>{const e=await fetch(m+"/list"),t=await e.json();for(const a of t)f.makeListInDOM(a)},makeListInDOM:e=>{const t=document.getElementById("listTemplate"),a=document.importNode(t.content,!0),o=a.querySelector(".listMain");o.setAttribute("data-list-id",e.id),o.setAttribute("data-list-position",e.position);const l=a.querySelector(".listName");l.textContent=e.name,a.querySelector(".addCardToList").addEventListener("click",t=>{g.triggerModal("Card",{card_listId:e.id})});const r=a.querySelector(".deleteList");r.addEventListener("submit",async a=>{a.preventDefault();a=m+"/list/"+e.id;fetch(a,g.setRequest("DELETE",{id:e.id})),f.deleteListFromDOM(e.id)});const n=a.querySelector(".modifyList");if(n.addEventListener("submit",async t=>{t.preventDefault();try{var a=g.formToJson(t.target),o=m+"/list/"+e.id;console.log(o),await fetch(o,g.setRequest("PATCH",a)),l.textContent=a.name}catch(t){console.error(t)}finally{g.swapElements(n,[l,r])}}),l.addEventListener("dblclick",e=>{n.querySelector(".modifyListInput").value=e.target.textContent,g.swapElements([e.target,r],n)}),document.getElementById("addListButton").before(a),o.addEventListener("dragstart",f.onDragStart),o.addEventListener("drop",f.onDrop),e.cards)for(const s of e.cards)y.makeCardInDOM(s)},onDragStart:e=>{g.checkType(e,"list")&&(e.target.getAttribute("data-list-id"),e.dataTransfer.setData("text/plain",JSON.stringify({id:e.target.getAttribute("data-list-id"),type:"list"})),console.log(JSON.parse(e.dataTransfer.getData("text/plain"))))},onDrop:e=>{e.preventDefault(),console.log("drop",e.dataTransfer.getData("text/plain"));const{id:t,type:a}=JSON.parse(e.dataTransfer.getData("text/plain"));if(console.log("drop data",a,t),"list"===a){const a=t,o=document.querySelector(`[data-list-id="${a}"]`),l=e.target.closest(".listMain");if(o!==l){e.dataTransfer.clearData("text/plain");const t=o.dataset.listPosition-l.dataset.listPosition;console.log(t);let a=t<0?"after":"before";console.log(t<0),console.log(a);var r=o.parentElement.removeChild(o);l[a](r),f.saveListsPositions()}}else if("card"===a&&!e.target.querySelector(".cardMain")){console.log("add first card ?");const a=document.querySelector(`[data-card-id="${t}"]`),o=a.parentElement.removeChild(a);e.target.closest(".listMain").querySelector(".listContent").append(o),f.saveListsPositions()}},onDragOver:e=>{e.preventDefault()},saveListsPositions:()=>{const e=document.querySelectorAll(".listMain");let t=0;e.forEach(l=>{l.setAttribute("data-list-position",t++);var a=l.dataset.listId,l={position:t},l=g.setRequest("PATCH",l);fetch(m+"/list/"+a,l)})},deleteListFromDOM:e=>{const t=document.querySelector(`[data-list-id="${e}"]`);t.parentElement.removeChild(t)},addListeners:()=>{document.getElementById("addListButton").addEventListener("click",e=>{g.triggerModal("List")});const e=document.getElementById("addListModal"),t=e.getElementsByTagName("form")[0],a=e.getElementsByClassName("close");for(const o of a)o.addEventListener("click",e=>{g.killModal()});t.addEventListener("submit",async e=>{e.preventDefault();const t=g.formToJson(e.target),a=document.querySelectorAll(`.${"List".toLowerCase()}Main`).length;if(t.position=a,console.log(a,t.position),t.position){console.log(t);let o=await fetch(m+"/"+"List".toLowerCase(),g.setRequest("POST",t));o=await o.json(),f.makeListInDOM(o),g.killModal()}})}};b={listModule:f};const p=t["tools"],L=u["cardModule"],E=b["listModule"],h=n["labelModule"],D={addListeners:()=>{document.addEventListener("click",e=>{if(!e.target.classList.contains("modifyListInput")){const e=document.querySelectorAll(".modifyList"),t=document.querySelectorAll(".listName"),a=document.querySelectorAll(".deleteList");p.swapElements(e,Array.from(t).concat(Array.from(a)))}if(!e.target.closest(".editLabel")){const e=document.querySelectorAll(".editLabel"),t=document.querySelectorAll(".labelName");p.swapElements(e,t)}const t=!!e.target.closest("form")&&e.target.closest("form").classList.contains("triggerPatchCard");if(!e.target.closest(".modifyCard")){let a=document.querySelectorAll(".modifyCard");var o=document.querySelectorAll(".cardContent");t&&(a=(a=Array.from(a)).filter(t=>e.target.closest(".cardMain")!==t.closest(".cardMain"))),p.swapElements(a,o)}e.target.closest("form.modifyCard,form.editLabel")||p.globalDraggable("true")})},init:async()=>{await E.drawLists(),await h.drawLabelsInDictionnary(),D.addListeners(),L.addListeners(),E.addListeners(),h.addListeners()}};document.addEventListener("DOMContentLoaded",D.init)}();