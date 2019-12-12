require('dotenv').config();
const express = require('express');
const ViberBot = require('viber-bot').Bot;
const TextMessage = require('viber-bot').Message.Text;
const { getUsers, setUsers } = require('./fileApi');

const authToken = process.env.PRIVATE_TOKEN;
const name = process.env.NAME;
const webhookUrl = process.env.WEBHOOK_URL;
const avatar = process.env.AVATAR_URL;

const webhookPath = '/viber/webhook';

const app = express();

app.set('view engine', 'pug');

const bot = new ViberBot({
    authToken,
    name,
    avatar
});

bot.onTextMessage(/^register$/i, (message, response) => {
    const { id, name } = response.userProfile;

    getUsers()
        .then(users => {
            const existing = users.find(u => u.id === id);
            if (existing) {
                response.send(new TextMessage(`Вы уже зарегистрированы 🤦`));
                return true;
            }

            users.push({ id, name });
            return setUsers(users);
        })
        .then((skip) => {
            if (skip) {
                return;
            }
            response.send(new TextMessage(`${name}, Вы успешно зарегистрированы 😀`));
        })
        .catch(() => {
            response.send(new TextMessage(`Что-то пошло не так 😟`));
        });
});

bot.onTextMessage(/^status$/i, (message, response) => {
    const { id, name } = response.userProfile;
    getUsers()
        .then(users => {
            const user = users.find(u => u.id === id);
            const txt = user ?
                `${name}, Вы успешно зарегистрированы, ожидайте других пользователей 😆` :
                `Для участия введите сообщение: register 😅`;
            const msg = new TextMessage(txt);
            response.send(msg);
        })
        .catch(() => {
            response.send(new TextMessage(`Что-то пошло не так 😟`));
        });
});

app.get('/', (req, res) => {
    res.render('users', {
        title: 'Secret Santa',
        message: 'Привет',
        users: registeredUsers
    });
});

app.use(webhookPath, bot.middleware());

app.listen(process.env.PORT, () => {
    console.log(`app is listening on ${process.env.PORT}`);
    bot.setWebhook(webhookUrl + webhookPath)
        .then((res) => console.log(`successfully set webhook`))
        .catch(reason => console.error(reason));
});