import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

import * as Game from "./game.ts";
import * as Editor from "./editor.ts";
import * as Title from "./title.ts";

// Overwrite setInterval to cache ids

console.log(chalk.black(`
┌-------------------------------------------------------┐
|                    ${chalk.bold("Super Mr. Bennet")}                   |
|           ${chalk.italic("By Nathan Le and Tristan Greenhagen")}         |
└-------------------------------------------------------┘
`));

console.log(chalk.italic("Based on works by Nintendo and Jane Austen"))

console.log(`
${chalk.bold("Debug Keybinds")}
${chalk.italic("alt+g")} | Show Hitboxes
`)

const sceneManager = new Engine.SceneManager();
const app: Engine.App = new Engine.App(sceneManager, {
    downscaleFactor: 4*(window.innerHeight / 665)
})

sceneManager.addScene(new Game.Scene(), "game");
sceneManager.addScene(new Editor.Scene(), "editor");
sceneManager.addScene(new Title.Scene(), "title");

sceneManager.loadScene("title", app);