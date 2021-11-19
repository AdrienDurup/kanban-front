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
            // if(patchCard.classList.contains("is-hidden")){
            // app.swapElements(patchCard, content);
            // }else{
            app.swapElements(content, patchCard);
            // };

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
    },
    deleteCardFromDOM: (cardId) => {
        const DOMlist = document.querySelector(`[data-card-id="${cardId}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
    },
    addListeners: () => {
        const el = "Card";

        const modal = document.getElementById(`add${el}Modal`);
        const form = modal.getElementsByTagName("form")[0];

        const closeButtons = modal.getElementsByClassName("close");
        // console.log("close", closeButtons);
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                app.killModal();
            });
        };

        form.addEventListener("submit", async (e) => {
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
    },
};
//export {cardModule};