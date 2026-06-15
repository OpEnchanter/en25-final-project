import chalk from "chalk"

let debugEnabled = false;

export type vector = {
    x: number,
    y: number
}

export type CollisionData = {
    collisionVector: vector,
    collisionObjectPosition: vector,
    collisionNormal: vector,
    collisionObjectBounds: vector,
    object: null | GameObject
}

export type TriggerData = {
    object: null | GameObject
}

export type BodyProperties = {
    bounciness: number,
    density: number,
    drag: number,
    friction: number
}

export class vMath {
    public static dot(a: vector, b: vector): number {
        return (a.x*b.x) + (a.y*b.y);
    }

    public static magnitude(a: vector): number {
        return Math.sqrt(a.x**2 + a.y**2)
    }

    public static normalize(a: vector): vector {
        const m = this.magnitude(a);
        if (m===0) return {x:0, y:0}
        return {x:a.x / m, y:a.y / m} as vector
    }

    public static multiply(a: vector, b: number) {
        return {x:a.x*b, y:a.y*b} as vector
    }

    public static subtract(a: vector, b: vector) {
        return {x:a.x-b.x, y:a.y-b.y}
    }

    public static add(a: vector, b: vector) {
        return {x:a.x+b.x, y:a.y+b.y}
    }
}

export function fixScale(canvas: HTMLCanvasElement, downscaleFactor: number) {
    canvas.width = (document.body.clientWidth / downscaleFactor);
    canvas.height = (document.body.clientHeight / downscaleFactor);
}

export function draw(ctx: any, image: HTMLImageElement, rotation: number, position: vector, scale: vector) {
    if (!ctx) {throw new Error("Canvas context not found")}
    const xscalar = scale.x < 0 ? -1 : 1
    ctx.translate(position.x, position.y);
    ctx.rotate((Math.PI / 180) * rotation);
    ctx.scale(xscalar, 1)
    ctx.translate(-1*(position.x), -1*(position.y));
    try {
        ctx.drawImage(image, position.x-(scale.x/2), position.y-(scale.y/2), scale.x, scale.y);
    } catch {
        console.log(`[${chalk.yellow("Warn")}] Texture '${image.src}' failed to render.`)
        return;
    }

    ctx.translate(position.x, position.y);
    ctx.rotate((Math.PI / 180) * -rotation);
    ctx.scale(xscalar, 1)
    ctx.translate(-1*(position.x), -1*(position.y));
}

export class ComponentBase {
    public object: GameObject | null = null;
    constructor(object?: GameObject) {
        this.object = object ? object : null;
    }

    onCollisionUpdate(): void {};
    onPhysicsUpdate(data: Array<CollisionData>): void {};

    onNewSceneObject(o: GameObject): void {};
    onRemoveSceneObject(o: GameObject): void {};

    onUpdate(): void {};
    onCollisionEnter(params: CollisionData): void {};
    onCollisionExit(): void {};
    onCollisionStay(params: CollisionData): void {};
    onTriggerEnter(params: TriggerData): void {};
    onTriggerExit(): void {};
    onTriggerStay(params: TriggerData): void {};

    onLateUpdate(): void {};

    onLateRender(): void {};

    onUIRender(): void {};

    onInitialized(): void {};
}

export class Transform extends ComponentBase {
    public position: vector;
    public rotation: number;
    public scale: vector;
    constructor(position?: vector, rotation?: number, scale?: vector) {
        super();
        this.position = position ? position : {x:0, y:0};
        this.rotation = rotation ? rotation : 0;
        this.scale = scale ? scale : {x:24, y:24};
    }
}

export class Sprite extends ComponentBase {
    public texture: any = new window.Image();
    constructor(src: string | HTMLCanvasElement) {
        super();
        if (src instanceof HTMLCanvasElement) {
            this.texture = src;
        } else {
            this.texture.src = src;
        }
    }
}

export class Renderer extends ComponentBase {
    private ctx: CanvasRenderingContext2D;
    private sprite: Sprite | null;
    private transform: Transform | null;
    constructor(ctx: any) {
        super();
        this.ctx = ctx;
        this.sprite = null;
        this.transform = null;
    } 

    override onInitialized(): void {
        this.sprite = this.object?.getComponents(Sprite)[0] as Sprite;
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
    }

