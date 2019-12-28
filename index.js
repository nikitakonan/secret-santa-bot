require('dotenv').config();
const express = require('express');
const Telegraf = require('telegraf')
const { getUsers, setUsers } = require('./fileApi');
const lottery = require('./lottery');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT;

const bot = new Telegraf(BOT_TOKEN);

const app = express();

app.use(bot.webhookCallback('/secret-path'));
bot.telegram.setWebhook(`${WEBHOOK_URL}/secret-path`);
app.use(express.static('static'));
app.set('view engine', 'pug');

bot.start((ctx) => {
    const { id, first_name, last_name, username, language_code, is_bot } = ctx.from;
    return ctx.reply(`Welcome! [${id}] ${first_name} ${last_name} (${username})`);
});

bot.command('register', (ctx) => {
    const chatId = ctx.message.chat.id;
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name} ${last_name}`;

    return getUsers()
        .then(users => {
            const existing = users.find(u => u.id === id);
            if (existing) {
                return ctx.reply(`Вы уже зарегистрированы 🤦`)
                    .then(() => true);
            }

            users.push({ id, chatId, name });
            return setUsers(users);
        })
        .then((skip) => {
            if (skip) {
                return;
            }
            return ctx.reply(`${name}, Вы успешно зарегистрированы 😀`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.command('unregister', (ctx) => {
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name} ${last_name}`;

    getUsers()
        .then(users => {
            const existing = users.findIndex(u => u.id === id);
            if (existing === -1) {
                ctx.reply(`Вас нету в списках 🙀🤭`);
                return true;
            }

            users.splice(existing, 1);
            return setUsers(users);
        })
        .then((skip) => {
            if (skip) {
                return;
            }
            ctx.reply(`${name}, Вы успешно удалены 😀`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.command('list', (ctx) => {
    getUsers()
        .then(users => {
            if (users.length === 0) {
                ctx.reply(`Никого нет 😢`);
                return;
            }

            ctx.reply(`Поприветствуем участников 👇${users.map(u => u.name).join(',')}`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.command('status', (ctx) => {
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name} ${last_name}`;

    getUsers()
        .then(users => {
            const allGifted = users.length > 0 && users.every(u => !!u.to);
            const user = users.find(u => u.id === id);

            if (allGifted) {
                return ctx.reply(`Розыгрыш состоялся вы дарите подарок для ${user.to}`);
            }

            const msg = user ?
                `${name}, Вы успешно зарегистрированы, ожидайте других пользователей 😆` :
                `Для участия введите сообщение: /register 😅`;
            ctx.reply(msg);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.launch();

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

            result.forEach(({ name, to, chatId }) => {
                bot.telegram.sendMessage(chatId, `Уважаемый ${name}, розыгрыш состоялся 🥳. Вы дарите 🎁 для ${to}.`);
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
            console.dir(reason);
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

app.listen(PORT, () => {
    console.log(`app is listening on ${PORT}`);
});