Project Overview
This Telegram Mini App already exists and is functional. The goal is to add a new section: a fully working roulette wheel game where users can:

Place bets using their MUSKY token balance.
Use virtual chips to represent their bets.
Spin the wheel and receive payouts based on standard roulette rules.
Experience a seamless, error-free gameplay loop.
The app should integrate with the existing Telegram Mini App framework, leveraging JavaScript for the frontend and communicating with a backend (if already present) or a mock system for token balance management.

Objectives
Create a Roulette Wheel UI: A visually appealing, interactive roulette wheel that spins and lands on a random number/color.
Integrate MUSKY Token Balance: Display the user's current MUSKY token balance and allow them to bet using this balance.
Chip-Based Betting System: Provide chips of varying denominations (e.g., 1, 5, 10, 50 MUSKY) for users to place bets on the roulette table.
Game Logic: Implement standard roulette rules (e.g., single number, red/black, odd/even bets) with appropriate payouts.
Error Handling: Ensure the system prevents invalid bets (e.g., betting more than the available balance) and provides clear feedback.
Telegram Integration: Use Telegram's Web App API to enhance the user experience (e.g., theme syncing, button interactions).
Technical Requirements
Language: JavaScript (with HTML/CSS for the UI).
Framework: Use vanilla JS or a lightweight library like React if already part of the app.
Telegram Web App API: Leverage Telegram.WebApp for theme settings, user data, and interactions (e.g., main button for spinning).
Backend (Optional): If a backend exists, it should handle MUSKY token balance updates and bet validation. If not, use a mock local storage system for prototyping.
Randomness: Use a cryptographically secure random number generator (e.g., crypto.getRandomValues) for fairness.
Testing: Ensure the wheel works on both desktop and mobile Telegram clients without errors.
Roulette Wheel Features
1. UI Components

Roulette Wheel: An animated wheel with 37 slots (0-36, European style) showing numbers and colors (red, black, green for 0).
Betting Table: A grid where users can place chips on:
Single numbers (0-36).
Red or black.
Odd or even.
High (19-36) or low (1-18).
Dozens (1-12, 13-24, 25-36).
Chips: Clickable buttons for chip denominations (e.g., 1, 5, 10, 50 MUSKY).
Balance Display: Shows the user's current MUSKY token balance.
Spin Button: Triggers the wheel animation and resolves the bet (e.g., Telegram’s MainButton).
2. Game Flow

Start: User sees their MUSKY balance and selects a chip denomination.
Place Bets: User clicks on the betting table to place chips (multiple bets allowed).
Validation: System checks if total bet ≤ MUSKY balance; if not, show an error ("Insufficient balance").
Spin: User presses the "Spin" button, wheel animates, and lands on a random slot.
Result: Calculate winnings based on bet types and payouts (e.g., 35:1 for single number, 1:1 for red/black).
Update Balance: Add winnings or deduct losses from the MUSKY balance.
Reset: Clear the table for the next round.
3. Payout Rules

Single number: 35:1
Red/Black: 1:1
Odd/Even: 1:1
High/Low: 1:1
Dozens: 2:1
Implementation Steps
Step 1: Setup the Roulette Wheel

Use a canvas or CSS animations to create a spinning wheel with 37 slots.
Assign each slot a number (0-36) and color (red/black/green).
Implement a spin animation that slows down and stops on a random slot using Math.random() or crypto.getRandomValues.
Step 2: Build the Betting Table

Create a grid layout mimicking a roulette table.
Add event listeners to allow users to place chips by clicking.
Track bets in an object (e.g., { "single_5": 10, "red": 5 } for 10 MUSKY on number 5 and 5 MUSKY on red).
Step 3: Integrate MUSKY Token Balance

Fetch the user’s MUSKY balance from local storage (mock) or backend API.
Display it in the UI (e.g., "Balance: 100 MUSKY").
Update balance after each spin based on wins/losses.
Step 4: Chip System

Provide chip buttons (1, 5, 10, 50 MUSKY).
Highlight the selected chip and deduct its value from the balance when placed on the table.
Allow users to remove bets before spinning.
Step 5: Game Logic and Validation

Before spinning, verify total bet ≤ balance.
After spinning, calculate winnings based on the landed slot and bet types.
Handle edge cases (e.g., no bets placed, invalid inputs).
Step 6: Telegram Enhancements

Use Telegram.WebApp.ready() to initialize the app.
Sync UI colors with Telegram.WebApp.themeParams.
Replace the "Spin" button with Telegram.WebApp.MainButton:
javascript
Wrap
Copy
Telegram.WebApp.MainButton.setText("Spin").show().onClick(spinWheel);
Step 7: Error Handling

Show alerts (e.g., Telegram.WebApp.showAlert("Insufficient balance")) for:
Betting more than the balance.
Attempting to spin without bets.
Log errors to the console for debugging.

Assets Needed
Wheel Graphic: A PNG/SVG of a roulette wheel with 37 slots.
Chip Icons: Images for 100 , 500 , 1000, 5000 MUSKY chips. 
Table Layout: A CSS grid or image mimicking a roulette betting table.
Testing Checklist
 Wheel spins and stops on a random slot.
 Bets deduct from MUSKY balance correctly.
 Winnings are calculated and added accurately.
 Errors are caught and displayed (e.g., insufficient balance).
 Works on both mobile and desktop Telegram clients.
 No console errors during gameplay.
Notes
Replace mock balance with real backend integration if available.
Ensure animations are smooth and don’t lag on low-end devices.