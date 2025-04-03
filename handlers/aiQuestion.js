exports.aiQuestion = (client) => async (event) => {
  await client.sendMessage(event.message.peerId, { message: "Пожалуйста, введите ваш вопрос для нейросети:" });
};
