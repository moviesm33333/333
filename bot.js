require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { start } = require('./handlers/start');
const { register } = require('./handlers/register');
const { aiQuestion } = require('./handlers/aiQuestion');
const { handleMessage } = require('./handlers/handleMessage');
const { checkBalance } = require('./handlers/checkBalance');

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;

const stringSession = new StringSession(process.env.SESSION_STRING || '');

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

(async () => {
  await client.start({
    botAuthToken: botToken,
  });
  console.log('Bot started');

  client.addEventHandler(start(client), { pattern: /^\/start/ });
  client.addEventHandler(register(client), { pattern: /^register$/ });
  client.addEventHandler(aiQuestion(client), { pattern: /^ai_question$/ });
  client.addEventHandler(handleMessage(client), {});
  client.addEventHandler(checkBalance(client), { pattern: /^\/balance/ });
})();
