const {tools}=require("./tools");
const {cardModule}=require("./card");
const {listModule}=require("./list");
const {labelModule}=require("./label");

const app = {
    addListeners: () => {
        /* gestion du click dans la fenetre */
        document.addEventListener("click", (e) => {
            /* si on clique en dehors d’un form de modification de titre de liste, on les ferme tous */
            if (!e.target.classList.contains("modifyListInput")) {
                const modifyListForms = document.querySelectorAll(".modifyList");
                const listNames = document.querySelectorAll(".listName");
                const trashcans = document.querySelectorAll(".deleteList");
                /* pour concaténer on transforme les NodeList en Array */
                tools.swapElements(modifyListForms, Array.from(listNames).concat(Array.from(trashcans)));
            };

            /* si on clique en dehors d’un form de modification de LABEL, on les ferme tous */
            if (!e.target.closest(".editLabel")) {
                const modifyListForms = document.querySelectorAll(".editLabel");
                const labelNames = document.querySelectorAll(".labelName");
                tools.swapElements(modifyListForms, labelNames);
            };

            /* On vérifie si le bouton cliqué est le crayon d’édition de carte.
            la sélection se fait avec closest à cause d’issues dues au SVG */
            const testEditCardButton = e.target.closest("form") ?
                e.target.closest("form").classList.contains("triggerPatchCard")
                : false;

            /* on vérifie que target n’est pas un élément du card edit form 
            pour tous les fermer */
            // if (!e.target.classList.contains("modifyCardInput")) {
            if (!e.target.closest(".modifyCard")) {
                let modifyCardForms = document.querySelectorAll(".modifyCard");
                const cardsContents = document.querySelectorAll(".cardContent");

                /* si le bouton cliqué est le crayon, on le retire de la liste des éléments à effacer
                le édit form courant, car son effacement est gérer par un autre évènement (celui du bouton crayon cliqué).
                Toute cette opération afin d’éviter des téléscopages d’events.
                Du coup les edit forms se ferment quand : on clique en dehors OU sur le bouton crayon (lui meme en dehors) */
                if (testEditCardButton) {

                    /* on passe de NodeList à Array pour avoir filter */
                    modifyCardForms = Array.from(modifyCardForms);
                    // console.log(modifyCardForms);
                    modifyCardForms = modifyCardForms
                        .filter(el => {
                            /* on garde dans le tableau des éléments à effacer que ceux qui
                             ne sont pas dans la meme carte que le bouton cliqué */
                            return e.target.closest(".cardMain") !== el.closest(".cardMain");
                        });
                };
                // console.log("longueur", modifyCardForms);

                // console.log(modifyCardForms, cardsContents);
                tools.swapElements(modifyCardForms, cardsContents);

            };

            /* On réactive le drag n drop si l’élément cliqué n’est pas enfant des forms spécifiés */
            if (!e.target.closest("form.modifyCard,form.editLabel"))
            tools.globalDraggable("true");

        });
    },

    init: async () => {
        // labelModule.setLabelForm();
        await listModule.drawLists();
        await labelModule.drawLabelsInDictionnary();
        app.addListeners();
        cardModule.addListeners();
        listModule.addListeners();
        labelModule.addListeners();
    }
};

document.addEventListener("DOMContentLoaded", app.init);