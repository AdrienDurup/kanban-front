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