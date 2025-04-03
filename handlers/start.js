exports.start = (client) => async (event) => {
  const user = event.message.sender;
  const userId = user.id;

  if (user) {
    await client.sendMessage(event.message.peerId, { message: "С возвращением!" });
    const keyboard = {
      rows: [
        [
          { text: "Вопрос - ответ", callbackData: 'ai_question' },
          { text: "Диалог", callbackData: 'dialogue' }
        ]
      ]
    };
    await client.sendMessage(event.message.peerId, { message: "Выберите режим работы бота:", buttons: keyboard });
  } else {
    const keyboard = {
      rows: [
        [
          { text: "Зарегистрироваться", callbackData: 'register' }
        ]
      ]
    };
    await client.sendMessage(event.message.peerId, {
      message: "Добро пожаловать! Для использования бота необходимо зарегистрироваться.",
      buttons: keyboard
    });
  }
};
