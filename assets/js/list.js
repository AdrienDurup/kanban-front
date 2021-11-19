const listModule = {
    addListenerToActions: () => {
        //Je récupère le bouton à partir d'un ID
        const btn = document.querySelector('#addListButton');
        // OU
        // const btn = document.getElementById("addListButton");

        // On rajoute l'écouteur sur l'event click
        btn.addEventListener('click', listModule.showAddListModal);


        //On récupère le <form> contenu dans l'element <element id="addListModal">
        const listForm = document.querySelector("#addListModal form");

        // On ajoute handleAddListForm comme eventlistenr pour submit
        listForm.addEventListener('submit', listModule.handleAddListForm);

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
        newList.querySelector('.add-card-button').addEventListener('click', cardModule.showAddCardModal);

        // Je gère le double click sur titre et j'appelle toggleEditForm
        newList.querySelector('.list-name').addEventListener('dblclick', listModule.toggleEditForm);

        // Je gère le double click sur titre et j'appelle toggleEditForm
        newList.querySelector('.list-form-name input[name="list-name"]').addEventListener('blur', listModule.toggleEditForm);

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
    showAddListModal: () => {
        // Je récupère le modal à partir de son ID
        const modal = document.querySelector('#addListModal');
        // J'ajoute la classe is-active pour afficher le modal
        modal.classList.add('is-active');
    },
    toggleEditForm: (e) => {
        // On récupère notre liste à partir du titre
        const elList = e.target.closest('.panel');
        // De cacher/afficher le titre
        elList.querySelector(".list-name").classList.toggle('is-hidden');
        // De cacher/afficher le formulaire
        elList.querySelector(".list-form-name").classList.toggle('is-hidden');

        elList.querySelector('.list-form-name input[name="list-name"]').focus();

    },
    handleAddListForm: async (e) => {
        // Ne fais pas ton comportement habituel
        // NE FAIT PAS UN POST OU UN GET, NE RECHARGE PAS LA PAGE
        e.preventDefault();

        const formData = new FormData(e.target);

        const header = {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(app.formDataToObject(formData))
        }

        const res = await fetch(app.base_url + '/lists', header);
        const data = await res.json();

        listModule.makeListInDOM(data);

    },
    handleEditListForm: async () => {

    },
};