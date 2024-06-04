import { fakerFR as faker } from '@faker-js/faker';

const USER_COUNT = 1e6;
const QUERY_COUNT = 200;

console.time('Création de la BDD');
const emptyArray = new Array(USER_COUNT).fill();
const users = emptyArray.map(() => ({
  id: faker.string.uuid(),
  fullname: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  age: faker.number.int({min: 18, max: 99}),
}));
console.timeEnd('Création de la BDD');

const emptyArrayCount = new Array(QUERY_COUNT).fill();

// SELECT * FROM users WHERE age = 45;
console.time('Utilisateur ayant 45 ans');
let users45;
emptyArrayCount.forEach(() => {
  users45 = users.filter(user => user.age === 45);
});
console.timeEnd('Utilisateur ayant 45 ans');
console.log(`résultat : ${users45.length}`);

// Création d'un index de type Hash
// Pour cela on va réorginser les informations avec un objet

console.time("Création de l'index pour l'âge");
const userIndex = {};
users.forEach((user) => {
  // Potentiellement la propriété nommé avec l'âge n'existe pas encore et JS nous ferais une erreur lors du push dans une propriété qui n'existe pas donc undefined
  if(!userIndex[user.age]){
    userIndex[user.age] = [];
  }
  // J'ajoute l'utilisateur courant dans son groupe d'age
  userIndex[user.age].push(user.id);
});
console.timeEnd("Création de l'index pour l'âge");

// Création de l'index avace la nouvelle méthode group()
// Bon apparemenbt ca fonctionne pas encore…… tristitude…
/*
console.time("Création de l'index pour l'âge (new 2024)");

const userIndex2 = users.group((user) => user.age);
const userIndex2 = users.group(({age}) => age);
console.timeEnd("Création de l'index pour l'âge (new 2024)");
console.log(userIndex2);
*/

// Autre méthode fonctionnelle (mais pas plus efficace)
/*
console.time("Création de l'index pour l'âge (new 2024)");
const userIndex2 = Object.groupBy(users, ({age}) => age);
console.timeEnd("Création de l'index pour l'âge (new 2024)");
*/

// SELECT * FROM users WHERE age = 45;
console.time('Utilisateur ayant 45 ans avec index');
let users45withindex;
emptyArrayCount.forEach(() => {
  users45withindex = userIndex[45];
});
console.timeEnd('Utilisateur ayant 45 ans avec index');
console.log(`résultat : ${users45withindex.length}`);
