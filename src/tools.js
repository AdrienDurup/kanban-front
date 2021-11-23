const tools={
    showElement: (DOMobject) => {

        // console.log("showElement", DOMobject);
        // console.log("showElement", DOMobject.classList.contains(`is-hidden`));
        DOMobject.classList.remove(`is-hidden`);
        //
        // console.log("showElement", DOMobject.classList.contains(`is-hidden`));
    },
    hideElement: (DOMobject) => {
        DOMobject.classList.add(`is-hidden`);
    },
    swapElements: (el1, el2) => {
        /* les nodeLists récupérés par querySelector ne sont pas des tableaux mais des objets itérables,
        on doit pouvoir traiter les deux, ainsi que les Elements du DOM */
        // console.log("SWAP");
        if (!(el1 instanceof Array) && !(el1 instanceof NodeList)) {
            // console.log("SWAP ONE", el1);
            tools.hideElement(el1);
        } else {
            // console.log("SWAP ALL", el1);
            el1.forEach((el) => { tools.hideElement(el); });
        };
        if (!(el2 instanceof Array) && !(el2 instanceof NodeList)) {
            // console.log("SWAP SHOW ONE", el2);
            tools.showElement(el2);
        } else {
            // console.log("SWAP ALL", el2);
            el2.forEach((el) => { tools.showElement(el); });
        };
    },
    setRequest: (method, data) => {
        return {
            headers: { "Content-Type": "application/json; charset=utf-8" },
            method: method,
            body: JSON.stringify(data)
        }
    },
    rgbToHex: (RGBstring) => {

        if(/#[a-zA-Z0-9]{6}/.test(RGBstring))//si la string est déjà en hex, la retourner
        return RGBstring;
        
        const rgbValsRX = /\d{1,3}/g;

        let newColor = RGBstring.match(rgbValsRX);
        console.log(newColor);
        newColor = newColor.map(el => {/* on convertit en number puis en chaine hexa */
            let hexVal = Number(el).toString(16);
            if (hexVal.length === 1)//pour avoir un chiffre hexa sur 2 caractères
                hexVal = "0" + hexVal;
            return hexVal;
        });
        console.log(newColor);
        return `#${newColor.join("")}`;/* On récupère une couleur hexa */
    },
    formToJson: (form) => {
        const data = new FormData(form);
        const keys = data.keys();//keys est un objet itérable. en tant qu’itérable il fonctionne avec for of (et non for in)
        const dataToSend = {};
        //On réucupère les données du formulaire
        for (const key of keys) {
            dataToSend[key] = data.get(key);
        };
        return dataToSend;
    },
    checkType:(e,wantedType)=>{
        const check=e.target.classList.contains(`${wantedType.toLowerCase()}Main`);
        return check;
    },
    triggerModal: (name, data = {}) => {
        console.log("running");
        const modal = document.getElementById(`add${name}Modal`);
        const form = modal.getElementsByTagName("form")[0];
        console.log(form);
        if (data) {
            for (const key in data) {
                const elem = form.querySelector(`#${key}`);
                elem.value = data[key];
            };
        };
        modal.classList.add("is-active");
    },
    killModal: () => {
        /* kill toutes les modales */
        const modals = document.querySelectorAll(".modal.is-active");
        console.log(modals);
        modals.forEach((el) => { el.classList.remove("is-active") });
    },
    deleteFromDOM: (type, id) => {
        const DOMelement = document.querySelector(`[data-${type.toLowerCase()}-id="${id}"]`);
        DOMelement.parentElement.removeChild(DOMelement);
    },
    globalDraggable: (boolString) => {
        const draggables = document.querySelectorAll(`.listMain,.cardMain,.labelMain`);
        console.log(boolString, draggables.length);
        draggables.forEach(el => {
            el.setAttribute("draggable", boolString);
        });
    },
}

module.exports={tools};