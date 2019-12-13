const lottery = require('./lottery');
const testUsers = [
    { id: '1', name: 'Vasya' },
    { id: '2', name: 'Volodya' },
    { id: '3', name: 'Vova' },
    { id: '4', name: 'Volodymir' },
    { id: '5', name: 'Alyaksander' },
    { id: '6', name: 'Angela' },
    { id: '7', name: 'Barak' },
    { id: '8', name: 'Donald' },
    { id: '9', name: 'Peter' },
];

const result = lottery(testUsers);
console.dir(result);
