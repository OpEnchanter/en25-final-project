import * as Engine from "./engine.ts"
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import chalk from "chalk";

export type DynamicObjectInputs = {
    textBox?: TextBox,

    player?: Engine.GameObject,
    playerTransform?: Engine.Transform,
    playerSpawnPosition?: Engine.vector,

    levelIndex?: number,

    levelLoadCallback?: ()=>void
}

import tiledata from "/assets/tiles/tiledata.json"
const tileset: Record<string, Array<Array<string>>> = tiledata.tilesets;

export const loadDynamicObjects: (inputs: DynamicObjectInputs)=>Record<string, (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any, o?: any) => Engine.GameObject> = (inputs: DynamicObjectInputs)=>{
    return({
        "sign": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/props/sign.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .build())
        },
        "flower_red": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/props/flower-red.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .build())
        },
        "flower_blue": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/props/flower-blue.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .build())
        },
        "lucky_block": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/lucky.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Engine.BoxCollider({ x: 16, y: 16 }, { x: 0, y: 0 }, false))
                .addComponent(new Engine.BoxCollider({ x: 4, y: 8 }, { x: 0, y: 8 }, true))
                .addComponent(new LuckyBlock(objectData))
                .build())
        },
        "title": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: 16 * tileScale, y: 8 * tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/title.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .build())
        },
        "text_trigger": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new TextTrigger(inputs.textBox as TextBox, inputs.playerTransform as Engine.Transform, objectData.text))
                .build())
        },
        "checkpoint": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/flag/1.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Checkpoint(inputs.player as Engine.GameObject, inputs.playerSpawnPosition as Engine.vector))
                .build())
        },
        "next_level_trigger": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new NextLevelTrigger(inputs.playerTransform as Engine.Transform, inputs.playerSpawnPosition as Engine.vector, inputs.levelIndex as number, inputs.levelLoadCallback as ()=>void))
                .build())
        },
        "moving_platform": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: 3 * tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/moving-platform.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Engine.BoxCollider({ x: 44, y: 6 }, { x: 0, y: -12 }, true))
                .addComponent(new Engine.BoxCollider({ x: 48, y: 16 }, { x: 0, y: 0 }, false))
                .addComponent(new MovingPlatform(objectData.x_translation, objectData.y_translation, objectData.speed, inputs.player as Engine.GameObject))
                .build())
        },
        "enemy": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Engine.Sprite("assets/tiles/enemy/animation/walking/1.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Engine.BoxCollider({ x: 1, y: 8 }, { x: -11, y: 2 }, true))
                .addComponent(new Engine.BoxCollider({ x: 1, y: 8 }, { x: 11, y: 2 }, true))
                .addComponent(new Engine.BoxCollider({ x: 14, y: 1 }, { x: 0, y: -11 }, true))
                .addComponent(new Engine.BoxCollider({ x: 14, y: 16 }, { x: 0, y: 0 }, false))
                .addComponent(new Engine.Rigidbody({ bounciness: 0, friction: 1, drag: 1 } as Engine.BodyProperties))
                .addComponent(new Enemy(inputs.player as Engine.GameObject))
                .build())
        },
        "story_dialogue": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new BlankScreenDialogue(objectData.text, inputs.levelIndex as number, inputs.playerSpawnPosition as Engine.vector, inputs.levelLoadCallback as ()=>void))
                .build())
        },
        "grass": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any, windNoise: NoiseFunction2D) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale, y: tileScale }))
                .addComponent(new Grass(inputs.playerTransform, windNoise))
                .build())
        },
        "balloon": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale * 6, y: tileScale * 8 }))
                .addComponent(new Engine.Sprite("assets/tiles/balloon/1.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Engine.BoxCollider({ x: 32, y: 10 }, { x: 0, y: 49 }, false))
                .addComponent(new Engine.Rigidbody({ bounciness: 0, friction: 1, drag: 1 } as Engine.BodyProperties))
                .addComponent(new Balloon())
                .build())
        },
        
        "coin": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale * 1, y: tileScale * 1 }))
                .addComponent(new Engine.Sprite("assets/tiles/coin/1.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new Engine.BoxCollider({ x: 16, y: 16 }, { x: 0, y: 0 }, true))
                .addComponent(new CoinCollectible())
                .build())
        },
        "lucky_block_coin": (app: Engine.App, position: Engine.vector, tileScale: number, objectData: any) => {
            return (new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: tileScale * position.x, y: tileScale * position.y }, 0, { x: tileScale * 1, y: tileScale * 1 }))
                .addComponent(new Engine.Sprite("assets/tiles/coin/1.png"))
                .addComponent(new Engine.Renderer(app.ctx))
                .addComponent(new LuckyBlockCoin(inputs.player!))
                .build())
        }
    });
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

