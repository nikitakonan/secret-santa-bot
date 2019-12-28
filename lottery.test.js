const lottery = require('./lottery');
const { testAllGifted, allHaveTo, noDuplicate } = require('./testFns');

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

function test1User() {
    const users = testUsers.map(u => ({ ...u })).slice(0, 1);
    const result = lottery(users);
    testAllGifted(result);
    allHaveTo(result);
    noDuplicate(result);
}

function test3Users() {
    const users = testUsers.map(u => ({ ...u })).slice(0, 3);
    const result = lottery(users);
    testAllGifted(result);
    allHaveTo(result);
    noDuplicate(result);
}

function test8Users() {
    const users = testUsers.map(u => ({ ...u })).slice(0, 8);
    const result = lottery(users);
    testAllGifted(result);
    allHaveTo(result);
    noDuplicate(result);
}

function test7Users() {
    const users = testUsers.map(u => ({ ...u })).slice(0, 7);
    const result = lottery(users);
    testAllGifted(result);
    allHaveTo(result);
    noDuplicate(result);
}

test1User();
console.log('\x1b[32m%s\x1b[0m', `[test1User] Success`);

for (let i = 0; i < 100; i++) {
    test3Users();
    console.log('\x1b[32m%s\x1b[0m', `(${i}) [test3Users] Success`);
}

for (let i = 0; i < 100; i++) {
    test8Users();
    console.log('\x1b[32m%s\x1b[0m', `(${i}) [test8Users] Success`);
}

for (let i = 0; i < 100; i++) {
    test7Users();
    console.log('\x1b[32m%s\x1b[0m', `(${i}) [test8Users] Success`);
}
