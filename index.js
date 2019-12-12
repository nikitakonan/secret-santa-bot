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

app.use(express.static('static'));
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

bot.onTextMessage(/^unregister$/i, (message, response) => {
    const { id, name } = response.userProfile;

    getUsers()
        .then(users => {
            const existing = users.findIndex(u => u.id === id);
            if (existing === -1) {
                response.send(new TextMessage(`Вас нету в списках 🙀🤭`));
                return true;
            }

            users.splice(existing, 1);
            return setUsers(users);
        })
        .then((skip) => {
            if (skip) {
                return;
            }
            response.send(new TextMessage(`${name}, Вы успешно удалены 😀`));
        })
        .catch(() => {
            response.send(new TextMessage(`Что-то пошло не так 😟`));
        });
});

bot.onTextMessage(/^list$/i, (message, response) => {
    getUsers()
        .then(users => {
            if (users.length === 0) {
                response.send(new TextMessage(`Никого нет 😢`));
                return;
            }

            response.send([
                new TextMessage(`Поприветствуем участников 👇`),
                ...users.map(u => new TextMessage(u.name))
            ]);
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
    getUsers()
        .then(users => {
            res.render('users', {
                title: 'Secret Santa',
                message: 'Привет',
                users
            });
        })
        .catch(() => {
            res.send(`Something went wrong`);
        });
});

app.get('/docs', (req, res) => {
    res.render('docs');
});

app.use(webhookPath, bot.middleware());

app.listen(process.env.PORT, () => {
    console.log(`app is listening on ${process.env.PORT}`);
    bot.setWebhook(webhookUrl + webhookPath)
        .then((res) => console.log(`successfully set webhook`))
        .catch(reason => console.error(reason));
});