export type SerializedWorld = {
    staticObjects: Array<StaticObject>
    dynamicObjects: Array<DynamicObject>
    levelOptions?: {
        background: string
    }
}

export class LuckyBlock extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;
    sprite: Engine.Sprite | null = null;
    triggered: boolean = false;
    startPos: Engine.vector = { x: 0, y: 0 };
    tick: number = 0;

    contents: any;

    constructor(data: any) {
        super();
        this.contents = data.contents;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.startPos = { x: this.transform.position.x, y: this.transform.position.y }
    }

    override onUpdate(): void {
        if (this.triggered && this.transform) {
            this.transform.position.y = this.startPos.y - Math.max(0.05 * (-this.tick * (this.tick - 25)), 0)
            this.tick++;
        }
    }

    override onTriggerEnter(params: Engine.TriggerData): void {
        if (!this.transform || !this.sprite || !this.object) return
        if (!this.triggered) {
            this.triggered = true
            this.sprite.texture.src = "assets/tiles/lucky-consumed.png"
            this.object.app.addObject(dynamicObjectFunctions[this.contents](this.object.app, { x: this.transform.position.x / 16, y: this.transform.position.y / 16 - 1 }, 16, { contents: "" }));
        }
    }
}

export class PlayerHealthController extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;

    playerTransform: Engine.Transform | undefined = undefined;
    playerSpawnPosition: Engine.vector;

    constructor(playerSpawnPosition: Engine.vector) {
        super();
        this.playerSpawnPosition = playerSpawnPosition;
        if (!this.object) return
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.playerTransform = (this.object?.getComponents(Engine.Transform)[0] as Engine.Transform)
    }

    public kill(): void {
        if (!this.object || !this.playerTransform) return
        this.playerTransform.position.x = this.playerSpawnPosition.x;
        this.playerTransform.position.y = this.playerSpawnPosition.y - 1;
        (this.object.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody).velocity = { x: 0, y: -2 }
    }

    override onUpdate(): void {
        if (!this.transform) return
        if (this.transform.position.y > 96) {
            this.kill();
        }
    }
}

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const lines = text.split(":nl");
    for (const line of lines) {
        const words = line.split(" ");
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
        y += lineHeight;
    }
}

export class TextTrigger extends Engine.ComponentBase {
    textBox: TextBox;
    tracked: Engine.Transform;

    transform: Engine.Transform | undefined = undefined;

    triggered: boolean = false;
    triggeredOld: boolean = false;

    text: string;
    constructor(textBox: TextBox, trackedTransform: Engine.Transform, text: string) {
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

export class TextBox extends Engine.ComponentBase {
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
        img.src = `assets/tiles/textbox/${name}.png`;
        return img;
    }

    override onInitialized(): void {
        if (!this.object) return
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
        }, {signal: this.object.app?.abortSignal})

        document.body.addEventListener("keyup", (e) => {
            if (e.key === " ") {
                this.spacePressed = false;
            }
        }, {signal: this.object.app?.abortSignal})
    }

    override onUIRender(): void {
        if (!this.object) return
        // Top row
        const xpad = 32;
        const ypad = 16;
        const cwid = this.object.app.viewportScale.x - (xpad + 8) * 2;
        const chi = 16

        if (this.pages.length !== 0) {
            const splicedText = this.pages[this.pageIdx]!.slice(0, Math.floor(this.t / this.writeSpeed));

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

            if (this.advanceButton) Engine.draw(this.object.app.ctx, this.advanceButton, 0, { x: xpad + cwid - 24, y: ypad + 32 + chi + this.nby }, { x: 64, y: 16 })
            Engine.draw(this.object.app.ctx, this.textures?.[0]?.[0] as HTMLImageElement, 0, { x: xpad, y: ypad }, { x: 16, y: 16 });
            Engine.draw(this.object.app.ctx, this.textures?.[0]?.[1] as HTMLImageElement, 0, { x: xpad + 8 + cwid / 2, y: ypad }, { x: cwid + 1, y: 16 });
            Engine.draw(this.object.app.ctx, this.textures?.[0]?.[2] as HTMLImageElement, 0, { x: xpad + cwid + 16, y: ypad }, { x: 16, y: 16 });


            Engine.draw(this.object.app.ctx, this.textures?.[1]?.[0] as HTMLImageElement, 0, { x: xpad, y: ypad + 8 + chi / 2 }, { x: 16, y: chi });
            Engine.draw(this.object.app.ctx, this.textures?.[1]?.[1] as HTMLImageElement, 0, { x: xpad + 8 + cwid / 2, y: ypad + 8 + chi / 2 }, { x: cwid + 1, y: chi });
            Engine.draw(this.object.app.ctx, this.textures?.[1]?.[2] as HTMLImageElement, 0, { x: xpad + cwid + 16, y: ypad + 8 + chi / 2 }, { x: 16, y: chi });

            Engine.draw(this.object.app.ctx, this.textures?.[2]?.[0] as HTMLImageElement, 0, { x: xpad, y: ypad + 16 + chi }, { x: 16, y: 16 });
            Engine.draw(this.object.app.ctx, this.textures?.[2]?.[1] as HTMLImageElement, 0, { x: xpad + 8 + cwid / 2, y: ypad + 16 + chi }, { x: cwid + 1, y: 16 });
            Engine.draw(this.object.app.ctx, this.textures?.[2]?.[2] as HTMLImageElement, 0, { x: xpad + cwid + 16, y: ypad + 16 + chi }, { x: 16, y: 16 });


            // Draw text
            if (!this.object.app.ctx) return
            this.object.app.ctx.font = "7px 'PressStart2P'"
            this.object.app.ctx.fillStyle = "black"

            drawWrappedText(this.object.app.ctx, splicedText, xpad + 8, ypad + 8, cwid, 9)

            this.t++;
        }
    }
}

