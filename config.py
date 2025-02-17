from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Bot Configuration
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
ADMIN_ID = os.getenv('ADMIN_ID')

# Channel and Group Links
CHANNELS = {
    "musky": "-1002251074450",  # @musky_on_sol
    "airdrop": "-1002498998240"  # @Airdrop_Saggitarus
}

# Group Chat
GROUP_LINK = "@MUSKY_GROUPCHAT"

# Social Media
TWITTER_LINK = "https://x.com/Musky_On_solana"

# Token Configuration
INITIAL_BALANCE = 1000
REFERRAL_BONUS = 2000
MINIMUM_WITHDRAW = 7000

# Launch Date (10 days from now)
LAUNCH_DATE = datetime.now() + timedelta(days=10)

# Messages
WELCOME_MSG = """
🌟 Welcome to MUSKY Token Airdrop! 🌟

🚀 Get ready for an exciting journey into the MUSKY ecosystem!
💰 Start with {initial} MUSKY tokens
🎁 Earn {bonus} MUSKY for each referral

Required Steps:
1️⃣ Join our channels:
   • @musky_on_sol
   • @Airdrop_Saggitarus
   • Join @MUSKY_GROUPCHAT
   • Type 'MUSKY TO MOON' in the group

Use the menu buttons below to:
👥 Share your referral link
💰 Check your balance
ℹ️ Learn about MUSKY
💸 Withdraw tokens

Let's get started! 🎉
"""

ABOUT_MSG = """
ℹ️ About MUSKY Token ℹ️

🚀 MUSKY is the next generation community-driven token
💫 Built on Solana for lightning-fast transactions
🌐 Powering the future of decentralized finance

📊 Tokenomics:
• Total Supply: 1,000,000,000 MUSKY
• Airdrop: 10%
• Liquidity: 40%
• Development: 20%
• Marketing: 20%
• Team: 10%

🔒 Contract will be audited by CertiK
"""