    override onLateRender(): void {
        if (!this.transform || !this.object) {return}
        const vscale = this.object.app.renderingClippingPlane.scale;
        const cplane = this.object.app.renderingClippingPlane;
        const p = {
            x: Math.floor(this.transform.position.x - (cplane.position.x - vscale.x / 2)),
            y: Math.floor(this.transform.position.y - (cplane.position.y - vscale.y / 2))
        } as vector
        if (p.x - Math.abs(this.transform.scale.x) < vscale.x && p.y - Math.abs(this.transform.scale.y) < vscale.y) {
            draw(this.ctx, this.sprite?.texture as HTMLImageElement, this.transform?.rotation as number, p, this.transform?.scale as vector)
        }
    }
}

export class BoxCollider extends ComponentBase {
    bounds: vector;
    transform: Transform | null = null;
    colliders: Array<BoxCollider> = [];
    transforms: Array<Transform> = [];
    isTrigger: boolean = false;
    offset: vector = {x:0, y:0};

    constructor(bounds: vector, offset: vector, isTrigger: boolean) {
        super();
        this.bounds = bounds;
        this.isTrigger = isTrigger;
        this.offset = offset;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        if (!this.object) return
        for (const o of this.object?.app.objects) {
            const oCols = o.getComponents(BoxCollider) as Array<BoxCollider>;
            const transform = o.getComponents(Transform)[0] as Transform;
            for (const col of oCols) {
                if (!col.isTrigger && col.object !== this.object) {
                    this.colliders.push(col);
                    this.transforms.push(transform);
                }
            }
        }
    }

    override onNewSceneObject(o: GameObject): void {
        const cols = o.getComponents(BoxCollider) as Array<BoxCollider>;
        const transform = o.getComponents(Transform)[0] as Transform;
        for (const col of cols) {
            this.colliders.push(col);
            this.transforms.push(transform);
        }
    }

    override onRemoveSceneObject(o: GameObject): void {
        const cols = o.getComponents(BoxCollider) as Array<BoxCollider>;
        let colsToRemove: Array<number> = [];
        for (const col of cols) {
            const idx = this.colliders.indexOf(col);
            this.transforms.splice(idx, 1);
            colsToRemove.push(idx)
        }
        for (const idx of colsToRemove) {
            this.colliders.splice(idx, 1)
        }
    }

    override onCollisionUpdate(): void {
        if (!this.transform || !this.object) { return }
        this.object.isColliding = false;

        const tb = this.bounds;
        const tp = this.transform.position;

        for (let i = 0; i < this.colliders.length; i++) {
            const b = this.colliders[i]?.bounds;
            const p = this.transforms[i]?.position;
            const o = this.colliders[i]?.offset
            if (!b || !p || !o) { continue }

            const ax = tp.x + this.offset.x
            const ay = tp.y + this.offset.y

            if (debugEnabled) {
                if (!this.object.app.ctx) return;
                this.object.app.ctx.fillStyle = this.isTrigger ? "#afffaf" : "#ffefaf"
                this.object.app.ctx.fillRect(ax-this.bounds.x/2 - this.object.app.renderingClippingPlane.position.x + this.object.app.viewportScale.x / 2, ay-this.bounds.y/2 - this.object.app.renderingClippingPlane.position.y + this.object.app.viewportScale.y / 2, this.bounds.x, this.bounds.y)
            }

            const bx = p.x + o.x
            const by = p.y + o.y

            const dx = ax - bx
            const dy = ay - by

            const px = (tb.x / 2 + b.x / 2) - Math.abs(dx)
            const py = (tb.y / 2 + b.y / 2) - Math.abs(dy)

            if (px > 0 && py > 0) {
                if (!this.isTrigger) {
                    this.object.isColliding = true;

                    let pv: vector = {
                        x: dx<0 ? px : -px, 
                        y: dy<0 ? py : -py
                    };

                    let mtv: vector;
                    let nv: vector;

                    if (px < py) {
                        mtv = { x: pv.x, y: 0 };
                        nv  = { x: dx < 0 ? -1 : 1, y: 0 };
                    } else {
                        mtv = { x: 0, y: pv.y };
                        nv  = { x: 0, y: dy < 0 ? -1 : 1 };
                    }

                    this.object.collisionData.push({
                        collisionVector: mtv,
                        collisionObjectPosition: {
                            x: p.x,
                            y: p.y
                        },
                        collisionNormal: nv,
                        collisionObjectBounds: b,
                        object: this.colliders[i]?.object as GameObject
                    })
                } else {
                    this.object.isTriggerred = true;
                    this.object.triggerData.push({
                        object: this.colliders[i]?.object as GameObject
                    });
                }
            }
        }
    }
}