export class Checkpoint extends Engine.ComponentBase {
    transform: Engine.Transform | null = null;
    sprite: Engine.Sprite | null = null;
    playerRb: Engine.Rigidbody | null = null;
    playerTransform: Engine.Transform | null = null;
    player: Engine.GameObject;

    playerSpawnPosition: Engine.vector;

    playerSide: number = 0;
    lastFrameSide: number = 0;

    rotationVelocity: number = 0;

    playerVelocity: number = 0;
    t: number = 0;

    initialPosition: Engine.vector = { x: 0, y: 0 };

    deg = 0;

    claimedImage: HTMLImageElement = new window.Image();

    constructor(player: Engine.GameObject, playerSpawnPosition: Engine.vector) {
        super();
        this.player = player
        this.playerSpawnPosition = playerSpawnPosition;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.playerRb = this.player.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
        this.playerTransform = this.player.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.initialPosition.x = this.transform.position.x;
        this.initialPosition.y = this.transform.position.y;

        this.claimedImage.src = 'assets/tiles/flag/2.png'
    }

    override onUpdate(): void {
        if (!this.transform || !this.playerRb || !this.sprite || !this.playerTransform) return
        this.playerSide = this.playerTransform.position.x > this.transform?.position.x ? 1 : -1;

        if (this.lastFrameSide !== this.playerSide && this.lastFrameSide !== 0) {
            this.t = 1;
            let ydist = Math.max(Math.abs(this.transform.position.y - this.playerTransform.position.y), 1);
            this.rotationVelocity = this.playerRb.velocity.x * 5 / ydist;
            this.sprite.texture = this.claimedImage;
            this.playerSpawnPosition.x = this.transform.position.x;
            this.playerSpawnPosition.y = this.transform.position.y;
        }

        this.deg += this.rotationVelocity;
        this.deg = Math.min(Math.max(this.deg, -90), 90)
        const rad = this.deg * (Math.PI / 180)

        this.transform.rotation = this.deg;

        this.transform.position.x = this.initialPosition.x - Math.cos(rad + Math.PI / 2) * 8
        this.transform.position.y = this.initialPosition.y - Math.sin(rad + Math.PI / 2) * 8 + 8

        this.lastFrameSide = this.playerSide;
        this.rotationVelocity += (0 - this.deg) / 10;
        this.rotationVelocity *= 0.95
    }
}

export class NextLevelTrigger extends Engine.ComponentBase {

    transform: Engine.Transform | undefined = undefined;

    playerTransform: Engine.Transform;
    playerSpawnPosition: Engine.vector;
    levelIndex: number;
    levelLoadCallback: ()=>void;

    triggered: boolean = false;
    triggeredOld: boolean = false;

    constructor(playerTransform: Engine.Transform, playerSpawnPosition: Engine.vector, levelIndex: number, levelLoadCallback: ()=>void) {
        super()
        this.playerTransform = playerTransform;
        this.playerSpawnPosition = playerSpawnPosition;
        this.levelIndex = levelIndex;
        this.levelLoadCallback = levelLoadCallback;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.transform || !this.playerTransform || !this.object) return
        if (this.transform.position.x < this.playerTransform.position.x) {
            this.triggered = true;
        }

        if (this.triggered && !this.triggeredOld) {
            this.levelIndex++;

            if (!(new URL(window.location.href).searchParams.has("playtest"))) {
                localStorage.setItem("campaignLevelIndex", this.levelIndex.toString())
            }

            this.playerSpawnPosition = { x: -64, y: -24 };

            this.object.app.stop();
            this.levelLoadCallback();
            this.object.app.start(60);
        }

