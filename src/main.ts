import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

import tilesets from "./assets/tiles/tilesets.json"

const dynamicObjectFunctions: Record<string, (position: Engine.vector, tileScale: number)=>Engine.GameObject> = {
    "lucky_block": (position: Engine.vector, tileScale: number)=>{
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:tileScale, y:tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/lucky.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Engine.BoxCollider({x: 16, y: 16}, {x:0, y:0}, false))
            .addComponent(new Engine.BoxCollider({x: 4, y: 8}, {x:0, y:8}, true))
            .addComponent(new LuckyBlock())
            .build())
    },
    "title": (position: Engine.vector, tileScale: number) => {
        return (new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:tileScale * position.x, y:tileScale * position.y}, 0, {x:16*tileScale, y:8*tileScale}))
            .addComponent(new Engine.Sprite("/src/assets/tiles/title.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Engine.BoxCollider({x: 16, y: 16}, {x:0, y:0}, false))
            .build())
    }
};

type StaticObject = {
    objectId: string,
    areaStartPos: Engine.vector,
    areaScale: Engine.vector,
    hasCollision: boolean
}

type DynamicObject = {
    objectId: string
    position: Engine.vector
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

    override onUpdate(): void {
        if (!this.sprite || !this.rigidbody || !this.transform) return
        if (Math.abs(this.rigidbody.velocity.x) > 0.5) {
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
        this.triggered = true
        this.sprite.texture.src = "/src/assets/tiles/lucky-consumed.png"
    }
}

console.log(tilesets)
const tileset: Record<string, Array<Array<string>>> = tilesets;

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
        app.addObject(dynamicObjectFunctions[object.objectId](object.position, tileScale))
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

let worldJson = `{"staticObjects":[{"objectId":"null","areaStartPos":{"x":-5,"y":-10},"areaScale":{"x":1,"y":10},"hasCollision":true},{"objectId":"brick_grass","areaStartPos":{"x":-26,"y":0},"areaScale":{"x":50,"y":5},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":12,"y":-3},"areaScale":{"x":2,"y":1},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":15,"y":-3},"areaScale":{"x":2,"y":1},"hasCollision":true},{"objectId":"pit","areaStartPos":{"x":24,"y":0},"areaScale":{"x":4,"y":5},"hasCollision":false},{"objectId":"brick_grass","areaStartPos":{"x":28,"y":0},"areaScale":{"x":11,"y":5},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":30,"y":-1},"areaScale":{"x":3,"y":1},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":33,"y":-2},"areaScale":{"x":4,"y":2},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":2,"y":-11},"areaScale":{"x":4,"y":4},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":7,"y":-11},"areaScale":{"x":4,"y":4},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":5,"y":-17},"areaScale":{"x":3,"y":7},"hasCollision":true},{"objectId":"brick-dark","areaStartPos":{"x":4,"y":-18},"areaScale":{"x":5,"y":3},"hasCollision":true},{"objectId":"brick","areaStartPos":{"x":6,"y":-18},"areaScale":{"x":1,"y":2},"hasCollision":true}],"dynamicObjects":[{"objectId":"title","position":{"x":-4,"y":-4}},{"objectId":"lucky_block","position":{"x":14,"y":-3}},{"objectId":"lucky_block","position":{"x":14,"y":-6}},{"objectId":"lucky_block","position":{"x":33,"y":-5}},{"objectId":"lucky_block","position":{"x":8,"y":-3}},{"objectId":"lucky_block","position":{"x":7,"y":-3}},{"objectId":"lucky_block","position":{"x":6,"y":-3}}]}`

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

worldJson = urlParams.get("map") ? urlParams.get("map") as string : worldJson

loadWorldFromJson(JSON.parse(worldJson) as SerializedWorld, app, 16)

const player = new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/mario.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:-64, y:-24}, 0, {x:12, y:16}))
    .addComponent(new Engine.BoxCollider({x: 12, y: 16}, {x:0, y:0}, false))
    .addComponent(new PlayerAnimator())
    .addComponent(new Engine.Rigidbody({
        bounciness: 0,
        friction: 0.98,
        drag: 0.983141592653589,
        density: 9
    }))
    .addComponent(new Engine.PlayerController())
    .build()

app.addObject(player)

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Transform({x:-64, y:-512}, 0, {x:0, y:0}))
    .addComponent(new Engine.Camera())
    .addComponent(new CameraController(player.getComponents(Engine.Transform)[0] as Engine.Transform))
    .build())

app.start(60);