# AraadhOS

A personal web operating system 
> Introduction-to-software project, built with a lot of help and encouragement from [Hack Club](https://hackclub.com).


---

## Live Demo


**[https://web-os-phi-six.vercel.app/](#)** 

---

## Screenshots

| Boot screen | Desktop |
| :---: | :---: |
| ![Boot screen](docs/screenshot-boot.png) | ![Desktop with dock and icons](docs/screenshot-desktop.png) |

| Terminal | Settings |
| :---: | :---: |
| ![Working terminal app](docs/screenshot-terminal.png) | ![Settings app with theming](docs/screenshot-settings.png) |

---

## Features

- **Boot sequence** — a terminal-style landing screen with a typing intro, a braille spinner, and a blinking ASCII mascot. Press `Enter` to power on.
- **Real window manager** — open, close, drag by the title bar, and click to focus (with rising z-index). Apps are single-instance and cascade so windows never stack perfectly on top of each other.
- **Dock** — frosted-glass dock with hover-lift, a click bounce, tooltips, and an indicator dot under every open app.
- **Desktop icons** — app shortcuts on the desktop surface; single-click to select, double-click to open.
- **Menu bar** — frosted-glass top bar with a live clock and date, plus quick launchers.
- **Persistent settings** — accent color, 12/24-hour clock, UI scale, and wallpaper, all saved to `localStorage` and restored on reload.

### Built-in apps

| App | What it does |
| --- | --- |
| **Terminal** | A working command interpreter (`help`, `ls`, `open`, `date`, `echo`, `clear`, and more). |
| **About Me** | Bio, skills, and links. |
| **Projects** | Terminal-style listing of projects with tech stacks and links. |
| **Files** | A small, functional file browser. |
| **Calculator** | A clean, working calculator. |
| **Notes** | An auto-saving notepad with a live word/character counter, backed by `localStorage`. |
| **Settings** | Live theming — accent color, clock format, UI scale, and wallpaper. |

---
---


---

## Credits
Built by [Araadh](https://github.com/Araadh3111) as an intro-to-software project, with thanks to [Hack Club](https://hackclub.com).