        this.triggeredOld = this.triggered;
    }
}

export class MovingPlatform extends Engine.ComponentBase {
    translation: Engine.vector
    startPos: Engine.vector = { x: 0, y: 0 }
    transform: Engine.Transform | undefined = undefined;
    speed: number = 1

    oldPosition: Engine.vector = {x:0, y:0}

    player: Engine.GameObject;

    targetPos = {x:0, y:0}

    t: number = 0;

    constructor(xt: string, yt: string, speed: string, player: Engine.GameObject) {
        super()
        this.translation = { x: parseInt(xt) * 16, y: parseInt(yt) * -16 }
        this.speed = parseFloat(speed);
        this.player = player;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.startPos.x = this.transform.position.x;
        this.startPos.y = this.transform.position.y;
        this.oldPosition.x = this.transform.position.x;
        this.oldPosition.y = this.transform.position.y;
        this.targetPos.x = this.startPos.x;
        this.targetPos.y = this.startPos.y;
    }

    override onUpdate(): void {
        if (!this.transform) return;
        this.transform.position.x += ((this.targetPos.x - this.transform.position.x) * (this.speed / 16))
        this.transform.position.y += ((this.targetPos.y - this.transform.position.y) * (this.speed / 16))
        this.t += 1;
    }
    
    override onTriggerStay(params: Engine.TriggerData): void {
        if (!this.transform || params.object !== this.player) return

        const positionDelta = {
            x: this.oldPosition.x - this.transform.position.x, 
            y: this.oldPosition.y - this.transform.position.y
        }

        const otherTransform = params.object?.getComponents(Engine.Transform)[0] as Engine.Transform
        const otherRb = params.object?.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody

        otherTransform.position.x -= positionDelta.x;
        otherTransform.position.y -= positionDelta.y;
    }


    override onTriggerEnter(params: Engine.TriggerData): void {
        console.log("updating")
        this.targetPos.x = this.startPos.x + this.translation.x
        this.targetPos.y = this.startPos.y + this.translation.y
    }

   override onTriggerExit(): void {
       this.targetPos = {x: this.startPos.x, y: this.startPos.y}
   }

    override onLateUpdate(): void {
        if (!this.transform) return
        this.oldPosition.x = this.transform.position.x
        this.oldPosition.y = this.transform.position.y
    }
}

export class CloudRenderer extends Engine.ComponentBase {
    noise2D: NoiseFunction2D = createNoise2D();

    lowerBound = 0.6;
    resolutionDivisor = 8

    cameraTransform: Engine.Transform | undefined;
    camera: Engine.GameObject;

    t = 0;

    constructor(camera: Engine.GameObject) {
        super()
        this.camera = camera;
    }

    override onInitialized(): void {
        this.cameraTransform = this.camera.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.object || !this.cameraTransform || !this.object.app.ctx) return
        this.object.app.ctx.fillStyle = "#ffffff2f";
        const cp = this.object.app.renderingClippingPlane.position;
        for (let x = 0; x < Math.floor(this.object.app.viewportScale.x / this.resolutionDivisor); x++) {
            for (let y = 0; y < Math.floor(this.object.app.viewportScale.y / this.resolutionDivisor); y++) {
                let td = (y / Math.floor((60 / this.resolutionDivisor)))
                if (y * this.resolutionDivisor > 60) td = 0;
                let nval =
                    Math.max((this.noise2D((((x + this.t / 32) + cp.x / 32) * 0.05), ((y) * 0.05)) + 1) / 2 - this.lowerBound, 0)
                    * ((td ** 2) * 8)
                    ;

                const cc = 200 + td * 55
                this.object.app.ctx.fillStyle = `rgba(${cc},${cc},${cc},${nval / 4})`
                this.object.app.ctx.beginPath();
                this.object.app.ctx.arc(
                    x * this.resolutionDivisor,
                    y * this.resolutionDivisor - cp.y - 100,
                    (nval) * 8,
                    0, 2 * Math.PI);
                this.object.app.ctx.fill();
            }
        }
        this.t++;
    }
}

export class BlankScreenDialogue extends Engine.ComponentBase {
    advanceButton: HTMLImageElement | undefined = undefined;
    private pages: Array<String> = [];

    private t = 0;
    private pageIdx = 0;

    writeSpeed = 1.5;

    nby: number = -8;
    nbty: number = -8;

    private spacePressed = false;
    private shiftPressed = false;

    levelIndex: number;
    playerSpawnPosition: Engine.vector;
    levelLoadCallback: ()=>void