export class Rigidbody extends ComponentBase {
    velocity: vector = {x:0, y:0};
    transform: Transform | null = null;
    lastPos: vector | null = null;
    public bodyProps;

    public lastCollisionReflection: vector = {x:0, y:0};
    public lastCollisionPosition: vector = {x:0, y:0};

    boxCollider: BoxCollider | null = null;

    constructor(bodyProps: BodyProperties) {
        super();
        this.bodyProps = bodyProps;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        this.boxCollider = this.object?.getComponents(BoxCollider)[0] as BoxCollider;
        this.lastPos = this.transform.position;
    }

    override onPhysicsUpdate(data: Array<CollisionData>): void {
        let anyFloorCol: boolean = false;
        for (const c of data) {
            if (c.collisionNormal.y < 0) {
                anyFloorCol = true;
            }
        }

        if (anyFloorCol === false) {
            this.velocity = {x:this.velocity.x, y:(this.velocity.y+0.1)};
        }

        // Interaction
        if (data[0]) {
            const params = data[0]

            let b = {
                x: Math.abs(params.collisionNormal.y),
                y: -Math.abs(params.collisionNormal.x)
            }
            
            if (this.transform) {
                this.transform.position = {
                    x: this.transform.position.x - params.collisionVector.x,
                    y: this.transform.position.y - params.collisionVector.y,
                }
            }

            if (this.object?.isColliding && !this.object.isCollidingOld) {
                const a = vMath.normalize(this.velocity);
                
                const scalar = (vMath.dot(a, b) / vMath.magnitude(b)**2) * 2
                const scaledB = vMath.multiply(b, scalar)

                const r = vMath.subtract(scaledB, a);

                this.lastCollisionReflection = r;
                this.lastCollisionPosition = this.transform ? this.transform?.position : {x:0, y:0};

                const otherBody = params.object;
                if (!otherBody) return;
                const obRb = otherBody.getComponents(Rigidbody)[0] as Rigidbody
                this.velocity = {
                    x:r.x * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*-b.y) + 1) * (-1*((1-this.bodyProps.friction)*b.x) + 1), 
                    y:r.y * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*b.x) + 1) * (-1*((1-this.bodyProps.friction)*b.y) + 1)
                }
            } else if (this.object?.isColliding && this.object.isCollidingOld) {
                this.velocity.x *= (-1*((1-this.bodyProps.friction)*b.x) + 1)
                this.velocity.y *= (-1*((1-this.bodyProps.friction)*b.y) + 1)

                const a = vMath.normalize(this.velocity);
                
                const scalar = (vMath.dot(a, b) / vMath.magnitude(b)**2) * 2
                const scaledB = vMath.multiply(b, scalar)

                const r = vMath.subtract(scaledB, a);

                this.velocity = {
                    x:r.x * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*-b.y) + 1) * (-1*((1-this.bodyProps.friction)*b.x) + 1), 
                    y:r.y * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*b.x) + 1) * (-1*((1-this.bodyProps.friction)*b.y) + 1)
                }
            }
        }

        this.velocity = {x:this.velocity.x*this.bodyProps.drag, y:this.velocity.y*this.bodyProps.drag};

        if (this.transform) {
            this.transform.position = {
                x:this.transform?.position.x as number + this.velocity.x,
                y:this.transform?.position.y as number + this.velocity.y
            };
        }
    }
}

export class Camera extends ComponentBase {
    private transform: Transform | null = null;
    override onInitialized(): void {
        if (!this.object) return
        this.transform = this.object.getComponents(Transform)[0] as Transform
    }

    override onUpdate(): void {
        if (!this.transform || !this.object) return
        this.object.app.renderingClippingPlane.position = {
            x: Math.floor(this.transform.position.x),
            y: Math.floor(this.transform.position.y)
        };
    }
}

