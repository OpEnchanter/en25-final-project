import * as Engine from "./lib/engine.ts"
import * as Game from "./game.ts";
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import { loadWorldFromJson, type SerializedWorld } from "./lib/worldLoader.ts";

let app: Engine.App | undefined = undefined

function exitPlaytestMode() {
    const url = new URL(window.location.href);
    url.searchParams.delete("playtest", "true");
    window.history.pushState(null, '', url);
}

class Menu extends Engine.ComponentBase {
    private menuOpen = true;
    private t: number = 0;

    private buttons: Record<string, ()=>void> = {
        "New Game": ()=>{exitPlaytestMode(); localStorage.setItem("campaignLevelIndex", "0"); app?.sceneManager.loadScene("game", app)},
        "Continue": ()=>{exitPlaytestMode(); app?.sceneManager.loadScene("game", app)},
        "Editor": ()=>{exitPlaytestMode(); app?.sceneManager.loadScene("editor", app)},
    }

    private mPos: Engine.vector = {x:0, y:0};

    private ht: number = 0;
    private oldHovered: boolean = false;

    private mouseDown = false;

    override onInitialized(): void {
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

        app.ctx.fillStyle = gradient
        app.ctx.fillRect(0, 0, 100, app.viewportScale.y)

        let anyIsHovered = false;

        app.ctx.font = "600 11px 'Times New Roman'"

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
            app.ctx.fillText(Object.keys(this.buttons)[i] as string, bPos.x + 4, bPos.y + 9)

            this.oldHovered = isHovered ? true : this.oldHovered
        }

        document.body.style.cursor = anyIsHovered ? "pointer" : "default"

        this.t++;
    }
}

class Title extends Engine.ComponentBase {
    private t: number = 0;
    private transform: Engine.Transform | undefined = undefined;

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform
    }

    override onUpdate(): void {
        if (!this.transform) return
        this.transform.rotation = (Math.sin(this.t / 96 + Math.PI/3) * 2)
        this.t++;
    }
}

export class CloudRenderer extends Engine.ComponentBase {
    noise2D: NoiseFunction2D = createNoise2D();

    lowerBound = 0.6;
    resolutionDivisor = 8

    cameraTransform: Engine.Transform | undefined;

    t = 0;

    override onInitialized(): void {
        if (camera)
        this.cameraTransform = camera.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!app || !app.ctx || !this.cameraTransform) return
        app.ctx.fillStyle = "#ffffff2f";
        const cp = app.renderingClippingPlane.position;
        for (let x = 0; x < Math.floor(app.viewportScale.x / this.resolutionDivisor); x++) {
            for (let y = 0; y < Math.floor(app.viewportScale.y / this.resolutionDivisor); y++) {
                let td = (y / Math.floor((60 / this.resolutionDivisor)))
                if (y * this.resolutionDivisor > 60) td = 0;
                let nval =
                    Math.max((this.noise2D((((x + this.t / 32) + cp.x / 32) * 0.05), ((y) * 0.05)) + 1) / 2 - this.lowerBound, 0)
                    * ((td ** 2) * 8)
                    ;

                const cc = 200 + td * 55
                app.ctx.fillStyle = `rgba(${cc},${cc},${cc},${nval / 4})`
                app.ctx.beginPath();
                app.ctx.arc(
                    x * this.resolutionDivisor,
                    y * this.resolutionDivisor - cp.y - 100,
                    (nval) * 8,
                    0, 2 * Math.PI);
                app.ctx.fill();
            }
        }
        this.t++;
    }
}

let camera: Engine.GameObject | undefined = undefined;

export class Scene extends Engine.Scene {
    private intervalId: any = undefined;
    public override load(mainApp: Engine.App): void {
        app = mainApp;

        this.intervalId = setInterval(() => {
            if (!app) return;
            app.options.downscaleFactor = 4 * (window.innerHeight / 665)
        }, 500)

        const world: SerializedWorld = {"staticObjects":[{"objectId":"stone_brick_grass","areaStartPos":{"x":-13,"y":0},"areaScale":{"x":19,"y":2},"hasCollision":true},{"objectId":"stone-bricks/stone-bricks","areaStartPos":{"x":-13,"y":-13},"areaScale":{"x":7,"y":15},"hasCollision":true},{"objectId":"stone_brick_grass","areaStartPos":{"x":1,"y":-2},"areaScale":{"x":5,"y":3},"hasCollision":true},{"objectId":"stone_brick_grass","areaStartPos":{"x":3,"y":-6},"areaScale":{"x":3,"y":6},"hasCollision":true},{"objectId":"stone_brick_grass","areaStartPos":{"x":4,"y":-12},"areaScale":{"x":2,"y":7},"hasCollision":true},{"objectId":"stone_brick_grass","areaStartPos":{"x":-6,"y":-1},"areaScale":{"x":2,"y":2},"hasCollision":true}],"dynamicObjects":[{"objectId":"lucky_block","position":{"x":-1,"y":-3},"objectData":{"contents":""}},{"objectId":"flower_red","position":{"x":-5,"y":-2},"objectData":{}},{"objectId":"flower_blue","position":{"x":3,"y":-7},"objectData":{}}]}
        loadWorldFromJson(world, mainApp, 16, {})

        camera = new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:-64, y:-72}, 0, {x:0, y:0}))
            .addComponent(new Engine.Camera())
            .build()

        app.addObject(camera)

        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new CloudRenderer())
            .build())

        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new Menu())
            .build())

        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:-32, y:-116}, 0, {x:128, y:64}))
            .addComponent(new Engine.Sprite("/assets/tiles/title.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Title())
            .build())

        app.start(60);
    }

    public override unload(): void {
        clearInterval(this.intervalId);
    }
}