    constructor(text: string, levelIndex: number, playerSpawnPosition: Engine.vector, levelLoadCallback: ()=>void) {
        super();

        this.pages = text.split("\\");
        this.levelIndex = levelIndex;
        this.playerSpawnPosition = playerSpawnPosition;
        this.levelLoadCallback = levelLoadCallback;
    }

    public setPages(pages: Array<string>) {
        this.pages = pages;
        this.pageIdx = 0;
    }

    private getTexture(name: string) {
        const img = new window.Image();
        img.src = `assets/tiles/textbox/${name}.png`;
        return img;
    }

    override onInitialized(): void {
        if (!this.object) return
        this.advanceButton = this.getTexture("textbox-advance-dark");

        document.body.addEventListener("keydown", (e) => {
            if (e.key === " ") {
                this.spacePressed = true;
            }

            if (e.key === "Shift") {
                this.shiftPressed = true;
            }
        }, {signal: this.object.app?.abortSignal})

        document.body.addEventListener("keyup", (e) => {
            if (e.key === " ") {
                this.spacePressed = false;
            }

            if (e.key === "Shift") {
                this.shiftPressed = false;
            }
        }, {signal: this.object.app?.abortSignal})
    }

    override onUIRender(): void {
        if (!this.object || !this.object.app.ctx) return
        // Top row
        const xpad = 32;
        const ypad = 24;
        const cwid = this.object.app.viewportScale.x - (xpad + 8) * 2;

        this.object.app.ctx.fillStyle = "#080415"
        this.object.app.ctx.fillRect(0, 0, this.object.app.viewportScale.x, this.object.app.viewportScale.y)

        this.writeSpeed = this.shiftPressed ? 0.5 : 1.5

        if (this.pages.length !== 0) {
            const splicedText = this.pages[this.pageIdx]!.slice(0, Math.floor(this.t));

            if (splicedText.length === this.pages[this.pageIdx]?.length && this.spacePressed) {
                if (this.pageIdx < this.pages.length - 1) {
                    this.pageIdx++;
                    this.t = 0;
                } else {
                    this.pages = [];
                    this.levelIndex++;

                    if (!(new URL(window.location.href).searchParams.has("playtest"))) {
                        localStorage.setItem("campaignLevelIndex", this.levelIndex.toString())
                    }

                    this.playerSpawnPosition = { x: -64, y: -24 };

                    this.object.app.stop();
                    this.levelLoadCallback();
                    this.object.app.start(60);
                }
            }

            this.nbty = splicedText.length === this.pages[this.pageIdx]?.length ? 8 : -8

            this.nby += (this.nbty - this.nby) / 4

            if (this.advanceButton) Engine.draw(this.object.app.ctx, this.advanceButton, 0, { x: xpad + cwid - 24, y: this.nby }, { x: 64, y: 16 })

            // Draw text
            this.object.app.ctx.font = "7px 'PressStart2P'"
            this.object.app.ctx.fillStyle = "#c0cbdc"

            drawWrappedText(this.object.app.ctx, splicedText, xpad + 8, ypad + 8, cwid, 9)

            this.t += 1 / this.writeSpeed;
        }
    }
}

export class Enemy extends Engine.ComponentBase {
    sprite: Engine.Sprite | undefined = undefined;
    rigidbody: Engine.Rigidbody | undefined = undefined;
    transform: Engine.Transform | undefined = undefined;
    collider: Engine.BoxCollider | undefined = undefined;

    playerTransform: Engine.Transform | undefined = undefined;
    playerHeathController: PlayerHealthController | undefined = undefined
    playerRb: Engine.Rigidbody | undefined = undefined;
    animation: Array<HTMLImageElement> = [];
    t: number = 0;

    vel: number = -1;

    player: Engine.GameObject;

    constructor(player: Engine.GameObject) {
        super();
        this.player = player;
    }

    getAnimFrame(id: number): HTMLImageElement {
        const img = new window.Image();
        img.src = `assets/tiles/enemy/animation/walking/${id}.png`
        return img;
    }

    override onInitialized(): void {
        this.animation.push(this.getAnimFrame(1))
        this.animation.push(this.getAnimFrame(2))

        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.rigidbody = this.object?.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.collider = this.object?.getComponents(Engine.BoxCollider)[0] as Engine.BoxCollider;

        this.playerTransform = this.player.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.playerHeathController = this.player.getComponents(PlayerHealthController)[0] as PlayerHealthController;
        this.playerRb = this.player.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
    }

