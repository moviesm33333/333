exports.register = (client) => async (event) => {
  const user = event.message.sender;
  const userId = user.id;
  const username = user.username;
  const firstName = user.firstName;
  const lastName = user.lastName;

  // Here you would typically store the user data in a database
  // For now, we'll just log it
  console.log('User registered:', { userId, username, firstName, lastName });

  await client.sendMessage(event.message.peerId, { message: "Регистрация успешно завершена. Теперь вы можете использовать все функции бота." });
};
