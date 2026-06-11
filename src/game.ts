import * as Engine from "./lib/engine.ts";
import { loadWorldFromJson, TextBox, CloudRenderer, PlayerHealthController, type SerializedWorld, type DynamicObjectInputs } from "./lib/worldLoader.ts";

import data from "./data/data.json"

let textBox: TextBox | undefined = undefined;
let player: Engine.GameObject;
let camera: Engine.GameObject;
let playerTransform: Engine.Transform;

let levelIndex = 0;
let playerSpawnPosition = { x: -64, y: -24 };

class CameraController extends Engine.ComponentBase {
    playerTransform: Engine.Transform | null = null;
    transform: Engine.Transform | null = null;

    constructor(playerTransform: Engine.Transform) {
        super()
        this.playerTransform = playerTransform;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.playerTransform || !this.transform || !this.object) return;
        this.transform.position.x += (this.playerTransform.position.x - this.transform.position.x) / 4
        this.transform.position.y += (Math.min(this.playerTransform.position.y, -(this.object.app.viewportScale.y / 2) + 12) - this.transform.position.y) / 16
    }
}

class PlayerAnimator extends Engine.ComponentBase {
    private sprite: Engine.Sprite | null = null
    private rigidbody: Engine.Rigidbody | null = null;
    private transform: Engine.Transform | null = null;

    standingSprite: any = new window.Image();
    jumpingSprite: any = new window.Image();
    fallingSprite: any = new window.Image();
    runAnimation: Array<HTMLImageElement> = [];

    idx: number = 0;
    override onInitialized(): void {
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.rigidbody = this.object?.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;

        this.standingSprite.src = "assets/bennet/standing.png"
        this.jumpingSprite.src = "assets/bennet/animation/jump/jump.png"
        this.fallingSprite.src = "assets/bennet/animation/jump/fall.png"

        this.runAnimation.push((() => { let im = new window.Image(); im.src = "assets/bennet/animation/run/1.png"; return im })())
        this.runAnimation.push((() => { let im = new window.Image(); im.src = "assets/bennet/animation/run/2.png"; return im })())
    }

    override onUpdate(): void {
        if (!this.sprite || !this.rigidbody || !this.transform) return
        if (Math.abs(this.rigidbody.velocity.x) > 0.2) {
            this.sprite.texture = this.runAnimation[(Math.floor(this.idx) % this.runAnimation.length)];
            this.idx += Math.abs(this.rigidbody.velocity.x / 20);
            if (this.rigidbody.velocity.x < 0.1) {
                this.transform.scale.x = -12
            } else {
                this.transform.scale.x = 12
            }
        } else {
            this.sprite.texture = this.standingSprite;
            this.idx = 0;
        }

        if (this.rigidbody.velocity.y < 0) {
            this.sprite.texture = this.jumpingSprite;
        } else if (this.rigidbody.velocity.y > 0.1) {
            this.sprite.texture = this.fallingSprite;
        }
    }
}

class Backdrop extends Engine.ComponentBase {
    tile: HTMLImageElement;

    constructor(tileName: string) {
        super();
        this.tile = new window.Image();
        this.tile.src = `assets/tiles/${tileName}.png`
    }

    override onLateUpdate(): void {
        if (!app) return
        const sx = Math.floor(app.renderingClippingPlane.position.x / 16) * 16 - app.renderingClippingPlane.position.x;
        const sy = Math.floor(app.renderingClippingPlane.position.y / 16) * 16 - app.renderingClippingPlane.position.y;
        for (let x = 0; x < Math.floor(app.renderingClippingPlane.scale.x / 16) + 3; x++) {
            for (let y = 0; y < Math.floor(app.renderingClippingPlane.scale.y / 16) + 3; y++) {
                Engine.draw(app.ctx, this.tile, 0, { x: Math.floor(sx + ((x - 1) * 16)), y: Math.floor(sy + ((y - 1) * 16)) }, { x: 16, y: 16 })
            }
        }
    }
}

class PauseMenu extends Engine.ComponentBase {
    private menuOpen = false;
    private t: number = 0;

    private buttons: Record<string, ()=>void> = {
        "Edit Level": ()=>{console.log(JSON.stringify(levels[levelIndex])); localStorage.setItem("playtestMap", JSON.stringify([levels[levelIndex]])); app?.sceneManager.loadScene("editor", app);},
        "Quit": ()=>{app?.sceneManager.loadScene("title", app)}
    }

    private mPos: Engine.vector = {x:0, y:0};

    private ht: number = 0;
    private oldHovered: boolean = false;

    private mouseDown = false;

