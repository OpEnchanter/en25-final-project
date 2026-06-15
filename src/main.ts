import { registerSW } from "virtual:pwa-register";
import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

// Install the service worker that precaches assets for instant repeat loads.
registerSW({ immediate: true });

import * as Game from "./game.ts";
import * as Editor from "./editor.ts";
import * as Title from "./title.ts";

console.log(`
${chalk.bold("Debug Keybinds")}
${chalk.italic("ALT+H")} | Show Hitboxes
${chalk.italic("ALT+R")} | Reset
`)

const sceneManager = new Engine.SceneManager();
const app: Engine.App = new Engine.App(sceneManager, {
    downscaleFactor: 4*(window.innerHeight / 665)
})

sceneManager.addScene(new Game.Scene(), "game");
sceneManager.addScene(new Editor.Scene(), "editor");
sceneManager.addScene(new Title.Scene(), "title");

sceneManager.loadScene("title", app);