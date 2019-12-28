require('dotenv').config();
const express = require('express');
const Telegraf = require('telegraf')
const lottery = require('./lottery');
const api = require('./fireBase');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT;

const bot = new Telegraf(BOT_TOKEN);

const app = express();

app.use(bot.webhookCallback('/secret-path'));
bot.telegram.setWebhook(`${WEBHOOK_URL}/secret-path`);
app.use(express.static('static'));
app.set('view engine', 'pug');

const getName = (ctx) => {
    const { username, first_name, last_name } = ctx.from;
    const hasFirstName = !!first_name;
    const hasLastName = !!last_name;
    const fullName = ` (${first_name || ''} ${last_name || ''})`;
    return `${username}${hasFirstName || hasLastName ? fullName : ''}`;
}

bot.start((ctx) => {
    const name = getName(ctx);
    return ctx.reply(`Welcome! ${name}`);
});

const registerLock = {};

bot.command('register', (ctx) => {
    const lockKey = ctx.from.id;
    if (registerLock[lockKey]) {
        return ctx.reply(`В процессе регистрации`);
    }
    registerLock[lockKey] = true;

    const chatId = ctx.message.chat.id;
    const { id } = ctx.from;
    const name = getName(ctx);

    return api.getUsers()
        .then(users => {
            const existing = users.find(u => u.id === id);
            if (existing) {
                return ctx.reply(`Вы уже зарегистрированы 😉`)
                    .then(() => true);
            }

            return api.addUser({ id, chatId, name });
        })
        .then((skip) => {
            if (skip === true) {
                return;
            }
            return ctx.reply(`${name}, Вы успешно зарегистрированы 😀`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        })
        .finally(() => {
            delete registerLock[lockKey];
        })
});

bot.command('unregister', (ctx) => {
    const { id } = ctx.from;
    const name = getName(ctx);

    api.removeUser(id)
        .then(result => {
            if (result === `NOT_EXIST`) {
                ctx.reply(`Вас нету в списках 🙀🤭`);
                return;
            }
            ctx.reply(`${name}, Вы успешно удалены 😀`);
        })
        .catch((reason) => {
            ctx.reply(`Что-то пошло не так 😟${JSON.stringify(reason)}`);
        });
});

bot.command('list', (ctx) => {
    api.getUsers()
        .then(users => {
            if (users.length === 0) {
                ctx.reply(`Никого нет 😢`);
                return;
            }

            ctx.reply(`Поприветствуем участников 👏 ${users.map(u => u.name).join(',')}`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.command('status', (ctx) => {
    const { id } = ctx.from;
    const name = getName(ctx);

    api.getUsers()
        .then(users => {
            const allGifted = users.length > 0 && users.every(u => !!u.to);
            const user = users.find(u => u.id === id);

            if (allGifted) {
                return ctx.reply(`Розыгрыш состоялся Вы дарите подарок для ${user.to}`);
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

app.get('/', (_, res) => {
    api.getUsers()
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
            res.send(`Что-то пошло не так 😟`);
        });
});

app.get('/docs', (req, res) => {
    res.render('docs');
});

app.get('/result', (req, res) => {
    api.getUsers()
        .then(users => {
            res.render('result', { users });
        })
        .catch(_ => res.send(`Что-то пошло не так 😟`));
});

app.post('/get-started', (_, res) => {
    api.getUsers()
        .then(users => {
            const result = lottery(users);

            return Promise.all(result.map(({ documentId, ...user }) => {
                return api.updateUser(documentId, user);
            }))
        })
        .then(users => {
            users.forEach(({ name, to, chatId }) => {
                bot.telegram.sendMessage(chatId, `Уважаемая/уважаемый ${name}, розыгрыш состоялся 🥳. Вы дарите 🎁 для ${to}.`);
            });

            res.redirect('/result');
        })
        .catch(_ => {
            res.statusCode = 500;
            res.send(`Что-то пошло не так 😟`);
        });
});

app.post('/clean-result', (req, res) => {
    api.getUsers()
        .then(users => {
            return Promise.all(users.map(({ documentId, to, gifted, ...user }) => {
                return api.setUser(documentId, user);
            }))
        })
        .then(() => {
            res.redirect('/');
        })
        .catch(reason => {
            res.statusCode = 500;
            res.send(`Что-то пошло не так 😟. ${JSON.stringify(reason)}`);
        });
});

app.listen(PORT, () => {
    console.log(`app is listening on ${PORT}`);
});