    override onInitialized(): void {
        document.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() == "escape") {
                this.menuOpen = !this.menuOpen;
                this.t = 0;
            }
        }, {signal: app?.abortSignal})

        document.addEventListener("mousemove", (e) => {
            if (!app || !app.options.downscaleFactor) return
            this.mPos.x = e.clientX / app.options.downscaleFactor
            this.mPos.y = e.clientY / app.options.downscaleFactor
        }, {signal: app?.abortSignal});

        document.addEventListener("mousedown", (e) => {
            this.mouseDown = true;
        }, {signal: app?.abortSignal})

        document.addEventListener("mouseup", (e) => {
            this.mouseDown = false;
        }, {signal: app?.abortSignal})
    }

    override onLateRender(): void {
        if (!app || !app.ctx) return
        const gradient = app.ctx.createLinearGradient(0, 0, 200, 0)
        gradient.addColorStop(0, "#000000ab")
        gradient.addColorStop(0.5, "transparent")

        const bgCurve = this.menuOpen ? -(1/2**((this.t-6.643))) : (1/2**((this.t-6.643))) - 100

        app.ctx.fillStyle = gradient
        app.ctx.fillRect(bgCurve, 0, 100, app.viewportScale.y)

        let anyIsHovered = false;

        app.ctx.font = "7px 'PressStart2P'"

        for (let i = 0; i < Object.keys(this.buttons).length; i++) {
            const btnCurve = this.menuOpen ? 1/2**((this.t-7.228-(i*3))) : ((-1/2)**(this.t-7.228-(i*3))) - 150
            const bPos = {x: 10-btnCurve, y:10+16*i}
            const bScale = {x: 80, y: 10}
            let isHovered = (this.mPos.x > bPos.x && this.mPos.y > bPos.y) &&
                (this.mPos.x < bPos.x + bScale.x && this.mPos.y < bPos.y + bScale.y)

            anyIsHovered = isHovered ? true : anyIsHovered;

            if (isHovered && this.mouseDown) {
                Object.values(this.buttons)[i]()
            }

            // Render
            if (isHovered) {
                const gradient = app.ctx.createLinearGradient(bPos.x+40-(Math.sin(this.t/40)*100), bPos.y+5, 1, 0)
                gradient.addColorStop(0, "#0095e9")
                gradient.addColorStop(0.5, "#124e89")
                app.ctx.fillStyle = gradient
                app.ctx.beginPath()
                app.ctx.roundRect(bPos.x-1, bPos.y-1, bScale.x+2, bScale.y+2, 3)
                app.ctx.fill()
            }

            app.ctx.fillStyle = isHovered ? "#5a6988" : "#8b9bb4"
            app.ctx.beginPath()
            app.ctx.roundRect(bPos.x, bPos.y, bScale.x, bScale.y, 2)
            app.ctx.fill()

            app.ctx.fillStyle = isHovered ? "#b0c3e2" : "#1c212b"
            app.ctx.fillText(Object.keys(this.buttons)[i] as string, bPos.x + 4, bPos.y + 10)

            this.oldHovered = isHovered ? true : this.oldHovered
        }

        document.body.style.cursor = anyIsHovered ? "pointer" : "default"

        this.t++;
    }
}

let app: Engine.App | undefined = undefined;
let levels: Array<SerializedWorld> = data.levels as Array<SerializedWorld>

function startLevelLoad() {
    if (!app) return;
    app.objects = [];

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    if (urlParams.get("playtest") == "true") {
        if (urlParams.get("map")) {
            const uriLevelData = JSON.parse(decodeURIComponent(urlParams.get("map") as string))
            levels = uriLevelData
        } else if (localStorage.getItem("playtestMap")) {
            const localStorageLevelData = JSON.parse(localStorage.getItem("playtestMap") as string)
            levels = localStorageLevelData
        }
    } else if (localStorage.getItem("campaignLevelIndex")) {
        levelIndex = parseInt(localStorage.getItem("campaignLevelIndex") as string)
    }

    const worldJson = levels[levelIndex]

    document.title = urlParams.get("map") ? "Custom Map" : "Campaign"

    player = new Engine.GameObjectBuilder(app)
        .addComponent(new Engine.Sprite("assets/mario.png"))
        .addComponent(new Engine.Renderer(app.ctx))
        .addComponent(new Engine.Transform(playerSpawnPosition, 0, { x: 12, y: 16 }))
        .addComponent(new Engine.BoxCollider({ x: 14, y: 14 }, { x: -0.5, y: 0 }, true))
        .addComponent(new Engine.BoxCollider({ x: 12, y: 16 }, { x: 0, y: 0 }, false))
        .addComponent(new PlayerAnimator())
        .addComponent(new Engine.Rigidbody({
            bounciness: 0,
            friction: 0.93,
            drag: 0.98,
            density: 1
        }))
        .addComponent(new Engine.PlayerController())
        .addComponent(new PlayerHealthController(playerSpawnPosition))
        .build()

    playerTransform = player.getComponents(Engine.Transform)[0] as Engine.Transform;

    const textBoxObject = new Engine.GameObjectBuilder(app)
        .addComponent(new TextBox())
        .build();

    textBox = textBoxObject.getComponents(TextBox)[0] as TextBox;

    camera = new Engine.GameObjectBuilder(app)
        .addComponent(new Engine.Transform({ x: -64, y: -512 }, 0, { x: 0, y: 0 }))
        .addComponent(new Engine.Camera())
        .addComponent(new CameraController(playerTransform))
        .build()

    if (worldJson?.levelOptions) {
        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new Backdrop(worldJson.levelOptions.background))
            .build())
    } else {
        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new CloudRenderer(camera))
            .build())
    }

    loadWorldFromJson(worldJson as SerializedWorld, app, 16, {
        textBox,

        player,
        playerTransform,
        playerSpawnPosition,

        levelIndex,

        levelLoadCallback: startLevelLoad
    } as DynamicObjectInputs)

    app.addObject(camera)

    app.addObject(player)

    app.addObject(textBoxObject);

    app.addObject(new Engine.GameObjectBuilder(app)
        .addComponent(new PauseMenu())
        .build())
}



export class Scene extends Engine.Scene {
    intervalId: any | undefined = undefined;
    override load(mainApp: Engine.App): void {
        app = mainApp;
        this.intervalId = setInterval(() => {
            if (!app) return;
            app.options.downscaleFactor = 4 * (window.innerHeight / 665)
        }, 500)

        startLevelLoad();

        document.body.addEventListener("keydown", (e) => {
            if (e.key === "r" && e.altKey) {
                if (!app) return;
                app.stop();
                startLevelLoad();
                app.start(60);
            }
        }, {signal: app?.abortSignal})

        app.start(60);
    }

    override unload() {
        clearInterval(this.intervalId);
    }
}