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
const { tools } = require("./tools");
const { restRoot } = require("./restRoot");
const { labelModule } = require("./label");

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
        triggerDeleteCard.addEventListener("submit", cardModule.handleDeleteCard);

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
        if (tools.checkType(e, "card")) {
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
            /* Si l’association existe déjà on ne fait rien */
            if (!e.target.querySelector(`[data-label-id="${labelId}"]`)) {
                const cardId = e.target.closest(".cardMain").getAttribute("data-card-id");
                e.dataTransfer.clearData("text/plain");
                labelModule.createAssociation(cardId, labelId);
            };
        } else if (type === "card") {
            const cardId = id;
            const draggedCard = document.querySelector(`[data-card-id="${cardId}"]`);
            const targetedCard = e.target.closest(".cardMain");
            const list = targetedCard.closest(".listMain");

            if (draggedCard
                && draggedCard !== targetedCard) {

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
                    const method = e.clientY < boxHeightCenter ? "before" : "after";
                    targetedCard[method](draggedCard);

                    const list2 = targetedCard.closest(".listMain");
                    const draggedCardListId = list.dataset.listId;
                    const targetCardListId = list2.dataset.listId;
                    const targetCardId = targetedCard.dataset.cardId;
                    cardModule.changeListOfCard(cardId, draggedCardListId);
                    cardModule.changeListOfCard(targetCardId, targetCardListId);
                    cardModule.saveCardsPositions(list);
                    cardModule.saveCardsPositions(list2);
                };

            };
        };


    },
    changeListOfCard: (cardId, listId) => {
        fetch(`${restRoot}/card/${cardId}`, tools.setRequest("PATCH", { list_id: listId }));
    },
    saveCardsPositions: (listDOM) => {
        console.log("save ?");
        const cards = listDOM.querySelectorAll(".cardMain");
        let newPositionIndex = 0;
        cards.forEach(el => {
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
    handleDeleteCard: (e) => {
        e.preventDefault();
        const cardId = e.target.closest(".cardMain").dataset.cardId;
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
module.exports = { cardModule };
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
                /* On update la view sur toutes les instances */
                const labels=document.querySelectorAll(`[data-label-id="${labelId}"]`);
                labels.forEach(el=>{
                    const labelName = el.querySelector(".labelName");
                    labelName.textContent = data.name;
                    el.style.setProperty("background-color", data.color);
                });
                /* on ferme le formulaire */
                const LabelInDictName=e.target.closest(".labelMain").querySelector(".labelName");
                console.log("LABELS",LabelInDictName);
                tools.swapElements(e.target, LabelInDictName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL2NhcmQuanMiLCJzcmMvbGFiZWwuanMiLCJzcmMvbGlzdC5qcyIsInNyYy9yZXN0Um9vdC5qcyIsInNyYy90b29scy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHt0b29sc309cmVxdWlyZShcIi4vdG9vbHNcIik7XG5jb25zdCB7Y2FyZE1vZHVsZX09cmVxdWlyZShcIi4vY2FyZFwiKTtcbmNvbnN0IHtsaXN0TW9kdWxlfT1yZXF1aXJlKFwiLi9saXN0XCIpO1xuY29uc3Qge2xhYmVsTW9kdWxlfT1yZXF1aXJlKFwiLi9sYWJlbFwiKTtcblxuY29uc3QgYXBwID0ge1xuICAgIGFkZExpc3RlbmVyczogKCkgPT4ge1xuICAgICAgICAvKiBnZXN0aW9uIGR1IGNsaWNrIGRhbnMgbGEgZmVuZXRyZSAqL1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIC8qIHNpIG9uIGNsaXF1ZSBlbiBkZWhvcnMgZOKAmXVuIGZvcm0gZGUgbW9kaWZpY2F0aW9uIGRlIHRpdHJlIGRlIGxpc3RlLCBvbiBsZXMgZmVybWUgdG91cyAqL1xuICAgICAgICAgICAgaWYgKCFlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJtb2RpZnlMaXN0SW5wdXRcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlMaXN0Rm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLm1vZGlmeUxpc3RcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdE5hbWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5saXN0TmFtZVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFzaGNhbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmRlbGV0ZUxpc3RcIik7XG4gICAgICAgICAgICAgICAgLyogcG91ciBjb25jYXTDqW5lciBvbiB0cmFuc2Zvcm1lIGxlcyBOb2RlTGlzdCBlbiBBcnJheSAqL1xuICAgICAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhtb2RpZnlMaXN0Rm9ybXMsIEFycmF5LmZyb20obGlzdE5hbWVzKS5jb25jYXQoQXJyYXkuZnJvbSh0cmFzaGNhbnMpKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKiBzaSBvbiBjbGlxdWUgZW4gZGVob3JzIGTigJl1biBmb3JtIGRlIG1vZGlmaWNhdGlvbiBkZSBMQUJFTCwgb24gbGVzIGZlcm1lIHRvdXMgKi9cbiAgICAgICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChcIi5lZGl0TGFiZWxcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlMaXN0Rm9ybXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmVkaXRMYWJlbFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsYWJlbE5hbWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5sYWJlbE5hbWVcIik7XG4gICAgICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKG1vZGlmeUxpc3RGb3JtcywgbGFiZWxOYW1lcyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKiBPbiB2w6lyaWZpZSBzaSBsZSBib3V0b24gY2xpcXXDqSBlc3QgbGUgY3JheW9uIGTigJnDqWRpdGlvbiBkZSBjYXJ0ZS5cbiAgICAgICAgICAgIGxhIHPDqWxlY3Rpb24gc2UgZmFpdCBhdmVjIGNsb3Nlc3Qgw6AgY2F1c2UgZOKAmWlzc3VlcyBkdWVzIGF1IFNWRyAqL1xuICAgICAgICAgICAgY29uc3QgdGVzdEVkaXRDYXJkQnV0dG9uID0gZS50YXJnZXQuY2xvc2VzdChcImZvcm1cIikgP1xuICAgICAgICAgICAgICAgIGUudGFyZ2V0LmNsb3Nlc3QoXCJmb3JtXCIpLmNsYXNzTGlzdC5jb250YWlucyhcInRyaWdnZXJQYXRjaENhcmRcIilcbiAgICAgICAgICAgICAgICA6IGZhbHNlO1xuXG4gICAgICAgICAgICAvKiBvbiB2w6lyaWZpZSBxdWUgdGFyZ2V0IG7igJllc3QgcGFzIHVuIMOpbMOpbWVudCBkdSBjYXJkIGVkaXQgZm9ybSBcbiAgICAgICAgICAgIHBvdXIgdG91cyBsZXMgZmVybWVyICovXG4gICAgICAgICAgICAvLyBpZiAoIWUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm1vZGlmeUNhcmRJbnB1dFwiKSkge1xuICAgICAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLm1vZGlmeUNhcmRcIikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbW9kaWZ5Q2FyZEZvcm1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5tb2RpZnlDYXJkXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcmRzQ29udGVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNhcmRDb250ZW50XCIpO1xuXG4gICAgICAgICAgICAgICAgLyogc2kgbGUgYm91dG9uIGNsaXF1w6kgZXN0IGxlIGNyYXlvbiwgb24gbGUgcmV0aXJlIGRlIGxhIGxpc3RlIGRlcyDDqWzDqW1lbnRzIMOgIGVmZmFjZXJcbiAgICAgICAgICAgICAgICBsZSDDqWRpdCBmb3JtIGNvdXJhbnQsIGNhciBzb24gZWZmYWNlbWVudCBlc3QgZ8OpcmVyIHBhciB1biBhdXRyZSDDqXbDqG5lbWVudCAoY2VsdWkgZHUgYm91dG9uIGNyYXlvbiBjbGlxdcOpKS5cbiAgICAgICAgICAgICAgICBUb3V0ZSBjZXR0ZSBvcMOpcmF0aW9uIGFmaW4gZOKAmcOpdml0ZXIgZGVzIHTDqWzDqXNjb3BhZ2VzIGTigJlldmVudHMuXG4gICAgICAgICAgICAgICAgRHUgY291cCBsZXMgZWRpdCBmb3JtcyBzZSBmZXJtZW50IHF1YW5kIDogb24gY2xpcXVlIGVuIGRlaG9ycyBPVSBzdXIgbGUgYm91dG9uIGNyYXlvbiAobHVpIG1lbWUgZW4gZGVob3JzKSAqL1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RWRpdENhcmRCdXR0b24pIHtcblxuICAgICAgICAgICAgICAgICAgICAvKiBvbiBwYXNzZSBkZSBOb2RlTGlzdCDDoCBBcnJheSBwb3VyIGF2b2lyIGZpbHRlciAqL1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlDYXJkRm9ybXMgPSBBcnJheS5mcm9tKG1vZGlmeUNhcmRGb3Jtcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG1vZGlmeUNhcmRGb3Jtcyk7XG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeUNhcmRGb3JtcyA9IG1vZGlmeUNhcmRGb3Jtc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihlbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogb24gZ2FyZGUgZGFucyBsZSB0YWJsZWF1IGRlcyDDqWzDqW1lbnRzIMOgIGVmZmFjZXIgcXVlIGNldXggcXVpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5lIHNvbnQgcGFzIGRhbnMgbGEgbWVtZSBjYXJ0ZSBxdWUgbGUgYm91dG9uIGNsaXF1w6kgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKSAhPT0gZWwuY2xvc2VzdChcIi5jYXJkTWFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJsb25ndWV1clwiLCBtb2RpZnlDYXJkRm9ybXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobW9kaWZ5Q2FyZEZvcm1zLCBjYXJkc0NvbnRlbnRzKTtcbiAgICAgICAgICAgICAgICB0b29scy5zd2FwRWxlbWVudHMobW9kaWZ5Q2FyZEZvcm1zLCBjYXJkc0NvbnRlbnRzKTtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyogT24gcsOpYWN0aXZlIGxlIGRyYWcgbiBkcm9wIHNpIGzigJnDqWzDqW1lbnQgY2xpcXXDqSBu4oCZZXN0IHBhcyBlbmZhbnQgZGVzIGZvcm1zIHNww6ljaWZpw6lzICovXG4gICAgICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCJmb3JtLm1vZGlmeUNhcmQsZm9ybS5lZGl0TGFiZWxcIikpXG4gICAgICAgICAgICB0b29scy5nbG9iYWxEcmFnZ2FibGUoXCJ0cnVlXCIpO1xuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgIC8vIGxhYmVsTW9kdWxlLnNldExhYmVsRm9ybSgpO1xuICAgICAgICBhd2FpdCBsaXN0TW9kdWxlLmRyYXdMaXN0cygpO1xuICAgICAgICBhd2FpdCBsYWJlbE1vZHVsZS5kcmF3TGFiZWxzSW5EaWN0aW9ubmFyeSgpO1xuICAgICAgICBhcHAuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGNhcmRNb2R1bGUuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGxpc3RNb2R1bGUuYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIGxhYmVsTW9kdWxlLmFkZExpc3RlbmVycygpO1xuICAgIH1cbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGFwcC5pbml0KTsiLCJjb25zdCB7IHRvb2xzIH0gPSByZXF1aXJlKFwiLi90b29sc1wiKTtcbmNvbnN0IHsgcmVzdFJvb3QgfSA9IHJlcXVpcmUoXCIuL3Jlc3RSb290XCIpO1xuY29uc3QgeyBsYWJlbE1vZHVsZSB9ID0gcmVxdWlyZShcIi4vbGFiZWxcIik7XG5cbmNvbnN0IGNhcmRNb2R1bGUgPSB7XG4gICAgbWFrZUNhcmRJbkRPTTogKGNhcmQpID0+IHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhcmRUZW1wbGF0ZVwiKTtcbiAgICAgICAgY29uc3QgY2xvbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IG1haW4gPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLmNhcmRNYWluXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhjYXJkLmNvbG9yKTtcbiAgICAgICAgbWFpbi5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtY29sb3JcIiwgY2FyZC5jb2xvcik7XG4gICAgICAgIG1haW4uc2V0QXR0cmlidXRlKFwiZGF0YS1jYXJkLWlkXCIsIGNhcmQuaWQpO1xuICAgICAgICBtYWluLnNldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1wb3NpdGlvblwiLCBjYXJkLnBvc2l0aW9uKTtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5jYXJkQ29udGVudFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coY29udGVudCk7XG4gICAgICAgIGNvbnRlbnQudGV4dENvbnRlbnQgPSBjYXJkLmNvbnRlbnQ7XG5cbiAgICAgICAgLy8gY29uc3QgbGFiZWxDb250YWluZXI9Y2xvbmUucXVlcnlTZWxlY3RvcihcIi5sYWJlbENvbnRhaW5lclwiKTtcbiAgICAgICAgLy8gbGFiZWxDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsKGUpPT57XG4gICAgICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0O1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtbGlzdC1pZD1cIiR7Y2FyZC5saXN0X2lkfVwiXWApO1xuICAgICAgICBjb25zb2xlLmxvZyhsaXN0KTtcblxuICAgICAgICBjb25zdCBzaG93SGlkZVBhdGNoQ2FyZEZvcm0gPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLnRyaWdnZXJQYXRjaENhcmRcIik7XG4gICAgICAgIGNvbnN0IHRyaWdnZXJEZWxldGVDYXJkID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi50cmlnZ2VyRGVsZXRlQ2FyZFwiKTtcbiAgICAgICAgY29uc3QgZWRpdEZvcm0gPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLm1vZGlmeUNhcmRcIik7XG4gICAgICAgIHNob3dIaWRlUGF0Y2hDYXJkRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGNhcmRNb2R1bGUuaGFuZGxlU2hvd0hpZGVQYXRjaEZvcm0pO1xuXG4gICAgICAgIC8qIERSQUfCoEFORMKgRFJPUCAqL1xuICAgICAgICAvKiBhdm9pZCBkJmQgb24gaW5wdXRzIDogc2VlIGJlbG93IGhhbmRsZVNob3dIaWRlUGF0Y2hGb3JtKi9cbiAgICAgICAgLyogZCZkIGV2ZW50cyAqL1xuICAgICAgICBtYWluLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIGNhcmRNb2R1bGUub25Ecm9wKTtcbiAgICAgICAgbWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgY2FyZE1vZHVsZS5vbkRyYWdPdmVyKTtcbiAgICAgICAgbWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIGNhcmRNb2R1bGUub25EcmFnU3RhcnQpO1xuICAgICAgICAvLyBtYWluLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnXCIsIGNhcmRNb2R1bGUub25EcmFnKTtcbiAgICAgICAgLy8gbWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VuZFwiLCBjYXJkTW9kdWxlLm9uRHJhZ0VuZCk7XG5cbiAgICAgICAgLyogPT09PT09PT09QcKgREVUQUNIRVIgKi9cbiAgICAgICAgdHJpZ2dlckRlbGV0ZUNhcmQuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBjYXJkTW9kdWxlLmhhbmRsZURlbGV0ZUNhcmQpO1xuXG4gICAgICAgIGVkaXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGUpID0+IHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBjYXJkTW9kdWxlLmhhbmRsZVBhdGNoQ2FyZChlLCBjYXJkKTsgfSk7XG5cbiAgICAgICAgLyogQXBwZW5kICovXG4gICAgICAgIGNvbnN0IGxpc3RDb250ZW50ID0gbGlzdC5xdWVyeVNlbGVjdG9yKFwiLmxpc3RDb250ZW50XCIpO1xuICAgICAgICBsaXN0Q29udGVudC5hcHBlbmRDaGlsZChjbG9uZSk7XG5cbiAgICAgICAgLyogb24gcmFqb3V0ZSBsZXMgbGFiZWxzIHF1YW5kIGxhIGNhcnRlIGVzdCBkw6lqYSBkYW5zIGxlIERPTSAqL1xuICAgICAgICBpZiAoY2FyZC5sYWJlbHMpIHtcbiAgICAgICAgICAgIGNhcmQubGFiZWxzLmZvckVhY2gobGFiZWwgPT4ge1xuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLm1ha2VMYWJlbEluRE9NKGxhYmVsLCBtYWluLnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxDb250YWluZXJcIikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIG9uRHJhZ1N0YXJ0OiAoZSkgPT4ge1xuICAgICAgICBpZiAodG9vbHMuY2hlY2tUeXBlKGUsIFwiY2FyZFwiKSkge1xuICAgICAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGlkOiBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtaWRcIiksXG4gICAgICAgICAgICAgICAgdHlwZTogXCJjYXJkXCJcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIG9uRHJhZ0VuZDogKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyB0b29scy5zaG93RWxlbWVudChlLnRhcmdldCk7XG4gICAgfSxcbiAgICBvbkRyb3A6IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJkcm9wXCIsIGUpO1xuICAgICAgICBjb25zdCB7IGlkLCB0eXBlIH0gPSBKU09OLnBhcnNlKGUuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJkcm9wIGRhdGFcIiwgdHlwZSwgaWQpO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJsYWJlbFwiKSB7XG4gICAgICAgICAgICBjb25zdCBsYWJlbElkID0gaWQ7XG4gICAgICAgICAgICAvKiBTaSBs4oCZYXNzb2NpYXRpb24gZXhpc3RlIGTDqWrDoCBvbiBuZSBmYWl0IHJpZW4gKi9cbiAgICAgICAgICAgIGlmICghZS50YXJnZXQucXVlcnlTZWxlY3RvcihgW2RhdGEtbGFiZWwtaWQ9XCIke2xhYmVsSWR9XCJdYCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXJkSWQgPSBlLnRhcmdldC5jbG9zZXN0KFwiLmNhcmRNYWluXCIpLmdldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1pZFwiKTtcbiAgICAgICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5jbGVhckRhdGEoXCJ0ZXh0L3BsYWluXCIpO1xuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLmNyZWF0ZUFzc29jaWF0aW9uKGNhcmRJZCwgbGFiZWxJZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiY2FyZFwiKSB7XG4gICAgICAgICAgICBjb25zdCBjYXJkSWQgPSBpZDtcbiAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRDYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtY2FyZC1pZD1cIiR7Y2FyZElkfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ZWRDYXJkID0gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKTtcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSB0YXJnZXRlZENhcmQuY2xvc2VzdChcIi5saXN0TWFpblwiKTtcblxuICAgICAgICAgICAgaWYgKGRyYWdnZWRDYXJkXG4gICAgICAgICAgICAgICAgJiYgZHJhZ2dlZENhcmQgIT09IHRhcmdldGVkQ2FyZCkge1xuXG4gICAgICAgICAgICAgICAgLyogY29udHJvbGVyIHNpIGRhbnMgbGEgbWVtZSBsaXN0ZSBldCBjaGVjayBwbGFjZXIgZW4gYXZhbnQgZW4gYXJyacOocmUgKi9cbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ZWRDYXJkLnBhcmVudE5vZGUgPT09IGRyYWdnZWRDYXJkLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHJhZ2dlZFBvc2l0aW9uID0gZHJhZ2dlZENhcmQuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXJkLXBvc2l0aW9uXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRlZFBvc2l0aW9uID0gdGFyZ2V0ZWRDYXJkLmdldEF0dHJpYnV0ZShcImRhdGEtY2FyZC1wb3NpdGlvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW92ZUluZGV4ID0gZHJhZ2dlZFBvc2l0aW9uIC0gdGFyZ2V0ZWRQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgLyogZMOpcGxhY2VyIGxhIGNhcnRlIGFwcsOocyBvdSBhdmFudCBlbiBmb25jdGlvbiAqL1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0aG9kID0gbW92ZUluZGV4IDwgMCA/IFwiYWZ0ZXJcIiA6IFwiYmVmb3JlXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRDYXJkRGV0YWNoZWQgPSBkcmFnZ2VkQ2FyZC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGRyYWdnZWRDYXJkKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ZWRDYXJkW21ldGhvZF0oZHJhZ2dlZENhcmREZXRhY2hlZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5zYXZlQ2FyZHNQb3NpdGlvbnMobGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIC8qIHNpIHN1ciBkZXV4IGxpc3Rlcywgw6dhIGZvbmN0aW9ubmUgZGlmZsOpcmVtbWVudCA6XG4gICAgICAgICAgICAgICAgICAgIGxhIGNhcnRlIHNlIHBsYWNlIGVuIGZvbmN0aW9uIGR1IHBvaW50ZXVyIHBhciByYXBwb3J0IGF1IGNlbnRyZSBkZSBsYSBjYXJ0ZSBjaWJsZS4gU2kgYXUgZGVzc3VzIHNlIHBsYWNlIGF1IGRlc3N1cyxcbiAgICAgICAgICAgICAgICAgICAgU2kgZW4gZGVzc291cyBzZSBwbGFjZSBlbiBkZXNzb3VzLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldGVkQ2FyZEJvdW5kaW5nID0gdGFyZ2V0ZWRDYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpOy8vb2JqZXQgcXVpIGNvbnRpZW50IHRvdXRlcyBsZXMgaW5mb3MgZGUgcG9zaXRpb25uZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94SGVpZ2h0Q2VudGVyID0gKHRhcmdldGVkQ2FyZEJvdW5kaW5nLmJvdHRvbSArIHRhcmdldGVkQ2FyZEJvdW5kaW5nLnRvcCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRob2QgPSBlLmNsaWVudFkgPCBib3hIZWlnaHRDZW50ZXIgPyBcImJlZm9yZVwiIDogXCJhZnRlclwiO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRlZENhcmRbbWV0aG9kXShkcmFnZ2VkQ2FyZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlzdDIgPSB0YXJnZXRlZENhcmQuY2xvc2VzdChcIi5saXN0TWFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHJhZ2dlZENhcmRMaXN0SWQgPSBsaXN0LmRhdGFzZXQubGlzdElkO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRDYXJkTGlzdElkID0gbGlzdDIuZGF0YXNldC5saXN0SWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldENhcmRJZCA9IHRhcmdldGVkQ2FyZC5kYXRhc2V0LmNhcmRJZDtcbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5jaGFuZ2VMaXN0T2ZDYXJkKGNhcmRJZCwgZHJhZ2dlZENhcmRMaXN0SWQpO1xuICAgICAgICAgICAgICAgICAgICBjYXJkTW9kdWxlLmNoYW5nZUxpc3RPZkNhcmQodGFyZ2V0Q2FyZElkLCB0YXJnZXRDYXJkTGlzdElkKTtcbiAgICAgICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5zYXZlQ2FyZHNQb3NpdGlvbnMobGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIGNhcmRNb2R1bGUuc2F2ZUNhcmRzUG9zaXRpb25zKGxpc3QyKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG5cbiAgICB9LFxuICAgIGNoYW5nZUxpc3RPZkNhcmQ6IChjYXJkSWQsIGxpc3RJZCkgPT4ge1xuICAgICAgICBmZXRjaChgJHtyZXN0Um9vdH0vY2FyZC8ke2NhcmRJZH1gLCB0b29scy5zZXRSZXF1ZXN0KFwiUEFUQ0hcIiwgeyBsaXN0X2lkOiBsaXN0SWQgfSkpO1xuICAgIH0sXG4gICAgc2F2ZUNhcmRzUG9zaXRpb25zOiAobGlzdERPTSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmUgP1wiKTtcbiAgICAgICAgY29uc3QgY2FyZHMgPSBsaXN0RE9NLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2FyZE1haW5cIik7XG4gICAgICAgIGxldCBuZXdQb3NpdGlvbkluZGV4ID0gMDtcbiAgICAgICAgY2FyZHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtcG9zaXRpb25cIiwgbmV3UG9zaXRpb25JbmRleCsrKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gZWwuZGF0YXNldC5jYXJkSWQ7XG4gICAgICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0ge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXdQb3NpdGlvbkluZGV4XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdE9iamVjdCA9IHRvb2xzLnNldFJlcXVlc3QoXCJQQVRDSFwiLCBkYXRhVG9TZW5kKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlcXVlc3RPYmplY3QpO1xuICAgICAgICAgICAgZmV0Y2goYCR7cmVzdFJvb3R9L2NhcmQvJHtpZH1gLCByZXF1ZXN0T2JqZWN0KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGF3YWl0IHJlcy5qc29uKCkpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG4gICAgb25EcmFnRW50ZXI6IChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LFxuICAgIGhhbmRsZVNob3dIaWRlUGF0Y2hGb3JtOiAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGNhcmQgPSBlLnRhcmdldC5jbG9zZXN0KFwiLmNhcmRNYWluXCIpOy8vb24gcsOpY3Vww6hyZSBsYSBjYXJ0ZVxuICAgICAgICBjb25zdCBlZGl0Rm9ybSA9IGNhcmQucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlDYXJkXCIpOy8vc29uIGZvcm11bGFpcmUgZOKAmcOpZGl0aW9uXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoXCIuY2FyZENvbnRlbnRcIik7Ly9sZSBjb250YWluZXIgZHUgdGV4dGVcbiAgICAgICAgLy8gY29uc3Qgc2hvd0Zvcm1CdXR0b24gPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoXCIuZWRpdEJ1dHRvblwiKTsvL2xlIGNvbnRhaW5lciBkdSB0ZXh0ZVxuXG4gICAgICAgIGNvbnN0IHRleHRhcmVhID0gZWRpdEZvcm0ucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlDYXJkSW5wdXRcIik7XG4gICAgICAgIC8qIHRleHRhcmVhIGEgdW5lIHByb3ByacOpdMOpIHZhbHVlIG1haXMgcGFzIGTigJlhdHRyaWJ1dCB2YWx1ZSAqL1xuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IGNvbnRlbnQudGV4dENvbnRlbnQ7XG5cbiAgICAgICAgLyogb24gZm91cm5pdCBsYSBjb3VsZXVyIGF1IGNoYW1wICovXG4gICAgICAgIGNvbnN0IGNvbG9yID0gY2FyZC5xdWVyeVNlbGVjdG9yKFwiLm1vZGlmeUNvbG9ySW5wdXRcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ09MT1JcIiwgY2FyZC5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKFwiYmFja2dyb3VuZC1jb2xvclwiKSk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudENhcmRDb2xvciA9IGNhcmQuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShcImJhY2tncm91bmQtY29sb3JcIik7XG4gICAgICAgIGNvbG9yLnZhbHVlID0gdG9vbHMucmdiVG9IZXgoY3VycmVudENhcmRDb2xvcik7LyogT24gcsOpY3Vww6hyZSB1bmUgY291bGV1ciBoZXhhICovXG4gICAgICAgIGNvbnNvbGUubG9nKGNvbG9yLnZhbHVlKTtcblxuICAgICAgICAvKiBBdHRlbnRpb24gOiBldmVudCBzdXIgbGEgZmVuZXRyZSBFVCBzdXIgbGUgYm91dG9uIGTigJlhZmZpY2hhZ2UgZGUgZWRpdEZvcm0gOlxuICAgICAgICBsZXMgZGV1eCBwZXV2ZW50IHPigJlhbm51bGVyLkdlc3Rpb24gZGUgbGEgZmVybWV0dXJlIHN1ciB0b29scy5saXN0ZW5lcnMgKi9cbiAgICAgICAgY29uc29sZS5sb2coZWRpdEZvcm0uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtaGlkZGVuXCIpKTtcbiAgICAgICAgaWYgKGVkaXRGb3JtLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWhpZGRlblwiKSkge1xuICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKGNvbnRlbnQsIGVkaXRGb3JtKTtcbiAgICAgICAgICAgIC8qIGRpc2FibGUgY2FyZCBkcmFnZ2FibGUgd2hlbiBlZGl0Rm9ybSBiZWNvbWVzIHZpc2libGUgKi9cbiAgICAgICAgICAgIHRvb2xzLmdsb2JhbERyYWdnYWJsZShcImZhbHNlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKGVkaXRGb3JtLCBjb250ZW50KTtcbiAgICAgICAgICAgIC8qIGFsbG93IGNhcmQgZHJhZ2dhYmxlIHdoZW4gZWRpdEZvcm0gYmVjb21lcyBpbnZpc2libGUgKi9cbiAgICAgICAgICAgIHRvb2xzLmdsb2JhbERyYWdnYWJsZShcInRydWVcIik7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIGhhbmRsZVBhdGNoQ2FyZDogYXN5bmMgKGUsIGNhcmQpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsZXQgcGF0Y2hDYXJkO1xuICAgICAgICBsZXQgY29udGVudDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGF0Y2hpbmdcIik7XG4gICAgICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0gdG9vbHMuZm9ybVRvSnNvbihlLnRhcmdldCk7XG4gICAgICAgICAgICAvKiBvbiByw6ljdXDDqHJlIGxhIHN0cmluZyBkZXMgbGFiZWxzICovXG4gICAgICAgICAgICBsZXQgbGFiZWxOYW1lcyA9IGRhdGFUb1NlbmQubGFiZWxzO1xuXG4gICAgICAgICAgICAvKiB1cGRhdGUgdW5lIGNhcnRlICovXG4gICAgICAgICAgICBkZWxldGUgZGF0YVRvU2VuZC5sYWJlbHM7Ly9vbiBzdXBwcmltZSBhdmFudCBk4oCZZW52b3llciBlbiBiYXNlXG4gICAgICAgICAgICBjb25zdCByb3V0ZSA9IGAke3Jlc3RSb290fS9jYXJkLyR7Y2FyZC5pZH1gO1xuICAgICAgICAgICAgY2FyZERPTSA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIuY2FyZE1haW5cIik7XG4gICAgICAgICAgICBjb250ZW50ID0gY2FyZERPTS5xdWVyeVNlbGVjdG9yKFwiLmNhcmRDb250ZW50XCIpO1xuICAgICAgICAgICAgcGF0Y2hDYXJkID0gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKS5xdWVyeVNlbGVjdG9yKFwiLm1vZGlmeUNhcmRcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhVG9TZW5kKTtcbiAgICAgICAgICAgIGF3YWl0IGZldGNoKHJvdXRlLCB0b29scy5zZXRSZXF1ZXN0KFwiUEFUQ0hcIiwgZGF0YVRvU2VuZCkpO1xuICAgICAgICAgICAgY29udGVudC50ZXh0Q29udGVudCA9IGRhdGFUb1NlbmQuY29udGVudDtcbiAgICAgICAgICAgIGNhcmRET00uc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGRhdGFUb1NlbmQuY29sb3IpO1xuXG4gICAgICAgICAgICAvKiBjcsOpZXIgZGVzIGFzc29jaWF0aW9ucyBkZSBsYWJlbHMgKi9cbiAgICAgICAgICAgIGxhYmVsTmFtZXMgPSBsYWJlbE5hbWVzLnNwbGl0KFwiO1wiKTsvL3RhYmxlYXUgZGVzIGxhYmVsc1xuICAgICAgICAgICAgbGV0IGxhYmVsSW5EaWN0aW9uYXJ5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYWJlbERpY3Rpb25hcnlcIikucXVlcnlTZWxlY3RvckFsbChcIi5sYWJlbE1haW5cIik7Ly9ub2RlTGlzdCBkZXMgbGFiZWxzIGVuIGhhdXQgZGUgcGFnZVxuICAgICAgICAgICAgLy9PbiBlbiBmYWl0IHVuIHRhYmxlYXVcbiAgICAgICAgICAgIGxhYmVsSW5EaWN0aW9uYXJ5ID0gQXJyYXkuZnJvbShsYWJlbEluRGljdGlvbmFyeSk7XG4gICAgICAgICAgICAvKiBQb3VyIGNoYXF1ZSBub20gZGUgbGFiZWwgZW52b3nDqSBkYW5zIGxlIGNoYW1wLCBvbiBjaGVyY2hlIGxlIGxhYmVsIGNvcnJlc3BvbmRhbnQgZXQgb24gbOKAmWFzc29jaWUuICovXG4gICAgICAgICAgICBsYWJlbE5hbWVzLmZvckVhY2gobGFiZWxOYW1lID0+IHtcbiAgICAgICAgICAgICAgICAvKiBPbiByw6ljdXDDqHJlIGxlIGxhYmVsIHF1aSBwb3J0ZSBsZSBub20gcXXigJlvbiBjaGVyY2hlIMOgIGFzc29jaWVyICovXG4gICAgICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBsYWJlbEluRGljdGlvbmFyeS5maW5kKGVsSW5EaWN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFiZWxOYW1lRnJvbURpY3QgPSBlbEluRGljdC5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsTmFtZVwiKS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsTmFtZUZyb21EaWN0ID09PSBsYWJlbE5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsSWQgPSBsYWJlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtbGFiZWwtaWRgKTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUuY3JlYXRlQXNzb2NpYXRpb24oY2FyZC5pZCwgbGFiZWxJZCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0b29scy5zd2FwRWxlbWVudHMocGF0Y2hDYXJkLCBjb250ZW50KTtcbiAgICAgICAgfTtcblxuICAgIH0sXG4gICAgaGFuZGxlRGVsZXRlQ2FyZDogKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjYXJkSWQgPSBlLnRhcmdldC5jbG9zZXN0KFwiLmNhcmRNYWluXCIpLmRhdGFzZXQuY2FyZElkO1xuICAgICAgICBjb25zdCByb3V0ZSA9IGAke3Jlc3RSb290fS9jYXJkLyR7Y2FyZElkfWA7XG4gICAgICAgIGZldGNoKHJvdXRlLCB0b29scy5zZXRSZXF1ZXN0KFwiREVMRVRFXCIsIHsgaWQ6IGNhcmRJZCB9KSk7XG4gICAgICAgIHRvb2xzLmRlbGV0ZUZyb21ET00oXCJjYXJkXCIsIGNhcmRJZCk7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnM6ICgpID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBcIkNhcmRcIjtcblxuICAgICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBhZGQke2VsfU1vZGFsYCk7XG5cblxuICAgICAgICAvKiBnZXN0aW9uIGRlcyBib3V0b25zIGRlIGZlcm1ldHVyZSAqL1xuICAgICAgICBjb25zdCBjbG9zZUJ1dHRvbnMgPSBtb2RhbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiY2xvc2VcIik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2xvc2VcIiwgY2xvc2VCdXR0b25zKTtcbiAgICAgICAgZm9yIChjb25zdCBidXR0b24gb2YgY2xvc2VCdXR0b25zKSB7XG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgdG9vbHMua2lsbE1vZGFsKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIGNvbnN0IGZvcm0gPSBtb2RhbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XG4gICAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm1vZGFsIHN1Ym1pdFwiKTtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHRvb2xzLmZvcm1Ub0pzb24oZS50YXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgLyogT24gcsOpY3Vww6hyZSBsYSBwcm9jaGFpbmUgcG9zaXRpb24gZGUgZmluKi9cbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtlbC50b0xvd2VyQ2FzZSgpfU1haW5gKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKCFwb3NpdGlvbilcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSAwO1xuXG4gICAgICAgICAgICAgICAgZGF0YVRvU2VuZC5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocG9zaXRpb24sIGRhdGFUb1NlbmQucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIC8vIGlmICghZGF0YVRvU2VuZC5wb3NpdGlvbilcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YVRvU2VuZCk7XG4gICAgICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS8ke2VsLnRvTG93ZXJDYXNlKCl9YCwgdG9vbHMuc2V0UmVxdWVzdChcIlBPU1RcIiwgZGF0YVRvU2VuZCkpO1xuICAgICAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgICAgICAgICAvKiBMYSBwYXJ0aWUgcXVpIGNoYW5nZSBk4oCZdW5lIG1vZGFsZSDDoCBs4oCZYXV0cmUgKi9cbiAgICAgICAgICAgICAgICBpZiAocmVzKVxuICAgICAgICAgICAgICAgICAgICBjYXJkTW9kdWxlLm1ha2VDYXJkSW5ET00ocmVzKTtcblxuICAgICAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cblxuICAgIH0sXG59O1xubW9kdWxlLmV4cG9ydHMgPSB7IGNhcmRNb2R1bGUgfTsiLCJjb25zdCB7IHRvb2xzIH0gPSByZXF1aXJlKFwiLi90b29sc1wiKTtcbmNvbnN0IHsgcmVzdFJvb3QgfSA9IHJlcXVpcmUoXCIuL3Jlc3RSb290XCIpO1xuXG5jb25zdCBsYWJlbE1vZHVsZSA9IHtcbiAgICBtYWtlTGFiZWxJbkRPTTogKGxhYmVsLCBjb250YWluZXIpID0+IHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxhYmVsVGVtcGxhdGVcIik7XG4gICAgICAgIGNvbnN0IGNsb25lID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKTtcblxuICAgICAgICBjb25zdCBsYWJlbE1haW4gPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsTWFpblwiKTtcbiAgICAgICAgbGFiZWxNYWluLnNldEF0dHJpYnV0ZShcImRhdGEtbGFiZWwtaWRcIiwgbGFiZWwuaWQpO1xuICAgICAgICAvLyBsYWJlbE1haW4uc2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbC1jb2xvclwiLCBsYWJlbC5jb2xvcik7XG4gICAgICAgIGxhYmVsTWFpbi5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtY29sb3JcIiwgbGFiZWwuY29sb3IpO1xuXG4gICAgICAgIGNvbnN0IGxhYmVsTmFtZSA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxOYW1lXCIpO1xuICAgICAgICBsYWJlbE5hbWUudGV4dENvbnRlbnQgPSBsYWJlbC5uYW1lO1xuICAgICAgICBsYWJlbE5hbWUuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIGxhYmVsTW9kdWxlLnNob3dFZGl0TGFiZWwpO1xuXG4gICAgICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuZGVsZXRlTGFiZWxcIik7XG4gICAgICAgIGRlbGV0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgbGFiZWxNb2R1bGUuZGVsZXRlTGFiZWwpO1xuXG4gICAgICAgIGNvbnN0IGVkaXRGb3JtID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5lZGl0TGFiZWxcIik7XG4gICAgICAgIGVkaXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgbGFiZWxNb2R1bGUuZWRpdExhYmVsKTtcbiAgICAgICAgY29uc3QgY29sb3JJbnB1dD1lZGl0Rm9ybS5xdWVyeVNlbGVjdG9yKFwiLmNvbG9ySW5wdXRcIik7XG4gICAgICAgIGNvbG9ySW5wdXQudmFsdWU9bGFiZWwuY29sb3I7XG4gICAgICAgIFxuICAgICAgICAvKiBEUkFHwqBBTkTCoERST1AgKi9cbiAgICAgICAgbGFiZWxNYWluLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgbGFiZWxNb2R1bGUub25EcmFnU3RhcnQpO1xuXG4gICAgICAgIC8qIEFwcGVuZCAqL1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2xvbmUpO1xuICAgIH0sXG4gICAgb25EcmFnU3RhcnQ6IChlKSA9PiB7XG4gICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdGFydERyYWdcIik7XG4gICAgICAgIGNvbnN0IG9iaiA9IHtcbiAgICAgICAgICAgIGlkOiBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWxhYmVsLWlkXCIpLFxuICAgICAgICAgICAgdHlwZTogXCJsYWJlbFwiXG4gICAgICAgIH1cbiAgICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgSlNPTi5zdHJpbmdpZnkob2JqKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGUuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcblxuICAgIH0sXG4gICAgb25EcmFnRW5kOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgfSxcbiAgICBzaG93RWRpdExhYmVsOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5jbG9zZXN0KFwiI2xhYmVsRGljdGlvbmFyeVwiKSk7XG4gICAgICAgIGlmIChlLnRhcmdldC5jbG9zZXN0KFwiI2xhYmVsRGljdGlvbmFyeVwiKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0cnkgdG8gZWRpdFwiKTtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gZS50YXJnZXQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBsYWJlbC5xdWVyeVNlbGVjdG9yKFwiLmVkaXRMYWJlbFwiKTtcbiAgICAgICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvcihcIi5uYW1lSW5wdXRcIikudmFsdWUgPSBlLnRhcmdldC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9ySW5wdXQ9Zm9ybS5xdWVyeVNlbGVjdG9yKFwiLmNvbG9ySW5wdXRcIik7XG4gICAgICAgICAgICBjb25zdCBoZXhDb2xvcj10b29scy5yZ2JUb0hleChjb2xvcklucHV0LnZhbHVlKTtcbiAgICAgICAgICAgIGNvbG9ySW5wdXQudmFsdWU9aGV4Q29sb3I7XG4gICAgICAgICAgICB0b29scy5zd2FwRWxlbWVudHMoZS50YXJnZXQsIGZvcm0pO1xuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICBlZGl0TGFiZWw6IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0b29scy5mb3JtVG9Kc29uKGUudGFyZ2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsSWQgPSBlLnRhcmdldC5jbG9zZXN0KFwiLmxhYmVsTWFpblwiKS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWxhYmVsLWlkXCIpO1xuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9sYWJlbC8ke2xhYmVsSWR9YCwgdG9vbHMuc2V0UmVxdWVzdChcIlBBVENIXCIsIGRhdGEpKTtcbiAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAgICAgICAgICAgaWYgKHJlc1swXSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8qIE9uIHVwZGF0ZSBsYSB2aWV3IHN1ciB0b3V0ZXMgbGVzIGluc3RhbmNlcyAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVscz1kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS1sYWJlbC1pZD1cIiR7bGFiZWxJZH1cIl1gKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuZm9yRWFjaChlbD0+e1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbE5hbWUgPSBlbC5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsTmFtZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxOYW1lLnRleHRDb250ZW50ID0gZGF0YS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtY29sb3JcIiwgZGF0YS5jb2xvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLyogb24gZmVybWUgbGUgZm9ybXVsYWlyZSAqL1xuICAgICAgICAgICAgICAgIGNvbnN0IExhYmVsSW5EaWN0TmFtZT1lLnRhcmdldC5jbG9zZXN0KFwiLmxhYmVsTWFpblwiKS5xdWVyeVNlbGVjdG9yKFwiLmxhYmVsTmFtZVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxBQkVMU1wiLExhYmVsSW5EaWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKGUudGFyZ2V0LCBMYWJlbEluRGljdE5hbWUpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgZGVsZXRlTGFiZWw6IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYWJlbCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubGFiZWxNYWluXCIpO1xuICAgICAgICAgICAgY29uc3QgbGFiZWxJZCA9IGxhYmVsLmdldEF0dHJpYnV0ZShcImRhdGEtbGFiZWwtaWRcIik7XG4gICAgICAgICAgICAvKiB2w6lyaWZpb25zIG/DuSBzZSB0cm91dmUgbGUgbGFiZWwgKi9cbiAgICAgICAgICAgIC8qIFByw6hzIGR1IGJvdXRvbiBcImFqb3V0ZXIgTGFiZWxcIiAqL1xuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmNsb3Nlc3QoXCIjbGFiZWxEaWN0aW9uYXJ5XCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJkZWxldGUgbGFiZWwgZnJvbSBkaWN0XCIpO1xuICAgICAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCBmZXRjaChgJHtyZXN0Um9vdH0vbGFiZWwvJHtsYWJlbElkfWAsIHRvb2xzLnNldFJlcXVlc3QoXCJERUxFVEVcIikpO1xuICAgICAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzID09PSAxKVxuICAgICAgICAgICAgICAgICAgICBsYWJlbE1vZHVsZS5kZWxldGVFdmVyeXdoZXJlKGxhYmVsSWQpO1xuXG4gICAgICAgICAgICAgICAgLyogRGFucyB1bmUgY2FyZCAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlLnRhcmdldC5jbG9zZXN0KFwiLmxhYmVsQ29udGFpbmVyXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJkZWxldGUgYXNzb2NcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FyZElkID0gZS50YXJnZXQuY2xvc2VzdChcIi5jYXJkTWFpblwiKS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhcmQtaWRcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFiZWxJZCA9IGUudGFyZ2V0LnBhcmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbC1pZFwiKTtcbiAgICAgICAgICAgICAgICBsYWJlbE1vZHVsZS5kZWxldGVBc3NvY2lhdGlvbihjYXJkSWQsIGxhYmVsSWQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfTtcblxuICAgIH0sXG4gICAgZGVsZXRlRXZlcnl3aGVyZTogKGlkKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtbGFiZWwtaWQ9XCIke2lkfVwiXWApO1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgdG9vbHMuZGVsZXRlRnJvbURPTShcIkxhYmVsXCIsIGlkKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjcmVhdGVBc3NvY2lhdGlvbjogYXN5bmMgKGNhcmRJZCwgbGFiZWxJZCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS9jYXJkLyR7Y2FyZElkfS9sYWJlbC8ke2xhYmVsSWR9YCwgdG9vbHMuc2V0UmVxdWVzdChcIlBPU1RcIikpO1xuICAgICAgICAgICAgcmVzID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgIGxldCByZXMyID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2xhYmVsLyR7bGFiZWxJZH1gKTtcbiAgICAgICAgICAgIGxhYmVsT2JqID0gYXdhaXQgcmVzMi5qc29uKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjb250YWluZXJcIixkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jYXJkLWlkPVwiJHtjYXJkSWR9XCJdYCkpO1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jYXJkLWlkPVwiJHtjYXJkSWR9XCJdYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFiZWxDb250YWluZXIgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoXCIubGFiZWxDb250YWluZXJcIik7XG4gICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUubWFrZUxhYmVsSW5ET00obGFiZWxPYmosIGxhYmVsQ29udGFpbmVyKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGRlbGV0ZUFzc29jaWF0aW9uOiBhc3luYyAoY2FyZElkLCBsYWJlbElkKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2NhcmQvJHtjYXJkSWR9L2xhYmVsLyR7bGFiZWxJZH1gLCB0b29scy5zZXRSZXF1ZXN0KFwiREVMRVRFXCIpKTtcbiAgICAgICAgICAgIHJlcyA9IGF3YWl0IHJlcy5qc29uKCk7XG5cbiAgICAgICAgICAgIGlmIChyZXMpXG4gICAgICAgICAgICAgICAgbGFiZWxNb2R1bGUuZGVsZXRlTGFiZWxGcm9tQ2FyZERPTShjYXJkSWQsIGxhYmVsSWQpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBkZWxldGVMYWJlbEZyb21DYXJkRE9NOiAoY2FyZElkLCBsYWJlbElkKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jYXJkLWlkPVwiJHtjYXJkSWR9XCJdYCk7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gY2FyZC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1sYWJlbC1pZD1cIiR7bGFiZWxJZH1cIl1gKTtcbiAgICAgICAgbGFiZWwucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChsYWJlbCk7XG4gICAgfSxcbiAgICBkcmF3TGFiZWxzSW5EaWN0aW9ubmFyeTogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYWJlbERpY3Rpb25hcnlcIik7XG4gICAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2xhYmVsYCk7XG4gICAgICAgICAgICByZXMgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgcmVzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgICAgICAgIGxhYmVsTW9kdWxlLm1ha2VMYWJlbEluRE9NKGVsLCBjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIGFkZExpc3RlbmVyczogKCkgPT4ge1xuICAgICAgICBjb25zdCBhZGRMYWJlbEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRkTGFiZWxCdXR0b25cIik7XG4gICAgICAgIGFkZExhYmVsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRvb2xzLnRyaWdnZXJNb2RhbChcIkxhYmVsXCIpIH0pO1xuXG4gICAgICAgIGNvbnN0IG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGFkZExhYmVsTW9kYWxgKTtcbiAgICAgICAgY29uc3QgZm9ybSA9IG1vZGFsLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZm9ybVwiKVswXTtcblxuICAgICAgICBjb25zdCBjbG9zZUJ1dHRvbnMgPSBtb2RhbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiY2xvc2VcIik7XG4gICAgICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGNsb3NlQnV0dG9ucykge1xuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFUb1NlbmQgPSB0b29scy5mb3JtVG9Kc29uKGUudGFyZ2V0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGFUb1NlbmQpO1xuXG4gICAgICAgICAgICBsZXQgcmVzID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2xhYmVsYCwgdG9vbHMuc2V0UmVxdWVzdChcIlBPU1RcIiwgZGF0YVRvU2VuZCkpO1xuICAgICAgICAgICAgcmVzID0gYXdhaXQgcmVzLmpzb24oKTsvL3RhYmxlYXUgYXZlYyAwOm9iamV0IDE6aXNDcmVhdGVkXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNbMF0pXG4gICAgICAgICAgICAvKiBMYSBwYXJ0aWUgcXVpIGNoYW5nZSBk4oCZdW5lIG1vZGFsZSDDoCBs4oCZYXV0cmUgKi9cbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxhYmVsRGljdGlvbmFyeVwiKTtcbiAgICAgICAgICAgICAgICBsYWJlbE1vZHVsZS5tYWtlTGFiZWxJbkRPTShyZXNbMF0sIGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG59O1xubW9kdWxlLmV4cG9ydHMgPSB7IGxhYmVsTW9kdWxlIH07IiwiY29uc3Qge3Rvb2xzfT1yZXF1aXJlKFwiLi90b29sc1wiKTtcbmNvbnN0IHtyZXN0Um9vdH09cmVxdWlyZShcIi4vcmVzdFJvb3RcIik7XG5jb25zdCB7Y2FyZE1vZHVsZX09cmVxdWlyZShcIi4vY2FyZFwiKTtcblxuY29uc3QgbGlzdE1vZHVsZSA9IHtcbiAgICBkcmF3TGlzdHM6IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmV0Y2goYCR7cmVzdFJvb3R9L2xpc3RgKTtcbiAgICAgICAgY29uc3QgbGlzdHMgPSBhd2FpdCByZXN1bHQuanNvbigpO1xuICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIGxpc3RzKSB7XG4gICAgICAgICAgICBsaXN0TW9kdWxlLm1ha2VMaXN0SW5ET00oZWwpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgbWFrZUxpc3RJbkRPTTogKGxpc3QpID0+IHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RUZW1wbGF0ZVwiKTtcbiAgICAgICAgY29uc3QgY2xvbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhjbG9uZSk7XG4gICAgICAgIGNvbnN0IGxpc3RNYWluID0gY2xvbmUucXVlcnlTZWxlY3RvcihgLmxpc3RNYWluYCk7XG4gICAgICAgIGxpc3RNYWluLnNldEF0dHJpYnV0ZShcImRhdGEtbGlzdC1pZFwiLCBsaXN0LmlkKTtcbiAgICAgICAgbGlzdE1haW4uc2V0QXR0cmlidXRlKFwiZGF0YS1saXN0LXBvc2l0aW9uXCIsIGxpc3QucG9zaXRpb24pO1xuXG4gICAgICAgIC8qIG9uIGZvdXJuaXQgbGUgdGl0cmUgKi9cbiAgICAgICAgY29uc3QgdGl0bGUgPSBjbG9uZS5xdWVyeVNlbGVjdG9yKFwiLmxpc3ROYW1lXCIpO1xuICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGxpc3QubmFtZTtcblxuICAgICAgICBjb25zdCBwbHVzID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5hZGRDYXJkVG9MaXN0XCIpO1xuICAgICAgICAvKiBHZXN0aW9uIGR1IGJvdXRvbiArIHBvdXIgYWpvdXRlciB1bmUgY2FydGUgKi9cbiAgICAgICAgcGx1cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIHRvb2xzLnRyaWdnZXJNb2RhbChcIkNhcmRcIiwgeyBjYXJkX2xpc3RJZDogbGlzdC5pZCB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyogZ2VzdGlvbiBkdSBib3V0b24gcG91YmVsbGUgcG91ciBzdXBwcmltZXIgdW5lIGxpc3RlICovXG4gICAgICAgIGNvbnN0IHRyYXNoY2FuID0gY2xvbmUucXVlcnlTZWxlY3RvcihcIi5kZWxldGVMaXN0XCIpO1xuICAgICAgICB0cmFzaGNhbi5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCByb3V0ZSA9IGAke3Jlc3RSb290fS9saXN0LyR7bGlzdC5pZH1gO1xuICAgICAgICAgICAgZmV0Y2gocm91dGUsIHRvb2xzLnNldFJlcXVlc3QoXCJERUxFVEVcIiwgeyBpZDogbGlzdC5pZCB9KSk7XG4gICAgICAgICAgICBsaXN0TW9kdWxlLmRlbGV0ZUxpc3RGcm9tRE9NKGxpc3QuaWQpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8qIGdlc3Rpb24gZHUgZm9ybXVsYWlyZSBwb3VyIG1vZGlmaWVyIGxlIHRpdHJlICovXG4gICAgICAgIGNvbnN0IG1vZGlmeSA9IGNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIubW9kaWZ5TGlzdFwiKTtcbiAgICAgICAgbW9kaWZ5LmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YVRvU2VuZCA9IHRvb2xzLmZvcm1Ub0pzb24oZS50YXJnZXQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvdXRlID0gYCR7cmVzdFJvb3R9L2xpc3QvJHtsaXN0LmlkfWA7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocm91dGUpO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZldGNoKHJvdXRlLCB0b29scy5zZXRSZXF1ZXN0KFwiUEFUQ0hcIiwgZGF0YVRvU2VuZCkpO1xuICAgICAgICAgICAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gZGF0YVRvU2VuZC5uYW1lO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRvb2xzLnN3YXBFbGVtZW50cyhtb2RpZnksIFt0aXRsZSwgdHJhc2hjYW5dKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBtb2RpZnkucXVlcnlTZWxlY3RvcihcIi5tb2RpZnlMaXN0SW5wdXRcIik7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IGUudGFyZ2V0LnRleHRDb250ZW50O1xuICAgICAgICAgICAgdG9vbHMuc3dhcEVsZW1lbnRzKFtlLnRhcmdldCwgdHJhc2hjYW5dLCBtb2RpZnkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGRMaXN0QnV0dG9uXCIpLmJlZm9yZShjbG9uZSk7XG5cbiAgICAgICAgLyogRFJBR8KgQU5EwqBEUk9QICovXG4gICAgICAgIC8qIEF0dGFjaCBEJkQgbGlzdGVuZXJzIG9uIGxpc3QgKi9cbiAgICAgICAgbGlzdE1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCBsaXN0TW9kdWxlLm9uRHJhZ1N0YXJ0KTtcbiAgICAgICAgbGlzdE1haW4uYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgbGlzdE1vZHVsZS5vbkRyb3ApO1xuICAgICAgICAvLyBsaXN0TWFpbi5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgbGlzdE1vZHVsZS5vbkRyYWdPdmVyKTtcblxuICAgICAgICBpZiAobGlzdC5jYXJkcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBlbCBvZiBsaXN0LmNhcmRzKSB7XG4gICAgICAgICAgICAgICAgY2FyZE1vZHVsZS5tYWtlQ2FyZEluRE9NKGVsKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBvbkRyYWdTdGFydDogKGUpID0+IHtcbiAgICAgICAgaWYodG9vbHMuY2hlY2tUeXBlKGUsXCJsaXN0XCIpKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1saXN0LWlkXCIpO1xuICAgICAgICAvLyBpZiAoZHJhZ2dlZElkKSB7XG4gICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgaWQ6IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtbGlzdC1pZFwiKSxcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxpc3RcIlxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZShlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSkpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihcImRyYWdnZWQgaWQgdW5kZWZpbmVkID9cIik7XG4gICAgICAgIC8vfTtcblxuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICBvbkRyb3A6IChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJkcm9wXCIsIGUuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpKTtcbiAgICAgICAgY29uc3QgeyBpZCwgdHlwZSB9ID0gSlNPTi5wYXJzZShlLmRhdGFUcmFuc2Zlci5nZXREYXRhKFwidGV4dC9wbGFpblwiKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZHJvcCBkYXRhXCIsIHR5cGUsIGlkKTtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibGlzdFwiKSB7XG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkSWQgPSBpZDtcbiAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtbGlzdC1pZD1cIiR7ZHJhZ2dlZElkfVwiXWApO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ZWRMaXN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi5saXN0TWFpblwiKTtcbiAgICAgICAgICAgIC8vIGNvbnN0IHRhcmdldGVkSWQgPSB0YXJnZXRlZExpc3QuZ2V0QXR0cmlidXRlKFwiZGF0YS1saXN0LWlkXCIpO1xuXG4gICAgICAgICAgICBpZihkcmFnZ2VkTGlzdCE9PXRhcmdldGVkTGlzdCl7XG4gICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5jbGVhckRhdGEoXCJ0ZXh0L3BsYWluXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkUG9zaXRpb24gPSBkcmFnZ2VkTGlzdC5kYXRhc2V0Lmxpc3RQb3NpdGlvbjtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldGVkUG9zaXRpb24gPSB0YXJnZXRlZExpc3QuZGF0YXNldC5saXN0UG9zaXRpb247XG4gICAgICAgICAgICBjb25zdCBtb3ZlSW5kZXggPSBkcmFnZ2VkUG9zaXRpb24gLSB0YXJnZXRlZFBvc2l0aW9uO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobW92ZUluZGV4KTtcbiAgICAgICAgICAgIC8qIGTDqXBsYWNlciBsYSBsaXN0ZSBhcHLDqHMgb3UgYXZhbnQgZW4gZm9uY3Rpb24gKi9cbiAgICAgICAgICAgIGxldCBtZXRob2QgPSBtb3ZlSW5kZXggPCAwID8gXCJhZnRlclwiIDogXCJiZWZvcmVcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vdmVJbmRleCA8IDApO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWV0aG9kKTtcbiAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRMaXN0RGV0YWNoZWQgPSBkcmFnZ2VkTGlzdC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGRyYWdnZWRMaXN0KTtcbiAgICAgICAgICAgIHRhcmdldGVkTGlzdFttZXRob2RdKGRyYWdnZWRMaXN0RGV0YWNoZWQpO1xuXG4gICAgICAgICAgICBsaXN0TW9kdWxlLnNhdmVMaXN0c1Bvc2l0aW9ucygpO1xuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBvbkRyYWdPdmVyOiAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cblxuICAgIH0sXG4gICAgc2F2ZUxpc3RzUG9zaXRpb25zOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpc3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5saXN0TWFpblwiKTtcbiAgICAgICAgbGV0IG5ld1Bvc2l0aW9uSW5kZXg9MDtcbiAgICAgICAgbGlzdHMuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWxpc3QtcG9zaXRpb25cIiwgbmV3UG9zaXRpb25JbmRleCsrKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gZWwuZGF0YXNldC5saXN0SWQ7XG4gICAgICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0ge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXdQb3NpdGlvbkluZGV4XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdE9iamVjdCA9IHRvb2xzLnNldFJlcXVlc3QoXCJQQVRDSFwiLCBkYXRhVG9TZW5kKTtcbiAgICAgICAgICAgIGZldGNoKGAke3Jlc3RSb290fS9saXN0LyR7aWR9YCwgcmVxdWVzdE9iamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlTGlzdEZyb21ET006IChsaXN0SWQpID0+IHtcbiAgICAgICAgY29uc3QgRE9NbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWxpc3QtaWQ9XCIke2xpc3RJZH1cIl1gKTtcbiAgICAgICAgRE9NbGlzdC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKERPTWxpc3QpO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzOiAoKSA9PiB7XG4gICAgICAgIC8qIGdlc3Rpb24gZHUgYm91dG9uIGFqb3V0ZXIgZGVzIGxpc3RlcyAqL1xuICAgICAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkZExpc3RCdXR0b25cIik7XG4gICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIHRvb2xzLnRyaWdnZXJNb2RhbChcIkxpc3RcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qIGdlc3Rpb24gYm91dG9ucyBwb3VyIGFqb3V0ZXIgdW5lIGNhcnRlICovXG4gICAgICAgIC8vIGNvbnN0IHBsdXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmFkZENhcmRUb0xpc3RcIik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiLMOpdcOob8OpdSxvw6l1XCIscGx1cyk7XG4gICAgICAgIC8vIHBsdXMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwiZWxlbWVudCBwZW9wb3VlcG/DqVwiLGVsKTtcbiAgICAgICAgLy8gICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwicGx1c1wiLCBlKTtcbiAgICAgICAgLy8gICAgICAgICB0b29scy50cmlnZ2VyTW9kYWwoXCJDYXJkXCIsIHsgY2FyZF9saXN0SWQ6IGxpc3QuaWQgfSk7XG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGVsLmFkZEV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAvLyB9KVxuXG5cbiAgICAgICAgY29uc3QgZWwgPSBcIkxpc3RcIjtcblxuICAgICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBhZGQke2VsfU1vZGFsYCk7XG4gICAgICAgIGNvbnN0IGZvcm0gPSBtb2RhbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImZvcm1cIilbMF07XG5cbiAgICAgICAgY29uc3QgY2xvc2VCdXR0b25zID0gbW9kYWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImNsb3NlXCIpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNsb3NlXCIsIGNsb3NlQnV0dG9ucyk7XG4gICAgICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGNsb3NlQnV0dG9ucykge1xuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRvb2xzLmtpbGxNb2RhbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0gdG9vbHMuZm9ybVRvSnNvbihlLnRhcmdldCk7XG5cbiAgICAgICAgICAgIC8qIE9uIHLDqWN1cMOocmUgbGEgcHJvY2hhaW5lIHBvc2l0aW9uIGRlIGZpbiovXG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke2VsLnRvTG93ZXJDYXNlKCl9TWFpbmApLmxlbmd0aDtcbiAgICAgICAgICAgIGRhdGFUb1NlbmQucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvc2l0aW9uLCBkYXRhVG9TZW5kLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmICghZGF0YVRvU2VuZC5wb3NpdGlvbilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGFUb1NlbmQpO1xuICAgICAgICAgICAgbGV0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Jlc3RSb290fS8ke2VsLnRvTG93ZXJDYXNlKCl9YCwgdG9vbHMuc2V0UmVxdWVzdChcIlBPU1RcIiwgZGF0YVRvU2VuZCkpO1xuICAgICAgICAgICAgcmVzID0gYXdhaXQgcmVzLmpzb24oKTtcblxuICAgICAgICAgICAgLyogTGEgcGFydGllIHF1aSBjaGFuZ2UgZOKAmXVuZSBtb2RhbGUgw6AgbOKAmWF1dHJlICovXG4gICAgICAgICAgICBsaXN0TW9kdWxlLm1ha2VMaXN0SW5ET00ocmVzKTtcblxuICAgICAgICAgICAgdG9vbHMua2lsbE1vZGFsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cz0ge2xpc3RNb2R1bGV9OyIsImNvbnN0IHJlc3RSb290PWBodHRwOi8vbG9jYWxob3N0OjE2NjQvcmVzdGA7XG5tb2R1bGUuZXhwb3J0cz17cmVzdFJvb3R9OyIsImNvbnN0IHRvb2xzPXtcbiAgICBzaG93RWxlbWVudDogKERPTW9iamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2hvd0VsZW1lbnRcIiwgRE9Nb2JqZWN0KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzaG93RWxlbWVudFwiLCBET01vYmplY3QuY2xhc3NMaXN0LmNvbnRhaW5zKGBpcy1oaWRkZW5gKSk7XG4gICAgICAgIERPTW9iamVjdC5jbGFzc0xpc3QucmVtb3ZlKGBpcy1oaWRkZW5gKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzaG93RWxlbWVudFwiLCBET01vYmplY3QuY2xhc3NMaXN0LmNvbnRhaW5zKGBpcy1oaWRkZW5gKSk7XG4gICAgfSxcbiAgICBoaWRlRWxlbWVudDogKERPTW9iamVjdCkgPT4ge1xuICAgICAgICBET01vYmplY3QuY2xhc3NMaXN0LmFkZChgaXMtaGlkZGVuYCk7XG4gICAgfSxcbiAgICBzd2FwRWxlbWVudHM6IChlbDEsIGVsMikgPT4ge1xuICAgICAgICAvKiBsZXMgbm9kZUxpc3RzIHLDqWN1cMOpcsOpcyBwYXIgcXVlcnlTZWxlY3RvciBuZSBzb250IHBhcyBkZXMgdGFibGVhdXggbWFpcyBkZXMgb2JqZXRzIGl0w6lyYWJsZXMsXG4gICAgICAgIG9uIGRvaXQgcG91dm9pciB0cmFpdGVyIGxlcyBkZXV4LCBhaW5zaSBxdWUgbGVzIEVsZW1lbnRzIGR1IERPTSAqL1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNXQVBcIik7XG4gICAgICAgIGlmICghKGVsMSBpbnN0YW5jZW9mIEFycmF5KSAmJiAhKGVsMSBpbnN0YW5jZW9mIE5vZGVMaXN0KSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJTV0FQIE9ORVwiLCBlbDEpO1xuICAgICAgICAgICAgdG9vbHMuaGlkZUVsZW1lbnQoZWwxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU1dBUCBBTExcIiwgZWwxKTtcbiAgICAgICAgICAgIGVsMS5mb3JFYWNoKChlbCkgPT4geyB0b29scy5oaWRlRWxlbWVudChlbCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIShlbDIgaW5zdGFuY2VvZiBBcnJheSkgJiYgIShlbDIgaW5zdGFuY2VvZiBOb2RlTGlzdCkpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU1dBUCBTSE9XIE9ORVwiLCBlbDIpO1xuICAgICAgICAgICAgdG9vbHMuc2hvd0VsZW1lbnQoZWwyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU1dBUCBBTExcIiwgZWwyKTtcbiAgICAgICAgICAgIGVsMi5mb3JFYWNoKChlbCkgPT4geyB0b29scy5zaG93RWxlbWVudChlbCk7IH0pO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgc2V0UmVxdWVzdDogKG1ldGhvZCwgZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIiB9LFxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKVxuICAgICAgICB9XG4gICAgfSxcbiAgICByZ2JUb0hleDogKFJHQnN0cmluZykgPT4ge1xuXG4gICAgICAgIGlmKC8jW2EtekEtWjAtOV17Nn0vLnRlc3QoUkdCc3RyaW5nKSkvL3NpIGxhIHN0cmluZyBlc3QgZMOpasOgIGVuIGhleCwgbGEgcmV0b3VybmVyXG4gICAgICAgIHJldHVybiBSR0JzdHJpbmc7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZ2JWYWxzUlggPSAvXFxkezEsM30vZztcblxuICAgICAgICBsZXQgbmV3Q29sb3IgPSBSR0JzdHJpbmcubWF0Y2gocmdiVmFsc1JYKTtcbiAgICAgICAgY29uc29sZS5sb2cobmV3Q29sb3IpO1xuICAgICAgICBuZXdDb2xvciA9IG5ld0NvbG9yLm1hcChlbCA9PiB7Lyogb24gY29udmVydGl0IGVuIG51bWJlciBwdWlzIGVuIGNoYWluZSBoZXhhICovXG4gICAgICAgICAgICBsZXQgaGV4VmFsID0gTnVtYmVyKGVsKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICBpZiAoaGV4VmFsLmxlbmd0aCA9PT0gMSkvL3BvdXIgYXZvaXIgdW4gY2hpZmZyZSBoZXhhIHN1ciAyIGNhcmFjdMOocmVzXG4gICAgICAgICAgICAgICAgaGV4VmFsID0gXCIwXCIgKyBoZXhWYWw7XG4gICAgICAgICAgICByZXR1cm4gaGV4VmFsO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2cobmV3Q29sb3IpO1xuICAgICAgICByZXR1cm4gYCMke25ld0NvbG9yLmpvaW4oXCJcIil9YDsvKiBPbiByw6ljdXDDqHJlIHVuZSBjb3VsZXVyIGhleGEgKi9cbiAgICB9LFxuICAgIGZvcm1Ub0pzb246IChmb3JtKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRm9ybURhdGEoZm9ybSk7XG4gICAgICAgIGNvbnN0IGtleXMgPSBkYXRhLmtleXMoKTsvL2tleXMgZXN0IHVuIG9iamV0IGl0w6lyYWJsZS4gZW4gdGFudCBxdeKAmWl0w6lyYWJsZSBpbCBmb25jdGlvbm5lIGF2ZWMgZm9yIG9mIChldCBub24gZm9yIGluKVxuICAgICAgICBjb25zdCBkYXRhVG9TZW5kID0ge307XG4gICAgICAgIC8vT24gcsOpdWN1cMOocmUgbGVzIGRvbm7DqWVzIGR1IGZvcm11bGFpcmVcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgZGF0YVRvU2VuZFtrZXldID0gZGF0YS5nZXQoa2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGRhdGFUb1NlbmQ7XG4gICAgfSxcbiAgICBjaGVja1R5cGU6KGUsd2FudGVkVHlwZSk9PntcbiAgICAgICAgY29uc3QgY2hlY2s9ZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGAke3dhbnRlZFR5cGUudG9Mb3dlckNhc2UoKX1NYWluYCk7XG4gICAgICAgIHJldHVybiBjaGVjaztcbiAgICB9LFxuICAgIHRyaWdnZXJNb2RhbDogKG5hbWUsIGRhdGEgPSB7fSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInJ1bm5pbmdcIik7XG4gICAgICAgIGNvbnN0IG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGFkZCR7bmFtZX1Nb2RhbGApO1xuICAgICAgICBjb25zdCBmb3JtID0gbW9kYWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJmb3JtXCIpWzBdO1xuICAgICAgICBjb25zb2xlLmxvZyhmb3JtKTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZm9ybS5xdWVyeVNlbGVjdG9yKGAjJHtrZXl9YCk7XG4gICAgICAgICAgICAgICAgZWxlbS52YWx1ZSA9IGRhdGFba2V5XTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoXCJpcy1hY3RpdmVcIik7XG4gICAgfSxcbiAgICBraWxsTW9kYWw6ICgpID0+IHtcbiAgICAgICAgLyoga2lsbCB0b3V0ZXMgbGVzIG1vZGFsZXMgKi9cbiAgICAgICAgY29uc3QgbW9kYWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5tb2RhbC5pcy1hY3RpdmVcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKG1vZGFscyk7XG4gICAgICAgIG1vZGFscy5mb3JFYWNoKChlbCkgPT4geyBlbC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtYWN0aXZlXCIpIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlRnJvbURPTTogKHR5cGUsIGlkKSA9PiB7XG4gICAgICAgIGNvbnN0IERPTWVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS0ke3R5cGUudG9Mb3dlckNhc2UoKX0taWQ9XCIke2lkfVwiXWApO1xuICAgICAgICBET01lbGVtZW50LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoRE9NZWxlbWVudCk7XG4gICAgfSxcbiAgICBnbG9iYWxEcmFnZ2FibGU6IChib29sU3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAubGlzdE1haW4sLmNhcmRNYWluLC5sYWJlbE1haW5gKTtcbiAgICAgICAgY29uc29sZS5sb2coYm9vbFN0cmluZywgZHJhZ2dhYmxlcy5sZW5ndGgpO1xuICAgICAgICBkcmFnZ2FibGVzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZHJhZ2dhYmxlXCIsIGJvb2xTdHJpbmcpO1xuICAgICAgICB9KTtcbiAgICB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cz17dG9vbHN9OyJdfQ==
