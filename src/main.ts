import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

import tiledata from "./assets/tiles/tiledata.json"

let textBox: TextBox | undefined = undefined;
let player: Engine.GameObject;
let playerTransform: Engine.Transform;

const dynamicObjectFunctions: Record<string, (position: Engine.vector, tileScale: number, objectData: any)=>Engine.GameObject> = {
    "sign": (position: Engine.vector, tileScale: number, objectData: any)=>{
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/props/sign.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .build())
    },
    "flower_red": (position: Engine.vector, tileScale: number, objectData: any)=>{
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/props/flower-red.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .build())
    },
    "flower_blue": (position: Engine.vector, tileScale: number, objectData: any)=>{
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/props/flower-blue.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .build())
    },
    "lucky_block": (position: Engine.vector, tileScale: number, objectData: any)=>{
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/lucky.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Engine.BoxCollider({x: 16, y: 16}, {x:0, y:0}, false))
            .addComponent(new Engine.BoxCollider({x: 4, y: 8}, {x:0, y:8}, true))
            .addComponent(new LuckyBlock(objectData))
            .build())
    },
    "title": (position: Engine.vector, tileScale: number, objectData: any) => {
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:16*tileScale, y:8*tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/title.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .build())
    },
    "text_trigger": (position: Engine.vector, tileScale: number, objectData: any) => {
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new TextTrigger(textBox as TextBox, playerTransform, objectData.text))
            .build())
    },
    "checkpoint": (position: Engine.vector, tileScale: number, objectData: any) => {
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/flag/1.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Checkpoint())
            .build())
    },
    "next_level_trigger": (position: Engine.vector, tileScale: number, objectData: any) => {
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new NextLevelTrigger())
            .build())
    },
};

type StaticObject = {
    objectId: string,
    areaStartPos: Engine.vector,
    areaScale: Engine.vector,
    hasCollision: boolean
}

type DynamicObject = {
    objectId: string,
    position: Engine.vector,
    objectData: Record<string, string>
}

type SerializedWorld = {
    staticObjects: Array<StaticObject>
    dynamicObjects: Array<DynamicObject>
}

class CameraController extends Engine.ComponentBase {
    playerTransform: Engine.Transform | null = null;
    transform: Engine.Transform | null = null;

    constructor (playerTransform: Engine.Transform) {
        super()
        this.playerTransform = playerTransform;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.playerTransform || !this.transform) return;
        this.transform.position.x += (this.playerTransform.position.x - this.transform.position.x) / 4
        this.transform.position.y += (Math.min(this.playerTransform.position.y, -(app.viewportScale.y/2) + 12) - this.transform.position.y) / 16
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

        this.standingSprite.src = "/src/assets/bennet/standing.png"
        this.jumpingSprite.src = "/src/assets/bennet/animation/jump/jump.png"
        this.fallingSprite.src = "/src/assets/bennet/animation/jump/fall.png"

        this.runAnimation.push((() => {let im = new window.Image(); im.src = "/src/assets/bennet/animation/run/1.png"; return im})())
        this.runAnimation.push((() => {let im = new window.Image(); im.src = "/src/assets/bennet/animation/run/2.png"; return im})())
    }

    override onLateUpdate(): void {
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

class LuckyBlock extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;
    sprite: Engine.Sprite | null = null;
    triggered: boolean = false;
    startPos: Engine.vector = {x:0, y:0};
    tick: number = 0;

    contents: any;

    constructor(data: any) {
        super();
        this.contents = data.contents;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.startPos = {x:this.transform.position.x, y:this.transform.position.y}
    }

    override onUpdate(): void {
        if (this.triggered && this.transform) {
            this.transform.position.y = this.startPos.y - Math.max(0.05 * (-this.tick * (this.tick - 25)), 0)
            this.tick++;
        }
    }

    override onTriggerEnter(params: Engine.TriggerData): void {
        if (!this.transform || !this.sprite) return
        if (!this.triggered) {
            this.triggered = true
            this.sprite.texture.src = "/src/assets/tiles/lucky-consumed.png"
            app.addObject(dynamicObjectFunctions[this.contents]({x:this.transform.position.x / 16, y:this.transform.position.y / 16 - 1}, 16, {contents:""}));
        }
    }
}

class PlayerHeathController extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.transform) return
        if (this.transform.position.y > 96) {
            playerTransform.position.x = playerSpawnPosition.x;
            playerTransform.position.y = playerSpawnPosition.y - 1;
            (player.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody).velocity = {x:0, y:-2}
        }
    }
}

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + " ";
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(currentLine, x, y);
            currentLine = words[i] + " ";
            y += lineHeight;          
        } else {
            currentLine = testLine;
        }
    }
    
    ctx.fillText(currentLine, x, y);
}

