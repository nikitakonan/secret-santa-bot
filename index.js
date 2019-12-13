require('dotenv').config();
const express = require('express');
const ViberBot = require('viber-bot').Bot;
const TextMessage = require('viber-bot').Message.Text;
const { getUsers, setUsers } = require('./fileApi');
const lottery = require('./lottery');

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
            const allGifted = users.length > 0 && users.every(u => !!u.to);
            const user = users.find(u => u.id === id);

            if (allGifted) {
                return response.send(new TextMessage(`Розыгрыш состоялся вы дарите подарок для ${user.to}`));
            }

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
            const allGifted = users.length > 0 && users.every(u => !!u.to);

            res.render('users', {
                title: 'Secret Santa',
                message: 'Привет',
                users,
                allGifted
            });
        })
        .catch(() => {
            res.send(`Something went wrong`);
        });
});

app.get('/docs', (req, res) => {
    res.render('docs');
});

app.get('/result', (req, res) => {
    getUsers()
        .then(users => {
            res.render('result', { users });
        })
        .catch(reason => res.send(`Something went wrong`));
});

app.post('/get-started', (req, res) => {
    getUsers()
        .then(users => {
            const result = lottery(users);

            result.forEach(({ id, name, to }) => {
                bot.sendMessage({ id, name }, new TextMessage(`Уважаемый ${name}, розыгрыш состоялся 🥳. Вы дарите 🎁 для ${to}.`));
            });

            setUsers(result)
                .then(() => {
                    // TODO Send messages to users
                    res.redirect('/result');
                })
                .catch(reason => {
                    res.send(`Something went wrong`);
                });
        })
        .catch(reason => {
            res.statusCode = 500;
            res.send('Something went wrong');
        });
});

app.post('/clean-result', (req, res) => {
    getUsers()
        .then(users => {
            const x = users.map(({ to, ...user }) => user);
            return setUsers(x);
        })
        .then(() => {
            res.redirect('/');
        })
        .catch(reason => {
            res.statusCode = 500;
            res.send('Something went wrong');
        });
});

app.use(webhookPath, bot.middleware());

app.listen(process.env.PORT, () => {
    console.log(`app is listening on ${process.env.PORT}`);
    bot.setWebhook(webhookUrl + webhookPath)
        .then((res) => console.log(`successfully set webhook`))
        .catch(reason => console.error(reason));
});