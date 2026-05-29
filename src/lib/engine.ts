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

export function draw(ctx: any, image: HTMLImageElement | HTMLCanvasElement, rotation: number, position: vector, scale: vector) {
    if (!ctx) {throw new Error("Canvas context not found")}
    const xscalar = scale.x < 0 ? -1 : 1
    ctx.translate(position.x, position.y);
    ctx.rotate((Math.PI / 180) * rotation);
    ctx.scale(xscalar, 1)
    ctx.translate(-1*(position.x), -1*(position.y));

    ctx.drawImage(image, position.x-(scale.x/2), position.y-(scale.y/2), scale.x, scale.y);

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
    private ctx: any;
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

    override onLateUpdate(): void {
        if (!this.transform || !this.object) {return}
        const vscale = this.object.app.viewportScale;
        const cplane = this.object.app.renderingClippingPlane;
        const p = {
            x: Math.round(this.transform.position.x - (cplane.position.x - vscale.x / 2)),
            y: Math.round(this.transform.position.y - (cplane.position.y - vscale.y / 2))
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
        console.log("INIT")
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
                if (obRb) {
                    const obDensity = obRb.bodyProps.density;

                    const density = this.bodyProps.density;

                    const totalDensity = obDensity + density;

                    obRb.velocity = {
                        x: obRb.velocity.x + vMath.normalize(this.velocity).x * (vMath.magnitude(this.velocity) * (density/totalDensity)),
                        y: obRb.velocity.y + vMath.normalize(this.velocity).y * (vMath.magnitude(this.velocity) * (density/totalDensity))
                    }

                    this.velocity = {
                        x:r.x * (vMath.magnitude(this.velocity) * (obDensity/totalDensity)), 
                        y:r.y * (vMath.magnitude(this.velocity) * (obDensity/totalDensity))
                    }
                } else {
                    this.velocity = {
                        x:r.x * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*-b.y) + 1) * (-1*((1-this.bodyProps.friction)*b.x) + 1), 
                        y:r.y * vMath.magnitude(this.velocity) * (-1*((1-this.bodyProps.bounciness)*b.x) + 1) * (-1*((1-this.bodyProps.friction)*b.y) + 1)
                    }
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
        this.object.app.renderingClippingPlane.position = this.transform.position;
    }
}

export class PlayerController extends ComponentBase {
    keys: any = {};
    private transform: Transform | null = null;
    private rigidbody: Rigidbody | null = null;
    override onInitialized(): void {
        document.body.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        })
        document.body.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        })
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        this.rigidbody = this.object?.getComponents(Rigidbody)[0] as Rigidbody;
    }

    override onUpdate(): void {
        const onGround = this.object?.collisionData[0]?.collisionNormal.y == -1
        const canJump = (this.object?.isColliding && onGround)
        if (this.transform && this.rigidbody) {
            if (this.keys["w"] && canJump) {
                this.transform.position = {x: this.transform?.position.x, y: (this.transform?.position.y as number)-1}
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x, y: this.rigidbody.velocity.y-4}
            }

            if (this.keys["a"]) {
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x-0.1, y: this.rigidbody.velocity.y}
            } else if (this.keys["d"]) {
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x+0.1, y: this.rigidbody.velocity.y}
            }
        }
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

        for (const m of this.Components) {
            m.onLateUpdate();
        }

        this.isCollidingOld = this.isColliding;
        this.isTriggerredOld = this.isTriggerred;
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

export class App {
    public objects: Array<GameObject> = [];
    canvas: HTMLCanvasElement;
    public ctx: any;

    private isRunning: boolean = false;

    options: ApplicationOptions;

    intervalId: any = null;

    public renderingClippingPlane: {
        position: vector,
        scale: vector
    } = {position: {x:0,y:0},scale: {x:0,y:0},};

    public viewportScale: vector = {x:0,y:0}

    constructor (options?: ApplicationOptions) {
        this.options = options ? options : {
            downscaleFactor: 1
        };
        this.canvas = document.body.appendChild((()=>{
            const canvas = document.createElement("canvas");
            canvas.id = "canvas";
            return canvas;
        })());
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false

        if (!this.options.downscaleFactor) return
        const vw = document.body.clientWidth / this.options.downscaleFactor;
        const vh = document.body.clientHeight / this.options.downscaleFactor;
        this.viewportScale = {x:vw, y:vh}
        this.renderingClippingPlane = {
            position: {x:vw/2, y:vh/2},
            scale: {x:vw, y:vh}
        }
    }

    addObject(obj: GameObject) {
        if (this.isRunning) this.objects.forEach(o => {o.newSceneObject(obj)})
        this.objects.push(obj);
        if (this.isRunning) obj.onInitialized();
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId)
    }

    start(targetFramerate: number) {
        let t = 0;
        for(const object of this.objects) {
            object.onInitialized();
        }
        document.body.addEventListener("keydown", (e) => {
            if (e.key === "g" && e.altKey) {
                e.preventDefault();
                debugEnabled = !debugEnabled;
            }
        })
        console.log(`[${chalk.blueBright("Info")}] App starting!`)
        this.intervalId = setInterval(() => {
            const dsf = this.options.downscaleFactor
            fixScale(this.canvas, dsf ? dsf : 1)
            this.ctx.fillStyle = "#9fdfff"
            this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
            for (const object of this.objects) {
                object.onUpdate();
            }
            t++;
        }, 1000/targetFramerate)
        this.isRunning = true;
    }
}