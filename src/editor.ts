import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

import tilesets from "./assets/tiles/tilesets.json"

const tileset: Record<string, Array<Array<string>>> = tilesets;

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

const playerSprite = new window.Image();
playerSprite.src="/src/assets/tiles/flag.png";

const tileNameAliases: Record<string, string> = {
    "null": "Invisible",
    "brick/brick": "Bricks",
    "brick/brick-dark": "Dark Bricks",
    "brick/grass/brick-grass": "Grass Bricks",
    "brick/grass/brick-grass-top-left": "Grass Bricks TL",
    "brick/grass/brick-grass-top-right": "Grass Bricks TR",
    "stone-bricks/stone-bricks": "Stone Bricks",
    "stone-bricks/stone-bricks-dark": "Dark Stone Bricks",
    "stone-bricks/grass/stone-bricks-grass": "Grass Stone Bricks",

    "brick_grass": "Grass Bricks",
    "brick_pit": "Brick Pit",
    "stone_brick_grass": "Stone Bricks Grass",

    "lucky_block": "Lucky Block",
    "title": "Title"
}

// Define static and dynamic tiles and tile sets
const tiles: Array<string> = [
    "null",
    "brick/brick",
    "brick/brick-dark",
    "brick/grass/brick-grass",
    "brick/grass/brick-grass-top-left",
    "brick/grass/brick-grass-top-right",
    "stone-bricks/stone-bricks",
    "stone-bricks/stone-bricks-dark",
    "stone-bricks/grass/stone-bricks-grass"
]

const dynamicTiles: Record<string, {spriteName:string, scale: Engine.vector, objectDataShape:Record<string, string>}> = {
    "lucky_block": {spriteName:"lucky", scale:{x:16, y:16}, objectDataShape:{contents:""}},
    "title": {spriteName:"title", scale:{x:256, y:128}, objectDataShape:{}}
}

const tileSets: Array<string> = Object.keys(tileset);

let currentTile = "brick";

const tilePicker = document.getElementById("tileList");
const tilesetPicker = document.getElementById("tilesetList");
const objectPicker = document.getElementById("dynamicObjectList");
for (const t of tiles) {
    tilePicker?.appendChild((()=>{
        const e = document.createElement("label");
        e.className = "tile";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "tiles";
        radio.value = t;

        const img = document.createElement("img");
        img.src = `/src/assets/tiles/${t}.png`;
        img.width = 16;
        img.height = 16;

        const span = document.createElement("span");
        span.innerText = tileNameAliases[t] as string;

        e.appendChild(radio);
        e.appendChild(img);
        e.appendChild(span);

        radio.addEventListener("change", (e) => {
            currentTile = e?.target?.value;

            if (selectedStaticObject !== -1) {
                const obj: StaticObject = scene.staticObjects[selectedStaticObject] as StaticObject
                if (obj == undefined) return
                obj.objectId = currentTile;
            }
        })

        return e;
    })())
}

for (const t of tileSets) {
    tilesetPicker?.appendChild((()=>{
        const e = document.createElement("label");
        e.className = "tile";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "tiles";
        radio.value = t;

        const img = document.createElement("img");
        img.src = `/src/assets/tiles/${(tileset[t] as Array<Array<string>>)[0]?.[0] as string}.png`;
        img.width = 16;
        img.height = 16;

        const span = document.createElement("span");
        span.innerText = tileNameAliases[t] as string;

        e.appendChild(radio);
        e.appendChild(img);
        e.appendChild(span);

        radio.addEventListener("change", (e) => {
            currentTile = e?.target?.value;
            if (selectedStaticObject !== -1) {
                const obj: StaticObject = scene.staticObjects[selectedStaticObject] as StaticObject
                if (obj == undefined) return
                obj.objectId = currentTile;
            }
        })

        return e;
    })())
}

for (const o of Object.keys(dynamicTiles)) {
    objectPicker?.appendChild((()=>{
        const e = document.createElement("label");
        e.className = "tile";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "tiles";
        radio.value = o;

        const img = document.createElement("img");
        img.src = `/src/assets/tiles/${dynamicTiles[o]?.spriteName}.png`;
        img.width = 16;
        img.height = 16;

        const span = document.createElement("span");
        span.innerText = tileNameAliases[o] as string;

        e.appendChild(radio);
        e.appendChild(img);
        e.appendChild(span);

        radio.addEventListener("change", (e) => {
            currentTile = e?.target?.value;
        })

        return e;
    })())
}

