# Super Mr. Bennet

[Public Website](https://bennet.tgreenhagen.com) | [Itch.io](https://openchanter.itch.io/super-mr-bennet)

This is a web-based platformer based on Jane Austen's *Pride and Prejudice*! This game features a reimagination of the portion of pride and prejudice in which Mr. Bennet chases down his daughter Lydia after she ran off with Mr. Wickham. 

The game was originally based on Nintendo's *Super Mario Bros*, but has since diverged far from the original vision with many aspects and features being more similar to more modern games than the old retro style of *Super Mario Bros*.

## Features
**Game**

The main game features 4 levels with some dialogue between the levels presented in a 3rd person, script-like format, and dialogue presented within the levels in a 1st person format. The levels get more difficult as the player progresses through the game and they include all of the distinct features implemented into the game.

**Level Editor**

The game also features a level editor, in which players can create their own custom levels using all of the features that are shown in the main levels of the game. In the level editor, players can import / export levels from the provided textbox as well as quickly open the level they are currently owkring on to playtest it.

The level editor can be accessed through the main menu via the `Editor` button or through any level via the `Edit Level` button in the pause menu. Opening the level editor from a level automatically loads the layout of that level into the editor where it can be used to learn the level editor, as the base for a new level, or to just have fun messing around with the level editor.

## Controls
**Game**
- **W** -> Jump
- **A** -> Move Left
- **D** -> Move right
- **Space** -> Advance dialogue
- **Shift** -> Speed up dialogue on story dialogue pages
- **Escape** -> Open pause menu

**Editor**
- **WASD** -> Move camera
- **Tab** -> Open editor tools
- **Left-Click** -> Place / select object
- **Drag** -> Move / resize object (Resizing requires dragging on the purple dot)
- **R** -> Reset camera position to player spawn

**Game Debug**
- **Alt+R** -> Reset level & move player to last checkpoint
- **Alt+H** -> Show hitboxes
    - **Yellow Shape** -> Physical collider
    - **Green Shape** -> Trigger collider

## Frontend
This game is built for a web browser, for maximum compatability across platforms and devices, it uses a game engine built from the ground up specifically for this project featuring simple rectangular AABB collision and rigidbody physics built on the HTML `canvas` element.

This project uses `Typescript` and `Bun` with `Vite` to package all the typescript resources and art to be loaded and create a playable game in any modern web browser.

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

## Backend
Currently there is no long-running backend implemented in this project. **However**, a user-made level sharing system is planned for a future version.


---

*Silly statistics :3*

![Hackatime Badge](https://hackatime.hackclub.com/api/v1/badge/U0ADGEN6745/OpEnchanter/en25-final-project)

---

Made with love :heart: