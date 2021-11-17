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
            const wrapper = document.getElementById("listsWrapper");
            const styles = {
                title: "panel-heading has-background-info has-text-white",
                content: "panel-block is-block has-background-light",
                wrapper: "column is-one-quarter panel"
            }
            const list = addList(wrapper, el.name, styles);
            for (const card of el.cards) {
                addCard(list.content, card.content, "box column is-narrow");
            };

        };
        app.drawCards();
    },
    drawCards: () => {

    },
    makeListInDOM: (list) => {
        const template = document.getElementById("listTemplate");
        console.log(template);
        console.log(template.content);
        const title=template.content.getElementById("listName");
        title.textContent=list.name;
        const container=document.getElementById("listsWrapper");
        container.prepend(template.content);
    },

    addListeners: () => {
        const button = document.getElementById("addListButton");
        button.addEventListener("click", (e) => {
            const modal = document.getElementById("addListModal");
            modal.classList.add("is-active");
        });

        const closeButtons = document.getElementsByClassName("close");
        for (const el of closeButtons) {
            el.addEventListener("click", (e) => {
                const modal = document.getElementById("addListModal");
                modal.classList.remove("is-active");
            });
        };
        const listModal = document.getElementById("addListModal").getElementsByTagName("form")[0];
        console.log(listModal);
        listModal.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            const keys = data.keys();//keys est un objet itérable. en tant qu’itérable il fonctionne avec for of (et non for in)
            const dataToSend = {};
            for (const key of keys) {
                dataToSend[key] = data.get(key);
            };
            const list = await fetch("http://localhost:1664/rest/list", {
                headers: { "Content-Type": "application/json; charset=utf-8" },
                method: 'POST',
                body: JSON.stringify(dataToSend)
            });
            app.makeListInDOM(list);
        });
    },

    init: () => {
        app.setLabelForm();
        app.drawLists();
        app.addListeners();
    }
};

document.addEventListener("DOMContentLoaded", app.init);