# en25 final ~ Super Mr. Bennet
[Public Website](https://bennet.tgreenhagen.com) | [Itch.io](https://openchanter.itch.io/super-mr-bennet) | [Level Editor](https://bennet.tgreenhagen.com/editor/)

A web-based platformer game I am working on for my English class final project. It features a reinterpretation of the portion of Jane Austen's Pride and Prejudice in which Mr. Bennet searches for his daughter Lydia after she ran off with Mr. Wickham.

---

*Silly statistics :3*

![Test](https://hackatime.hackclub.com/api/v1/badge/U0ADGEN6745/OpEnchanter/en25-final-project)

---

### Frontend
This game is built for a web browser, for maximum compatability across platforms and devices, it uses a game engine built from the ground up specifically for this project featuring simple rectangular AABB collision and rigidbody physics built on the HTML `canvas` element.

### Backend
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