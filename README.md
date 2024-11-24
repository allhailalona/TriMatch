<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" height="30" />
  <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" height="30" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" height="30" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" height="30" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" height="30" />
  <img src="https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white" height="30" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" height="30" />
</div>
<br />

DISCLAIMER:
This game (Trimatch) is a portfolio project implementation inspired by SET®, which is owned and copyrighted by Set Enterprises, Inc. This is a non-commercial, educational project with no monetization (no ads, no in-app purchases). While the game mechanics and styling closely follow the original SET® game, it's created solely for demonstrating programming capabilities in my portfolio. The project maintains a deliberately limited user base and is not being advertised or distributed commercially.
If you are the rights holder and have any concerns, please contact me at lotanbar3@gmail.com.

<div align="center">
  <img src="./assets/output.gif" alt="Description of GIF" />
</div>


# TriMatch - Full Stack Memory Game
Hey there! 👋 Trimatch is a pattern-matching puzzle where you spot unique combinations of shapes and colors. Explore the game's features in this full-stack implementation

**<div align="center">🔨 Looking for contributors. Check open issues below or create a new one. Contact me at lotanbar3@gmail.com 🔨</div>**

**<div align="center">To run app in Dev mode use npm i and npm run dev/server - A docker-compose up is under construction</div>**

## Features
✅ Full responsive UI/UX design
✅ Game core mechanics & logic
✅ Real-time game updates
✅ Error handling & logging
✅ Mobile (Expo) & Web (Vue) support
🚧 Camera-based SET detection with AI (coming soon)
🚧 Multiplayer rooms (coming soon)

APK is currently unavailable, Expo version can be accessed via an android emulator with Expo Go

## Future Enhancements:
  - 🔍 Custom Express Request Types: Incomplete integration with middleware. Will finalize for type safety and cleaner API handling.
  - ⚠️ Security vulnerability: Stats validation relies on front-end state instead of server-side validation
  - 🔧 Inconsistent state management: Mixed usage of Pinia and provide/inject patterns should be consolidated
  - ⏱️ Timer/Stopwatch in Active Board: UX-related issue. Not prioritized due to time and energy constraints.

## Production mode limitations -  Fully functional in Development mode
  - 🔒 Google Auth redirect URIs not properly configured in Google Cloud Console
  - 📧 Email OTP service pending due to email provider cost constraints
  - 🛠️ Build Config: eas-cli entry point issue. Needs config fixes.









