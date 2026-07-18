# 🎮 GameVault

> **Your Games. One Vault.**

GameVault is a modern, high-performance desktop game launcher built with **Electron**, **React**, and **TypeScript**. It provides a beautiful game library experience inspired by modern gaming platforms while remaining lightweight, customizable, and controller-friendly.

> **Development note:** GameVault is currently being built with AI assistance.

---

## ✨ Features

### 🎮 Library Management

* Scan local game folders automatically
* Organize games in a modern library
* Search, sort, and filter games
* Favorites and custom collections
* Recently played games
* Playtime tracking

### 🖼️ Metadata & Artwork

* Game covers
* Hero banners
* Logos
* Screenshots
* Game descriptions
* Developer & publisher information
* Genres and release dates

### 🕹️ Big Picture Mode

* Full-screen console experience
* Controller-friendly navigation
* Focus-based UI
* Smooth animations
* Large, readable interface

### 🎯 Platform Support *(Planned)*

* Steam
* Epic Games
* GOG Galaxy
* EA App
* Ubisoft Connect
* Battle.net
* Xbox App
* Local executable games

### 🎲 Emulator Support *(Planned)*

* RetroArch
* PCSX2
* RPCS3
* Dolphin
* PPSSPP
* Cemu
* Ryujinx (or another actively maintained Switch emulator)
* DuckStation

---

# 🚀 Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Zustand

## Desktop

* Electron
* Electron Builder

## Backend

* Node.js
* SQLite
* better-sqlite3

## Development

* Git
* GitHub Actions
* ESLint
* Prettier

---

# 📂 Project Structure

```text
GameVault/
│
├── electron/
│   ├── main/
│   ├── preload/
│   ├── ipc/
│   ├── services/
│   ├── database/
│   ├── scanner/
│   ├── launcher/
│   └── utils/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── stores/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
│
├── assets/
├── docs/
├── public/
├── scripts/
└── package.json
```

---

# 🛣️ Roadmap

## Version 0.1

* [x] Electron setup
* [x] React + TypeScript
* [x] Tailwind CSS
* [x] SQLite integration
* [x] Basic application shell

## Version 0.2

* [x] Scan game folders
* [x] Import executable games
* [x] Store game data
* [ ] Launch games

## Version 0.3

* [ ] Metadata
* [ ] Artwork
* [x] Search
* [x] Filters
* [x] Collections

## Version 0.4

* [x] Big Picture Mode
* [x] Controller navigation
* [x] Focus management
* [x] Sound effects

## Version 0.5

### User Experience

* [x] Animated GameVault boot screen
* [x] Startup splash animation
* [x] Smooth application loading sequence
* [x] Improved transitions and UI animations

### User Profile

* [x] User profile
* [x] Profile avatar
* [x] Display name
* [x] Profile statistics

### Game Experience

* [x] Game details page
* [x] Hero artwork
* [x] Playtime tracking
* [x] Last played date
* [x] Recently played games
* [x] Continue Playing section

### Statistics

* [x] Total playtime
* [x] Most played games
* [x] Library statistics
* [x] Session timer

### Customization

* [x] Themes
* [x] Accent colors
* [x] Startup options
* [x] Library layout customization

### Performance

* [x] Faster startup
* [x] Artwork caching improvements
* [x] Database optimization
* [x] Background task optimization

## Version 1.0

* [ ] Steam integration
* [ ] Epic integration
* [ ] GOG integration
* [ ] Platform management
* [ ] Stable release

---

# 🎯 Goals

* Fast startup
* Lightweight memory usage
* Smooth performance on low-end PCs
* Modern UI
* Controller-first experience
* Cross-platform support
* Plugin-ready architecture

---

# 🧠 Design Principles

* Performance first
* Clean architecture
* Type-safe development
* Security by default
* Accessibility
* Modular components
* Scalable codebase

---

# 📸 Screenshots

> Coming soon.

---

# 🤝 Contributing

Contributions are welcome.

If you'd like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request.

Please follow the project's coding standards and keep pull requests focused.

---

# 📄 License

This project will be released under the **MIT License**.

---

# 👨‍💻 Author

**Sakthi Naveen**

Built with ❤️ using Electron, React, and TypeScript.

---

## ⭐ Vision

GameVault aims to become a modern desktop gaming hub that brings together games from multiple launchers and emulators into one fast, elegant, and controller-friendly experience.
