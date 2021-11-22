const restRoot = "http://localhost:1664/rest";

const app = {
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
            app.hideElement(el1);
        } else {
            // console.log("SWAP ALL", el1);
            el1.forEach((el) => { app.hideElement(el); });
        };
        if (!(el2 instanceof Array) && !(el2 instanceof NodeList)) {
            // console.log("SWAP SHOW ONE", el2);
            app.showElement(el2);
        } else {
            // console.log("SWAP ALL", el2);
            el2.forEach((el) => { app.showElement(el); });
        };
    },
    setRequest: (method, data) => {
        return {
            headers: { "Content-Type": "application/json; charset=utf-8" },
            method: method,
            body: JSON.stringify(data)
        }
    },
    rgbToHex:(RGBstring)=>{
        const rgbValsRX = /\d{1,3}/g;
        let newColor = RGBstring.match(rgbValsRX);
        console.log(newColor);
        newColor = newColor.map(el => {/* on convertit en number puis en chaine hexa */
            let hexVal=Number(el).toString(16);
            if(hexVal.length===1)//pour avoir un chiffre hexa sur 2 caractères
            hexVal="0"+hexVal;
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
    globalDraggable:(boolString)=>{
        const draggables=document.querySelectorAll(`.listMain,.cardMain,.labelMain`);
        console.log(boolString,draggables.length);
        draggables.forEach(el=>{
           el.setAttribute("draggable", boolString);
        });
    },
    addListeners: () => {

        /* gestion du click dans la fenetre */
        document.addEventListener("click", (e) => {
            /* si on clique en dehors d’un form de modification de titre de liste, on les ferme tous */
            if (!e.target.classList.contains("modifyListInput")) {
                const modifyListForms = document.querySelectorAll(".modifyList");
                const listNames = document.querySelectorAll(".listName");
                const trashcans = document.querySelectorAll(".deleteList");
                /* pour concaténer on transforme les NodeList en Array */
                app.swapElements(modifyListForms, Array.from(listNames).concat(Array.from(trashcans)));
            };

            /* si on clique en dehors d’un form de modification de LABEL, on les ferme tous */
            if (!e.target.closest(".editLabel")) {
                const modifyListForms = document.querySelectorAll(".editLabel");
                const labelNames = document.querySelectorAll(".labelName");
                app.swapElements(modifyListForms,labelNames);
            };

            /* On vérifie si le bouton cliqué est le crayon d’édition de carte.
            la sélection se fait avec closest à cause d’issues dues au SVG */
            const testEditCardButton = e.target.closest("form") ?
                e.target.closest("form").classList.contains("triggerPatchCard")
                : false;

            /* on vérifie que target n’est pas un élément du card edit form 
            pour tous les fermer */
            // if (!e.target.classList.contains("modifyCardInput")) {
            if (!e.target.closest(".modifyCard")) {
                let modifyCardForms = document.querySelectorAll(".modifyCard");
                const cardsContents = document.querySelectorAll(".cardContent");

                /* si le bouton cliqué est le crayon, on le retire de la liste des éléments à effacer
                le édit form courant, car son effacement est gérer par un autre évènement (celui du bouton crayon cliqué).
                Toute cette opération afin d’éviter des téléscopages d’events.
                Du coup les edit forms se ferment quand : on clique en dehors OU sur le bouton crayon (lui meme en dehors) */
                if (testEditCardButton) {

                    /* on passe de NodeList à Array pour avoir filter */
                    modifyCardForms = Array.from(modifyCardForms);
                    // console.log(modifyCardForms);
                    modifyCardForms = modifyCardForms
                        .filter(el => {
                            /* on garde dans le tableau des éléments à effacer que ceux qui
                             ne sont pas dans la meme carte que le bouton cliqué */
                            return e.target.closest(".cardMain") !== el.closest(".cardMain");
                        });
                };
                // console.log("longueur", modifyCardForms);

                // console.log(modifyCardForms, cardsContents);
                app.swapElements(modifyCardForms, cardsContents);
               
            };

            /* On réactive le drag n drop si l’élément cliqué n’est pas enfant des forms spécifiés */
             if(!e.target.closest("form.modifyCard,form.editLabel"))
              app.globalDraggable("true");

        });
    },

    init: async () => {
        // labelModule.setLabelForm();
        await listModule.drawLists();
        await labelModule.drawLabelsInDictionnary();
        app.addListeners();
        cardModule.addListeners();
        listModule.addListeners();
        labelModule.addListeners();
    }
};

document.addEventListener("DOMContentLoaded", app.init);