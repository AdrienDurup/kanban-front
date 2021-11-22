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

        /* DRAG AND DROP */
        // labelMain.addEventListener("drag", labelModule.onDrag);
        labelMain.addEventListener("dragstart", labelModule.onDragStart);
       // labelMain.addEventListener("dragend", labelModule.onDragEnd);
        // clone.addEventListener("dragstart", labelModule.onDragStart);

        if (label.card_has_label)
            container = document.querySelector(`[data-card-id="${label.card_has_label.card_id}"]`);

        container.appendChild(clone);
    },
    onDragStart: (e) => {
        // e.preventDefault();
        console.log("startDrag");
        const obj={
            id:e.target.getAttribute("data-label-id"),
            type:"label"
        }
        e.dataTransfer.setData("text/plain",JSON.stringify(obj));
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
            form.querySelector(".colorInput").value = label.style.getPropertyValue("background-color");
            app.swapElements(e.target, form);
        };

    },
    editLabel: async (e) => {
        e.preventDefault();
        try {
            const data = app.formToJson(e.target);
            const labelId = e.target.closest(".labelMain").getAttribute("data-label-id");
            let res = await fetch(`${restRoot}/label/${labelId}`, app.setRequest("PATCH", data));
            res = await res.json();
            console.log(res);
            if (res[0] === 1) {
                const labelName = e.target.parentElement.querySelector(".labelName");
                labelName.textContent = data.name;
                labelName.parentElement.style.setProperty("background-color", data.color);
                labelName.textContent = data.name;
                app.swapElements(e.target, labelName);
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
                let res = await fetch(`${restRoot}/label/${labelId}`, app.setRequest("DELETE"));
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
            app.deleteFromDOM("Label", id);
        });
    },
    createAssociation: async (cardId, labelId) => {
        try {
            let res = await fetch(`${restRoot}/card/${cardId}/label/${labelId}`, app.setRequest("POST"));
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
            let res = await fetch(`${restRoot}/card/${cardId}/label/${labelId}`, app.setRequest("DELETE"));
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
        addLabelButton.addEventListener("click", () => { app.triggerModal("Label") });

        const modal = document.getElementById(`addLabelModal`);
        const form = modal.getElementsByTagName("form")[0];

        const closeButtons = modal.getElementsByClassName("close");
        for (const button of closeButtons) {
            button.addEventListener("click", (e) => {
                app.killModal();
            });
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const dataToSend = app.formToJson(e.target);
            console.log(dataToSend);

            let res = await fetch(`${restRoot}/label`, app.setRequest("POST", dataToSend));
            res = await res.json();//tableau avec 0:objet 1:isCreated
            console.log(res[0])
            /* La partie qui change d’une modale à l’autre */
            if (res) {
                const container = document.getElementById("labelDictionary");
                labelModule.makeLabelInDOM(res[0], container);
            };


            app.killModal();
        });

    },
};