class TextTrigger extends Engine.ComponentBase {
    textBox: TextBox;
    tracked: Engine.Transform;

    transform: Engine.Transform | undefined = undefined;

    triggered: boolean = false;
    triggeredOld: boolean = false;

    text: string;
    constructor (textBox: TextBox, trackedTransform: Engine.Transform, text: string) {
        super()
        this.textBox = textBox;
        this.tracked = trackedTransform;
        this.text = text;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.transform || !this.tracked) return
        if (this.transform.position.x < this.tracked.position.x) {
            this.triggered = true;
        }

        if (this.triggered && !this.triggeredOld) {
            this.textBox.setPages(this.text.split("\\"))
        }

        this.triggeredOld = this.triggered;
    }
}

class TextBox extends Engine.ComponentBase {
    textures: Array<Array<HTMLImageElement>> = [];
    advanceButton: HTMLImageElement | undefined = undefined;
    private pages: Array<String> = [];

    private t = 0;
    private pageIdx = 0;

    writeSpeed = 1.5;

    private nbty = -32;
    private nby = -32;

    private spacePressed = false;

    public setPages(pages: Array<string>) {
        this.pages = pages;
        this.pageIdx = 0;
    }

    private getTexture(name: string) {
        const img = new window.Image();
        img.src = `/src/assets/tiles/textbox/${name}.png`;
        return img;
    }

    override onInitialized(): void {
        this.advanceButton = this.getTexture("textbox-advance");
        this.textures = [
            [this.getTexture("textbox-top-left"), this.getTexture("textbox-top"), this.getTexture("textbox-top-right")],
            [this.getTexture("textbox-left"), this.getTexture("textbox-center"), this.getTexture("textbox-right")],
            [this.getTexture("textbox-bottom-left"), this.getTexture("textbox-bottom"), this.getTexture("textbox-bottom-right")]
        ]

        document.body.addEventListener("keydown", (e) => {
            if (e.key === " ") {
                this.spacePressed = true;
            }
        })

        document.body.addEventListener("keyup", (e) => {
            if (e.key === " ") {
                this.spacePressed = false;
            }
        })
    }

    override onUpdate(): void {
        // Top row
        const xpad = 32;
        const ypad = 16;
        const cwid = app.viewportScale.x - (xpad+8)*2;
        const chi = 16

        if (this.pages.length !== 0) {
            const splicedText = this.pages?.[this.pageIdx].slice(0, Math.round(this.t/this.writeSpeed));

            if (splicedText.length === this.pages[this.pageIdx]?.length && this.spacePressed) {
                if (this.pageIdx < this.pages.length - 1) {
                    this.pageIdx++;
                    this.t = 0;
                } else {
                    this.pages = [];
                }
            }

            this.nbty = splicedText.length === this.pages[this.pageIdx]?.length ? 0 : -32

            this.nby += (this.nbty - this.nby) / 4

            if (this.advanceButton) Engine.draw(app.ctx, this.advanceButton, 0, {x:xpad+cwid-24, y: ypad+32+chi+this.nby}, {x:64, y:16})
            Engine.draw(app.ctx, this.textures?.[0]?.[0] as HTMLImageElement, 0, {x:xpad, y:ypad}, {x:16, y:16});
            Engine.draw(app.ctx, this.textures?.[0]?.[1] as HTMLImageElement, 0, {x:xpad+8+cwid/2, y:ypad}, {x:cwid, y:16});
            Engine.draw(app.ctx, this.textures?.[0]?.[2] as HTMLImageElement, 0, {x:xpad+cwid+16, y:ypad}, {x:16, y:16});


            Engine.draw(app.ctx, this.textures?.[1]?.[0] as HTMLImageElement, 0, {x:xpad, y:ypad+8+chi/2}, {x:16, y:chi});
            Engine.draw(app.ctx, this.textures?.[1]?.[1] as HTMLImageElement, 0, {x:xpad+8+cwid/2, y:ypad+8+chi/2}, {x:cwid, y:chi});
            Engine.draw(app.ctx, this.textures?.[1]?.[2] as HTMLImageElement, 0, {x:xpad+cwid+16, y:ypad+8+chi/2}, {x:16, y:chi});

            Engine.draw(app.ctx, this.textures?.[2]?.[0] as HTMLImageElement, 0, {x:xpad, y:ypad+16+chi}, {x:16, y:16});
            Engine.draw(app.ctx, this.textures?.[2]?.[1] as HTMLImageElement, 0, {x:xpad+8+cwid/2, y:ypad+16+chi}, {x:cwid, y:16});
            Engine.draw(app.ctx, this.textures?.[2]?.[2] as HTMLImageElement, 0, {x:xpad+cwid+16, y:ypad+16+chi}, {x:16, y:16});


            // Draw text
            app.ctx.font = "7px 'PressStart2P'"
            app.ctx.fillStyle = "black"

            drawWrappedText(app.ctx, splicedText, xpad+8, ypad+8, cwid, 8)

            this.t++;
        }
    }
}

