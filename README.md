# en25 final ~ Super Mr. Bennet

[Public Website](https://bennet.tgreenhagen.com) | [Itch.io](https://openchanter.itch.io/super-mr-bennet) | [Level Editor](https://bennet.tgreenhagen.com/editor/)

A web-based platformer game I am working on for my English class final project. It features a reinterpretation of the portion of Jane Austen's Pride and Prejudice in which Mr. Bennet searches for his daughter Lydia after she ran off with Mr. Wickham.

---

*Silly statistics :3*

![Test](https://hackatime.hackclub.com/api/v1/badge/U0ADGEN6745/OpEnchanter/en25-final-project)

---

>[!NOTE]
>There is a known issue with the level editor where if a level is to big upon entering playtest, the server will refuse to respond to the URL due to the level data being stored in the URL.

## Features
**Game**

The main game features 4 levels with some dialogue between the levels presented in a 3rd person, script-like format, and dialogue presented within the levels in a 1st person format. The levels get more difficult as the player progresses through the game and they include all of the distinct features implemented into the game.

**Level Editor**

The game also features a level editor, in which players can create their own custom levels using all of the features that are shown in the main levels of the game. In the level editor, players can import / export levels from the provided textbox as well as quickly open a window to immediately playtest levels.

## Controls
**Game**
- **W** -> Jump
- **A** -> Move Left
- **D** -> Move right
- **Space** -> Advance dialogue
- **Shift** -> Speed up dialogue on story dialogue pages

**Editor**
- **WASD** -> Move camera
- **Tab** -> Open editor tools
- **Left-Click** -> Place / select object
- **Drag** -> Move / resize object
- **R** -> Reset camera position to player spawn

**Game Debug**
- **Alt+R** -> Reset level & move player to last checkpoint
- **Alt+H** -> Show hitboxes
    - **Yellow Shape** -> Physical collider
    - **Green Shape** -> Trigger collider

## Frontend
This game is built for a web browser, for maximum compatability across platforms and devices, it uses a game engine built from the ground up specifically for this project featuring simple rectangular AABB collision and rigidbody physics built on the HTML `canvas` element.

## Backend
This project uses `Vite` to package all the typescript resources for a web browser.

**Simple Self-Hosting**
1. Clone the repository (`git clone https://github.com/OpEnchanter/en25-final-project.git`)
3. Change directory (`cd en25-final-project`)
2. Install dependencies (`bun install`)
3. Run the dev server   (`bun run dev` or `bun run dev -- --host` to expose server)

**Single-File Packaging**
1. Clone the repository (`git clone https://github.com/OpEnchanter/en25-final-project.git`)
3. Change directory (`cd en25-final-project`)
2. Install dependencies (`bun install`)
3. Run script (`./build.sh`)

---

Made with love :heart: