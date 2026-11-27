// URL du backend Spring Boot (en développement local).
// Même machine que la page : « localhost » sur le PC, l'adresse du PC quand on ouvre l'application depuis un téléphone du réseau local.
const host = typeof location !== 'undefined' && location.hostname ? location.hostname : 'localhost';

export const environment = {
  apiUrl: 'http://localhost:8080/api',
};
