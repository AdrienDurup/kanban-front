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
    drawCard: () => {
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
            const wrapper = document.getElementById("contentWrapper");
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
    init: () => {
        app.drawLists();
    }
};

document.addEventListener("DOMContentLoaded", app.init);