export class PlayerController extends ComponentBase {
    keys: any = {};
    private transform: Transform | null = null;
    private rigidbody: Rigidbody | null = null;
    private lastGroundedFrame = 0;
    private t = 0;
    override onInitialized(): void {
        document.body.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        }, { signal: this.object?.app.abortSignal })
        document.body.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        }, { signal: this.object?.app.abortSignal })
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        this.rigidbody = this.object?.getComponents(Rigidbody)[0] as Rigidbody;
    }

    override onUpdate(): void {
        const isGroundNormal = this.object?.collisionData[0]?.collisionNormal.y == -1
        const onGround = (this.object?.isColliding && isGroundNormal)
        this.lastGroundedFrame = onGround ? this.t : this.lastGroundedFrame
        const canJump = (this.t - this.lastGroundedFrame) < 6
        if (this.transform && this.rigidbody) {
            if (this.keys["w"] && canJump) {
                this.transform.position = {x: this.transform?.position.x, y: (this.transform?.position.y as number)-1}
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x, y: this.rigidbody.velocity.y-4}
                this.lastGroundedFrame = 0;
            }
            
            const leftCol = this.object?.triggerData.some(col => {
                if (!col.object?.getComponents(Transform) || !this.transform) return false;
                const ot: Transform = (col.object?.getComponents(Transform)[0] as Transform)
                return ot.position.x < this.transform.position.x
            })
            const rightCol = this.object?.triggerData.some(col => {
                if (!col.object?.getComponents(Transform) || !this.transform) return false;
                const ot: Transform = (col.object?.getComponents(Transform)[0] as Transform)
                return ot.position.x > this.transform.position.x
            })

            const playerMovementSpeed = onGround ? 0.15 : 0.05
            this.rigidbody.bodyProps.friction = 0.78
            if (this.keys["a"] && !leftCol) {
                this.rigidbody.velocity.x = this.rigidbody?.velocity.x-playerMovementSpeed
                this.rigidbody.bodyProps.friction = 0.978
            } else if (this.keys["d"] && !rightCol) {
                this.rigidbody.velocity.x = this.rigidbody?.velocity.x+playerMovementSpeed
                this.rigidbody.bodyProps.friction = 0.978
            }
            this.rigidbody.velocity.x = Math.max(-3, Math.min(3, this.rigidbody.velocity.x))
        }
        this.t++;
    }
}

export class GameObject {
    public Components: Array<ComponentBase> = [];
    public isColliding: boolean = false;
    public isTriggerred: boolean = false;

    public collisionData: Array<CollisionData> = [];

    public isCollidingOld: boolean = false;
    public isTriggerredOld: boolean = false;

    public triggerData: Array<TriggerData> = [];

    public app: App;

    constructor (app: App){
        this.app = app;
    }

    public getComponents(type: any): Array<ComponentBase> {
        let Components: Array<ComponentBase> = [];
        for (const Component of this.Components) {
            if (Component instanceof type) {
                Components.push(Component)
            }
        }
        return Components;
    }

    public onInitialized() {
        for (const m of this.Components){
            m.onInitialized();
        }
    }

    public newSceneObject(o: GameObject) {
        this.Components.forEach(m => {
            m.onNewSceneObject(o);
        })
    }

    public removeSceneObject(o: GameObject) {
        this.Components.forEach(m => {
            m.onRemoveSceneObject(o);
        })
    }

    public onUpdate() {

        this.collisionData = [];
        this.triggerData = [];

        this.isColliding = false;
        this.isTriggerred = false;

        for (const m of this.Components) {
            m.onCollisionUpdate();
            m.onPhysicsUpdate(this.collisionData);
            m.onUpdate();
        }

        if (this.isColliding && !this.isCollidingOld) {
            for (const m of this.Components) {
                for (const col of this.collisionData) {
                    m.onCollisionEnter(col);
                }
            }
        } else if (!this.isColliding && this.isCollidingOld) {
            for (const m of this.Components) {
                m.onCollisionExit();
            }
        }

        if (this.isColliding && this.isCollidingOld) {
            for (const m of this.Components) {
                for (const col of this.collisionData) {
                    m.onCollisionStay(col);
                }
            }
        }
        
        if (this.isTriggerred && this.isTriggerredOld) {
            for (const m of this.Components) {
                for (const col of this.collisionData) {
                    m.onTriggerStay(col);
                }
            }
        }

        if (this.isTriggerred && !this.isTriggerredOld) {
            for (const m of this.Components) {
                for (const col of this.triggerData) {
                    m.onTriggerEnter(col);
                }
            }
        } else if (!this.isTriggerred && this.isTriggerredOld) {
            for (const m of this.Components) {
                m.onTriggerExit();
            }
        }

        this.isCollidingOld = this.isColliding;
        this.isTriggerredOld = this.isTriggerred;
    }

    public onLateUpdate() {
        for (const m of this.Components) {
            m.onLateUpdate();
        }
    }

    public onLateRender() {
        for (const m of this.Components) {
            m.onLateRender();
        }
    }

    public onUIRender() {
        for (const m of this.Components) {
            m.onUIRender();
        }
    }
}

export class GameObjectBuilder {
    Components: Array<ComponentBase> = [];
    go: GameObject;
    constructor(app: App) {
        this.go = new GameObject(app);
    }

