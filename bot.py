import logging
from datetime import datetime
import re
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
    ConversationHandler,
    PicklePersistence,
)
from config import *
from database import Database
import os
from dotenv import load_dotenv

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize database
db = Database()

# Get admin ID from environment
ADMIN_ID = int(os.getenv('ADMIN_ID', '0'))

# Define conversation states
(
    CHECKING_CHANNELS,
    CHECKING_GROUP,
    CHECKING_TWITTER,
    GETTING_SOLANA,
    MAIN_MENU
) = range(5)

def create_main_menu() -> ReplyKeyboardMarkup:
    """Create the main menu keyboard."""
    keyboard = [
        [
            KeyboardButton("👥 Refer and Earn"),
            KeyboardButton("💰 Balance")
        ],
        [
            KeyboardButton("ℹ️ About MUSKY"),
            KeyboardButton("💸 Withdraw")
        ],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=False)

def create_continue_button() -> InlineKeyboardMarkup:
    """Create continue button."""
    keyboard = [[InlineKeyboardButton("🟢 Continue", callback_data="continue")]]
    return InlineKeyboardMarkup(keyboard)

async def check_member(bot, user_id, chat_id):
    """Check if user is member of a channel/group."""
    try:
        chat_id = str(chat_id).replace("@", "")  # Remove @ if present
        member = await bot.get_chat_member(chat_id=f"@{chat_id}", user_id=user_id)
        return member.status in ['member', 'administrator', 'creator']
    except Exception as e:
        logger.error(f"Error checking membership: {e}")
        return False

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the conversation and check channels first."""
    user = update.effective_user
    
    # Initialize user in database if not exists
    if not db.get_user(user.id):
        db.add_user(user.id, user.username or "")
    
    user_data = db.get_user(user.id)
    
    # Store referrer if this is a referral link
    if context.args and context.args[0].startswith("ref_"):
        try:
            referrer_id = int(context.args[0].split("_")[1])
            if referrer_id != user.id:  # Prevent self-referral
                context.user_data['referrer_id'] = referrer_id
                referrer_data = db.get_user(referrer_id)
                if referrer_data:
                    await update.message.reply_text(
                        f"🎉 You were referred by {referrer_data.get('username', 'a MUSKY member')}!"
                    )
        except (ValueError, IndexError):
            pass

    if not user_data or not user_data.get('verification_complete'):
        await update.message.reply_text(
            "🌟 Welcome to MUSKY Token Airdrop! 🌟\n\n"
            "🎁 Complete simple tasks to earn tokens worth $15!\n\n"
            "Step 1️⃣: Join our channels:\n"
            "• @musky_on_sol\n"
            "• @Airdrop_Saggitarus\n"
            "• @MUSKY_GROUPCHAT\n"
            "• Type 'MUSKY TO MOON' in the group @MUSKY_GROUPCHAT\n\n"
            "Click 🟢 Continue when done! 👇",
            reply_markup=create_continue_button()
        )
        return CHECKING_CHANNELS
    
    # If user is already verified, show main menu
    await show_main_menu(update, context)
    return MAIN_MENU

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle button callbacks."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "continue":
        if "Join our channels" in query.message.text:
            return await check_channels(update, context)
        elif "Twitter" in query.message.text:
            return await check_twitter(update, context)
    
    return CHECKING_CHANNELS

async def check_channels(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Check if user has joined the required channels."""
    if update.callback_query:
        message = update.callback_query.message
        user_id = update.callback_query.from_user.id
    else:
        message = update.message
        user_id = update.message.from_user.id
    
    try:
        # Check membership in both channels
        musky_member = await check_member(context.bot, user_id, CHANNELS['musky'])
        airdrop_member = await check_member(context.bot, user_id, CHANNELS['airdrop'])
        
        if not (musky_member and airdrop_member):
            not_joined = []
            if not musky_member:
                not_joined.append("@musky_on_sol")
            if not airdrop_member:
                not_joined.append("@Airdrop_Saggitarus")
                
            await message.reply_text(
                "❌ Please join all our channels first:\n"
                f"{', '.join(not_joined)}\n\n"
                "Once you've joined, click the button below! 👇",
                reply_markup=create_continue_button()
            )
            return CHECKING_CHANNELS
        
        await message.reply_text(
            "✨ Amazing! Let's continue!\n\n"
            "Step 2️⃣: Visit our Twitter:\n"
            f"• {TWITTER_LINK}\n\n"
            "Click 🟢 Continue after checking! 👇",
            reply_markup=create_continue_button()
        )
        return CHECKING_TWITTER
        
    except Exception as e:
        logger.error(f"Error in check_channels: {e}")
        await message.reply_text(
            "❌ Oops! Something went wrong.\n"
            "Please make sure you've joined all channels and try again! 👇",
            reply_markup=create_continue_button()
        )
        return CHECKING_CHANNELS