    kill() {
        if (!this.transform || !this.playerTransform || !this.playerHeathController || !this.playerRb || !this.object || !this.collider) return
        this.playerRb.velocity.y = -2;
        this.transform.scale.y = 6
        this.transform.position.y += 5;
        this.object?.Components.splice(this.object.Components.indexOf(this.rigidbody as Engine.ComponentBase))
        this.vel = 0;

        setTimeout(() => {
            if (!this.transform) return
            this.transform.position.y = 1000;
        }, 500)
    }

    override onTriggerEnter(params: Engine.TriggerData): void {
        if (!this.transform || !this.playerTransform || !this.playerHeathController || !this.playerRb) return
        if (this.vel == 0) return
        if (params.object === this.player) {
            const isHorizontal = this.playerTransform.position.x < (this.transform.position.x - 8) || this.playerTransform.position.x > (this.transform.position.x + 8);
            if (this.playerTransform.position.y <= this.transform.position.y - 14) {
                this.kill();
            } else if (isHorizontal) {
                this.playerHeathController.kill();
            }
        }
        const ot = params.object?.getComponents(Engine.Transform)[0] as Engine.Transform
        if (this.vel === -1 && (ot.position.x < this.transform.position.x)) {
            this.vel = 1;
        } else if (this.vel === 1 && (ot.position.x > this.transform.position.x)) {
            this.vel = -1;
        }
        this.transform.position.x += this.vel
    }

    override onTriggerStay(params: Engine.TriggerData): void {
        if (!this.transform || !this.rigidbody || !this.playerTransform || !this.playerHeathController || !this.playerRb) return
        if (this.vel == 0) return
        const ot = params.object?.getComponents(Engine.Transform)[0] as Engine.Transform
        this.vel = (this.transform.position.x - ot.position.x) / Math.abs(this.transform.position.x - ot.position.x)
        if (params.object === this.player) {
            const isHorizontal = this.playerTransform.position.x < (this.transform.position.x - 8) || this.playerTransform.position.x > (this.transform.position.x + 8);
            if (this.playerTransform.position.y <= this.transform.position.y - 14) {
                this.kill();
            } else if (isHorizontal) {
                this.playerHeathController.kill();
            }
        }
    }

    override onUpdate(): void {
        if (!this.sprite || !this.rigidbody || !this.transform || !this.object) return
        if (this.transform.position.x > this.object.app.renderingClippingPlane.position.x + this.object.app.renderingClippingPlane.scale.x + 32) return

        if (Math.abs(this.vel) > 0) this.sprite.texture = this.animation[(Math.floor(this.t / 15) % this.animation.length)]
        this.rigidbody.velocity.x = this.vel;

        this.t++;
    }
}

export class Grass extends Engine.ComponentBase {
    private transform: Engine.Transform | undefined = undefined;

    private bladePositions: Array<number> = [];
    private bladeColors: Array<string> = [];
    private bladeTilts: Array<number> = [];

    private t: number = 0;

    noise: NoiseFunction2D;

    playerTransform: Engine.Transform | undefined ;

    constructor(player: Engine.Transform | undefined, windNoise: NoiseFunction2D) {
        super();
        this.playerTransform = player;
        this.noise = windNoise;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;

        for (let x = 0; x < 3; x++) {
            this.bladePositions.push(Math.random()*16)
            this.bladeColors.push(`rgb(${Math.random()*25}, ${Math.random()*150+50}, ${Math.random()*75})`)
            this.bladeTilts.push(Math.random()*4-2)
        }
    }

    override onLateUpdate(): void {
        if (!this.transform || !this.object || !this.object.app.ctx) return

        const clip = this.object.app.renderingClippingPlane;
        const clipPos = clip.position;
        const clipScale = clip.scale;


        if (this.transform.position.x > clipPos.x + clipScale.x / 2 + 16 || this.transform.position.x < clipPos.x - clipScale.x / 2 - 16) return

        const rPos = {x:this.transform.position.x - clipPos.x + (clipScale.x / 2) - 8, y:this.transform.position.y - clipPos.y + (clipScale.y / 2) + 8}

        for (let i = 0; i < this.bladePositions.length; i++) {
            const xOff = (this.bladePositions[i] as number)

            let movement = 
                this.playerTransform ?
                (Math.max(0, 12 - Math.abs((this.transform.position.x + xOff) - (this.playerTransform.position.x + 8)))*0.3 * ((this.transform.position.x + xOff - this.playerTransform.position.x) / Math.abs((this.transform.position.x + xOff) - this.playerTransform.position.x))) / ((this.transform.position.y - this.playerTransform.position.y + 8) / 10)
                :
                0
            if (this.bladeTilts[i] != undefined) {
                movement += this.bladeTilts[i]!
            }

            movement += this.noise((this.transform.position.x + xOff / 100) + this.t / 256, 0) * 4

            const verts: Array<Engine.vector> = [
                {x:rPos.x + xOff, y:rPos.y},
                {x:rPos.x + 2 + xOff, y:rPos.y},
                {x:rPos.x + 1 + xOff + movement, y:rPos.y - 7 + (Math.abs(movement) / 2)}
            ]

            const gradient = this.object.app.ctx.createLinearGradient(rPos.x+xOff, rPos.y, rPos.x+xOff, rPos.y - 5)
            gradient.addColorStop(0, "#3e8948")
            gradient.addColorStop(1, this.bladeColors[i] as string)
            this.object.app.ctx.fillStyle = gradient

            if (!verts[0]) continue

            this.object.app.ctx.beginPath();
            this.object.app.ctx.moveTo(verts[0].x, verts[0].y)
            for (const v of verts) {
                this.object.app.ctx.lineTo(v.x, v.y)
            }
            this.object.app.ctx.closePath()

            this.object.app.ctx.fill()
        }
        this.t++;
    }
}

