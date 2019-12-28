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

bot.command('register', (ctx) => {
    const chatId = ctx.message.chat.id;
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name || ''} ${last_name || ''}`;

    return api.getUsers()
        .then(users => {
            const existing = users.find(u => u.id === id);
            if (existing) {
                return ctx.reply(`Вы уже зарегистрированы 🤦`)
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
        });
});

bot.command('unregister', (ctx) => {
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name} ${last_name}`;

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

            ctx.reply(`Поприветствуем участников 👇${users.map(u => u.name).join(',')}`);
        })
        .catch(() => {
            ctx.reply(`Что-то пошло не так 😟`);
        });
});

bot.command('status', (ctx) => {
    const { id, first_name, last_name } = ctx.from;
    const name = `${first_name} ${last_name}`;

    api.getUsers()
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
            res.send(`Something went wrong`);
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
        .catch(_ => res.send(`Something went wrong`));
});

app.post('/get-started', (req, res) => {
    api.getUsers()
        .then(users => {
            const result = lottery(users);

            return Promise.all(result.map(({ documentId, ...user }) => {
                return api.updateUser(documentId, user);
            }))
        })
        .then(users => {
            users.forEach(({ name, to, chatId }) => {
                bot.telegram.sendMessage(chatId, `Уважаемый ${name}, розыгрыш состоялся 🥳. Вы дарите 🎁 для ${to}.`);
            });

            res.redirect('/result');
        })
        .catch(_ => {
            res.statusCode = 500;
            res.send(`Something went wrong`);
        });
});

app.post('/clean-result', (req, res) => {
    api.getUsers()
        .then(users => {
            return Promise.all(users.map(({ documentId, to, ...user }) => {
                return api.setUser(documentId, user);
            }))
        })
        .then(() => {
            res.redirect('/');
        })
        .catch(reason => {
            res.statusCode = 500;
            res.send(`Something went wrong. ${JSON.stringify(reason)}`);
        });
});

app.listen(PORT, () => {
    console.log(`app is listening on ${PORT}`);
});