const labelModule={
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
};
