const axios = require('axios');

exports.handleMessage = (client) => async (event) => {
  const userQuestion = event.message.text;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  const headers = {
    "Authorization": `Bearer ${openrouterApiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "Telegram Bot",
  };

  const data = JSON.stringify({
    "model": "google/gemini-2.0-flash-exp:free",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": userQuestion
          }
        ]
      }
    ],
  });

  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", data, { headers });
    response.data.choices.forEach(async (choice) => {
      let aiResponse = choice.message.content;

      // Split the message into chunks of 4096 characters
      const chunkSize = 4096;
      for (let i = 0; i < aiResponse.length; i += chunkSize) {
        const chunk = aiResponse.substring(i, i + chunkSize);
        await client.sendMessage(event.message.peerId, { message: chunk });
      }
    });
  } catch (error) {
    console.error("Error during AI request:", error);
    await client.sendMessage(event.message.peerId, { message: `Произошла ошибка при запросе к нейросети: ${error.message}` });
  }
};