export class Balloon extends Engine.ComponentBase {
    t: number = 0;
    anim: Array<HTMLImageElement> = []

    sprite: Engine.Sprite | undefined = undefined;
    transform: Engine.Transform | undefined = undefined;
    rigidbody: Engine.Rigidbody | undefined = undefined;

    targetY: number = 0;

    getAnimFrame(frame: number) {
        const img = new window.Image() as HTMLImageElement;
        img.src = `/assets/tiles/balloon/${frame}.png`
        return img
    }
    
    override onInitialized(): void {
        for (let x = 1; x<5; x++) {
            this.anim.push(this.getAnimFrame(x))
        }

        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
        this.rigidbody = this.object?.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;

        this.targetY = this.transform.position.y;
        this.transform.position.y += 3
    }

    override onUpdate(): void {
        if (!this.sprite || !this.transform || !this.rigidbody) return

        if (this.transform.position.y > this.targetY) {
            this.rigidbody.velocity.y -= ((this.transform.position.y + 96) / this.targetY);
        } else {
            this.rigidbody.velocity.y -= 0.06;
        }

        this.sprite.texture = this.anim[Math.ceil(this.t / 5) % 4]
        this.t++;
    }
}

export class CoinCollectible extends Engine.ComponentBase {
    anim: Array<HTMLImageElement> = [];
    t: number = 0;

    sprite: Engine.Sprite | undefined = undefined;
    transform: Engine.Transform | undefined = undefined;

    triggered: boolean = false;

    getAnimFrame(i: number) {
        const img = new window.Image();
        img.src = `/assets/tiles/coin/${i}.png`
        return img
    }

    override onInitialized(): void {
        for (let i = 1; i < 5; i++) {
            this.anim.push(this.getAnimFrame(i))
        }

        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.sprite) return
        this.sprite.texture = this.anim[Math.floor(this.t / 10) % 3]
        this.t++;
    }

    override onTriggerEnter(params: Engine.TriggerData): void {
        if (!this.transform || this.triggered) return
        const collectibleManager = params.object?.getComponents(CollectibleManager)[0] as CollectibleManager;
        if (!collectibleManager) return
        collectibleManager.updateCollectible("coins", 1);
        this.transform.position.y += 10000;
        this.triggered = true;
    }
}

export class LuckyBlockCoin extends CoinCollectible {

    player: Engine.GameObject;

    constructor (player: Engine.GameObject) {
        super();
        this.player = player;
    }

    override onInitialized(): void {
        super.onInitialized();

        const collectibleManager = this.player.getComponents(CollectibleManager)[0] as CollectibleManager;
        if (!collectibleManager) return
        collectibleManager.updateCollectible("coins", 1);
    }

    override onUpdate(): void {
        if (!this.transform || !this.sprite) return
        this.sprite.texture = this.anim[Math.floor(this.t / 2) % 3]
        if (this.t < 15) {
            this.transform.position.y -= this.t/3;
            this.transform.scale.x *= 0.99
            this.transform.scale.y *= 0.99
        } else {
            this.transform.position.y = 10000;
        }
        this.t++;
    }

    override onTriggerEnter(params: Engine.TriggerData): void {}
}

export class CollectibleRenderer extends Engine.ComponentBase {
    manager: CollectibleManager;

    constructor (collectibleManager: CollectibleManager) {
        super();
        this.manager = collectibleManager;
    }

    override onUIRender(): void {
        if (!this.object || !this.object.app.ctx) return
        const ctx = this.object.app.ctx;
        const xpad = 8;
        const ypad = 16;

        ctx.font = "7px 'PressStart2P'"
        ctx.fillStyle = "#000000"
        ctx.textAlign = "right"
        ctx.fillText(`${this.manager.getCollectible("coins")}c`, this.object.app.viewportScale.x - xpad, ypad)
        ctx.textAlign = "left"
    }
}