    addComponent(Component: ComponentBase): GameObjectBuilder {
        Component.object = this.go;
        this.Components.push(Component)
        this.go.Components = this.Components;
        return this;
    }

    build(): GameObject {
        return this.go;
    }
}

type ApplicationOptions = {
    downscaleFactor?: number
}

export class Scene {
    public load(app: App) {}
    public unload() {}
}

let intervalIds: Array<number> = []

function clearIntervalAll(): void {
    intervalIds.forEach(i => {
        clearInterval(i)
    });
    intervalIds = [];
}

export class SceneManager {
    private scenes: Record<string, Scene> = {};
    private curScene: string = "";

    public addScene(scene: Scene, name: string) {
        this.scenes[name] = scene
    }

    public loadScene(name: string, app: App) {
        if (this.curScene !== "") this.scenes[this.curScene]?.unload();
        app.stop()

        clearIntervalAll();
        document.querySelector(".overlays")?.remove();
        app.objects = [];


        this.scenes[name]?.load(app)
        this.curScene = name;
    } 
}

export class App {
    public objects: Array<GameObject> = [];
    canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D | undefined = undefined;

    private isRunning: boolean = false;

    options: ApplicationOptions;

    public sceneManager: SceneManager;

    intervalId: any = null;

    intervalIds: Array<number>;
    abortSignal: any;
    abortController: any;

    public renderingClippingPlane: {
        position: vector,
        scale: vector
    } = {position: {x:0,y:0},scale: {x:0,y:0},};

    public viewportScale: vector = {x:0,y:0}

    lastClientScale: vector = {x:0, y:0}
    lastDownscaleFactor: number = 1

    constructor (sceneManager: SceneManager, options?: ApplicationOptions) {
        this.intervalIds = intervalIds;
        this.abortController = new AbortController();;
        const { signal } = this.abortController;
        this.abortSignal = signal;
        this.options = options ? options : {
            downscaleFactor: 1
        };
        this.sceneManager = sceneManager;
        const canvasParent = document.body.querySelector(".content") != null ? document.body.querySelector(".content") : document.body;
        this.canvas = canvasParent!.appendChild((()=>{
            const canvas = document.createElement("canvas");
            canvas.id = "canvas";
            return canvas;
        })());

        const ctx: CanvasRenderingContext2D | null = this.canvas.getContext("2d")
        if (!ctx) return;
        this.ctx = ctx;
        this.ctx.imageSmoothingEnabled = false

        setInterval(() => {
            if (!this.options.downscaleFactor) return
            const vw = document.body.clientWidth / this.options.downscaleFactor;
            const vh = document.body.clientHeight / this.options.downscaleFactor;
            if (this.lastClientScale.x == vw && this.lastClientScale.y == vh && this.lastDownscaleFactor == this.options.downscaleFactor) return
            this.viewportScale = {x:vw, y:vh}
            this.renderingClippingPlane = {
                position: {x:vw/2, y:vh/2},
                scale: {x:vw, y:vh}
            }
            this.lastClientScale = {x:vw, y:vh}
            this.lastDownscaleFactor = this.options.downscaleFactor;
        }, 500);
    }

    addObject(obj: GameObject) {
        if (this.isRunning) this.objects.forEach(o => {o.newSceneObject(obj)})
        this.objects.push(obj);
        if (this.isRunning) obj.onInitialized();
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.abortController.abort()
    }

    start(targetFramerate: number) {
        this.abortController = new AbortController();
        this.abortSignal = this.abortController.signal;
        let t = 0;
        for(const object of this.objects) {
            object.onInitialized();
        }
        document.body.addEventListener("keydown", (e) => {
            if (e.key === "h" && e.altKey) {
                e.preventDefault();
                debugEnabled = !debugEnabled;
            }
        }, { signal: this.abortSignal })
        console.log(`[${chalk.blueBright("Info")}] App starting!`)
        this.intervalId = setInterval(() => {
            if (!this.ctx) return;
            const dsf = this.options.downscaleFactor
            fixScale(this.canvas, dsf ? dsf : 1)
            this.ctx.fillStyle = "#9fdfff"
            this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
            for (const object of this.objects) {
                object.onUpdate();
            }
            for (const object of this.objects) {
                object.onLateUpdate();
            }
            for (const object of this.objects) {
                object.onLateRender();
            }
            for (const object of this.objects) {
                object.onUIRender();
            }
            t++;
        }, 1000/targetFramerate)
        this.isRunning = true;
    }
}