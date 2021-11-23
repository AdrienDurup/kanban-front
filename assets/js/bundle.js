(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {tools}=require("./tools");
const {cardModule}=require("./card");
const {listModule}=require("./list");
const {labelModule}=require("./label");

const app = {
    addListeners: () => {
        /* gestion du click dans la fenetre */
        document.addEventListener("click", (e) => {
            /* si on clique en dehors d’un form de modification de titre de liste, on les ferme tous */
            if (!e.target.classList.contains("modifyListInput")) {
                const modifyListForms = document.querySelectorAll(".modifyList");
                const listNames = document.querySelectorAll(".listName");
                const trashcans = document.querySelectorAll(".deleteList");
                /* pour concaténer on transforme les NodeList en Array */
                tools.swapElements(modifyListForms, Array.from(listNames).concat(Array.from(trashcans)));
            };

            /* si on clique en dehors d’un form de modification de LABEL, on les ferme tous */
            if (!e.target.closest(".editLabel")) {
                const modifyListForms = document.querySelectorAll(".editLabel");
                const labelNames = document.querySelectorAll(".labelName");
                tools.swapElements(modifyListForms, labelNames);
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
                tools.swapElements(modifyCardForms, cardsContents);

            };

            /* On réactive le drag n drop si l’élément cliqué n’est pas enfant des forms spécifiés */
            if (!e.target.closest("form.modifyCard,form.editLabel"))
            tools.globalDraggable("true");

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
},{"./card":2,"./label":3,"./list":4,"./tools":6}],2:[function(require,module,exports){
const {tools}=require("./tools");
const {restRoot}=require("./restRoot");
const {labelModule}=require("./label"); 

const cardModule = {
    makeCardInDOM: (card) => {
        const template = document.getElementById("cardTemplate");
        const clone = document.importNode(template.content, true);

        const main = clone.querySelector(".cardMain");
        console.log(card.color);
        main.style.setProperty("background-color", card.color);
        main.setAttribute("data-card-id", card.id);
        main.setAttribute("data-card-position", card.position);

        const content = clone.querySelector(".cardContent");
        console.log(content);
        content.textContent = card.content;

        // const labelContainer=clone.querySelector(".labelContainer");
        // labelContainer.addEventListener("dragover",(e)=>{
        //     e.preventDefault;
        // });

        const list = document.querySelector(`[data-list-id="${card.list_id}"]`);
        console.log(list);

        const showHidePatchCardForm = clone.querySelector(".triggerPatchCard");
        const triggerDeleteCard = clone.querySelector(".triggerDeleteCard");
        const editForm = clone.querySelector(".modifyCard");
        showHidePatchCardForm.addEventListener("submit", cardModule.handleShowHidePatchForm);

        /* DRAG AND DROP */
        /* avoid d&d on inputs : see below handleShowHidePatchForm*/
        /* d&d events */
        main.addEventListener("drop", cardModule.onDrop);
        main.addEventListener("dragover", cardModule.onDragOver);
        main.addEventListener("dragstart", cardModule.onDragStart);
        // main.addEventListener("drag", cardModule.onDrag);
        // main.addEventListener("dragend", cardModule.onDragEnd);

        /* =========A DETACHER */
        triggerDeleteCard.addEventListener("submit",cardModule.handleDeleteCard);

        editForm.addEventListener("submit", (e) => { e.preventDefault(); cardModule.handlePatchCard(e, card); });

        /* Append */
        const listContent = list.querySelector(".listContent");
        listContent.appendChild(clone);

        /* on rajoute les labels quand la carte est déja dans le DOM */
        if (card.labels) {
            card.labels.forEach(label => {
                labelModule.makeLabelInDOM(label, main.querySelector(".labelContainer"));
            });
        };

    },
    onDragStart: (e) => {
       if(tools.checkType(e,"card")){
                   e.dataTransfer.setData("text/plain", JSON.stringify({
            id: e.target.getAttribute("data-card-id"),
            type: "card"
        }));
        console.log(JSON.parse(e.dataTransfer.getData("text/plain")));
       };
    },
    onDragEnd: (e) => {
        e.preventDefault();
        // tools.showElement(e.target);
    },
    onDrop: async (e) => {
        e.preventDefault();
        console.log("drop", e);
        const { id, type } = JSON.parse(e.dataTransfer.getData("text/plain"));
        console.log("drop data", type, id);
        if (type === "label") {
            const labelId = id;
            const cardId = e.target.closest(".cardMain").getAttribute("data-card-id");
            e.dataTransfer.clearData("text/plain");
            labelModule.createAssociation(cardId, labelId);
        } else if (type === "card") {
            const cardId = id;
            const draggedCard = document.querySelector(`[data-card-id="${cardId}"]`);
            const targetedCard = e.target.closest(".cardMain");
            const list = targetedCard.closest(".listMain");
            
            if (draggedCard
                &&draggedCard!==targetedCard) {

                /* controler si dans la meme liste et check placer en avant en arrière */
                if (targetedCard.parentNode === draggedCard.parentNode) {
                    const draggedPosition = draggedCard.getAttribute("data-card-position");
                    const targetedPosition = targetedCard.getAttribute("data-card-position");
                    const moveIndex = draggedPosition - targetedPosition;
                    /* déplacer la carte après ou avant en fonction */
                    let method = moveIndex < 0 ? "after" : "before";
                    const draggedCardDetached = draggedCard.parentElement.removeChild(draggedCard);
                    targetedCard[method](draggedCardDetached);
                    
                    cardModule.saveCardsPositions(list);
             /* si sur deux listes, ça fonctionne différemment :
             la carte se place en fonction du pointeur par rapport au centre de la carte cible. Si au dessus se place au dessus,
             Si en dessous se place en dessous. */
                } else {
                    const targetedCardBounding = targetedCard.getBoundingClientRect();//objet qui contient toutes les infos de positionnement
                    const boxHeightCenter = (targetedCardBounding.bottom + targetedCardBounding.top) / 2;
                    const method=e.clientY<boxHeightCenter?"before":"after";
                    targetedCard[method](draggedCard);

                    const list2 = targetedCard.closest(".listMain");
                    const draggedCardListId=list.dataset.listId;
                    const targetCardListId=list2.dataset.listId;
                    const targetCardId=targetedCard.dataset.cardId;
                    cardModule.changeListOfCard(cardId,draggedCardListId);
                    cardModule.changeListOfCard(targetCardId,targetCardListId);
                    cardModule.saveCardsPositions(list);
                    cardModule.saveCardsPositions(list2);
                };

            };
        };


    },
    changeListOfCard:(cardId,listId)=>{
        fetch(`${restRoot}/card/${cardId}`, tools.setRequest("PATCH",{list_id:listId}));
    },
    saveCardsPositions: (listDOM) => {
        console.log("save ?");
        const cards = listDOM.querySelectorAll(".cardMain");
        let newPositionIndex = 0;
        cards.forEach( el => {
            el.setAttribute("data-card-position", newPositionIndex++);
            const id = el.dataset.cardId;
            const dataToSend = {
                position: newPositionIndex
            };
            const requestObject = tools.setRequest("PATCH", dataToSend);
            // console.log(requestObject);
            fetch(`${restRoot}/card/${id}`, requestObject);
            // console.log(await res.json());
        });

    },
    onDragEnter: (e) => {
        e.preventDefault();
    },
    handleShowHidePatchForm: (e) => {
        e.preventDefault();
        const card = e.target.closest(".cardMain");//on récupère la carte
        const editForm = card.querySelector(".modifyCard");//son formulaire d’édition
        const content = card.querySelector(".cardContent");//le container du texte
        // const showFormButton = card.querySelector(".editButton");//le container du texte

        const textarea = editForm.querySelector(".modifyCardInput");
        /* textarea a une propriété value mais pas d’attribut value */
        textarea.value = content.textContent;

        /* on fournit la couleur au champ */
        const color = card.querySelector(".modifyColorInput");
        console.log("COLOR", card.style.getPropertyValue("background-color"));

        const currentCardColor = card.style.getPropertyValue("background-color");
        color.value = tools.rgbToHex(currentCardColor);/* On récupère une couleur hexa */
        console.log(color.value);

        /* Attention : event sur la fenetre ET sur le bouton d’affichage de editForm :
        les deux peuvent s’annuler.Gestion de la fermeture sur tools.listeners */
        console.log(editForm.classList.contains("is-hidden"));
        if (editForm.classList.contains("is-hidden")) {
            tools.swapElements(content, editForm);
            /* disable card draggable when editForm becomes visible */
            tools.globalDraggable("false");
        } else {
            tools.swapElements(editForm, content);
            /* allow card draggable when editForm becomes invisible */
            tools.globalDraggable("true");
        };

    },
    handlePatchCard: async (e, card) => {
        e.preventDefault();
        let patchCard;
        let content;
        try {
            console.log("patching");
            const dataToSend = tools.formToJson(e.target);
            /* on récupère la string des labels */
            let labelNames = dataToSend.labels;

            /* update une carte */
            delete dataToSend.labels;//on supprime avant d’envoyer en base
            const route = `${restRoot}/card/${card.id}`;
            cardDOM = e.target.closest(".cardMain");
            content = cardDOM.querySelector(".cardContent");
            patchCard = e.target.closest(".cardMain").querySelector(".modifyCard");
            console.log(dataToSend);
            await fetch(route, tools.setRequest("PATCH", dataToSend));
            content.textContent = dataToSend.content;
            cardDOM.style.setProperty("background-color", dataToSend.color);

            /* créer des associations de labels */
            labelNames = labelNames.split(";");//tableau des labels
            let labelInDictionary = document.getElementById("labelDictionary").querySelectorAll(".labelMain");//nodeList des labels en haut de page
            //On en fait un tableau
            labelInDictionary = Array.from(labelInDictionary);
            /* Pour chaque nom de label envoyé dans le champ, on cherche le label correspondant et on l’associe. */
            labelNames.forEach(labelName => {
                /* On récupère le label qui porte le nom qu’on cherche à associer */
                const label = labelInDictionary.find(elInDict => {
                    const labelNameFromDict = elInDict.querySelector(".labelName").textContent;
                    return labelNameFromDict === labelName;
                });
                if (label) {
                    const labelId = label.getAttribute(`data-label-id`);
                    labelModule.createAssociation(card.id, labelId);
                };

            });
        } catch (e) {
            console.error(e);
        } finally {
            tools.swapElements(patchCard, content);
        };

    },
    handleDeleteCard:(e)=>{
            e.preventDefault();
            const cardId=e.target.closest(".cardMain").dataset.cardId;
            const route = `${restRoot}/card/${cardId}`;
            fetch(route, tools.setRequest("DELETE", { id: cardId }));
            tools.deleteFromDOM("card", cardId);
    },
    addListeners: () => {
        const el = "Card";

        const modal = document.getElementById(`add${el}Modal`);


        /* gestion des boutons de fermeture */
        const closeButtons = modal.getElementsByClassName("close");
        // console.log("close", closeButtons);
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                tools.killModal();
            });
        };


        const form = modal.getElementsByTagName("form")[0];
        form.addEventListener("submit", async (e) => {
            try {
                console.log("modal submit");
                e.preventDefault();
                const dataToSend = tools.formToJson(e.target);

                /* On récupère la prochaine position de fin*/
                let position = document.querySelectorAll(`.${el.toLowerCase()}Main`).length;
                if (!position)
                    position = 0;

                dataToSend.position = position;

                console.log(position, dataToSend.position);
                // if (!dataToSend.position)
                //     return;

                console.log(dataToSend);
                let res = await fetch(`${restRoot}/${el.toLowerCase()}`, tools.setRequest("POST", dataToSend));
                res = await res.json();
                console.log(res);
                /* La partie qui change d’une modale à l’autre */
                if (res)
                    cardModule.makeCardInDOM(res);

                tools.killModal();
            } catch (e) {
                console.log(e);
            };
        });


    },
};
module.exports= {cardModule};
},{"./label":3,"./restRoot":5,"./tools":6}],3:[function(require,module,exports){
const { tools } = require("./tools");
const { restRoot } = require("./restRoot");

const labelModule = {
    makeLabelInDOM: (label, container) => {
        const template = document.getElementById("labelTemplate");
        const clone = document.importNode(template.content, true);

        const labelMain = clone.querySelector(".labelMain");
        labelMain.setAttribute("data-label-id", label.id);
        // labelMain.setAttribute("data-label-color", label.color);
        labelMain.style.setProperty("background-color", label.color);

        const labelName = clone.querySelector(".labelName");
        labelName.textContent = label.name;
        labelName.addEventListener("dblclick", labelModule.showEditLabel);

        const deleteButton = clone.querySelector(".deleteLabel");
        deleteButton.addEventListener("click", labelModule.deleteLabel);

        const editForm = clone.querySelector(".editLabel");
        editForm.addEventListener("submit", labelModule.editLabel);
        const colorInput=editForm.querySelector(".colorInput");
        colorInput.value=label.color;
        
        /* DRAG AND DROP */
        labelMain.addEventListener("dragstart", labelModule.onDragStart);

        /* Append */
        container.appendChild(clone);
    },
    onDragStart: (e) => {
        // e.preventDefault();
        console.log("startDrag");
        const obj = {
            id: e.target.getAttribute("data-label-id"),
            type: "label"
        }
        e.dataTransfer.setData("text/plain", JSON.stringify(obj));
        console.log(e.dataTransfer.getData("text/plain"));

    },
    onDragEnd: (e) => {
        console.log(e.dataTransfer.getData("text/plain"));
    },
    showEditLabel: (e) => {
        console.log(e.target.closest("#labelDictionary"));
        if (e.target.closest("#labelDictionary")) {
            console.log("try to edit");
            const label = e.target.parentElement;
            const form = label.querySelector(".editLabel");
            form.querySelector(".nameInput").value = e.target.textContent;
            const colorInput=form.querySelector(".colorInput");
            const hexColor=tools.rgbToHex(colorInput.value);
            colorInput.value=hexColor;
            tools.swapElements(e.target, form);
        };

    },
    editLabel: async (e) => {
        e.preventDefault();
        try {
            const data = tools.formToJson(e.target);
            const labelId = e.target.closest(".labelMain").getAttribute("data-label-id");
            let res = await fetch(`${restRoot}/label/${labelId}`, tools.setRequest("PATCH", data));
            res = await res.json();
            console.log(res);
            if (res[0] === 1) {
                const labelName = e.target.parentElement.querySelector(".labelName");
                labelName.textContent = data.name;
                labelName.parentElement.style.setProperty("background-color", data.color);
                labelName.textContent = data.name;
                tools.swapElements(e.target, labelName);
            };

        } catch (e) {
            console.error(e);
        };
    },
    deleteLabel: async (e) => {
        try {
            const label = e.target.closest(".labelMain");
            const labelId = label.getAttribute("data-label-id");
            /* vérifions où se trouve le label */
            /* Près du bouton "ajouter Label" */
            if (e.target.closest("#labelDictionary")) {
                console.log("delete label from dict");
                let res = await fetch(`${restRoot}/label/${labelId}`, tools.setRequest("DELETE"));
                res = await res.json();

                if (res === 1)
                    labelModule.deleteEverywhere(labelId);

                /* Dans une card */
            } else if (e.target.closest(".labelContainer")) {
                console.log("delete assoc");
                const cardId = e.target.closest(".cardMain").getAttribute("data-card-id");
                const labelId = e.target.parentElement.getAttribute("data-label-id");
                labelModule.deleteAssociation(cardId, labelId);
            };
        } catch (e) {
            console.error(e);
        };

    },
    deleteEverywhere: (id) => {
        const elements = document.querySelectorAll(`[data-label-id="${id}"]`);
        elements.forEach((el) => {
            tools.deleteFromDOM("Label", id);
        });
    },
    createAssociation: async (cardId, labelId) => {
        try {
            let res = await fetch(`${restRoot}/card/${cardId}/label/${labelId}`, tools.setRequest("POST"));
            res = await res.json();
            let res2 = await fetch(`${restRoot}/label/${labelId}`);
            labelObj = await res2.json();
            // console.log(res);
            // console.log("container",document.querySelector(`[data-card-id="${cardId}"]`));
            if (res) {
                const card = document.querySelector(`[data-card-id="${cardId}"]`);
                const labelContainer = card.querySelector(".labelContainer");
                labelModule.makeLabelInDOM(labelObj, labelContainer);
            };

        } catch (e) {
            console.error(e);
        };
    },
    deleteAssociation: async (cardId, labelId) => {
        try {
            let res = await fetch(`${restRoot}/card/${cardId}/label/${labelId}`, tools.setRequest("DELETE"));
            res = await res.json();

            if (res)
                labelModule.deleteLabelFromCardDOM(cardId, labelId);

        } catch (e) {
            console.error(e);
        };
    },
    deleteLabelFromCardDOM: (cardId, labelId) => {
        const card = document.querySelector(`[data-card-id="${cardId}"]`);
        const label = card.querySelector(`[data-label-id="${labelId}"]`);
        label.parentElement.removeChild(label);
    },
    drawLabelsInDictionnary: async () => {
        try {
            const container = document.getElementById("labelDictionary");
            let res = await fetch(`${restRoot}/label`);
            res = await res.json();
            res.forEach(el => {
                labelModule.makeLabelInDOM(el, container);
            });
        } catch (e) {
            console.error(e);
        };

    },
    addListeners: () => {
        const addLabelButton = document.getElementById("addLabelButton");
        addLabelButton.addEventListener("click", () => { tools.triggerModal("Label") });

        const modal = document.getElementById(`addLabelModal`);
        const form = modal.getElementsByTagName("form")[0];

        const closeButtons = modal.getElementsByClassName("close");
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                tools.killModal();
            });
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const dataToSend = tools.formToJson(e.target);
            console.log(dataToSend);

            let res = await fetch(`${restRoot}/label`, tools.setRequest("POST", dataToSend));
            res = await res.json();//tableau avec 0:objet 1:isCreated
            console.log(res[0])
            /* La partie qui change d’une modale à l’autre */
            if (res) {
                const container = document.getElementById("labelDictionary");
                labelModule.makeLabelInDOM(res[0], container);
            };


            tools.killModal();
        });

    },
};
module.exports = { labelModule };
},{"./restRoot":5,"./tools":6}],4:[function(require,module,exports){
const {tools}=require("./tools");
const {restRoot}=require("./restRoot");
const {cardModule}=require("./card");

const listModule = {
    drawLists: async () => {
        const result = await fetch(`${restRoot}/list`);
        const lists = await result.json();
        for (const el of lists) {
            listModule.makeListInDOM(el);
        };
    },
    makeListInDOM: (list) => {
        const template = document.getElementById("listTemplate");
        const clone = document.importNode(template.content, true);
        // console.log(clone);
        const listMain = clone.querySelector(`.listMain`);
        listMain.setAttribute("data-list-id", list.id);
        listMain.setAttribute("data-list-position", list.position);

        /* on fournit le titre */
        const title = clone.querySelector(".listName");
        title.textContent = list.name;

        const plus = clone.querySelector(".addCardToList");
        /* Gestion du bouton + pour ajouter une carte */
        plus.addEventListener("click", (e) => {
            tools.triggerModal("Card", { card_listId: list.id });
        });

        /* gestion du bouton poubelle pour supprimer une liste */
        const trashcan = clone.querySelector(".deleteList");
        trashcan.addEventListener("submit", async (e) => {
            e.preventDefault();
            const route = `${restRoot}/list/${list.id}`;
            fetch(route, tools.setRequest("DELETE", { id: list.id }));
            listModule.deleteListFromDOM(list.id);
        });


        /* gestion du formulaire pour modifier le titre */
        const modify = clone.querySelector(".modifyList");
        modify.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                const dataToSend = tools.formToJson(e.target);
                const route = `${restRoot}/list/${list.id}`;
                console.log(route);
                await fetch(route, tools.setRequest("PATCH", dataToSend));
                title.textContent = dataToSend.name;
            } catch (e) {
                console.error(e);
            } finally {
                tools.swapElements(modify, [title, trashcan]);
            };
        });

        title.addEventListener("dblclick", (e) => {
            const input = modify.querySelector(".modifyListInput");
            input.value = e.target.textContent;
            tools.swapElements([e.target, trashcan], modify);
        });
        document.getElementById("addListButton").before(clone);

        /* DRAG AND DROP */
        /* Attach D&D listeners on list */
        listMain.addEventListener("dragstart", listModule.onDragStart);
        listMain.addEventListener("drop", listModule.onDrop);
        // listMain.addEventListener("dragover", listModule.onDragOver);

        if (list.cards) {
            for (const el of list.cards) {
                cardModule.makeCardInDOM(el);
            };
        };
    },
    onDragStart: (e) => {
        if(tools.checkType(e,"list")){
                    const draggedId = e.target.getAttribute("data-list-id");
        // if (draggedId) {
            e.dataTransfer.setData("text/plain", JSON.stringify({
                id: e.target.getAttribute("data-list-id"),
                type: "list"
            }));
            console.log(JSON.parse(e.dataTransfer.getData("text/plain")));
        // } else {
        //     console.error("dragged id undefined ?");
        //};

        };

    },
    onDrop: (e) => {
        e.preventDefault();
        console.log("drop", e.dataTransfer.getData("text/plain"));
        const { id, type } = JSON.parse(e.dataTransfer.getData("text/plain"));
        console.log("drop data", type, id);
        if (type === "list") {
            const draggedId = id;
            const draggedList = document.querySelector(`[data-list-id="${draggedId}"]`);
            const targetedList = e.target.closest(".listMain");
            // const targetedId = targetedList.getAttribute("data-list-id");

            if(draggedList!==targetedList){
            e.dataTransfer.clearData("text/plain");

            const draggedPosition = draggedList.dataset.listPosition;
            const targetedPosition = targetedList.dataset.listPosition;
            const moveIndex = draggedPosition - targetedPosition;
            console.log(moveIndex);
            /* déplacer la liste après ou avant en fonction */
            let method = moveIndex < 0 ? "after" : "before";
            console.log(moveIndex < 0);
            console.log(method);
            const draggedListDetached = draggedList.parentElement.removeChild(draggedList);
            targetedList[method](draggedListDetached);

            listModule.saveListsPositions();
            };


        };
    },
    onDragOver: (e) => {
        e.preventDefault();


    },
    saveListsPositions: () => {
        const lists = document.querySelectorAll(".listMain");
        let newPositionIndex=0;
        lists.forEach(el => {
            el.setAttribute("data-list-position", newPositionIndex++);
            const id = el.dataset.listId;
            const dataToSend = {
                position: newPositionIndex
            };
            const requestObject = tools.setRequest("PATCH", dataToSend);
            fetch(`${restRoot}/list/${id}`, requestObject);
        });
    },
    deleteListFromDOM: (listId) => {
        const DOMlist = document.querySelector(`[data-list-id="${listId}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
    },
    addListeners: () => {
        /* gestion du bouton ajouter des listes */
        const button = document.getElementById("addListButton");
        button.addEventListener("click", (e) => {
            tools.triggerModal("List");
        });

        /* gestion boutons pour ajouter une carte */
        // const plus = document.querySelectorAll(".addCardToList");
        // console.log(",éuèoéu,oéu",plus);
        // plus.forEach((el) => {
        //     console.log("element peopouepoé",el);
        //     el.addEventListener("click", (e) => {
        //         console.log("plus", e);
        //         tools.triggerModal("Card", { card_listId: list.id });
        //     });
        //     console.log(el.addEventListener);
        // })


        const el = "List";

        const modal = document.getElementById(`add${el}Modal`);
        const form = modal.getElementsByTagName("form")[0];

        const closeButtons = modal.getElementsByClassName("close");
        // console.log("close", closeButtons);
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                tools.killModal();
            });
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const dataToSend = tools.formToJson(e.target);

            /* On récupère la prochaine position de fin*/
            const position = document.querySelectorAll(`.${el.toLowerCase()}Main`).length;
            dataToSend.position = position;
            console.log(position, dataToSend.position);
            if (!dataToSend.position)
                return;

            console.log(dataToSend);
            let res = await fetch(`${restRoot}/${el.toLowerCase()}`, tools.setRequest("POST", dataToSend));
            res = await res.json();

            /* La partie qui change d’une modale à l’autre */
            listModule.makeListInDOM(res);

            tools.killModal();
        });
    }
};
module.exports= {listModule};
},{"./card":2,"./restRoot":5,"./tools":6}],5:[function(require,module,exports){
const restRoot=`http://localhost:1664/rest`;
module.exports={restRoot};
},{}],6:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL2NhcmQuanMiLCJzcmMvbGFiZWwuanMiLCJzcmMvbGlzdC5qcyIsInNyYy9yZXN0Um9vdC5qcyIsInNyYy90b29scy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHt0b29sc309cmVxdWlyZShcIi4vdG9vbHNcIik7XG5jb25zdCB7Y2FyZE1vZHVsZX09cmVxdWlyZShcIi4vY2FyZFwiKTtcbmNvbnN0IHtsaXN0TW9kdWxlfT1yZXF1aXJlKFwiLi9saXN0XCIpO1xuY29uc3Qge2xhYmVsTW9kdWxlfT1yZXF1aXJlKFwiLi9sYWJlbFwiKTtcblxuY29uc3QgYXBwID0ge1xuICAgIGFkZExpc3RlbmVyczogKCkgPT4ge1xuICAgICAgICAvKiBnZXN0aW9uIGR1IGNsaWNrIGRhbnMgbGEgZmVuZXRyZSAqL1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIC8qIHNpIG9uIGNsaXF1ZSBlbiBkZWhvcnMgZOKAmXVuIGZvcm0gZGUgbW9kaWZpY2F0aW9uIGRlIHRpdHJlIGRlIGxpc3RlLCBvbiBsZXMgZmVybWUgdG91cyAqL1xuICAgICAgICAgICAgaWYgKCFlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJtb2RpZnlMaXN0SW5wdXRcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlMaXN0Rm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLm1vZGlmeUxpc3RcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdE5hbWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5saXN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFzaGNhbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmRlbGV0ZUxpc3RcIik7XG4gICAgICAgICAgICAgICAgLyogcG91ciBjb25jYXTDqW5lciBvbiB0cmFuc2Zvcm1lIGxlcyBOb2RlTGlzdCBlbiBBcnJheSAqL1xuICAgICAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhtb2RpZnlMaXN0Rm9ybXMsIEFycmF5LmZyb20obGlzdE5hbWVzKS5jb25jYXQoQXJyYXkuZnJvbSh0cmFzaGNhbnMpKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKiBzaSBvbiBjbGlxdWUgZW4gZGVob3JzIGTigJl1biBmb3JtIGRlIG1vZGlmaWNhdGlvbiBkZSBMQUJFTCwgb24gbGVzIGZlcm1lIHRvdXMgKi9cbiAgICAgICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChcIi5lZGl0TGFiZWxcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlMaXN0Rm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmVkaXRMYWJlbFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsYWJlbE5hbWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5sYWJlbE5hbWVcIik7XG4gICAgICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKG1vZGlmeUxpc3RGb3JtcywgbGFiZWxOYW1lcyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKiBPbiB2w6lyaWZpZSBzaSBsZSBib3V0b24gY2xpcXXDqSBlc3QgbGUgY3JheW9uIGTigJnDqWRpdGlvbiBkZSBjYXJ0ZS5cbiAgICAgICAgICAgIGxhIHPDqWxlY3Rpb24gc2UgZmFpdCBhdmVjIGNsb3Nlc3Qgw6AgY2F1c2UgZOKAmWlzc3VlcyBkdWVzIGF1IFNWRyAqL1xuICAgICAgICAgICAgY29uc3QgdGVzdEVkaXRDYXJkQnV0dG9uID0gZS50YXJnZXQuY2xvc2VzdChcImZvcm1cIikgP1xuICAgICAgICAgICAgICAgIGUudGFyZ2V0LmNsb3Nlc3QoXCJmb3JtXCIpLmNsYXNzTGlzdC5jb250YWlucyhcInRyaWdnZXJQYXRjaENhcmRcIilcbiAgICAgICAgICAgICAgICA6IGZhbHNlO1xuXG4gICAgICAgICAgICAvKiBvbiB2w6lyaWZpZSBxdWUgdGFyZ2V0IG7igJllc3QgcGFzIHVuIMOpbMOpbWVudCBkdSBjYXJkIGVkaXQgZm9ybSBcbiAgICAgICAgICAgIHBvdXIgdG91cyBsZXMgZmVybWVyICovXG4gICAgICAgICAgICAvLyBpZiAoIWUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm1vZGlmeUNhcmRJbnB1dFwiKSkge1xuICAgICAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLm1vZGlmeUNhcmRcIikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbW9kaWZ5Q2FyZEZvcm1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5tb2RpZnlDYXJkXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcmRzQ29udGVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNhcmRDb250ZW50XCIpO1xuXG4gICAgICAgICAgICAgICAgLyogc2kgbGUgYm91dG9uIGNsaXF1w6kgZXN0IGxlIGNyYXlvbiwgb24gbGUgcmV0aXJlIGRlIGxhIGxpc3RlIGRlcyDDqWzDqW1lbnRzIMOgIGVmZmFjZXJcbiAgICAgICAgICAgICAgICBsZSDDqWRpdCBmb3JtIGNvdXJhbnQsIGNhciBzb24gZWZmYWNlbWVudCBlc3QgZ8OpcmVyIHBhciB1biBhdXRyZSDDqXbDqG5lbWVudCAoY2VsdWkgZHUgYm91dG9uIGNyYXlvbiBjbGlxdcOpKS5cbiAgICAgICAgICAgICAgICBUb3V0ZSBjZXR0ZSBvcMOpcmF0aW9uIGFmaW4gZOKAmcOpdml0ZXIgZGVzIHTDqWzDqXNjb3BhZ2VzIGTigJlldmVudHMuXG4gICAgICAgICAgICAgICAgRHUgY291cCBsZXMgZWRpdCBmb3JtcyBzZSBmZXJtZW50IHF1YW5kIDogb24gY2xpcXVlIGVuIGRlaG9ycyBPVSBzdXIgbGUgYm91dG9uIGNyYXlvbiAobHVpIG1lbWUgZW4gZGVob3JzKSAqL1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RWRpdENhcmRCdXR0b24pIHtcblxuICAgICAgICAgICAgICAgICAgICAvKiBvbiBwYXNzZSBkZSBOb2RlTGlzdCDDoCBBcnJheSBwb3VyIGF2b2lyIGZpbHRlciAqL1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlDYXJkRm9ybXMgPSBBcnJheS5mcm9tKG1vZGlmeUNhcmRGb3Jtcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG1vZGlmeUNhcmRGb3Jtcyk7XG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeUNhcmRGb3JtcyA9IG1vZGlmeUNhcmRGb3Jtc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihlbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogb24gZ2FyZGUgZGFucyBsZSB0YWJsZWF1IGRlcyDDqWzDqW1lbnRzIMOgIGVmZmFjZXIgcXVlIGNldXggcXVpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5lIHNvbnQgcGFzIGRhbnMgbGEgbWVtZSBjYXJ0ZSBxdWUgbGUgYm91dG9uIGNsaXF1w6kgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKSAhPT0gZWwuY2xvc2VzdChcIi5jYXJkTWFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJsb25ndWV1clwiLCBtb2RpZnlDYXJkRm9ybXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobW9kaWZ5Q2FyZEZvcm1zLCBjYXJkc0NvbnRlbnRzKTtcbiAgICAgICAgICAgICAgICB0b29scy5zd2FwRWxlbWVudHMobW9kaWZ5Q2FyZEZvcm1zLCBjYXJkc0NvbnRlbnRzKTtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyogT24gcsOpYWN0aXZlIGxlIGRyYWcgbiBkcm9wIHNpIGzigJnDqWzDqW1lbnQgY2xpcXXDqSBu4oCZZXN0IHBhcyBlbmZhbnQgZGVzIGZvcm1zIHNww6ljaWZpw6lzICovXG4gICAgICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCJmb3JtLm1vZGlmeUNhcmQsZm9ybS5lZGl0TGFiZWxcIikpXG4gICAgICAgICAgICB0b29scy5nbG9iYWxEcmFnZ2FibGUoXCJ0cnVlXCIpO1xuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgIC8vIGxhYmVsTW9kdWxlLnNldExhYmVsRm9ybSgpO1xuICAgICAgICBhd2FpdCBsaXN0TW9kdWxlLmRyYXdMaXN0cygpO1xuICAgICAgICBhd2FpdCBsYWJlbE1vZHVsZS5kcmF3TGFiZWxzSW5EaWN0aW9ubmFyeSgpO1xuICAgICAgICBhcHAuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGNhcmRNb2R1bGUuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGxpc3RNb2R1bGUuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGxhYmVsTW9kdWxlLmFkZExpc3RlbmVycygpO1xuICAgIH1cbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGFwcC5pbml0KTsiLCJjb25zdCB7dG9vbHN9PXJlcXVpcmUoXCIuL3Rvb2xzXCIpO1xuY29uc3Qge3Jlc3RSb290fT1yZXF1aXJlKFwiLi9yZXN0Um9vdFwiKTtcbmNvbnN0IHtsYWJlbE1vZHVsZX09cmVxdWlyZShcIi4vbGFiZWxcIik7IFxuXG5jb25zdCBjYXJkTW9kdWxlID0ge1xuICAgIG1ha2VDYXJkSW5ET006IChjYXJkKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYXJkVGVtcGxhdGVcIik7XG4gICAgICAgIGNvbnN0IGNsb25lID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKTtcblxuICAgICAgICBjb25zdCBtYWluID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5jYXJkTWFpblwiKTtcbiAgICAgICAgY29uc29sZS5sb2coY2FyZC5jb2xvcik7XG4gICAgICAgIG1haW4uc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGNhcmQuY29sb3IpO1xuICAgICAgICBtYWluLnNldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1pZFwiLCBjYXJkLmlkKTtcbiAgICAgICAgbWFpbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtcG9zaXRpb25cIiwgY2FyZC5wb3NpdGlvbik7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuY2FyZENvbnRlbnRcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbnRlbnQpO1xuICAgICAgICBjb250ZW50LnRleHRDb250ZW50ID0gY2FyZC5jb250ZW50O1xuXG4gICAgICAgIC8vIGNvbnN0IGxhYmVsQ29udGFpbmVyPWNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxDb250YWluZXJcIik7XG4gICAgICAgIC8vIGxhYmVsQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLChlKT0+e1xuICAgICAgICAvLyAgICAgZS5wcmV2ZW50RGVmYXVsdDtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWxpc3QtaWQ9XCIke2NhcmQubGlzdF9pZH1cIl1gKTtcbiAgICAgICAgY29uc29sZS5sb2cobGlzdCk7XG5cbiAgICAgICAgY29uc3Qgc2hvd0hpZGVQYXRjaENhcmRGb3JtID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi50cmlnZ2VyUGF0Y2hDYXJkXCIpO1xuICAgICAgICBjb25zdCB0cmlnZ2VyRGVsZXRlQ2FyZCA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIudHJpZ2dlckRlbGV0ZUNhcmRcIik7XG4gICAgICAgIGNvbnN0IGVkaXRGb3JtID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlDYXJkXCIpO1xuICAgICAgICBzaG93SGlkZVBhdGNoQ2FyZEZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBjYXJkTW9kdWxlLmhhbmRsZVNob3dIaWRlUGF0Y2hGb3JtKTtcblxuICAgICAgICAvKiBEUkFHwqBBTkTCoERST1AgKi9cbiAgICAgICAgLyogYXZvaWQgZCZkIG9uIGlucHV0cyA6IHNlZSBiZWxvdyBoYW5kbGVTaG93SGlkZVBhdGNoRm9ybSovXG4gICAgICAgIC8qIGQmZCBldmVudHMgKi9cbiAgICAgICAgbWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCBjYXJkTW9kdWxlLm9uRHJvcCk7XG4gICAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGNhcmRNb2R1bGUub25EcmFnT3Zlcik7XG4gICAgICAgIG1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBjYXJkTW9kdWxlLm9uRHJhZ1N0YXJ0KTtcbiAgICAgICAgLy8gbWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ1wiLCBjYXJkTW9kdWxlLm9uRHJhZyk7XG4gICAgICAgIC8vIG1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgY2FyZE1vZHVsZS5vbkRyYWdFbmQpO1xuXG4gICAgICAgIC8qID09PT09PT09PUHCoERFVEFDSEVSICovXG4gICAgICAgIHRyaWdnZXJEZWxldGVDYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIixjYXJkTW9kdWxlLmhhbmRsZURlbGV0ZUNhcmQpO1xuXG4gICAgICAgIGVkaXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGUpID0+IHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBjYXJkTW9kdWxlLmhhbmRsZVBhdGNoQ2FyZChlLCBjYXJkKTsgfSk7XG5cbiAgICAgICAgLyogQXBwZW5kICovXG4gICAgICAgIGNvbnN0IGxpc3RDb250ZW50ID0gbGlzdC5xdWVyeVNlbGVjdG9yKFwiLmxpc3RDb250ZW50XCIpO1xuICAgICAgICBsaXN0Q29udGVudC5hcHBlbmRDaGlsZChjbG9uZSk7XG5cbiAgICAgICAgLyogb24gcmFqb3V0ZSBsZXMgbGFiZWxzIHF1YW5kIGxhIGNhcnRlIGVzdCBkw6lqYSBkYW5zIGxlIERPTSAqL1xuICAgICAgICBpZiAoY2FyZC5sYWJlbHMpIHtcbiAgICAgICAgICAgIGNhcmQubGFiZWxzLmZvckVhY2gobGFiZWwgPT4ge1xuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLm1ha2VMYWJlbEluRE9NKGxhYmVsLCBtYWluLnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxDb250YWluZXJcIikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIG9uRHJhZ1N0YXJ0OiAoZSkgPT4ge1xuICAgICAgIGlmKHRvb2xzLmNoZWNrVHlwZShlLFwiY2FyZFwiKSl7XG4gICAgICAgICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgaWQ6IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1pZFwiKSxcbiAgICAgICAgICAgIHR5cGU6IFwiY2FyZFwiXG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZShlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSkpO1xuICAgICAgIH07XG4gICAgfSxcbiAgICBvbkRyYWdFbmQ6IChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gdG9vbHMuc2hvd0VsZW1lbnQoZS50YXJnZXQpO1xuICAgIH0sXG4gICAgb25Ecm9wOiBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZHJvcFwiLCBlKTtcbiAgICAgICAgY29uc3QgeyBpZCwgdHlwZSB9ID0gSlNPTi5wYXJzZShlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZHJvcCBkYXRhXCIsIHR5cGUsIGlkKTtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibGFiZWxcIikge1xuICAgICAgICAgICAgY29uc3QgbGFiZWxJZCA9IGlkO1xuICAgICAgICAgICAgY29uc3QgY2FyZElkID0gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtaWRcIik7XG4gICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5jbGVhckRhdGEoXCJ0ZXh0L3BsYWluXCIpO1xuICAgICAgICAgICAgbGFiZWxNb2R1bGUuY3JlYXRlQXNzb2NpYXRpb24oY2FyZElkLCBsYWJlbElkKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcImNhcmRcIikge1xuICAgICAgICAgICAgY29uc3QgY2FyZElkID0gaWQ7XG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkQ2FyZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWNhcmQtaWQ9XCIke2NhcmRJZH1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldGVkQ2FyZCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIuY2FyZE1haW5cIik7XG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGFyZ2V0ZWRDYXJkLmNsb3Nlc3QoXCIubGlzdE1haW5cIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChkcmFnZ2VkQ2FyZFxuICAgICAgICAgICAgICAgICYmZHJhZ2dlZENhcmQhPT10YXJnZXRlZENhcmQpIHtcblxuICAgICAgICAgICAgICAgIC8qIGNvbnRyb2xlciBzaSBkYW5zIGxhIG1lbWUgbGlzdGUgZXQgY2hlY2sgcGxhY2VyIGVuIGF2YW50IGVuIGFycmnDqHJlICovXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldGVkQ2FyZC5wYXJlbnROb2RlID09PSBkcmFnZ2VkQ2FyZC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRQb3NpdGlvbiA9IGRyYWdnZWRDYXJkLmdldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1wb3NpdGlvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ZWRQb3NpdGlvbiA9IHRhcmdldGVkQ2FyZC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtcG9zaXRpb25cIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVJbmRleCA9IGRyYWdnZWRQb3NpdGlvbiAtIHRhcmdldGVkUG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgIC8qIGTDqXBsYWNlciBsYSBjYXJ0ZSBhcHLDqHMgb3UgYXZhbnQgZW4gZm9uY3Rpb24gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ldGhvZCA9IG1vdmVJbmRleCA8IDAgPyBcImFmdGVyXCIgOiBcImJlZm9yZVwiO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkcmFnZ2VkQ2FyZERldGFjaGVkID0gZHJhZ2dlZENhcmQucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChkcmFnZ2VkQ2FyZCk7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldGVkQ2FyZFttZXRob2RdKGRyYWdnZWRDYXJkRGV0YWNoZWQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5zYXZlQ2FyZHNQb3NpdGlvbnMobGlzdCk7XG4gICAgICAgICAgICAgLyogc2kgc3VyIGRldXggbGlzdGVzLCDDp2EgZm9uY3Rpb25uZSBkaWZmw6lyZW1tZW50IDpcbiAgICAgICAgICAgICBsYSBjYXJ0ZSBzZSBwbGFjZSBlbiBmb25jdGlvbiBkdSBwb2ludGV1ciBwYXIgcmFwcG9ydCBhdSBjZW50cmUgZGUgbGEgY2FydGUgY2libGUuIFNpIGF1IGRlc3N1cyBzZSBwbGFjZSBhdSBkZXNzdXMsXG4gICAgICAgICAgICAgU2kgZW4gZGVzc291cyBzZSBwbGFjZSBlbiBkZXNzb3VzLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldGVkQ2FyZEJvdW5kaW5nID0gdGFyZ2V0ZWRDYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOy8vb2JqZXQgcXVpIGNvbnRpZW50IHRvdXRlcyBsZXMgaW5mb3MgZGUgcG9zaXRpb25uZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94SGVpZ2h0Q2VudGVyID0gKHRhcmdldGVkQ2FyZEJvdW5kaW5nLmJvdHRvbSArIHRhcmdldGVkQ2FyZEJvdW5kaW5nLnRvcCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRob2Q9ZS5jbGllbnRZPGJveEhlaWdodENlbnRlcj9cImJlZm9yZVwiOlwiYWZ0ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ZWRDYXJkW21ldGhvZF0oZHJhZ2dlZENhcmQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpc3QyID0gdGFyZ2V0ZWRDYXJkLmNsb3Nlc3QoXCIubGlzdE1haW5cIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRDYXJkTGlzdElkPWxpc3QuZGF0YXNldC5saXN0SWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldENhcmRMaXN0SWQ9bGlzdDIuZGF0YXNldC5saXN0SWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldENhcmRJZD10YXJnZXRlZENhcmQuZGF0YXNldC5jYXJkSWQ7XG4gICAgICAgICAgICAgICAgICAgIGNhcmRNb2R1bGUuY2hhbmdlTGlzdE9mQ2FyZChjYXJkSWQsZHJhZ2dlZENhcmRMaXN0SWQpO1xuICAgICAgICAgICAgICAgICAgICBjYXJkTW9kdWxlLmNoYW5nZUxpc3RPZkNhcmQodGFyZ2V0Q2FyZElkLHRhcmdldENhcmRMaXN0SWQpO1xuICAgICAgICAgICAgICAgICAgICBjYXJkTW9kdWxlLnNhdmVDYXJkc1Bvc2l0aW9ucyhsaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5zYXZlQ2FyZHNQb3NpdGlvbnMobGlzdDIpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cblxuICAgIH0sXG4gICAgY2hhbmdlTGlzdE9mQ2FyZDooY2FyZElkLGxpc3RJZCk9PntcbiAgICAgICAgZmV0Y2goYCR7cmVzdFJvb3R9L2NhcmQvJHtjYXJkSWR9YCwgdG9vbHMuc2V0UmVxdWVzdChcIlBBVENIXCIse2xpc3RfaWQ6bGlzdElkfSkpO1xuICAgIH0sXG4gICAgc2F2ZUNhcmRzUG9zaXRpb25zOiAobGlzdERPTSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmUgP1wiKTtcbiAgICAgICAgY29uc3QgY2FyZHMgPSBsaXN0RE9NLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2FyZE1haW5cIik7XG4gICAgICAgIGxldCBuZXdQb3NpdGlvbkluZGV4ID0gMDtcbiAgICAgICAgY2FyZHMuZm9yRWFjaCggZWwgPT4ge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1jYXJkLXBvc2l0aW9uXCIsIG5ld1Bvc2l0aW9uSW5kZXgrKyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IGVsLmRhdGFzZXQuY2FyZElkO1xuICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3UG9zaXRpb25JbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RPYmplY3QgPSB0b29scy5zZXRSZXF1ZXN0KFwiUEFUQ0hcIiwgZGF0YVRvU2VuZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXF1ZXN0T2JqZWN0KTtcbiAgICAgICAgICAgIGZldGNoKGAke3Jlc3RSb290fS9jYXJkLyR7aWR9YCwgcmVxdWVzdE9iamVjdCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhd2FpdCByZXMuanNvbigpKTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuICAgIG9uRHJhZ0VudGVyOiAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSxcbiAgICBoYW5kbGVTaG93SGlkZVBhdGNoRm9ybTogKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjYXJkID0gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKTsvL29uIHLDqWN1cMOocmUgbGEgY2FydGVcbiAgICAgICAgY29uc3QgZWRpdEZvcm0gPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoXCIubW9kaWZ5Q2FyZFwiKTsvL3NvbiBmb3JtdWxhaXJlIGTigJnDqWRpdGlvblxuICAgICAgICBjb25zdCBjb250ZW50ID0gY2FyZC5xdWVyeVNlbGVjdG9yKFwiLmNhcmRDb250ZW50XCIpOy8vbGUgY29udGFpbmVyIGR1IHRleHRlXG4gICAgICAgIC8vIGNvbnN0IHNob3dGb3JtQnV0dG9uID0gY2FyZC5xdWVyeVNlbGVjdG9yKFwiLmVkaXRCdXR0b25cIik7Ly9sZSBjb250YWluZXIgZHUgdGV4dGVcblxuICAgICAgICBjb25zdCB0ZXh0YXJlYSA9IGVkaXRGb3JtLnF1ZXJ5U2VsZWN0b3IoXCIubW9kaWZ5Q2FyZElucHV0XCIpO1xuICAgICAgICAvKiB0ZXh0YXJlYSBhIHVuZSBwcm9wcmnDqXTDqSB2YWx1ZSBtYWlzIHBhcyBk4oCZYXR0cmlidXQgdmFsdWUgKi9cbiAgICAgICAgdGV4dGFyZWEudmFsdWUgPSBjb250ZW50LnRleHRDb250ZW50O1xuXG4gICAgICAgIC8qIG9uIGZvdXJuaXQgbGEgY291bGV1ciBhdSBjaGFtcCAqL1xuICAgICAgICBjb25zdCBjb2xvciA9IGNhcmQucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlDb2xvcklucHV0XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkNPTE9SXCIsIGNhcmQuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShcImJhY2tncm91bmQtY29sb3JcIikpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRDYXJkQ29sb3IgPSBjYXJkLnN0eWxlLmdldFByb3BlcnR5VmFsdWUoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuICAgICAgICBjb2xvci52YWx1ZSA9IHRvb2xzLnJnYlRvSGV4KGN1cnJlbnRDYXJkQ29sb3IpOy8qIE9uIHLDqWN1cMOocmUgdW5lIGNvdWxldXIgaGV4YSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhjb2xvci52YWx1ZSk7XG5cbiAgICAgICAgLyogQXR0ZW50aW9uIDogZXZlbnQgc3VyIGxhIGZlbmV0cmUgRVQgc3VyIGxlIGJvdXRvbiBk4oCZYWZmaWNoYWdlIGRlIGVkaXRGb3JtIDpcbiAgICAgICAgbGVzIGRldXggcGV1dmVudCBz4oCZYW5udWxlci5HZXN0aW9uIGRlIGxhIGZlcm1ldHVyZSBzdXIgdG9vbHMubGlzdGVuZXJzICovXG4gICAgICAgIGNvbnNvbGUubG9nKGVkaXRGb3JtLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWhpZGRlblwiKSk7XG4gICAgICAgIGlmIChlZGl0Rm9ybS5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1oaWRkZW5cIikpIHtcbiAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhjb250ZW50LCBlZGl0Rm9ybSk7XG4gICAgICAgICAgICAvKiBkaXNhYmxlIGNhcmQgZHJhZ2dhYmxlIHdoZW4gZWRpdEZvcm0gYmVjb21lcyB2aXNpYmxlICovXG4gICAgICAgICAgICB0b29scy5nbG9iYWxEcmFnZ2FibGUoXCJmYWxzZVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhlZGl0Rm9ybSwgY29udGVudCk7XG4gICAgICAgICAgICAvKiBhbGxvdyBjYXJkIGRyYWdnYWJsZSB3aGVuIGVkaXRGb3JtIGJlY29tZXMgaW52aXNpYmxlICovXG4gICAgICAgICAgICB0b29scy5nbG9iYWxEcmFnZ2FibGUoXCJ0cnVlXCIpO1xuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICBoYW5kbGVQYXRjaENhcmQ6IGFzeW5jIChlLCBjYXJkKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHBhdGNoQ2FyZDtcbiAgICAgICAgbGV0IGNvbnRlbnQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBhdGNoaW5nXCIpO1xuICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHRvb2xzLmZvcm1Ub0pzb24oZS50YXJnZXQpO1xuICAgICAgICAgICAgLyogb24gcsOpY3Vww6hyZSBsYSBzdHJpbmcgZGVzIGxhYmVscyAqL1xuICAgICAgICAgICAgbGV0IGxhYmVsTmFtZXMgPSBkYXRhVG9TZW5kLmxhYmVscztcblxuICAgICAgICAgICAgLyogdXBkYXRlIHVuZSBjYXJ0ZSAqL1xuICAgICAgICAgICAgZGVsZXRlIGRhdGFUb1NlbmQubGFiZWxzOy8vb24gc3VwcHJpbWUgYXZhbnQgZOKAmWVudm95ZXIgZW4gYmFzZVxuICAgICAgICAgICAgY29uc3Qgcm91dGUgPSBgJHtyZXN0Um9vdH0vY2FyZC8ke2NhcmQuaWR9YDtcbiAgICAgICAgICAgIGNhcmRET00gPSBlLnRhcmdldC5jbG9zZXN0KFwiLmNhcmRNYWluXCIpO1xuICAgICAgICAgICAgY29udGVudCA9IGNhcmRET00ucXVlcnlTZWxlY3RvcihcIi5jYXJkQ29udGVudFwiKTtcbiAgICAgICAgICAgIHBhdGNoQ2FyZCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIuY2FyZE1haW5cIikucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlDYXJkXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YVRvU2VuZCk7XG4gICAgICAgICAgICBhd2FpdCBmZXRjaChyb3V0ZSwgdG9vbHMuc2V0UmVxdWVzdChcIlBBVENIXCIsIGRhdGFUb1NlbmQpKTtcbiAgICAgICAgICAgIGNvbnRlbnQudGV4dENvbnRlbnQgPSBkYXRhVG9TZW5kLmNvbnRlbnQ7XG4gICAgICAgICAgICBjYXJkRE9NLnN0eWxlLnNldFByb3BlcnR5KFwiYmFja2dyb3VuZC1jb2xvclwiLCBkYXRhVG9TZW5kLmNvbG9yKTtcblxuICAgICAgICAgICAgLyogY3LDqWVyIGRlcyBhc3NvY2lhdGlvbnMgZGUgbGFiZWxzICovXG4gICAgICAgICAgICBsYWJlbE5hbWVzID0gbGFiZWxOYW1lcy5zcGxpdChcIjtcIik7Ly90YWJsZWF1IGRlcyBsYWJlbHNcbiAgICAgICAgICAgIGxldCBsYWJlbEluRGljdGlvbmFyeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGFiZWxEaWN0aW9uYXJ5XCIpLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGFiZWxNYWluXCIpOy8vbm9kZUxpc3QgZGVzIGxhYmVscyBlbiBoYXV0IGRlIHBhZ2VcbiAgICAgICAgICAgIC8vT24gZW4gZmFpdCB1biB0YWJsZWF1XG4gICAgICAgICAgICBsYWJlbEluRGljdGlvbmFyeSA9IEFycmF5LmZyb20obGFiZWxJbkRpY3Rpb25hcnkpO1xuICAgICAgICAgICAgLyogUG91ciBjaGFxdWUgbm9tIGRlIGxhYmVsIGVudm95w6kgZGFucyBsZSBjaGFtcCwgb24gY2hlcmNoZSBsZSBsYWJlbCBjb3JyZXNwb25kYW50IGV0IG9uIGzigJlhc3NvY2llLiAqL1xuICAgICAgICAgICAgbGFiZWxOYW1lcy5mb3JFYWNoKGxhYmVsTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgLyogT24gcsOpY3Vww6hyZSBsZSBsYWJlbCBxdWkgcG9ydGUgbGUgbm9tIHF14oCZb24gY2hlcmNoZSDDoCBhc3NvY2llciAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gbGFiZWxJbkRpY3Rpb25hcnkuZmluZChlbEluRGljdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsTmFtZUZyb21EaWN0ID0gZWxJbkRpY3QucXVlcnlTZWxlY3RvcihcIi5sYWJlbE5hbWVcIikudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbE5hbWVGcm9tRGljdCA9PT0gbGFiZWxOYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbElkID0gbGFiZWwuZ2V0QXR0cmlidXRlKGBkYXRhLWxhYmVsLWlkYCk7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLmNyZWF0ZUFzc29jaWF0aW9uKGNhcmQuaWQsIGxhYmVsSWQpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKHBhdGNoQ2FyZCwgY29udGVudCk7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIGhhbmRsZURlbGV0ZUNhcmQ6KGUpPT57XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCBjYXJkSWQ9ZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKS5kYXRhc2V0LmNhcmRJZDtcbiAgICAgICAgICAgIGNvbnN0IHJvdXRlID0gYCR7cmVzdFJvb3R9L2NhcmQvJHtjYXJkSWR9YDtcbiAgICAgICAgICAgIGZldGNoKHJvdXRlLCB0b29scy5zZXRSZXF1ZXN0KFwiREVMRVRFXCIsIHsgaWQ6IGNhcmRJZCB9KSk7XG4gICAgICAgICAgICB0b29scy5kZWxldGVGcm9tRE9NKFwiY2FyZFwiLCBjYXJkSWQpO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsID0gXCJDYXJkXCI7XG5cbiAgICAgICAgY29uc3QgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgYWRkJHtlbH1Nb2RhbGApO1xuXG5cbiAgICAgICAgLyogZ2VzdGlvbiBkZXMgYm91dG9ucyBkZSBmZXJtZXR1cmUgKi9cbiAgICAgICAgY29uc3QgY2xvc2VCdXR0b25zID0gbW9kYWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImNsb3NlXCIpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNsb3NlXCIsIGNsb3NlQnV0dG9ucyk7XG4gICAgICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGNsb3NlQnV0dG9ucykge1xuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblxuICAgICAgICBjb25zdCBmb3JtID0gbW9kYWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xuICAgICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJtb2RhbCBzdWJtaXRcIik7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFUb1NlbmQgPSB0b29scy5mb3JtVG9Kc29uKGUudGFyZ2V0KTtcblxuICAgICAgICAgICAgICAgIC8qIE9uIHLDqWN1cMOocmUgbGEgcHJvY2hhaW5lIHBvc2l0aW9uIGRlIGZpbiovXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7ZWwudG9Mb3dlckNhc2UoKX1NYWluYCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmICghcG9zaXRpb24pXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gMDtcblxuICAgICAgICAgICAgICAgIGRhdGFUb1NlbmQucG9zaXRpb24gPSBwb3NpdGlvbjtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvc2l0aW9uLCBkYXRhVG9TZW5kLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBpZiAoIWRhdGFUb1NlbmQucG9zaXRpb24pXG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGFUb1NlbmQpO1xuICAgICAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBmZXRjaChgJHtyZXN0Um9vdH0vJHtlbC50b0xvd2VyQ2FzZSgpfWAsIHRvb2xzLnNldFJlcXVlc3QoXCJQT1NUXCIsIGRhdGFUb1NlbmQpKTtcbiAgICAgICAgICAgICAgICByZXMgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgICAgICAgICAgICAgLyogTGEgcGFydGllIHF1aSBjaGFuZ2UgZOKAmXVuZSBtb2RhbGUgw6AgbOKAmWF1dHJlICovXG4gICAgICAgICAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5tYWtlQ2FyZEluRE9NKHJlcyk7XG5cbiAgICAgICAgICAgICAgICB0b29scy5raWxsTW9kYWwoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG5cbiAgICB9LFxufTtcbm1vZHVsZS5leHBvcnRzPSB7Y2FyZE1vZHVsZX07IiwiY29uc3QgeyB0b29scyB9ID0gcmVxdWlyZShcIi4vdG9vbHNcIik7XG5jb25zdCB7IHJlc3RSb290IH0gPSByZXF1aXJlKFwiLi9yZXN0Um9vdFwiKTtcblxuY29uc3QgbGFiZWxNb2R1bGUgPSB7XG4gICAgbWFrZUxhYmVsSW5ET006IChsYWJlbCwgY29udGFpbmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYWJlbFRlbXBsYXRlXCIpO1xuICAgICAgICBjb25zdCBjbG9uZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSk7XG5cbiAgICAgICAgY29uc3QgbGFiZWxNYWluID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5sYWJlbE1haW5cIik7XG4gICAgICAgIGxhYmVsTWFpbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLWxhYmVsLWlkXCIsIGxhYmVsLmlkKTtcbiAgICAgICAgLy8gbGFiZWxNYWluLnNldEF0dHJpYnV0ZShcImRhdGEtbGFiZWwtY29sb3JcIiwgbGFiZWwuY29sb3IpO1xuICAgICAgICBsYWJlbE1haW4uc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGxhYmVsLmNvbG9yKTtcblxuICAgICAgICBjb25zdCBsYWJlbE5hbWUgPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsTmFtZVwiKTtcbiAgICAgICAgbGFiZWxOYW1lLnRleHRDb250ZW50ID0gbGFiZWwubmFtZTtcbiAgICAgICAgbGFiZWxOYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCBsYWJlbE1vZHVsZS5zaG93RWRpdExhYmVsKTtcblxuICAgICAgICBjb25zdCBkZWxldGVCdXR0b24gPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLmRlbGV0ZUxhYmVsXCIpO1xuICAgICAgICBkZWxldGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxhYmVsTW9kdWxlLmRlbGV0ZUxhYmVsKTtcblxuICAgICAgICBjb25zdCBlZGl0Rm9ybSA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuZWRpdExhYmVsXCIpO1xuICAgICAgICBlZGl0Rm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGxhYmVsTW9kdWxlLmVkaXRMYWJlbCk7XG4gICAgICAgIGNvbnN0IGNvbG9ySW5wdXQ9ZWRpdEZvcm0ucXVlcnlTZWxlY3RvcihcIi5jb2xvcklucHV0XCIpO1xuICAgICAgICBjb2xvcklucHV0LnZhbHVlPWxhYmVsLmNvbG9yO1xuICAgICAgICBcbiAgICAgICAgLyogRFJBR8KgQU5EwqBEUk9QICovXG4gICAgICAgIGxhYmVsTWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIGxhYmVsTW9kdWxlLm9uRHJhZ1N0YXJ0KTtcblxuICAgICAgICAvKiBBcHBlbmQgKi9cbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNsb25lKTtcbiAgICB9LFxuICAgIG9uRHJhZ1N0YXJ0OiAoZSkgPT4ge1xuICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3RhcnREcmFnXCIpO1xuICAgICAgICBjb25zdCBvYmogPSB7XG4gICAgICAgICAgICBpZDogZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbC1pZFwiKSxcbiAgICAgICAgICAgIHR5cGU6IFwibGFiZWxcIlxuICAgICAgICB9XG4gICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIEpTT04uc3RyaW5naWZ5KG9iaikpO1xuICAgICAgICBjb25zb2xlLmxvZyhlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG5cbiAgICB9LFxuICAgIG9uRHJhZ0VuZDogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpO1xuICAgIH0sXG4gICAgc2hvd0VkaXRMYWJlbDogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZS50YXJnZXQuY2xvc2VzdChcIiNsYWJlbERpY3Rpb25hcnlcIikpO1xuICAgICAgICBpZiAoZS50YXJnZXQuY2xvc2VzdChcIiNsYWJlbERpY3Rpb25hcnlcIikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidHJ5IHRvIGVkaXRcIik7XG4gICAgICAgICAgICBjb25zdCBsYWJlbCA9IGUudGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gbGFiZWwucXVlcnlTZWxlY3RvcihcIi5lZGl0TGFiZWxcIik7XG4gICAgICAgICAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoXCIubmFtZUlucHV0XCIpLnZhbHVlID0gZS50YXJnZXQudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICBjb25zdCBjb2xvcklucHV0PWZvcm0ucXVlcnlTZWxlY3RvcihcIi5jb2xvcklucHV0XCIpO1xuICAgICAgICAgICAgY29uc3QgaGV4Q29sb3I9dG9vbHMucmdiVG9IZXgoY29sb3JJbnB1dC52YWx1ZSk7XG4gICAgICAgICAgICBjb2xvcklucHV0LnZhbHVlPWhleENvbG9yO1xuICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKGUudGFyZ2V0LCBmb3JtKTtcbiAgICAgICAgfTtcblxuICAgIH0sXG4gICAgZWRpdExhYmVsOiBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gdG9vbHMuZm9ybVRvSnNvbihlLnRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCBsYWJlbElkID0gZS50YXJnZXQuY2xvc2VzdChcIi5sYWJlbE1haW5cIikuZ2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbC1pZFwiKTtcbiAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBmZXRjaChgJHtyZXN0Um9vdH0vbGFiZWwvJHtsYWJlbElkfWAsIHRvb2xzLnNldFJlcXVlc3QoXCJQQVRDSFwiLCBkYXRhKSk7XG4gICAgICAgICAgICByZXMgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgICAgIGlmIChyZXNbMF0gPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYWJlbE5hbWUgPSBlLnRhcmdldC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxOYW1lXCIpO1xuICAgICAgICAgICAgICAgIGxhYmVsTmFtZS50ZXh0Q29udGVudCA9IGRhdGEubmFtZTtcbiAgICAgICAgICAgICAgICBsYWJlbE5hbWUucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtY29sb3JcIiwgZGF0YS5jb2xvcik7XG4gICAgICAgICAgICAgICAgbGFiZWxOYW1lLnRleHRDb250ZW50ID0gZGF0YS5uYW1lO1xuICAgICAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhlLnRhcmdldCwgbGFiZWxOYW1lKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGRlbGV0ZUxhYmVsOiBhc3luYyAoZSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBlLnRhcmdldC5jbG9zZXN0KFwiLmxhYmVsTWFpblwiKTtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsSWQgPSBsYWJlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWxhYmVsLWlkXCIpO1xuICAgICAgICAgICAgLyogdsOpcmlmaW9ucyBvw7kgc2UgdHJvdXZlIGxlIGxhYmVsICovXG4gICAgICAgICAgICAvKiBQcsOocyBkdSBib3V0b24gXCJham91dGVyIExhYmVsXCIgKi9cbiAgICAgICAgICAgIGlmIChlLnRhcmdldC5jbG9zZXN0KFwiI2xhYmVsRGljdGlvbmFyeVwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVsZXRlIGxhYmVsIGZyb20gZGljdFwiKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2xhYmVsLyR7bGFiZWxJZH1gLCB0b29scy5zZXRSZXF1ZXN0KFwiREVMRVRFXCIpKTtcbiAgICAgICAgICAgICAgICByZXMgPSBhd2FpdCByZXMuanNvbigpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlcyA9PT0gMSlcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUuZGVsZXRlRXZlcnl3aGVyZShsYWJlbElkKTtcblxuICAgICAgICAgICAgICAgIC8qIERhbnMgdW5lIGNhcmQgKi9cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZS50YXJnZXQuY2xvc2VzdChcIi5sYWJlbENvbnRhaW5lclwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVsZXRlIGFzc29jXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcmRJZCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIuY2FyZE1haW5cIikuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXJkLWlkXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsSWQgPSBlLnRhcmdldC5wYXJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtbGFiZWwtaWRcIik7XG4gICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUuZGVsZXRlQXNzb2NpYXRpb24oY2FyZElkLCBsYWJlbElkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIGRlbGV0ZUV2ZXJ5d2hlcmU6IChpZCkgPT4ge1xuICAgICAgICBjb25zdCBlbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLWxhYmVsLWlkPVwiJHtpZH1cIl1gKTtcbiAgICAgICAgZWxlbWVudHMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgIHRvb2xzLmRlbGV0ZUZyb21ET00oXCJMYWJlbFwiLCBpZCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY3JlYXRlQXNzb2NpYXRpb246IGFzeW5jIChjYXJkSWQsIGxhYmVsSWQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBmZXRjaChgJHtyZXN0Um9vdH0vY2FyZC8ke2NhcmRJZH0vbGFiZWwvJHtsYWJlbElkfWAsIHRvb2xzLnNldFJlcXVlc3QoXCJQT1NUXCIpKTtcbiAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBsZXQgcmVzMiA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9sYWJlbC8ke2xhYmVsSWR9YCk7XG4gICAgICAgICAgICBsYWJlbE9iaiA9IGF3YWl0IHJlczIuanNvbigpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY29udGFpbmVyXCIsZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtY2FyZC1pZD1cIiR7Y2FyZElkfVwiXWApKTtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtY2FyZC1pZD1cIiR7Y2FyZElkfVwiXWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsQ29udGFpbmVyID0gY2FyZC5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsQ29udGFpbmVyXCIpO1xuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLm1ha2VMYWJlbEluRE9NKGxhYmVsT2JqLCBsYWJlbENvbnRhaW5lcik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBkZWxldGVBc3NvY2lhdGlvbjogYXN5bmMgKGNhcmRJZCwgbGFiZWxJZCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9jYXJkLyR7Y2FyZElkfS9sYWJlbC8ke2xhYmVsSWR9YCwgdG9vbHMuc2V0UmVxdWVzdChcIkRFTEVURVwiKSk7XG4gICAgICAgICAgICByZXMgPSBhd2FpdCByZXMuanNvbigpO1xuXG4gICAgICAgICAgICBpZiAocmVzKVxuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLmRlbGV0ZUxhYmVsRnJvbUNhcmRET00oY2FyZElkLCBsYWJlbElkKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgZGVsZXRlTGFiZWxGcm9tQ2FyZERPTTogKGNhcmRJZCwgbGFiZWxJZCkgPT4ge1xuICAgICAgICBjb25zdCBjYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtY2FyZC1pZD1cIiR7Y2FyZElkfVwiXWApO1xuICAgICAgICBjb25zdCBsYWJlbCA9IGNhcmQucXVlcnlTZWxlY3RvcihgW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsSWR9XCJdYCk7XG4gICAgICAgIGxhYmVsLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQobGFiZWwpO1xuICAgIH0sXG4gICAgZHJhd0xhYmVsc0luRGljdGlvbm5hcnk6IGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGFiZWxEaWN0aW9uYXJ5XCIpO1xuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9sYWJlbGApO1xuICAgICAgICAgICAgcmVzID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgIHJlcy5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgICAgICAgICBsYWJlbE1vZHVsZS5tYWtlTGFiZWxJbkRPTShlbCwgY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnM6ICgpID0+IHtcbiAgICAgICAgY29uc3QgYWRkTGFiZWxCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZExhYmVsQnV0dG9uXCIpO1xuICAgICAgICBhZGRMYWJlbEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0b29scy50cmlnZ2VyTW9kYWwoXCJMYWJlbFwiKSB9KTtcblxuICAgICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBhZGRMYWJlbE1vZGFsYCk7XG4gICAgICAgIGNvbnN0IGZvcm0gPSBtb2RhbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XG5cbiAgICAgICAgY29uc3QgY2xvc2VCdXR0b25zID0gbW9kYWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImNsb3NlXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBjbG9zZUJ1dHRvbnMpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICB0b29scy5raWxsTW9kYWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0gdG9vbHMuZm9ybVRvSnNvbihlLnRhcmdldCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhVG9TZW5kKTtcblxuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9sYWJlbGAsIHRvb2xzLnNldFJlcXVlc3QoXCJQT1NUXCIsIGRhdGFUb1NlbmQpKTtcbiAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7Ly90YWJsZWF1IGF2ZWMgMDpvYmpldCAxOmlzQ3JlYXRlZFxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzWzBdKVxuICAgICAgICAgICAgLyogTGEgcGFydGllIHF1aSBjaGFuZ2UgZOKAmXVuZSBtb2RhbGUgw6AgbOKAmWF1dHJlICovXG4gICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYWJlbERpY3Rpb25hcnlcIik7XG4gICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUubWFrZUxhYmVsSW5ET00ocmVzWzBdLCBjb250YWluZXIpO1xuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICB0b29scy5raWxsTW9kYWwoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxufTtcbm1vZHVsZS5leHBvcnRzID0geyBsYWJlbE1vZHVsZSB9OyIsImNvbnN0IHt0b29sc309cmVxdWlyZShcIi4vdG9vbHNcIik7XG5jb25zdCB7cmVzdFJvb3R9PXJlcXVpcmUoXCIuL3Jlc3RSb290XCIpO1xuY29uc3Qge2NhcmRNb2R1bGV9PXJlcXVpcmUoXCIuL2NhcmRcIik7XG5cbmNvbnN0IGxpc3RNb2R1bGUgPSB7XG4gICAgZHJhd0xpc3RzOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9saXN0YCk7XG4gICAgICAgIGNvbnN0IGxpc3RzID0gYXdhaXQgcmVzdWx0Lmpzb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBlbCBvZiBsaXN0cykge1xuICAgICAgICAgICAgbGlzdE1vZHVsZS5tYWtlTGlzdEluRE9NKGVsKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIG1ha2VMaXN0SW5ET006IChsaXN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0VGVtcGxhdGVcIik7XG4gICAgICAgIGNvbnN0IGNsb25lID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coY2xvbmUpO1xuICAgICAgICBjb25zdCBsaXN0TWFpbiA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoYC5saXN0TWFpbmApO1xuICAgICAgICBsaXN0TWFpbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLWxpc3QtaWRcIiwgbGlzdC5pZCk7XG4gICAgICAgIGxpc3RNYWluLnNldEF0dHJpYnV0ZShcImRhdGEtbGlzdC1wb3NpdGlvblwiLCBsaXN0LnBvc2l0aW9uKTtcblxuICAgICAgICAvKiBvbiBmb3Vybml0IGxlIHRpdHJlICovXG4gICAgICAgIGNvbnN0IHRpdGxlID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5saXN0TmFtZVwiKTtcbiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSBsaXN0Lm5hbWU7XG5cbiAgICAgICAgY29uc3QgcGx1cyA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuYWRkQ2FyZFRvTGlzdFwiKTtcbiAgICAgICAgLyogR2VzdGlvbiBkdSBib3V0b24gKyBwb3VyIGFqb3V0ZXIgdW5lIGNhcnRlICovXG4gICAgICAgIHBsdXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICB0b29scy50cmlnZ2VyTW9kYWwoXCJDYXJkXCIsIHsgY2FyZF9saXN0SWQ6IGxpc3QuaWQgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qIGdlc3Rpb24gZHUgYm91dG9uIHBvdWJlbGxlIHBvdXIgc3VwcHJpbWVyIHVuZSBsaXN0ZSAqL1xuICAgICAgICBjb25zdCB0cmFzaGNhbiA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuZGVsZXRlTGlzdFwiKTtcbiAgICAgICAgdHJhc2hjYW4uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY29uc3Qgcm91dGUgPSBgJHtyZXN0Um9vdH0vbGlzdC8ke2xpc3QuaWR9YDtcbiAgICAgICAgICAgIGZldGNoKHJvdXRlLCB0b29scy5zZXRSZXF1ZXN0KFwiREVMRVRFXCIsIHsgaWQ6IGxpc3QuaWQgfSkpO1xuICAgICAgICAgICAgbGlzdE1vZHVsZS5kZWxldGVMaXN0RnJvbURPTShsaXN0LmlkKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvKiBnZXN0aW9uIGR1IGZvcm11bGFpcmUgcG91ciBtb2RpZmllciBsZSB0aXRyZSAqL1xuICAgICAgICBjb25zdCBtb2RpZnkgPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLm1vZGlmeUxpc3RcIik7XG4gICAgICAgIG1vZGlmeS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFUb1NlbmQgPSB0b29scy5mb3JtVG9Kc29uKGUudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBjb25zdCByb3V0ZSA9IGAke3Jlc3RSb290fS9saXN0LyR7bGlzdC5pZH1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJvdXRlKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmZXRjaChyb3V0ZSwgdG9vbHMuc2V0UmVxdWVzdChcIlBBVENIXCIsIGRhdGFUb1NlbmQpKTtcbiAgICAgICAgICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGRhdGFUb1NlbmQubmFtZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0b29scy5zd2FwRWxlbWVudHMobW9kaWZ5LCBbdGl0bGUsIHRyYXNoY2FuXSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aXRsZS5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gbW9kaWZ5LnF1ZXJ5U2VsZWN0b3IoXCIubW9kaWZ5TGlzdElucHV0XCIpO1xuICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBlLnRhcmdldC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhbZS50YXJnZXQsIHRyYXNoY2FuXSwgbW9kaWZ5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkTGlzdEJ1dHRvblwiKS5iZWZvcmUoY2xvbmUpO1xuXG4gICAgICAgIC8qIERSQUfCoEFORMKgRFJPUCAqL1xuICAgICAgICAvKiBBdHRhY2ggRCZEIGxpc3RlbmVycyBvbiBsaXN0ICovXG4gICAgICAgIGxpc3RNYWluLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgbGlzdE1vZHVsZS5vbkRyYWdTdGFydCk7XG4gICAgICAgIGxpc3RNYWluLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIGxpc3RNb2R1bGUub25Ecm9wKTtcbiAgICAgICAgLy8gbGlzdE1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIGxpc3RNb2R1bGUub25EcmFnT3Zlcik7XG5cbiAgICAgICAgaWYgKGxpc3QuY2FyZHMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZWwgb2YgbGlzdC5jYXJkcykge1xuICAgICAgICAgICAgICAgIGNhcmRNb2R1bGUubWFrZUNhcmRJbkRPTShlbCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgb25EcmFnU3RhcnQ6IChlKSA9PiB7XG4gICAgICAgIGlmKHRvb2xzLmNoZWNrVHlwZShlLFwibGlzdFwiKSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRJZCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtbGlzdC1pZFwiKTtcbiAgICAgICAgLy8gaWYgKGRyYWdnZWRJZCkge1xuICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGlkOiBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWxpc3QtaWRcIiksXG4gICAgICAgICAgICAgICAgdHlwZTogXCJsaXN0XCJcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoXCJkcmFnZ2VkIGlkIHVuZGVmaW5lZCA/XCIpO1xuICAgICAgICAvL307XG5cbiAgICAgICAgfTtcblxuICAgIH0sXG4gICAgb25Ecm9wOiAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZHJvcFwiLCBlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgICAgIGNvbnN0IHsgaWQsIHR5cGUgfSA9IEpTT04ucGFyc2UoZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImRyb3AgZGF0YVwiLCB0eXBlLCBpZCk7XG4gICAgICAgIGlmICh0eXBlID09PSBcImxpc3RcIikge1xuICAgICAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gaWQ7XG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWxpc3QtaWQ9XCIke2RyYWdnZWRJZH1cIl1gKTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldGVkTGlzdCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubGlzdE1haW5cIik7XG4gICAgICAgICAgICAvLyBjb25zdCB0YXJnZXRlZElkID0gdGFyZ2V0ZWRMaXN0LmdldEF0dHJpYnV0ZShcImRhdGEtbGlzdC1pZFwiKTtcblxuICAgICAgICAgICAgaWYoZHJhZ2dlZExpc3QhPT10YXJnZXRlZExpc3Qpe1xuICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuY2xlYXJEYXRhKFwidGV4dC9wbGFpblwiKTtcblxuICAgICAgICAgICAgY29uc3QgZHJhZ2dlZFBvc2l0aW9uID0gZHJhZ2dlZExpc3QuZGF0YXNldC5saXN0UG9zaXRpb247XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRlZFBvc2l0aW9uID0gdGFyZ2V0ZWRMaXN0LmRhdGFzZXQubGlzdFBvc2l0aW9uO1xuICAgICAgICAgICAgY29uc3QgbW92ZUluZGV4ID0gZHJhZ2dlZFBvc2l0aW9uIC0gdGFyZ2V0ZWRQb3NpdGlvbjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vdmVJbmRleCk7XG4gICAgICAgICAgICAvKiBkw6lwbGFjZXIgbGEgbGlzdGUgYXByw6hzIG91IGF2YW50IGVuIGZvbmN0aW9uICovXG4gICAgICAgICAgICBsZXQgbWV0aG9kID0gbW92ZUluZGV4IDwgMCA/IFwiYWZ0ZXJcIiA6IFwiYmVmb3JlXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtb3ZlSW5kZXggPCAwKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1ldGhvZCk7XG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkTGlzdERldGFjaGVkID0gZHJhZ2dlZExpc3QucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChkcmFnZ2VkTGlzdCk7XG4gICAgICAgICAgICB0YXJnZXRlZExpc3RbbWV0aG9kXShkcmFnZ2VkTGlzdERldGFjaGVkKTtcblxuICAgICAgICAgICAgbGlzdE1vZHVsZS5zYXZlTGlzdHNQb3NpdGlvbnMoKTtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICB9O1xuICAgIH0sXG4gICAgb25EcmFnT3ZlcjogKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cbiAgICB9LFxuICAgIHNhdmVMaXN0c1Bvc2l0aW9uczogKCkgPT4ge1xuICAgICAgICBjb25zdCBsaXN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGlzdE1haW5cIik7XG4gICAgICAgIGxldCBuZXdQb3NpdGlvbkluZGV4PTA7XG4gICAgICAgIGxpc3RzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZGF0YS1saXN0LXBvc2l0aW9uXCIsIG5ld1Bvc2l0aW9uSW5kZXgrKyk7XG4gICAgICAgICAgICBjb25zdCBpZCA9IGVsLmRhdGFzZXQubGlzdElkO1xuICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3UG9zaXRpb25JbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RPYmplY3QgPSB0b29scy5zZXRSZXF1ZXN0KFwiUEFUQ0hcIiwgZGF0YVRvU2VuZCk7XG4gICAgICAgICAgICBmZXRjaChgJHtyZXN0Um9vdH0vbGlzdC8ke2lkfWAsIHJlcXVlc3RPYmplY3QpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUxpc3RGcm9tRE9NOiAobGlzdElkKSA9PiB7XG4gICAgICAgIGNvbnN0IERPTWxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1saXN0LWlkPVwiJHtsaXN0SWR9XCJdYCk7XG4gICAgICAgIERPTWxpc3QucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChET01saXN0KTtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyczogKCkgPT4ge1xuICAgICAgICAvKiBnZXN0aW9uIGR1IGJvdXRvbiBham91dGVyIGRlcyBsaXN0ZXMgKi9cbiAgICAgICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRMaXN0QnV0dG9uXCIpO1xuICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICB0b29scy50cmlnZ2VyTW9kYWwoXCJMaXN0XCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvKiBnZXN0aW9uIGJvdXRvbnMgcG91ciBham91dGVyIHVuZSBjYXJ0ZSAqL1xuICAgICAgICAvLyBjb25zdCBwbHVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5hZGRDYXJkVG9MaXN0XCIpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIizDqXXDqG/DqXUsb8OpdVwiLHBsdXMpO1xuICAgICAgICAvLyBwbHVzLmZvckVhY2goKGVsKSA9PiB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhcImVsZW1lbnQgcGVvcG91ZXBvw6lcIixlbCk7XG4gICAgICAgIC8vICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcInBsdXNcIiwgZSk7XG4gICAgICAgIC8vICAgICAgICAgdG9vbHMudHJpZ2dlck1vZGFsKFwiQ2FyZFwiLCB7IGNhcmRfbGlzdElkOiBsaXN0LmlkIH0pO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhlbC5hZGRFdmVudExpc3RlbmVyKTtcbiAgICAgICAgLy8gfSlcblxuXG4gICAgICAgIGNvbnN0IGVsID0gXCJMaXN0XCI7XG5cbiAgICAgICAgY29uc3QgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgYWRkJHtlbH1Nb2RhbGApO1xuICAgICAgICBjb25zdCBmb3JtID0gbW9kYWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xuXG4gICAgICAgIGNvbnN0IGNsb3NlQnV0dG9ucyA9IG1vZGFsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJjbG9zZVwiKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJjbG9zZVwiLCBjbG9zZUJ1dHRvbnMpO1xuICAgICAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBjbG9zZUJ1dHRvbnMpIHtcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICB0b29scy5raWxsTW9kYWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHRvb2xzLmZvcm1Ub0pzb24oZS50YXJnZXQpO1xuXG4gICAgICAgICAgICAvKiBPbiByw6ljdXDDqHJlIGxhIHByb2NoYWluZSBwb3NpdGlvbiBkZSBmaW4qL1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtlbC50b0xvd2VyQ2FzZSgpfU1haW5gKS5sZW5ndGg7XG4gICAgICAgICAgICBkYXRhVG9TZW5kLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwb3NpdGlvbiwgZGF0YVRvU2VuZC5wb3NpdGlvbik7XG4gICAgICAgICAgICBpZiAoIWRhdGFUb1NlbmQucG9zaXRpb24pXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhVG9TZW5kKTtcbiAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBmZXRjaChgJHtyZXN0Um9vdH0vJHtlbC50b0xvd2VyQ2FzZSgpfWAsIHRvb2xzLnNldFJlcXVlc3QoXCJQT1NUXCIsIGRhdGFUb1NlbmQpKTtcbiAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG5cbiAgICAgICAgICAgIC8qIExhIHBhcnRpZSBxdWkgY2hhbmdlIGTigJl1bmUgbW9kYWxlIMOgIGzigJlhdXRyZSAqL1xuICAgICAgICAgICAgbGlzdE1vZHVsZS5tYWtlTGlzdEluRE9NKHJlcyk7XG5cbiAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHM9IHtsaXN0TW9kdWxlfTsiLCJjb25zdCByZXN0Um9vdD1gaHR0cDovL2xvY2FsaG9zdDoxNjY0L3Jlc3RgO1xubW9kdWxlLmV4cG9ydHM9e3Jlc3RSb290fTsiLCJjb25zdCB0b29scz17XG4gICAgc2hvd0VsZW1lbnQ6IChET01vYmplY3QpID0+IHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInNob3dFbGVtZW50XCIsIERPTW9iamVjdCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2hvd0VsZW1lbnRcIiwgRE9Nb2JqZWN0LmNsYXNzTGlzdC5jb250YWlucyhgaXMtaGlkZGVuYCkpO1xuICAgICAgICBET01vYmplY3QuY2xhc3NMaXN0LnJlbW92ZShgaXMtaGlkZGVuYCk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2hvd0VsZW1lbnRcIiwgRE9Nb2JqZWN0LmNsYXNzTGlzdC5jb250YWlucyhgaXMtaGlkZGVuYCkpO1xuICAgIH0sXG4gICAgaGlkZUVsZW1lbnQ6IChET01vYmplY3QpID0+IHtcbiAgICAgICAgRE9Nb2JqZWN0LmNsYXNzTGlzdC5hZGQoYGlzLWhpZGRlbmApO1xuICAgIH0sXG4gICAgc3dhcEVsZW1lbnRzOiAoZWwxLCBlbDIpID0+IHtcbiAgICAgICAgLyogbGVzIG5vZGVMaXN0cyByw6ljdXDDqXLDqXMgcGFyIHF1ZXJ5U2VsZWN0b3IgbmUgc29udCBwYXMgZGVzIHRhYmxlYXV4IG1haXMgZGVzIG9iamV0cyBpdMOpcmFibGVzLFxuICAgICAgICBvbiBkb2l0IHBvdXZvaXIgdHJhaXRlciBsZXMgZGV1eCwgYWluc2kgcXVlIGxlcyBFbGVtZW50cyBkdSBET00gKi9cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJTV0FQXCIpO1xuICAgICAgICBpZiAoIShlbDEgaW5zdGFuY2VvZiBBcnJheSkgJiYgIShlbDEgaW5zdGFuY2VvZiBOb2RlTGlzdCkpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU1dBUCBPTkVcIiwgZWwxKTtcbiAgICAgICAgICAgIHRvb2xzLmhpZGVFbGVtZW50KGVsMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNXQVAgQUxMXCIsIGVsMSk7XG4gICAgICAgICAgICBlbDEuZm9yRWFjaCgoZWwpID0+IHsgdG9vbHMuaGlkZUVsZW1lbnQoZWwpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCEoZWwyIGluc3RhbmNlb2YgQXJyYXkpICYmICEoZWwyIGluc3RhbmNlb2YgTm9kZUxpc3QpKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNXQVAgU0hPVyBPTkVcIiwgZWwyKTtcbiAgICAgICAgICAgIHRvb2xzLnNob3dFbGVtZW50KGVsMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNXQVAgQUxMXCIsIGVsMik7XG4gICAgICAgICAgICBlbDIuZm9yRWFjaCgoZWwpID0+IHsgdG9vbHMuc2hvd0VsZW1lbnQoZWwpOyB9KTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHNldFJlcXVlc3Q6IChtZXRob2QsIGRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIgfSxcbiAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmdiVG9IZXg6IChSR0JzdHJpbmcpID0+IHtcblxuICAgICAgICBpZigvI1thLXpBLVowLTldezZ9Ly50ZXN0KFJHQnN0cmluZykpLy9zaSBsYSBzdHJpbmcgZXN0IGTDqWrDoCBlbiBoZXgsIGxhIHJldG91cm5lclxuICAgICAgICByZXR1cm4gUkdCc3RyaW5nO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgcmdiVmFsc1JYID0gL1xcZHsxLDN9L2c7XG5cbiAgICAgICAgbGV0IG5ld0NvbG9yID0gUkdCc3RyaW5nLm1hdGNoKHJnYlZhbHNSWCk7XG4gICAgICAgIGNvbnNvbGUubG9nKG5ld0NvbG9yKTtcbiAgICAgICAgbmV3Q29sb3IgPSBuZXdDb2xvci5tYXAoZWwgPT4gey8qIG9uIGNvbnZlcnRpdCBlbiBudW1iZXIgcHVpcyBlbiBjaGFpbmUgaGV4YSAqL1xuICAgICAgICAgICAgbGV0IGhleFZhbCA9IE51bWJlcihlbCkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgaWYgKGhleFZhbC5sZW5ndGggPT09IDEpLy9wb3VyIGF2b2lyIHVuIGNoaWZmcmUgaGV4YSBzdXIgMiBjYXJhY3TDqHJlc1xuICAgICAgICAgICAgICAgIGhleFZhbCA9IFwiMFwiICsgaGV4VmFsO1xuICAgICAgICAgICAgcmV0dXJuIGhleFZhbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKG5ld0NvbG9yKTtcbiAgICAgICAgcmV0dXJuIGAjJHtuZXdDb2xvci5qb2luKFwiXCIpfWA7LyogT24gcsOpY3Vww6hyZSB1bmUgY291bGV1ciBoZXhhICovXG4gICAgfSxcbiAgICBmb3JtVG9Kc29uOiAoZm9ybSkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuICAgICAgICBjb25zdCBrZXlzID0gZGF0YS5rZXlzKCk7Ly9rZXlzIGVzdCB1biBvYmpldCBpdMOpcmFibGUuIGVuIHRhbnQgcXXigJlpdMOpcmFibGUgaWwgZm9uY3Rpb25uZSBhdmVjIGZvciBvZiAoZXQgbm9uIGZvciBpbilcbiAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHt9O1xuICAgICAgICAvL09uIHLDqXVjdXDDqHJlIGxlcyBkb25uw6llcyBkdSBmb3JtdWxhaXJlXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgIGRhdGFUb1NlbmRba2V5XSA9IGRhdGEuZ2V0KGtleSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkYXRhVG9TZW5kO1xuICAgIH0sXG4gICAgY2hlY2tUeXBlOihlLHdhbnRlZFR5cGUpPT57XG4gICAgICAgIGNvbnN0IGNoZWNrPWUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhgJHt3YW50ZWRUeXBlLnRvTG93ZXJDYXNlKCl9TWFpbmApO1xuICAgICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSxcbiAgICB0cmlnZ2VyTW9kYWw6IChuYW1lLCBkYXRhID0ge30pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJydW5uaW5nXCIpO1xuICAgICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBhZGQke25hbWV9TW9kYWxgKTtcbiAgICAgICAgY29uc3QgZm9ybSA9IG1vZGFsLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9ybVwiKVswXTtcbiAgICAgICAgY29uc29sZS5sb2coZm9ybSk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGZvcm0ucXVlcnlTZWxlY3RvcihgIyR7a2V5fWApO1xuICAgICAgICAgICAgICAgIGVsZW0udmFsdWUgPSBkYXRhW2tleV07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBtb2RhbC5jbGFzc0xpc3QuYWRkKFwiaXMtYWN0aXZlXCIpO1xuICAgIH0sXG4gICAga2lsbE1vZGFsOiAoKSA9PiB7XG4gICAgICAgIC8qIGtpbGwgdG91dGVzIGxlcyBtb2RhbGVzICovXG4gICAgICAgIGNvbnN0IG1vZGFscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW9kYWwuaXMtYWN0aXZlXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhtb2RhbHMpO1xuICAgICAgICBtb2RhbHMuZm9yRWFjaCgoZWwpID0+IHsgZWwuY2xhc3NMaXN0LnJlbW92ZShcImlzLWFjdGl2ZVwiKSB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUZyb21ET006ICh0eXBlLCBpZCkgPT4ge1xuICAgICAgICBjb25zdCBET01lbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtJHt0eXBlLnRvTG93ZXJDYXNlKCl9LWlkPVwiJHtpZH1cIl1gKTtcbiAgICAgICAgRE9NZWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKERPTWVsZW1lbnQpO1xuICAgIH0sXG4gICAgZ2xvYmFsRHJhZ2dhYmxlOiAoYm9vbFN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBkcmFnZ2FibGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmxpc3RNYWluLC5jYXJkTWFpbiwubGFiZWxNYWluYCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGJvb2xTdHJpbmcsIGRyYWdnYWJsZXMubGVuZ3RoKTtcbiAgICAgICAgZHJhZ2dhYmxlcy5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImRyYWdnYWJsZVwiLCBib29sU3RyaW5nKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHM9e3Rvb2xzfTsiXX0=
