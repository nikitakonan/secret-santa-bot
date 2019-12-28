const firebase = require('firebase');

firebase.initializeApp({
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
});

const db = firebase.firestore();

const getUsers = () => {
    return db.collection("users").get()
        .then((querySnapshot) => {
            const result = [];
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                result.push({
                    ...user,
                    documentId: doc.id
                });
            });
            return result;
        });
}

const addUser = (user) => {
    return db.collection("users").add(user)
        .then(function (docRef) {
            return {
                ...user,
                documentId: docRef.id
            }
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
}

const removeUser = (id) => {
    return db.collection('users').get()
        .then(snapshot => {
            if (snapshot.empty) {
                return Promise.resolve(`NOT_EXIST`);
            }
            const doc = snapshot.docs.find(doc => doc.data().id === id);
            if (doc.exists) {
                return doc.ref.delete();
            }
            return Promise.resolve(`NOT_EXIST`);
        });
}

const updateUser = (docId, user) => {
    return db.collection('users').doc(docId).update(user).then(() => user);
}

const setUser = (docId, user) => {
    return db.collection('users').doc(docId).set(user).then(() => user);
}

module.exports = {
    addUser,
    getUsers,
    removeUser,
    updateUser,
    setUser
}