const restRoot = "http://localhost:1664/rest";

const app = {
    showElement: (DOMobject) => {
        DOMobject.classList.remove(`is-hidden`);
    },
    hideElement: (DOMobject) => {
        DOMobject.classList.add(`is-hidden`);
    },
    swapElements: (el1, el2) => {
        /* les nodeLists récupérés par querySelector ne sont pas des tableaux mais des objets itérables,
        on doit pouvoir traiter les deux, ainsi que les Elements du DOM */
        if (!(el1 instanceof Array) && !(el1 instanceof NodeList)) {
            app.hideElement(el1);
        } else {
            el1.forEach((el) => { app.hideElement(el); });
        };
        if (!(el2 instanceof Array) && !(el1 instanceof NodeList)) {
            app.showElement(el2);
        } else {
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
    deleteFromDOM:(type,id)=>{
        const DOMlist = document.querySelector(`[data-${type.toLowerCase()}-id="${id}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
    },
    addListeners: () => {

        /* gestion du click dans la fenetre */
        document.addEventListener("click", (e) => {
            /* si on clique en dehors d’un form de modification de titre de liste, on les ferme tous */
            if (!e.target.classList.contains("modifyListInput")) {
                const modifyListForms = document.querySelectorAll(".modifyList");
                const listNames = document.querySelectorAll(".listName");
                const trashcans = document.querySelectorAll(".deleteList");
                app.swapElements(modifyListForms, Array.from(listNames).concat(Array.from(trashcans)));
            };
            if (!e.target.classList.contains("modifyCardInput")) {
                const modifyCardForms = document.querySelectorAll(".modifyCard");
                const cardsContents = document.querySelectorAll(".cardContent");
                // console.log(modifyCardForms, cardsContents);
                app.swapElements(modifyCardForms, cardsContents);
            };
        });




        // for (const el of ["List", "Card"]) {

        //     const modal = document.getElementById(`add${el}Modal`);
        //     const form = modal.getElementsByTagName("form")[0];

        //     const closeButtons = modal.getElementsByClassName("close");
        //     // console.log("close", closeButtons);
        //     for (const button of closeButtons) {
        //         button.addEventListener("click", (e) => {
        //             app.killModal();
        //         });
        //     };

        //     console.log(modal);
        //     form.addEventListener("submit", async (e) => {
        //         e.preventDefault();
        //         const dataToSend = app.formToJson(e.target);
        //         /* On récupère la prochaine position de fin*/
        //         const position = document.querySelectorAll(`.sharedIdFor${el}`).length;
        //         dataToSend.position = position;
        //         console.log(position, dataToSend.position);
        //         if (!dataToSend.position)
        //             return;

        //         console.log(dataToSend);
        //         let res = await fetch(`${restRoot}/${el.toLowerCase()}`, {
        //             headers: { "Content-Type": "application/json; charset=utf-8" },
        //             method: 'POST',
        //             body: JSON.stringify(dataToSend)
        //         });
        //         res = await res.json();
        //         switch (el) {
        //             case "List":
        //                 app[`make${el}InDOM`](res);
        //                 break;
        //             case "Card":
        //                 app[`make${el}InDOM`](res);
        //                 /* todo */
        //                 break;
        //         };
        //         app.killModal();
        //     });
        // };


    },

    init: async () => {
        // labelModule.setLabelForm();
        await listModule.drawLists();
        app.addListeners();
        cardModule.addListeners();
        listModule.addListeners();
    }
};

document.addEventListener("DOMContentLoaded", app.init);