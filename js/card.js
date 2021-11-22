const cardModule = {
    makeCardInDOM: (card) => {
        const template = document.getElementById("cardTemplate");
        const clone = document.importNode(template.content, true);

        const main = clone.querySelector(".cardMain");
        console.log(card.color);
        main.style.setProperty("background-color", card.color);

        const content = clone.querySelector(".cardContent");
        console.log(content);
        content.textContent = card.content;

        // const labelContainer=clone.querySelector(".labelContainer");
        // labelContainer.addEventListener("dragover",(e)=>{
        //     e.preventDefault;
        // });

        const list = document.querySelector(`[data-list-id="${card.list_id}"]`);
        console.log(list);

        const cardDOM = clone.querySelector(`[data-card-id="J"]`);
        cardDOM.setAttribute("data-card-id", card.id);

        const showHidePatchCardForm = clone.querySelector(".triggerPatchCard");
        const triggerDeleteCard = clone.querySelector(".triggerDeleteCard");
        const editForm = clone.querySelector(".modifyCard");
        showHidePatchCardForm.addEventListener("submit", cardModule.handleShowHidePatchForm);

        /* DRAG AND DROP */
        /* avoid d&d on inputs : see below handleShowHidePatchForm*/

        /* d&d events */
        main.addEventListener("drop", cardModule.onDrop);
        main.addEventListener("dragover", cardModule.onDragOver);


        /* =========A DETACHER */
        triggerDeleteCard.addEventListener("submit", (e) => {
            e.preventDefault();
            const route = `${restRoot}/card/${card.id}`;
            fetch(route, app.setRequest("DELETE", { id: card.id }));
            app.deleteFromDOM("card", card.id);
        });

        editForm.addEventListener("submit", (e) => { e.preventDefault(); cardModule.handlePatchCard(e, card); });

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

    },
    onDrop: (e) => {
        e.preventDefault();
        console.log("drop",e);
        const labelId=e.dataTransfer.getData("text/plain");
        const cardId=e.target.closest(".cardMain").getAttribute("data-card-id");
        e.dataTransfer.clearData("text/plain");
        console.log(labelId,cardId);
        labelModule.createAssociation(cardId, labelId);
    },
    onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const data=e.dataTransfer.getData("text/plain");
        console.log("Over",data);
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
        color.value = app.rgbToHex(currentCardColor);/* On récupère une couleur hexa */
        console.log(color.value);

        /* Attention : event sur la fenetre ET sur le bouton d’affichage de editForm :
        les deux peuvent s’annuler.Gestion de la fermeture sur app.listeners */
        console.log(editForm.classList.contains("is-hidden"));
        if (editForm.classList.contains("is-hidden")) {
            app.swapElements(content, editForm);
            /* disable card draggable when editForm becomes visible */
            app.globalDraggable("false");
        } else {
            app.swapElements(editForm, content);
            /* allow card draggable when editForm becomes invisible */
            app.globalDraggable("true");
        };

    },
    handlePatchCard: async (e, card) => {
        e.preventDefault();
        let patchCard;
        let content;
        try {
            console.log("patching");
            const dataToSend = app.formToJson(e.target);
            /* on récupère la string des labels */
            let labelNames = dataToSend.labels;

            /* update une carte */
            delete dataToSend.labels;//on supprime avant d’envoyer en base
            const route = `${restRoot}/card/${card.id}`;
            cardDOM = e.target.closest(".cardMain");
            content = cardDOM.querySelector(".cardContent");
            patchCard = e.target.closest(".cardMain").querySelector(".modifyCard");
            console.log(dataToSend);
            await fetch(route, app.setRequest("PATCH", dataToSend));
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
            app.swapElements(patchCard, content);
        };

    },
    addListeners: () => {
        const el = "Card";

        const modal = document.getElementById(`add${el}Modal`);


        /* gestion des boutons de fermeture */
        const closeButtons = modal.getElementsByClassName("close");
        // console.log("close", closeButtons);
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                app.killModal();
            });
        };


        const form = modal.getElementsByTagName("form")[0];
        form.addEventListener("submit", async (e) => {
            try {
                console.log("modal submit");
                e.preventDefault();
                const dataToSend = app.formToJson(e.target);

                /* On récupère la prochaine position de fin*/
                let position = document.querySelectorAll(`.${el.toLowerCase()}Main`).length;
                if (!position)
                    position = 0;

                dataToSend.position = position;

                console.log(position, dataToSend.position);
                // if (!dataToSend.position)
                //     return;

                console.log(dataToSend);
                let res = await fetch(`${restRoot}/${el.toLowerCase()}`, app.setRequest("POST", dataToSend));
                res = await res.json();
                console.log(res);
                /* La partie qui change d’une modale à l’autre */
                if (res)
                    cardModule.makeCardInDOM(res);

                app.killModal();
            } catch (e) {
                console.log(e);
            };
        });


    },
};
//export {cardModule};