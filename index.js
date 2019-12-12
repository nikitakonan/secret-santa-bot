require('dotenv').config();
const express = require('express');
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;

const authToken = process.env.PRIVATE_TOKEN;
const name = process.env.NAME;
const webhookUrl = process.env.WEBHOOK_URL;
const avatar = process.env.AVATAR_URL;

const webhookPath = '/viber/webhook';

const app = express();

const bot = new ViberBot({
    authToken,
    name,
    avatar
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    response.send(message);
});

app.get('/', (req, res) => {
    res.send(`<html>
    <body>
        <h1>Hello</h1>
    </body>
    </html>`)
})

app.use(webhookPath, bot.middleware());

app.listen(process.env.PORT, () => {
    console.log(`app is listening on ${process.env.PORT}`);
    bot.setWebhook(webhookUrl + webhookPath)
        .then((res) => console.log(`successfully set webhook`))
        .catch(reason => console.error(reason));
});