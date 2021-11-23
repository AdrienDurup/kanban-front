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