class Checkpoint extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;
    sprite: Engine.Sprite | null = null;
    playerRb: Engine.Rigidbody | null = null;

    playerSide: number = -1;
    lastFrameSide: number = -1;

    rotationVelocity: number = 0;

    playerVelocity: number = 0;
    t: number = 0;

    initialPosition: Engine.vector = {x:0, y:0};

    deg = 0;

    claimedImage: HTMLImageElement = new window.Image();

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.playerRb = player.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
        this.initialPosition.x = this.transform.position.x;
        this.initialPosition.y = this.transform.position.y;

        this.claimedImage.src = '/src/assets/tiles/flag/2.png'
    }

    override onUpdate(): void {
        if (!this.transform || !this.playerRb || !this.sprite) return
        this.playerSide = playerTransform.position.x > this.transform?.position.x ? 1 : -1;

        if (this.lastFrameSide !== this.playerSide) {
            this.t = 1;
            let ydist = Math.max(Math.abs(this.transform.position.y - playerTransform.position.y), 1);
            this.rotationVelocity = this.playerRb.velocity.x * 5 / ydist;
            this.sprite.texture = this.claimedImage;
            playerSpawnPosition = this.transform.position;
        }

        this.deg += this.rotationVelocity;
        this.deg = Math.min(Math.max(this.deg, -90), 90)
        const rad = this.deg * (Math.PI/180)
        
        this.transform.rotation = this.deg;

        this.transform.position.x = this.initialPosition.x - Math.cos(rad + Math.PI/2) * 8
        this.transform.position.y = this.initialPosition.y - Math.sin(rad + Math.PI/2) * 8 + 8

        this.lastFrameSide = this.playerSide;
        this.rotationVelocity += (0 - this.deg) / 10;
        this.rotationVelocity *= 0.95
        console.log(this.rotationVelocity);
    }
}

class NextLevelTrigger extends Engine.ComponentBase {

    transform: Engine.Transform | undefined = undefined;

    triggered: boolean = false;
    triggeredOld: boolean = false;
    constructor () {
        super()
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.transform || !playerTransform) return
        if (this.transform.position.x < playerTransform.position.x) {
            this.triggered = true;
        }

        if (this.triggered && !this.triggeredOld) {
            levelIndex++;

            playerSpawnPosition = {x:-64, y:-24};

            app.stop();
            startLevelLoad();
            app.start(60);
        }

        this.triggeredOld = this.triggered;
    }
}

let levelIndex = 0;
let playerSpawnPosition = {x:-64, y:-24};
const tileset: Record<string, Array<Array<string>>> = tiledata.tilesets;

function loadWorldFromJson(world: SerializedWorld, app: Engine.App, tileScale: number) {
    const staticObjects = world.staticObjects;
    for (const object of staticObjects) {
        const k = object.areaScale
        const f = object.areaStartPos
        if (object.hasCollision) {
            app.addObject(new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({x:(f.x*tileScale-tileScale/2) + (tileScale/2)*k.x, y:(f.y*tileScale-tileScale/2) + (tileScale/2)*k.y}, 0, {x:tileScale*k.x, y:tileScale*k.y}))
                .addComponent(new Engine.BoxCollider({x:tileScale*k.x, y:tileScale*k.y}, {x:0, y:0}, false))
                .build())
        }
        if (object.objectId !== 'null' && Object.keys(tileset)) {
            const isTileset = Object.keys(tileset).includes(object.objectId) ? true : false;
            let spriteSrc =  isTileset ? "" : `/src/assets/tiles/${object.objectId}.png`
            console.log(spriteSrc)
            for (let b = 0; b < k.x; b++) {
                for (let i = 0; i < k.y; i++) {
                        if (isTileset) {
                            // Corner Conditions
                            const corners: Array<Engine.vector> = [
                                {x: 0, y: 0},
                                {x: k.x-1, y: 0},
                                {x: 0, y: k.y-1},
                                {x: k.x-1, y: k.y-1}
                            ]
                            const cornerTilesetPositions: Array<Engine.vector> = [{x: 0, y: 0}, {x: 2, y: 0}, {x: 0, y: 2}, {x: 2, y: 2}]

                            let tileType = {x: 1, y: 1} as Engine.vector | undefined;
                            const pos = {x: b, y: i};

                            if (corners.some(corner => corner.x == pos.x && corner.y == pos.y)) {
                                console.log("CORNER")
                                tileType = cornerTilesetPositions[corners.findIndex(corner => corner.x == pos.x && corner.y == pos.y)];
                                console.log(corners.findIndex(corner => corner.x == pos.x && corner.y == pos.y))
                            } else {
                                tileType = pos.x === 0 ? {x: 0, y: 1} : tileType;
                                tileType = pos.x === k.x ? {x: 2, y: 1} : tileType;

                                tileType = pos.y === 0 ? {x: 1, y: 0} : tileType;
                                tileType = pos.y === k.y ? {x: 1, y: 2} : tileType;
                            }

                            if (tileType === undefined) {
                                console.log(`[${chalk.red("Error")}] Tile not found!`)
                                continue
                            } else {
                                if (!tileset[object.objectId]?.[tileType.y]?.[tileType.x]) continue
                                spriteSrc = `/src/assets/tiles/${tileset[object.objectId]?.[tileType.y]?.[tileType.x] as string}.png`
                            }
                        }
                        let o: Engine.GameObject = new Engine.GameObjectBuilder(app)
                            .addComponent(new Engine.Transform({x:f.x*tileScale+(tileScale*b), y:f.y*tileScale+(tileScale*i)}, 0, {x:tileScale, y:tileScale}))
                            .addComponent(new Engine.Sprite(spriteSrc))
                            .addComponent(new Engine.Renderer(app.ctx))
                            .build();
                        app.addObject(o)
                }
            }
        }
    }

    for (const object of world.dynamicObjects) {
        if (dynamicObjectFunctions[object.objectId] === undefined) return
        app.addObject(dynamicObjectFunctions[object.objectId](object.position, tileScale, object.objectData))
    }
}

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

