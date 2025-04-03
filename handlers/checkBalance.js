const axios = require('axios');

exports.checkBalance = (client) => async (event) => {
  const userId = event.message.sender.id;
  const apiUrl = process.env.API_URL;

  try {
    const response = await axios.get(`${apiUrl}?action=check_balance&user_id=${userId}`);
    const data = response.data;

    if (data.success) {
      const balance = data.balance;
      const status = data.status;
      const isBlocked = data.is_blocked;

      let message = `Ваш баланс: ${balance}\nСтатус: ${status}`;
      if (isBlocked) {
        message += '\nВаш аккаунт заблокирован.';
      }

      await client.sendMessage(event.message.peerId, { message: message });
    } else {
      await client.sendMessage(event.message.peerId, { message: `Ошибка: ${data.message}` });
    }
  } catch (error) {
    console.error("Error checking balance:", error);
    await client.sendMessage(event.message.peerId, { message: `Произошла ошибка при проверке баланса: ${error.message}` });
  }
};
