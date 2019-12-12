const fs = require('fs');

const getUsers = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./users.json', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    fs.writeFile('./users.json', '[]', err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve([]);
                        }
                    })
                } else {
                    reject(err);
                }
                return;
            }
            try {
                const users = JSON.parse(data);
                resolve(users);
            } catch (e) {
                reject(e);
            }
        });
    });
}

const setUsers = (users) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(users, null, 2);
        fs.writeFile('./users.json', data, err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

module.exports = {
    getUsers,
    setUsers
}