// Create image cache for tile rendering
let tileImageCache: Record<string, HTMLImageElement> = {}

tileImageCache["editor-null"] = new window.Image();
tileImageCache["editor-null"].src = "/src/assets/tiles/editor-null.png"

for (const tile of tiles) {
    tileImageCache[tile] = new window.Image();
    tileImageCache[tile].src = `/src/assets/tiles/${tile}.png`
}

for (const set of Object.keys(tileset)) {
    for (let x = 0; x<3; x++) {
        for (let y = 0; y<3; y++) {
            if (!tileset[set]) continue
            const tilename = tileset[set]?.[y]?.[x] as string
            tileImageCache[tilename] = new window.Image();
            tileImageCache[tilename].src = `/src/assets/tiles/${tilename}.png`
        }
    }
}

for (const obj of Object.keys(dynamicTiles)) {
    tileImageCache[obj] = new window.Image();
    tileImageCache[obj].src = `/src/assets/tiles/${dynamicTiles[obj]?.spriteName}.png`
}

class CameraController extends Engine.ComponentBase {
    keys: any = {};
    alt: boolean = false;
    private transform: Engine.Transform | null = null;
    override onInitialized(): void {
        document.body.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.alt = e.shiftKey;
        })
        document.body.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.alt = e.shiftKey;
        })
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        const mSpeed = this.alt ? 5 : 3
        if (this.transform) {
            if (this.keys["w"]) {
                this.transform.position.y -= mSpeed
            } else if (this.keys["s"]) {
                this.transform.position.y += mSpeed
            }

            if (this.keys["a"]) {
                this.transform.position.x -= mSpeed
            } else if (this.keys["d"]) {
                this.transform.position.x += mSpeed
            }

            if (this.keys["r"]) {
                this.transform.position = {x: -64-app.viewportScale.x/2, y: -24-app.viewportScale.y/2}
            }
        }
    }
}

class EditorRenderer extends Engine.ComponentBase {
    isMouseDown: boolean = false;
    isDragging: boolean = false;
    isResizing: boolean = false;
    offset: Engine.vector = {x:0, y:0}
    mPos: Engine.vector = {x:0, y:0}

