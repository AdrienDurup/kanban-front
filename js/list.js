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
        const listMainDev = clone.querySelector(`[data-list-id="A"]`);
        listMainDev.setAttribute("data-list-id", list.id);

        /* on fournit le titre */
        const title = clone.querySelector(".listName");
        title.textContent = list.name;

        const plus = clone.querySelector(".addCardToList");
        /* Gestion du bouton + pour ajouter une carte */
        plus.addEventListener("click", (e) => {
           app.triggerModal("Card", { card_listId: list.id });
        });

        /* gestion du bouton poubelle pour supprimer une liste */
        const trashcan = clone.querySelector(".deleteList");
        trashcan.addEventListener("submit", async (e) => {
            e.preventDefault();
            const route = `${restRoot}/list/${list.id}`;
            fetch(route, app.setRequest("DELETE", { id: list.id }));
            listModule.deleteListFromDOM(list.id);
        });


        /* gestion du formulaire pour modifier le titre */
        const modify = clone.querySelector(".modifyList");
        modify.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                const dataToSend = app.formToJson(e.target);
                const route = `${restRoot}/list/${list.id}`;
                console.log(route);
                await fetch(route, app.setRequest("PATCH", dataToSend));
                title.textContent = dataToSend.name;
            } catch (e) {
                console.error(e);
            } finally {
                app.swapElements(modify, [title, trashcan]);
            };
        });

        title.addEventListener("dblclick", (e) => {
            const input = modify.querySelector(".modifyListInput");
            input.value = e.target.textContent;
            app.swapElements([e.target, trashcan], modify);
        });



        // const container = document.getElementById("listsWrapper");
        document.getElementById("addListButton").before(clone);
        // container;
        // container.appendChild(clone);
        if (list.cards) {
            for (const el of list.cards) {
                cardModule.makeCardInDOM(el);
            };
        };
    },
    onDragStart: (e) => {

    },
    deleteListFromDOM: (listId) => {
        const DOMlist = document.querySelector(`[data-list-id="${listId}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
    },
    addListeners: () => {
        /* gestion du bouton ajouter des listes */
        const button = document.getElementById("addListButton");
        button.addEventListener("click", (e) => {
            app.triggerModal("List");
        });

        /* gestion boutons pour ajouter une carte */
        // const plus = document.querySelectorAll(".addCardToList");
        // console.log(",éuèoéu,oéu",plus);
        // plus.forEach((el) => {
        //     console.log("element peopouepoé",el);
        //     el.addEventListener("click", (e) => {
        //         console.log("plus", e);
        //         app.triggerModal("Card", { card_listId: list.id });
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
                app.killModal();
            });
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const dataToSend = app.formToJson(e.target);

            /* On récupère la prochaine position de fin*/
            const position = document.querySelectorAll(`.${el.toLowerCase()}Main`).length;
            dataToSend.position = position;
            console.log(position, dataToSend.position);
            if (!dataToSend.position)
                return;

            console.log(dataToSend);
            let res = await fetch(`${restRoot}/${el.toLowerCase()}`, app.setRequest("POST", dataToSend));
            res = await res.json();

            /* La partie qui change d’une modale à l’autre */
            listModule.makeListInDOM(res);

            app.killModal();
        });
    }
};
//export {listModule};