export class CollectibleManager extends Engine.ComponentBase {
    private collectibles: Record<any, number> = {};

    override onInitialized(): void {
        if (!window.localStorage.getItem("playerCollectibles")) return;
        const collectiblesJson = JSON.parse(window.localStorage.getItem("playerCollectibles")!)
        this.collectibles = collectiblesJson;
    }

    public updateCollectible(collectibleName: string, totalChange: number) {
        if (!this.collectibles[collectibleName]) {
            this.collectibles[collectibleName] = 0;   
        }
        this.collectibles[collectibleName]! += totalChange;
        window.localStorage.setItem("playerCollectibles", JSON.stringify(this.collectibles))
    }

    public getCollectible(collectibleName: string): number {
        if (!this.collectibles[collectibleName]) {
            this.collectibles[collectibleName] = 0;   
        }
        return this.collectibles[collectibleName]!;
    }
}

let dynamicObjectFunctions: any = undefined;

export function loadWorldFromJson(world: SerializedWorld, app: Engine.App, tileScale: number, inputs: DynamicObjectInputs) {
    const staticObjects = world.staticObjects;
    dynamicObjectFunctions = loadDynamicObjects(inputs);
    const windNoise: NoiseFunction2D = createNoise2D();
    for (const object of staticObjects) {
        const k = object.areaScale
        const f = object.areaStartPos
        if (object.hasCollision) {
            app.addObject(new Engine.GameObjectBuilder(app)
                .addComponent(new Engine.Transform({ x: (f.x * tileScale - tileScale / 2) + (tileScale / 2) * k.x, y: (f.y * tileScale - tileScale / 2) + (tileScale / 2) * k.y }, 0, { x: tileScale * k.x, y: tileScale * k.y }))
                .addComponent(new Engine.BoxCollider({ x: tileScale * k.x, y: tileScale * k.y }, { x: 0, y: 0 }, false))
                .build())
        }
        if (object.objectId !== 'null' && Object.keys(tileset)) {
            const isTileset = Object.keys(tileset).includes(object.objectId) ? true : false;
            let spriteSrc = isTileset ? "" : `assets/tiles/${object.objectId}.png`
            for (let b = 0; b < k.x; b++) {
                for (let i = 0; i < k.y; i++) {
                    if (isTileset) {
                        // Corner Conditions
                        const corners: Array<Engine.vector> = [
                            { x: 0, y: 0 },
                            { x: k.x - 1, y: 0 },
                            { x: 0, y: k.y - 1 },
                            { x: k.x - 1, y: k.y - 1 }
                        ]
                        const cornerTilesetPositions: Array<Engine.vector> = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }]

                        let tileType = { x: 1, y: 1 } as Engine.vector | undefined;
                        const pos = { x: b, y: i };

                        if (corners.some(corner => corner.x == pos.x && corner.y == pos.y)) {
                            tileType = cornerTilesetPositions[corners.findIndex(corner => corner.x == pos.x && corner.y == pos.y)];
                        } else {
                            tileType = pos.x === 0 ? { x: 0, y: 1 } : tileType;
                            tileType = pos.x === k.x ? { x: 2, y: 1 } : tileType;

                            tileType = pos.y === 0 ? { x: 1, y: 0 } : tileType;
                            tileType = pos.y === k.y ? { x: 1, y: 2 } : tileType;
                        }

                        if (tileType === undefined) {
                            console.log(`[${chalk.red("Error")}] Tile not found!`)
                            continue
                        } else {
                            if (!tileset[object.objectId]?.[tileType.y]?.[tileType.x]) continue
                            spriteSrc = `assets/tiles/${tileset[object.objectId]?.[tileType.y]?.[tileType.x] as string}.png`
                        }
                    }
                    const px = f.x * tileScale + (tileScale * b)
                    const py = f.y * tileScale + (tileScale * i)
                    if (["assets/tiles/brick/grass/brick-grass.png", "assets/tiles/stone-bricks/grass/stone-bricks-grass.png"].includes(spriteSrc) && dynamicObjectFunctions.grass) {
                        app.addObject(dynamicObjectFunctions.grass(app, {x: (px/16), y:(py/16)-1}, 16, {}, windNoise));
                    }
                    let o: Engine.GameObject = new Engine.GameObjectBuilder(app)
                        .addComponent(new Engine.Transform({ x: px, y: py }, 0, { x: tileScale, y: tileScale }))
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
        app.addObject(dynamicObjectFunctions[object.objectId]!(app, object.position, tileScale, object.objectData))
    }
}