    override onInitialized(): void {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                if (selectedStaticObject != -1) {
                    scene.staticObjects.splice(selectedStaticObject, 1);
                    selectedStaticObject = -1;
                } else if (selectedDynamicObject != -1) {
                    scene.dynamicObjects.splice(selectedStaticObject, 1);
                    selectedDynamicObject = -1;
                }
            }
        })

        app.canvas.addEventListener("mousedown", (e) => {
            this.isMouseDown = true;
            if (!app.options.downscaleFactor) return
            const wp = {
                x: Math.round((e.clientX / app.options.downscaleFactor + app.renderingClippingPlane.position.x) / 16) * 16,
                y: Math.round((e.clientY / app.options.downscaleFactor + app.renderingClippingPlane.position.y) / 16) * 16
            }

            const wpnr = {
                x: (e.clientX / app.options.downscaleFactor + app.renderingClippingPlane.position.x),
                y: (e.clientY / app.options.downscaleFactor + app.renderingClippingPlane.position.y)
            }

            let select = false;
            scene.staticObjects.forEach(o => {
                const rhPos = {
                    x:o.areaStartPos.x * 16 - 8 + (o.areaScale.x * 16), 
                    y:o.areaStartPos.y * 16 - 8 + (o.areaScale.y * 16)
                }
                const mouseNearResize = scene.staticObjects[selectedStaticObject] === o && Engine.vMath.magnitude({x:rhPos.x - wpnr.x, y:rhPos.y - wpnr.y}) <= 8
                if ((wpnr.x >= o.areaStartPos.x * 16 - 8 && wpnr.y >= o.areaStartPos.y * 16 - 8 && wpnr.x <= rhPos.x && wpnr.y <= rhPos.y) || mouseNearResize) {
                    
                    select = true;

                    // Load Options
                    const objProps = document.getElementById("objectProps");

                    if (!objProps) return

                    objProps.innerHTML = "";
                    
                    const collisionEnabledContainer = document.createElement("label")
                    collisionEnabledContainer.className = "propContainer"

                    const collisionEnabledCheckbox = document.createElement("input")
                    collisionEnabledCheckbox.checked = o.hasCollision;
                    collisionEnabledCheckbox.type = "checkbox"

                    collisionEnabledCheckbox.addEventListener("change", (e) => {
                        o.hasCollision = e?.target?.checked;
                    })

                    const collisionEnabledText = document.createElement("span");
                    collisionEnabledText.innerText = "Collision Enabled"

                    collisionEnabledContainer.appendChild(collisionEnabledText);
                    collisionEnabledContainer.appendChild(collisionEnabledCheckbox);
                    objProps?.appendChild(collisionEnabledContainer);

                    this.isDragging = scene.staticObjects.indexOf(o) == selectedStaticObject
                    this.offset = {x:(wp.x - o.areaStartPos.x * 16), y:(wp.y - o.areaStartPos.y * 16)}
                    if (mouseNearResize) {
                        this.isDragging = false;
                        this.isResizing = true;
                    }
                    selectedStaticObject = scene.staticObjects.indexOf(o);
                    selectedDynamicObject = -1;
                }
            })

            scene.dynamicObjects.forEach(o => {
                const tile = dynamicTiles[o.objectId]
                if (!tile) return
                const c1 = {
                    x: o.position.x * 16 - tile.scale.x / 2,
                    y: o.position.y * 16 - tile.scale.y / 2,
                }

                const c2 = {
                    x: o.position.x * 16 + tile.scale.x / 2,
                    y: o.position.y * 16 + tile.scale.y / 2,
                }

                if (wpnr.x >= c1.x && wpnr.y >= c1.y && wpnr.x <= c2.x && wpnr.y <= c2.y)  {
                    select = true;

                    // Load Options
                    const objProps = document.getElementById("objectProps");

                    if (!objProps) return
                    objProps.innerHTML = "";

                    for (const prop of Object.keys(o.objectData)) {
                        const propContainer = document.createElement("label")
                        propContainer.className = "propContainer"

                        const propInput = document.createElement("input")
                        propInput.value = o.objectData[prop] as string;
                        propInput.type = "text"

                        propInput.addEventListener("change", (e) => {
                            o.objectData[prop] = e?.target?.value;
                        })

                        const propText = document.createElement("span");
                        propText.innerText = prop

                        propContainer.appendChild(propText);
                        propContainer.appendChild(propInput);
                        objProps?.appendChild(propContainer);
                    }

                    this.isDragging = scene.dynamicObjects.indexOf(o) == selectedDynamicObject
                    this.offset = {x:(wp.x - o.position.x * 16), y:(wp.y - o.position.y * 16)}
                    
                    selectedDynamicObject = scene.dynamicObjects.indexOf(o);
                    selectedStaticObject = -1;
                }
            })

            if (!select) {
                let newDyn = false;
                let newSta = false;
                if (selectedStaticObject == -1 && selectedDynamicObject == -1) {
                    if (Object.keys(dynamicTiles).includes(currentTile)) {
                        scene.dynamicObjects.push({
                            objectId: currentTile,
                            position: {x:Math.round(wp.x / 16), y:Math.round(wp.y / 16)},
                            objectData: structuredClone(dynamicTiles[currentTile]?.objectDataShape) as Record<string, string>
                        })
                        newDyn = true;
                    } else {
                        scene.staticObjects.push({
                            objectId: currentTile,
                            areaStartPos: {x:Math.round(wp.x / 16), y:Math.round(wp.y / 16)},
                            areaScale: {x:2, y:2},
                            hasCollision: true
                        })
                        newSta = true;
                    }
                }
                
                selectedStaticObject = -1;
                selectedDynamicObject = -1;
            }
        })

        app.canvas.addEventListener("mouseup", (e) => {
            this.isMouseDown = false;
            this.isDragging = false;
        });

        app.canvas.addEventListener("mousemove", (e) => {
            if (!app.options.downscaleFactor) return
            const wp = {
                x: Math.round((e.clientX / app.options.downscaleFactor + app.renderingClippingPlane.position.x) / 16) * 16,
                y: Math.round((e.clientY / app.options.downscaleFactor + app.renderingClippingPlane.position.y) / 16) * 16
            }
            if (selectedStaticObject != -1 && this.isMouseDown) {
                const areaStartPos = scene.staticObjects?.[selectedStaticObject]?.areaStartPos
                const areaScale = scene.staticObjects?.[selectedStaticObject]?.areaScale
                if (!areaStartPos || !areaScale) return
                if (this.isDragging) {
                    areaStartPos.x = Math.round((wp.x - this.offset.x) / 16)
                    areaStartPos.y = Math.round((wp.y - this.offset.y) / 16)
                } else if (this.isResizing) {
                    areaScale.x = Math.max(Math.round((wp.x - areaStartPos.x * 16) / 16), 1);
                    areaScale.y = Math.max(Math.round((wp.y - areaStartPos.y * 16) / 16), 1);
                }
            } else if (selectedDynamicObject != -1 && this.isMouseDown) {
                const position = scene.dynamicObjects?.[selectedDynamicObject]?.position;
                if (!position) return
                if (this.isDragging) {
                    position.x = Math.round((wp.x - this.offset.x) / 16)
                    position.y = Math.round((wp.y - this.offset.y) / 16)
                }
            }
            this.mPos = {x:e.clientX, y:e.clientY};
        })
    }

    override onLateUpdate(): void {
        const ctx = app.ctx;

        // Render Grid
        ctx.strokeStyle = "#8fcfff"
        ctx.strokeWeight = 1

        for (let i = 0; i < Math.round(app.viewportScale.x/16)+2; i++) {
            for (let b = 0; b < Math.round(app.viewportScale.y/16)+2; b++) {
                ctx.strokeRect(
                    Math.round(app.renderingClippingPlane.position.x / 16 - 1)*16+16*i-8 - app.renderingClippingPlane.position.x,
                    Math.round(app.renderingClippingPlane.position.y / 16 - 1)*16+16*b-8 - app.renderingClippingPlane.position.y,
                    16,16)
            }   
        }

        // Render Objects
        for (const object of scene.dynamicObjects) {
            const tile = dynamicTiles[object.objectId]
            if (!tile) continue
            const sprite = tileImageCache[object.objectId]
            if (!sprite) continue
            Engine.draw(ctx, sprite, 0, 
                {x:object.position.x * 16 - app.renderingClippingPlane.position.x, y: object.position.y * 16 - app.renderingClippingPlane.position.y}, 
                {x:tile.scale.x, y:tile.scale.y})
            if (scene.dynamicObjects.indexOf(object) == selectedDynamicObject) {
                const tile = dynamicTiles[object.objectId];
                if (!tile) continue
                ctx.strokeStyle = "#ffcf8f"
                ctx.strokeRect(
                    object.position.x * 16 - app.renderingClippingPlane.position.x - tile.scale.x / 2,
                    object.position.y * 16 - app.renderingClippingPlane.position.y - tile.scale.y / 2,
                    tile.scale.x, tile.scale.y)
            }
        }

        for (const object of scene.staticObjects) {
            const isTileset = Object.keys(tileset).includes(object.objectId) ? true : false;
            let sprite = isTileset ? null : tileImageCache[object.objectId];
            for (let x = 0; x < object.areaScale.x; x++) {
                for (let y = 0; y < object.areaScale.y; y++) {
                    if (isTileset) {
                        // Corner Conditions
                        const corners: Array<Engine.vector> = [
                            {x: 0, y: 0},
                            {x: object.areaScale.x-1, y: 0},
                            {x: 0, y: object.areaScale.y-1},
                            {x: object.areaScale.x-1, y: object.areaScale.y-1}
                        ]
                        const cornerTilesetPositions: Array<Engine.vector> = [{x: 0, y: 0}, {x: 2, y: 0}, {x: 0, y: 2}, {x: 2, y: 2}]

                        let tileType = {x: 1, y: 1} as Engine.vector | undefined;
                        const pos = {x: x, y: y};

                        if (corners.some(corner => corner.x == pos.x && corner.y == pos.y)) {
                            tileType = cornerTilesetPositions[corners.findIndex(corner => corner.x == pos.x && corner.y == pos.y)];
                        } else {
                            tileType = pos.x === 0 ? {x: 0, y: 1} : tileType;
                            tileType = pos.x === object.areaScale.x ? {x: 2, y: 1} : tileType;

                            tileType = pos.y === 0 ? {x: 1, y: 0} : tileType;
                            tileType = pos.y === object.areaScale.y ? {x: 1, y: 2} : tileType;
                        }

                        if (tileType === undefined) {
                            console.log(`[${chalk.red("Error")}] Tile not found!`)
                            continue
                        } else {
                            if (!tileset[object.objectId]?.[tileType.y]?.[tileType.x]) continue
                            sprite = tileImageCache[tileset[object.objectId]?.[tileType.y]?.[tileType.x] as string]
                        }
                    }

                    sprite = object.objectId == "null" ? tileImageCache["editor-null"] : sprite
                    if (sprite)
                    Engine.draw(ctx, sprite, 0, {x:object.areaStartPos.x*16+(x*16)-app.renderingClippingPlane.position.x, y:object.areaStartPos.y*16+(y*16)-app.renderingClippingPlane.position.y}, {x:16, y:16})
                }
            }
            if (scene.staticObjects.indexOf(object) == selectedStaticObject) {
                ctx.strokeStyle = "#ffcf8f"
                ctx.strokeRect(
                    object.areaStartPos.x * 16 - 8 - app.renderingClippingPlane.position.x,
                    object.areaStartPos.y * 16 - 8 - app.renderingClippingPlane.position.y,
                    object.areaScale.x*16, object.areaScale.y*16)
                
                ctx.fillStyle = "#cf8fff"
                ctx.beginPath();
                ctx.arc(object.areaStartPos.x * 16 - 8 + (object.areaScale.x * 16) - app.renderingClippingPlane.position.x, object.areaStartPos.y * 16 - 8 + (object.areaScale.y * 16) - app.renderingClippingPlane.position.y, 4, 0, 2*Math.PI)
                ctx.fill()
            }
        }

        // Draw player spawn
        Engine.draw(ctx, playerSprite, 0, {x:-64 - app.renderingClippingPlane.position.x, y:-24 - app.renderingClippingPlane.position.y}, {x:12, y:16})
    }
}

