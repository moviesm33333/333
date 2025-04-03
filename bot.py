import logging
import json
import os
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    filters,
    CallbackContext,
)
from dotenv import load_dotenv

load_dotenv()

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# States for ConversationHandler
START, REGISTER, AI_INTERACTION = range(3)

# Temporary storage for user data
user_data = {}


async def start_command(update: Update, context: CallbackContext) -> int:
    """Handles the /start command and sends a welcome message."""
    user = update.effective_user
    user_id = user.id

    if user_id in user_data:
        await update.message.reply_text("С возвращением!")
        keyboard = [
            [InlineKeyboardButton("Задать вопрос нейросети", callback_data='ai_question')],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("Что вы хотите сделать?", reply_markup=reply_markup)
        return ConversationHandler.END
    else:
        keyboard = [
            [InlineKeyboardButton("Зарегистрироваться", callback_data='register')],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            "Добро пожаловать! Для использования бота необходимо зарегистрироваться.",
            reply_markup=reply_markup
        )
        return START


async def register_button(update: Update, context: CallbackContext) -> int:
    """Handles the registration button press."""
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    user_id = user.id
    username = user.username
    first_name = user.first_name
    last_name = user.last_name

    user_data[user_id] = {
        'username': username,
        'first_name': first_name,
        'last_name': last_name,
        'id': user_id
    }

    await query.edit_message_text(text="Регистрация успешно завершена. Теперь вы можете использовать все функции бота.")
    return ConversationHandler.END


async def ai_question_button(update: Update, context: CallbackContext) -> int:
    """Handles the AI question button press."""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text(text="Пожалуйста, введите ваш вопрос для нейросети:")
    return AI_INTERACTION


async def process_ai_question(update: Update, context: CallbackContext) -> int:
    """Processes the user's question and sends it to the AI."""
    user_question = update.message.text
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",  # Замените на URL вашего сайта, если есть
        "X-Title": "Telegram Bot",  # Замените на название вашего сайта, если есть
    }

    data = json.dumps({
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": user_question
                    }
                ]
            }
        ],

    })

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=data
        )
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        ai_response = response.json()['choices'][0]['message']['content']
        await update.message.reply_text(ai_response)

    except requests.exceptions.RequestException as e:
        await update.message.reply_text(f"Произошла ошибка при запросе к нейросети: {e}")
        return ConversationHandler.END

    except requests.exceptions.ConnectionError as e:
        await update.message.reply_text(f"Произошла ошибка подключения к нейросети: {e}")
        return ConversationHandler.END

    except requests.exceptions.Timeout as e:
        await update.message.reply_text(f"Превышено время ожидания ответа от нейросети: {e}")
        return ConversationHandler.END

    except Exception as e:
        await update.message.reply_text(f"Произошла непредвиденная ошибка: {e}")
        return ConversationHandler.END

    return ConversationHandler.END


async def handle_message(update: Update, context: CallbackContext) -> None:
    """Handles all messages and sends them to the AI."""
    await process_ai_question(update, context)


async def cancel(update: Update, context: CallbackContext) -> int:
    """Cancels and ends the conversation."""
    user = update.message.from_user
    logger.info("User %s canceled the conversation.", user.first_name)
    await update.message.reply_text(
        "Действие отменено."
    )
    return ConversationHandler.END


def main() -> None:
    """Starts the bot."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    application = ApplicationBuilder().token(bot_token).build()

    # Add conversation handler with the states
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start_command)],
        states={
            START: [
                CallbackQueryHandler(register_button, pattern='^register$'),
            ],
            AI_INTERACTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, process_ai_question),
            ]
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    application.add_handler(conv_handler)
    application.add_handler(CallbackQueryHandler(ai_question_button, pattern='^ai_question$'))

    # Add message handler to handle all messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Start the Bot
    application.run_polling()


if __name__ == '__main__':
    main()
