const app = {
    base_url: 'http://localhost:5050',
    addListenerToActions: () => {
        listModule.addListenerToActions();
        cardModule.addListenerToActions();
    },
    hideModals: () => {
        // Je récupère tous les div .modal ET .is-active
        const modals = document.querySelectorAll(".modal.is-active");
        // Pour chaque modal je retière la classe .is-active
        // Pas de toggle HEIN SEB !
        modals.forEach(m => m.classList.remove("is-active"));

    },
    getInitialDataFromAPI: async () => {
        const rep = await fetch(app.base_url + '/lists');
        const data = await rep.json();

        data.forEach(list => {
            listModule.makeListInDOM(list);
            list.cards.forEach(card => {
                cardModule.makeCardInDOM(card);
            })
        });
    },
    formDataToObject: (formData) => {
        let obj = {};
        // Pour chaque entré dans mon form data je crée la propriété et j'assigne la valeur dans
        // mon objet obj
        formData.forEach((value, key) => obj[key] = value); //  obj["name"] = "Ma liste"

        return obj;
    },

    init: () => {
        console.log('app.init !');
        app.addListenerToActions();
        app.getInitialDataFromAPI();
    }
}


document.addEventListener('DOMContentLoaded', app.init);

// https: //developer.mozilla.org/fr/docs/Web/API/Fetch_API/Using_Fetch
// const res = await fetch('monurl');
// const json = await res.json();