const app = new Engine.App({
    downscaleFactor: 4
});

function startLevelLoad() {
    app.objects = [];
    let levels: Array<SerializedWorld> = [
        {"staticObjects":[{"objectId":"stone_brick_grass","areaStartPos":{"x":-7,"y":0},"areaScale":{"x":21,"y":2},"hasCollision":true},{"objectId":"stone_brick_grass","areaStartPos":{"x":3,"y":-3},"areaScale":{"x":2,"y":3},"hasCollision":true}],"dynamicObjects":[{"objectId":"next_level_trigger","position":{"x":12,"y":-1},"objectData":{}},{"objectId":"text_trigger","position":{"x":-2,"y":-1},"objectData":{"text":"Gotta get to the end!"}}]},
        {"staticObjects":[{"objectId":"stone_brick_grass","areaStartPos":{"x":-9,"y":0},"areaScale":{"x":11,"y":2},"hasCollision":true}],"dynamicObjects":[{"objectId":"text_trigger","position":{"x":-9,"y":-1},"objectData":{"text":"You did it!"}},{"objectId":"title","position":{"x":-4,"y":-5},"objectData":{}}]}
    ]

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    console.log(urlParams.get("map") as string)

    console.log()


    if (urlParams.get("map")) {
        const uriLevelData = JSON.parse(decodeURIComponent(urlParams.get("map") as string))
        levels = uriLevelData
    }

    const worldJson = levels[levelIndex]

    document.title = urlParams.get("map") ? "Custom Map" : "Campaign"

    player = new Engine.GameObjectBuilder(app)
        .addComponent(new Engine.Sprite("/src/assets/mario.png"))
        .addComponent(new Engine.Renderer(app.ctx))
        .addComponent(new Engine.Transform(playerSpawnPosition, 0, {x:12, y:16}))
        .addComponent(new Engine.BoxCollider({x: 12, y: 15}, {x:0, y:1}, false))
        .addComponent(new PlayerAnimator())
        .addComponent(new Engine.Rigidbody({
            bounciness: 0,
            friction: 0.975,
            drag: 0.98,
            density: 1
        }))
        .addComponent(new Engine.PlayerController())
        .addComponent(new PlayerHeathController())
        .build()

    playerTransform = player.getComponents(Engine.Transform)[0] as Engine.Transform;

    const textBoxObject = new Engine.GameObjectBuilder(app)
        .addComponent(new TextBox())
        .build();

    textBox = textBoxObject.getComponents(TextBox)[0] as TextBox;

    loadWorldFromJson(worldJson as SerializedWorld, app, 16)

    app.addObject(new Engine.GameObjectBuilder(app)
        .addComponent(new Engine.Transform({x:-64, y:-512}, 0, {x:0, y:0}))
        .addComponent(new Engine.Camera())
        .addComponent(new CameraController(playerTransform))
        .build())

    app.addObject(player)

    app.addObject(textBoxObject);
}

startLevelLoad();

document.body.addEventListener("keydown", (e) => {
    if (e.key === "r" && e.altKey) {
        app.stop();
        startLevelLoad();
        app.start(60);
    }
})

app.start(60);