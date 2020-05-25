console.log('Hello World!');

const person = {
    name: "Obaseki Nosa",
    location: "Lagos",
}

window.localStorage.setItem('test', JSON.stringify(person));

console.log(JSON.parse(window.localStorage.getItem('test')));