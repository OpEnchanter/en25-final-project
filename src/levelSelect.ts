import * as Engine from "./lib/engine.ts"
import LevelSelectHTML from "/editor/levelSelect.html?raw"

export class Scene extends Engine.Scene {
    public override load(app: Engine.App): void {
        const parser = new DOMParser();
        document.body.querySelector(".content")?.appendChild(parser.parseFromString(LevelSelectHTML, "text/html").querySelector(".overlays") as Node)
        app.start(60);
    }
}