async def check_twitter(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Ask for Solana address after Twitter step."""
    if update.callback_query:
        message = update.callback_query.message
    else:
        message = update.message
        
    await message.reply_text(
        "🎉 Final Step! 🎉\n\n"
        "Step 3️⃣: Drop your Solana address below\n"
        "💎 You'll receive tokens worth $15!\n\n"
        "⚠️ Address must be less than 100 characters"
    )
    return GETTING_SOLANA

async def get_solana(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle Solana address submission and complete verification."""
    solana_address = update.message.text
    
    if len(solana_address) > 100:
        await update.message.reply_text(
            "❌ Address too long! Please enter a shorter address (max 100 characters)."
        )
        return GETTING_SOLANA
    
    user_id = update.effective_user.id
    
    # Update user data
    db.update_user(user_id, {
        'solana_address': solana_address,
        'verification_complete': True,
        'balance': INITIAL_BALANCE
    })
    
    # Handle referral bonus if applicable
    referral_text = ""
    if 'referrer_id' in context.user_data:
        referrer_id = context.user_data['referrer_id']
        if db.add_referral(referrer_id):
            referrer_data = db.get_user(referrer_id)
            if referrer_data:
                referral_text = f"\n\n🎁 Your referrer {referrer_data.get('username', 'a MUSKY member')} received {REFERRAL_BONUS} MUSKY tokens!"
            logger.info(f"Added referral bonus for user {referrer_id}")
        del context.user_data['referrer_id']
    
    await update.message.reply_text(
        f"🎊 Congratulations! 🎊\n\n"
        f"💰 You've received {INITIAL_BALANCE} MUSKY tokens (~$15)!{referral_text}\n\n"
        f"🚀 Use the menu below to start earning more!",
        reply_markup=create_main_menu()
    )
    
    return MAIN_MENU

async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show the main menu with welcome message."""
    user_data = db.get_user(update.effective_user.id)
    welcome_text = WELCOME_MSG.format(
        initial=user_data['balance'],
        bonus=REFERRAL_BONUS
    )
    await update.message.reply_text(
        welcome_text,
        reply_markup=create_main_menu(),
        parse_mode='HTML'
    )

async def handle_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle menu button clicks."""
    text = update.message.text
    user_id = update.effective_user.id
    user_data = db.get_user(user_id)
    
    if not user_data.get('verification_complete'):
        await update.message.reply_text(
            "❌ Please complete the verification process first.\n"
            "Use /start to begin verification."
        )
        return ConversationHandler.END

    if text == "👥 Refer and Earn":
        referral_link = f"https://t.me/{context.bot.username}?start=ref_{user_id}"
        text = f"""
🎁 Share Your Referral Link 🎁

💰 Earn {REFERRAL_BONUS} MUSKY tokens (~$30) for each friend you invite!

🔗 Your referral link:
{referral_link}

📊 Stats:
👥 Current referrals: {user_data['referral_count']}
💎 Total earned: {int(user_data['referral_count']) * REFERRAL_BONUS} MUSKY
"""
        await update.message.reply_text(text)

    elif text == "💰 Balance":
        text = f"""
💰 Your MUSKY Balance 💰

Current Balance: {user_data['balance']} MUSKY (~${float(user_data['balance'])/67:.2f})
👥 Referrals: {user_data['referral_count']}
💎 Referral Earnings: {int(user_data['referral_count']) * REFERRAL_BONUS} MUSKY

🎯 Minimum withdrawal: {MINIMUM_WITHDRAW} MUSKY
⏳ Time until launch: {get_countdown()}
"""
        await update.message.reply_text(text)

    elif text == "ℹ️ About MUSKY":
        await update.message.reply_text(ABOUT_MSG)

    elif text == "💸 Withdraw":
        if int(user_data['balance']) >= MINIMUM_WITHDRAW:
            await update.message.reply_text(
                "💸 Your withdrawal request has been recorded.\n"
                "Tokens will be distributed after launch! 🚀"
            )
        else:
            await update.message.reply_text(
                f"❌ You need at least {MINIMUM_WITHDRAW} MUSKY tokens to withdraw.\n"
                f"Current balance: {user_data['balance']} MUSKY\n"
                f"Keep referring to earn more! 🚀"
            )

    return MAIN_MENU

async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Broadcast a message to all users. Only available to admin."""
    # Check if the user is admin
    if update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("⛔️ This command is only available to administrators.")
        return

    # If there's a photo and caption
    if update.message.photo:
        photo = update.message.photo[-1]  # Get the highest quality photo
        caption = update.message.caption or ""
        caption_entities = update.message.caption_entities
        
        # Get all users
        users = db.get_all_users()
        
        if not users:
            await update.message.reply_text("No users found in the database.")
            return

        # Initialize counters
        success_count = 0
        fail_count = 0
        
        # Send status message
        status_message = await update.message.reply_text(f"Broadcasting photo to {len(users)} users...")

        # Broadcast the photo
        for user in users:
            try:
                await context.bot.send_photo(
                    chat_id=user['user_id'],
                    photo=photo.file_id,
                    caption=f"📢 Broadcast Message:\n\n{caption}",
                    caption_entities=caption_entities,
                    parse_mode='HTML'
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send broadcast to {user['user_id']}: {str(e)}")
                fail_count += 1
            
            # Update status every 10 users
            if (success_count + fail_count) % 10 == 0:
                await status_message.edit_text(
                    f"Broadcasting: {success_count + fail_count}/{len(users)} users reached..."
                )

    # If it's a text message
    else:
        # Check if there's a message to broadcast
        if not context.args:
            await update.message.reply_text(
                "Please use one of these formats:\n\n"
                "1. For text: /broadcast <message>\n"
                "2. For formatted text: Use HTML formatting in your message\n"
                "3. For images: Send an image with caption and use /broadcast command\n\n"
                "HTML Formatting Examples:\n"
                "• Bold: <b>text</b>\n"
                "• Italic: <i>text</i>\n"
                "• Code: <code>text</code>\n"
                "• Link: <a href='URL'>text</a>"
            )
            return

        broadcast_message = " ".join(context.args)
        
        # Get all users
        users = db.get_all_users()
        
        if not users:
            await update.message.reply_text("No users found in the database.")
            return

        # Initialize counters
        success_count = 0
        fail_count = 0
        
        # Send status message
        status_message = await update.message.reply_text(f"Broadcasting message to {len(users)} users...")

        # Broadcast the message
        for user in users:
            try:
                await context.bot.send_message(
                    chat_id=user['user_id'],
                    text=f"📢 Broadcast Message:\n\n{broadcast_message}",
                    parse_mode='HTML',
                    entities=update.message.entities
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send broadcast to {user['user_id']}: {str(e)}")
                fail_count += 1
            
            # Update status every 10 users
            if (success_count + fail_count) % 10 == 0:
                await status_message.edit_text(
                    f"Broadcasting: {success_count + fail_count}/{len(users)} users reached..."
                )

    # Send final status
    await status_message.edit_text(
        f"✅ Broadcast completed!\n\n"
        f"Total users: {len(users)}\n"
        f"Successfully sent: {success_count}\n"
        f"Failed: {fail_count}"
    )

def get_countdown() -> str:
    """Get countdown to token launch."""
    remaining = LAUNCH_DATE - datetime.now()
    if remaining.total_seconds() <= 0:
        return "🚀 Launch time!"
    days = remaining.days
    hours = remaining.seconds // 3600
    minutes = (remaining.seconds % 3600) // 60
    return f"{days}d {hours}h {minutes}m"

def main() -> None:
    """Start the bot."""
    # Get the token from environment
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        raise ValueError("No token found! Make sure to set TELEGRAM_BOT_TOKEN in .env file")

    # Setup persistence
    persistence = PicklePersistence(filepath="bot_persistence")

    # Create application with persistence
    application = Application.builder().token(token).persistence(persistence).build()

    # Add conversation handler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            CHECKING_CHANNELS: [
                CallbackQueryHandler(check_channels, pattern="^continue$"),
            ],
            CHECKING_GROUP: [
                CallbackQueryHandler(check_channels, pattern="^continue$"),
            ],
            CHECKING_TWITTER: [
                CallbackQueryHandler(check_twitter, pattern="^continue$"),
            ],
            GETTING_SOLANA: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, get_solana),
            ],
            MAIN_MENU: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_menu),
            ],
        },
        fallbacks=[CommandHandler("start", start)],
        name="main_conversation",
        persistent=True,
        per_message=False,
        per_chat=True
    )

    # Add handlers
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler("broadcast", broadcast))

    # Start the bot
    print("🤖 Bot is starting...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()