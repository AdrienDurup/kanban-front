const cardModule = {
    addListenerToActions: () => {

        const addCardbtns = document.querySelectorAll('.add-card-button');
        addCardbtns.forEach(addCardBtn => addCardBtn.addEventListener('click', cardModule.showAddCardModal));

        // Je récupère tous les boutons avec la classe .close
        const closeBtns = document.querySelectorAll(".close");

        // Pour chaque bouton j'ajoute l'event listener
        closeBtns.forEach((cBtn) => {
            cBtn.addEventListener('click', app.hideModals);
        });



        //On récupère le <form> contenu dans l'element <element id="addCardModal">
        const cardForm = document.querySelector("#addCardModal form");

        // On ajoute handleAddListForm comme eventlistenr pour submit
        cardForm.addEventListener('submit', cardModule.handleAddCardForm);
    },
    makeCardInDOM: (card) => {
        /* DEBUT DU CLONAGE */
        // Je récupère le template
        const template = document.querySelector("#template-card");

        // J'en crée une copie
        const newCard = document.importNode(template.content, true);

        console.log(newCard);
        /* FIN DU CLONAGE */

        // je mets à jour les infos
        newCard.querySelector('.card-name').textContent = card.content;


        // et l'id
        const cardId = card.id; //'card-' + Date.now();
        newCard.querySelector('.column').dataset.cardId = cardId;

        newCard.querySelector('.edit-button').addEventListener('click', cardModule.toggleEditForm);

        newCard.querySelector('.card-form-name input[name="content"]').addEventListener('blur', cardModule.toggleEditForm);

        newCard.querySelector('.card-form-name').addEventListener('submit', cardModule.handleEditCardForm);


        // On récupère l'element au complet cf. Replay -> DocumentFragment vs Element DOM
        let box = newCard.querySelector('.box');
        // Au vu de modifier le style
        box.style.backgroundColor = card.color;


        // Je trouve la bonne liste a l'aide de l'id
        //cf. doc pour selectionner un attribut : https://developer.mozilla.org/fr/docs/Web/CSS/Attribute_selectors
        const theGoodList = document.querySelector(`[data-list-id="${card.list_id}"]`);

        // ET j'insère au bon endroit la carte
        theGoodList.querySelector('.panel-block').appendChild(newCard);

        app.hideModals();

    },
    showAddCardModal: (e) => {
        // Je récupère le modal à partir de son ID
        const modal = document.querySelector('#addCardModal');
        // J'ajoute la classe is-active pour afficher le modal
        modal.classList.add('is-active');

        const elList = e.target.closest('.panel');
        const listId = elList.getAttribute('data-list-id');

        modal.querySelector('input[name="list_id"]').value = listId;
    },
    handleAddCardForm: async (e) => {
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

        const res = await fetch(app.base_url + '/cards', header);
        const data = await res.json();

        cardModule.makeCardInDOM(data);
    },
    toggleEditForm: (e) => {

        // On récupère notre liste à partir du titre
        const elCard = e.target.closest('.box');
        // De cacher/afficher le titre
        elCard.querySelector(".card-name").classList.toggle('is-hidden');
        // De cacher/afficher le formulaire
        elCard.querySelector(".card-form-name").classList.toggle('is-hidden');

        elCard.querySelector('.card-form-name input[name="content"]').focus();

    },
    handleEditCardForm: async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const header = {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(app.formDataToObject(formData))
        }

        try {

            const res = await fetch(app.base_url + '/cards/' + formData.get('card-id'), header);
            const data = await res.json();

            // On récupère la liste du DOM
            const elCard = e.target.closest('.box');

            // On mets à jour le nom
            elCard.querySelector(".card-name").textContent = data.content;
        } catch (err) {
            console.error(err);
        }

        cardModule.toggleEditForm(e);
    },
};