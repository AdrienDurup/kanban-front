// document.querySelector => Il récupère UN élement, le PREMIER élément qui match la "requête"

// document.querySelector(".column") => Le Premier élément HTML avec la classe .column

// document.querySelectorAll(".column") => UN tableau avec TOUS les éléments html avec laz classe .column

// let tousLesElementsColumn = document.querySelectorAll(".column");
// Le premier .column qui recontre

// let jeSuisQuoi = tousLesElementsColumn[0].querySelector(".column");
// Le premier .column qui rencontre DANS le premier element de tousLesElements

// const btn = document.getElementById("doNotClick");
// LA MEME CHOSE 

// const btn = document.querySelector("#doNotClick");
// btn.addEventListener('click', () => {
//     alert("Diantre, Je t'avais dit de pas cliquer, Chenapan!");
//     const parentElm = btn.parentElement;
//     btn.remove();
//     const monSpan = document.createElement("span");
//     monSpan.textContent = "Sacripan ! Pour la peine le bouton est parti !";
//     parentElm.appendChild(monSpan);
// });


// const monInput = document.querySelector("#name");
// console.log(monInput.value);
// monInput.addEventListener('keyup', () => console.log(monInput.value));

const students = [{
        firstName: "Jean",
        lastName: "Bon"
    },
    {
        firstName: "Sarah",
        lastName: "Croche"
    },
    {
        firstName: "Sara",
        lastName: "Pelle"
    }
];

// <div class="student-list">
//     <div class="student"><span>Jean</span><span>Bon</span></div>
//     <div class="student"><span>Sarah</span><span>Croche</span></div>
//     <div class="student"><span>Sara</span><span>Pelle</span></div>
// </div>

// Créer la div avec la "student-list"

// Boucler sur les la liste et créer 3 div content des span 

const section = document.querySelector("section");

const holderDiv = document.createElement("div");
holderDiv.classList.add("student-list");

for (const student of students) {
    const divStudent = document.createElement("div");
    divStudent.classList.add("student");

    const firstSpan = document.createElement("span");
    firstSpan.textContent = student.firstName + ' ';

    const secondSpan = document.createElement("span");
    secondSpan.textContent = student.lastName;

    divStudent.appendChild(firstSpan);
    divStudent.appendChild(secondSpan);

    holderDiv.appendChild(divStudent);
}

section.appendChild(holderDiv);

// holderDiv.addEventListener('click', (e) => {
//     if (e.target.nodeName == "SPAN") {
//         const parent = e.target.parentElement;

//         alert(parent.children[0].textContent + parent.children[1].textContent);
//     }
// });