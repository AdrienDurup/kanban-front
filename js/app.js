//import {Card} from "./components/card.js";
//import {List} from "./components/list.js";

function addCard(parent, content, classes = "", mustAppend = true) {
    const dom = document.createElement("article");
    dom.classList = classes;
    dom.textContent = content;
    if (mustAppend) {
        parent.appendChild(dom);
    } else {
        parent.prependChild(dom);
    };
    return dom;
}
function addList(parent, name, classes = { title: "", wrapper: "", content: "" }, mustAppend = true) {
    const dom = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = name;
    title.classList = classes.title;
    dom.content = document.createElement("div");
    dom.content.classList = classes.content;
    dom.appendChild(title);
    dom.appendChild(dom.content);
    dom.classList = classes.wrapper;
    if (mustAppend) {
        parent.appendChild(dom);
    } else {
        parent.prependChild(dom);
    };
    return dom;
}

const restRoot = "http://localhost:1664/rest";

const app = {
    setLabelForm: () => {
        const wrapper = document.getElementById("contentWrapper");
        const getLabels = document.createElement("button");
        getLabels.textContent = "Voir la liste des labels";

        getLabels.addEventListener("click", async (e) => {
            try {
                const result = await fetch(`${restRoot}/label`);
                // console.log(result);
                console.log(result.ok);
                let labels;
                if (result.ok) {
                    labels = await result.json();
                } else {
                    throw `result.ok ${result.ok}`;
                };
                console.log(labels);
                const resultView = document.createElement("div");
                //resultView.id="resultView";
                labels = labels.map((el) => {
                    const item = document.createElement("div");
                    item.textContent = el.name;
                    // item.innerHTML = el.name;
                    return item;
                });
                for (el of labels) {
                    resultView.appendChild(el);
                };
                wrapper.appendChild(resultView);
            } catch (e) {
                console.error(e);
            };
        });
        wrapper.appendChild(getLabels);
    },
    drawLists: async () => {
        const result = await fetch(`${restRoot}/list`);
        const lists = await result.json();
        for (const el of lists) {
            app.makeListInDOM(el);
        };
    },
    makeListInDOM: (list) => {
        const template = document.getElementById("listTemplate");
        const clone = document.importNode(template.content, true);
        // console.log(clone);
        const listMainDev = clone.querySelector(`[data-list-id="A"]`);
        listMainDev.setAttribute("data-list-id", list.id);
        const title = clone.querySelector(".listName");
        const content = clone.querySelector(".listContent");
        // console.log(title);
        const plus = clone.querySelector(".fa-plus");
        plus.addEventListener("click", (e) => {
            // console.log(e);
            app.triggerModal("Card", { card_listId: list.id });
        });
        const trashcan = clone.querySelector(".deleteList");
        trashcan.addEventListener("submit", async (e) => {
            e.preventDefault();
            const route = `${restRoot}/list/${list.id}`;
            fetch(route,{
                headers: { "Content-Type": "application/json; charset=utf-8" },
                method: 'DELETE',
                body: JSON.stringify({id:list.id})
            })
            app.deleteListFromDOM(list.id);
        });

        title.textContent = list.name;
        const container = document.getElementById("listsWrapper");
        document.getElementById("addListButton").before(clone);
        // container;
        // container.appendChild(clone);
        if (list.cards) {
            for (const el of list.cards) {
                app.makeCardInDOM(el);
            };
        };
    },
    deleteListFromDOM: (listId) => {
        const DOMlist=document.querySelector(`[data-list-id="${listId}"]`);
        DOMlist.parentElement.removeChild(DOMlist);
    },
    makeCardInDOM: (card) => {
        const template = document.getElementById("cardTemplate");
        const clone = document.importNode(template.content, true);
        const content = clone.querySelector(".cardContent");
        console.log(content);
        content.textContent = card.content;
        const list = document.querySelector(`[data-list-id="${card.list_id}"]`);
        console.log(list);
        const listContent = list.querySelector(".listContent");
        listContent.appendChild(clone);
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
        modals.forEach(el => { el.classList.remove("is-active") });
    },
    addListeners: () => {

        const button = document.getElementById("addListButton");
        button.addEventListener("click", (e) => {
            app.triggerModal("List");
        });


        for (const el of ["List", "Card"]) {

            const modal = document.getElementById(`add${el}Modal`);
            const form = modal.getElementsByTagName("form")[0];

            const closeButtons = modal.getElementsByClassName("close");
            // console.log("close", closeButtons);
            for (const button of closeButtons) {
                button.addEventListener("click", (e) => {
                    app.killModal();
                });
            };

            console.log(modal);
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = new FormData(e.target);
                const keys = data.keys();//keys est un objet itérable. en tant qu’itérable il fonctionne avec for of (et non for in)
                const dataToSend = {};
                //On réucupère les données du formulaire
                for (const key of keys) {
                    dataToSend[key] = data.get(key);
                };
                /* On récupère la prochaine position de fin*/
                const position = document.querySelectorAll(`.sharedIdFor${el}`).length;
                dataToSend.position = position;
                console.log(position, dataToSend.position);
                if (!dataToSend.position)
                    return;

                console.log(dataToSend);
                let res = await fetch(`${restRoot}/${el.toLowerCase()}`, {
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    method: 'POST',
                    body: JSON.stringify(dataToSend)
                });
                res = await res.json();
                switch (el) {
                    case "List":
                        app[`make${el}InDOM`](res);
                        break;
                    case "Card":
                        app[`make${el}InDOM`](res);
                        /* todo */
                        break;
                };
                app.killModal();
            });
        };


    },

    init: () => {
        app.setLabelForm();
        app.drawLists();
        app.addListeners();
    }
};

document.addEventListener("DOMContentLoaded", app.init);