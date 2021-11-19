const app = {
    base_url: 'http://localhost:5050',
    addListenerToActions: () => {
        //Je récupère le bouton à partir d'un ID
        const btn = document.querySelector('#addListButton');
        // OU
        // const btn = document.getElementById("addListButton");

        // On rajoute l'écouteur sur l'event click
        btn.addEventListener('click', app.showAddListModal);

        const addCardbtns = document.querySelectorAll('.add-card-button');
        addCardbtns.forEach(addCardBtn => addCardBtn.addEventListener('click', app.showAddCardModal));

        // Je récupère tous les boutons avec la classe .close
        const closeBtns = document.querySelectorAll(".close");

        // Pour chaque bouton j'ajoute l'event listener
        closeBtns.forEach((cBtn) => {
            cBtn.addEventListener('click', app.hideModals);
        });

        //On récupère le <form> contenu dans l'element <element id="addListModal">
        const listForm = document.querySelector("#addListModal form");

        // On ajoute handleAddListForm comme eventlistenr pour submit
        listForm.addEventListener('submit', app.handleAddListForm);

        //On récupère le <form> contenu dans l'element <element id="addCardModal">
        const cardForm = document.querySelector("#addCardModal form");

        // On ajoute handleAddListForm comme eventlistenr pour submit
        cardForm.addEventListener('submit', app.handleAddCardForm);
    },
    handleAddListForm: (e) => {
        // Ne fais pas ton comportement habituel
        // NE FAIT PAS UN POST OU UN GET, NE RECHARGE PAS LA PAGE
        e.preventDefault();

        const formData = new FormData(e.target);

        app.makeListInDOM(app.formDataToObject(formData));

    },
    handleAddCardForm: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        app.makeCardInDOM(app.formDataToObject(formData));
    },
    makeListInDOM: (list) => { // list -> un objet JAVASCRIPT et non plus un type FormData

        /* DEBUT DU CLONAGE */
        // Je récupère le template
        const template = document.querySelector("#template-list");

        // J'en crée une copie
        const newList = document.importNode(template.content, true);

        /* FIN DU CLONAGE */


        /* ON METS A JOUR LE HTML */
        // Je mets à jour le titre
        newList.querySelector('h2').textContent = list.name;

        // Je génère un nouvel id Date.now -> Timestamp
        const listId = list.id; //list-' + Date.now();
        // On récupère la div .colun et on met àjour l'attribut list-id
        // Le dataset traduit listId AUTOMATIQUEMENT en data-list-id
        // c.f. la doc =>
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
        newList.querySelector('.column').dataset.listId = listId;

        // On mets à jour la valeur du input hidden name='list-id'
        newList.querySelector(`form input[name='list-id']`).value = listId;

        // A la création de ma nouvelle liste j'attache le event listeneur pour pouvoir ajouter une carte
        newList.querySelector('.add-card-button').addEventListener('click', app.showAddCardModal);

        // Je récupère le holder des cartes
        const listHolder = document.querySelector('.card-lists');
        // Je récupère toutes les colonnes
        const children = listHolder.querySelectorAll('.column');

        /* ON AJOUTE NOTRE CLONE A NOTRE HTML */
        // Je récupère la dernière colonne
        const lastChild = children[children.length - 1];

        lastChild.before(newList);

        app.hideModals();

    },
    makeCardInDOM: (card) => {
        /* DEBUT DU CLONAGE */
        // Je récupère le template
        const template = document.querySelector("#template-card");

        // J'en crée une copie
        const newCard = document.importNode(template.content, true);

        /* FIN DU CLONAGE */

        // je mets à jour les infos
        newCard.querySelector('.card-name').textContent = card.content;

        // et l'id
        const cardId = card.id; //'card-' + Date.now();
        newCard.querySelector('.column').dataset.cardId = cardId;

        // Je trouve la bonne liste a l'aide de l'id
        //cf. doc pour selectionner un attribut : https://developer.mozilla.org/fr/docs/Web/CSS/Attribute_selectors
        const theGoodList = document.querySelector(`[data-list-id="${card['list-id']}]"`);

        // ET j'insère au bon endroit la carte
        theGoodList.querySelector('.panel-block').appendChild(newCard);

        app.hideModals();

    },
    showAddListModal: () => {
        // Je récupère le modal à partir de son ID
        const modal = document.querySelector('#addListModal');
        // J'ajoute la classe is-active pour afficher le modal
        modal.classList.add('is-active');
    },
    showAddCardModal: (e) => {
        // Je récupère le modal à partir de son ID
        const modal = document.querySelector('#addCardModal');
        // J'ajoute la classe is-active pour afficher le modal
        modal.classList.add('is-active');

        const elList = e.target.closest('.panel');
        const listId = elList.getAttribute('data-list-id');

        modal.querySelector('input[name="list-id"]').value = listId;
    },
    hideModals: () => {
        // Je récupère tous les div .modal ET .is-active
        const modals = document.querySelectorAll(".modal.is-active");
        // Pour chaque modal je retière la classe .is-active
        // Pas de toggle HEIN SEB !
        modals.forEach(m => m.classList.remove("is-active"));

    },
    getListsFromAPI: async () => {
        const rep = await fetch(app.base_url + '/lists');
        const data = await rep.json();

        // data.forEach(list => {
        //     makeListInDOM(list);
        // })
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
        app.getListsFromAPI();
    }
}


document.addEventListener('DOMContentLoaded', app.init);

// https: //developer.mozilla.org/fr/docs/Web/API/Fetch_API/Using_Fetch
// const res = await fetch('monurl');
// const json = await res.json();