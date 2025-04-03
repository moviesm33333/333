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

let dialogueMode = false; // Flag to track dialogue mode
let conversationContext = []; // Array to store conversation context

(async () => {
  await client.start({
    botAuthToken: botToken,
  });
  console.log('Bot started');

  client.addEventHandler(start(client), { pattern: /^\/start/ });
  client.addEventHandler(register(client), { pattern: /^register$/ });
  client.addEventHandler(aiQuestion(client), { pattern: /^ai_question$/ });
  client.addEventHandler(handleMessage(client, conversationContext, () => {
    dialogueMode = false; // Reset dialogue mode
    conversationContext = []; // Clear conversation context
  }), {});

  client.addEventHandler(async (event) => {
    if (event.callbackQuery && event.callbackQuery.data === 'dialogue') {
      dialogueMode = true;
      conversationContext = []; // Clear previous context
      await event.answer({ message: 'Вы перешли в режим диалога. Теперь ваши сообщения будут отправляться с учетом предыдущего контекста. Для завершения диалога нажмите кнопку "Завершить чат".' });
      const keyboard = {
        rows: [
          [{ text: "Завершить чат", callbackData: 'end_chat' }]
        ]
      };
      await client.sendMessage(event.chatId, { message: "Начните общение:", buttons: keyboard });
    } else if (event.callbackQuery && event.callbackQuery.data === 'end_chat') {
      dialogueMode = false;
      conversationContext = []; // Clear context
      await event.answer({ message: 'Вы завершили режим диалога.' });
      await start(client)(event); // Go back to the start menu
    }
  }, { pattern: /^(dialogue|end_chat)$/ });

  client.addEventHandler(checkBalance(client), { pattern: /^\/balance/ });
})();