document.getElementById("exportLevelButton")?.addEventListener("click", (e) => {
    console.log("Exporting")
    const exportedTextArea = document.getElementById("export");
    if (!exportedTextArea) return;
    exportedTextArea.value = JSON.stringify(scene);
})

document.getElementById("importLevelButton")?.addEventListener("click", (e) => {
    console.log("Importing")
    const exportedTextArea = document.getElementById("export");
    if (!exportedTextArea) return;
    scene = JSON.parse(exportedTextArea.value as string);
})

document.getElementById("playtestButton")?.addEventListener("click", (e) => {
    console.log("Playtesting")
    const exportedTextArea = document.getElementById("export");
    if (!exportedTextArea) return;
    window.open(`/?map=${JSON.stringify(scene)}`)
})

let menuOpen = false;
function updateSidebar() {
    for (const elem of document.getElementsByClassName("sidebar")) {
        elem.style.transform = menuOpen ? "translateX(0%)" : "translateX(100%)";
    }

    const levelExport = document.querySelector(".exportedLevel")
    if (!levelExport) return
    levelExport.style.transform = menuOpen ? "translateX(0%)" : "translateX(calc(-100% - 24px))";
}

updateSidebar()
document.getElementById("menuButton")?.addEventListener("click", (e) => {
    console.log("MENU")
    menuOpen = !menuOpen;
    updateSidebar()
})

document.body.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        menuOpen = !menuOpen;
        updateSidebar();
    }
})


let scene: SerializedWorld = {
    staticObjects: [],
    dynamicObjects: []
}

let selectedStaticObject: number = -1;
let selectedDynamicObject: number = -1;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

scene = urlParams.get("map") ? JSON.parse(urlParams.get("map") as string) : scene

const app = new Engine.App({
    downscaleFactor: 2
});

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Transform({x: -64-app.viewportScale.x/2, y: -24-app.viewportScale.y/2}, 0, {x: 0, y: 0}))
    .addComponent(new Engine.Camera())
    .addComponent(new CameraController())
    .build())

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Transform({x: 0, y: 0}, 0, {x: 16, y: 16}))
    .addComponent(new EditorRenderer())
    .build())

app.start(60);