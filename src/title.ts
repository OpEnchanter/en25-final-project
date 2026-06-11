import * as Engine from "./lib/engine.ts"

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

export class Scene extends Engine.Scene {
    private intervalId: any = undefined;
    public override load(mainApp: Engine.App): void {
        app = mainApp;

        this.intervalId = setInterval(() => {
            if (!app) return;
            app.options.downscaleFactor = 4 * (window.innerHeight / 665)
        }, 500)

        app.addObject(new Engine.GameObjectBuilder(app)
            .addComponent(new Menu)
            .build())

        app.start(60);
    }

    public override unload(): void {
        clearInterval(this.intervalId);
    }
}