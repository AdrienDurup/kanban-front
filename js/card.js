const cardModule = {
    makeCardInDOM: (card) => {
        const template = document.getElementById("cardTemplate");
        const clone = document.importNode(template.content, true);
        const content = clone.querySelector(".cardContent");
        console.log(content);
        content.textContent = card.content;
        const list = document.querySelector(`[data-list-id="${card.list_id}"]`);
        console.log(list);

        const cardDOM = clone.querySelector(`[data-card-id="J"]`);
        cardDOM.setAttribute("data-card-id", card.id);

        const showHidePatchCardForm = clone.querySelector(".triggerPatchCard");
        const triggerDeleteCard = clone.querySelector(".triggerDeleteCard");
        const patchCard = clone.querySelector(".modifyCard");

         showHidePatchCardForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const textarea=patchCard.querySelector(".modifyCardInput");
            /* textarea a une propriété value mais pas d’attribut value */
            textarea.value=content.textContent;
            app.swapElements(content, patchCard);
        });
        triggerDeleteCard.addEventListener("submit", (e) => {
            e.preventDefault();
            const route = `${restRoot}/card/${card.id}`;
            fetch(route, app.setRequest("DELETE", { id: card.id }));
            app.deleteCardFromDOM(card.id);
        });

        patchCard.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                console.log("patching");
                const dataToSend = app.formToJson(e.target);
                const route = `${restRoot}/card/${card.id}`;
                console.log(dataToSend);
                await fetch(route, app.setRequest("PATCH", dataToSend));
                content.textContent = dataToSend.content;
            } catch (e) {
                console.error(e);
            } finally {
                app.swapElements(patchCard, content);
            };

        });

        const listContent = list.querySelector(".listContent");
        listContent.appendChild(clone);

        /* on rajoute les labels quand la carte est déja dans le DOM */
        card.labels.forEach(label => {
            labelModule.makeLabelInDOM(label);
        });
    },
    deleteCardFromDOM: (cardId) => {
        const DOMlist = document.querySelector(`[data-card-id="${cardId}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
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

        try {
            const form = modal.getElementsByTagName("form")[0];
            form.addEventListener("submit", async (e) => {
                console.log("modal submit");
                e.preventDefault();
                const dataToSend = app.formToJson(e.target);

                /* On récupère la prochaine position de fin*/
                const position = document.querySelectorAll(`.sharedIdFor${el}`).length;
                dataToSend.position = position;
                console.log(position, dataToSend.position);
                if (!dataToSend.position)
                    return;

                console.log(dataToSend);
                let res = await fetch(`${restRoot}/${el.toLowerCase()}`, app.setRequest("POST", dataToSend));
                res = await res.json();

                /* La partie qui change d’une modale à l’autre */
                cardModule.makeCardInDOM(res);

                app.killModal();
            });
        } catch (e) {
            console.log(e);
        };

    },
};
//export {cardModule};