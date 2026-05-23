export type vector = {
    x: number,
    y: number
}

export function fixScale(canvas: HTMLCanvasElement, downscaleFactor: number) {
    canvas.width = (document.body.clientWidth / downscaleFactor);
    canvas.height = (document.body.clientHeight / downscaleFactor);
}

export function draw(ctx: any, image: HTMLImageElement | HTMLCanvasElement, rotation: number, position: vector, scale: vector) {
    if (!ctx) {throw new Error("Canvas context not found")}
    ctx.translate(position.x, position.y);
    ctx.rotate((Math.PI / 180) * rotation);
    ctx.translate(-1*(position.x), -1*(position.y));

    ctx.drawImage(image, position.x-(scale.x/2), position.y-(scale.y/2), scale.x, scale.y);

    ctx.translate(position.x, position.y);
    ctx.rotate((Math.PI / 180) * -rotation);
    ctx.translate(-1*(position.x), -1*(position.y));
}

class ComponentBase {
    public object: GameObject | null = null;
    constructor(object?: GameObject) {
        this.object = object ? object : null;
    }

    onUpdate(): void {};
    onCollisionEnter(): void {};
    onCollisionExit(): void {};
    onCollisionStay(): void {};
    onTriggerEnter(): void {};
    onTriggerExit(): void {};
    onTriggerStay(): void {};

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
        draw(this.ctx, this.sprite?.texture as HTMLImageElement, this.transform?.rotation as number, this.transform?.position as vector, this.transform?.scale as vector)
    }
}

export class BoxCollider extends ComponentBase {
    bounds: vector;
    transform: Transform | null = null;
    colliders: Array<BoxCollider> = [];
    transforms: Array<Transform> = [];

    constructor(bounds: vector) {
        super();
        this.bounds = bounds;
    }

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        this.object?.app.objects.toSpliced(this.object?.app.objects.indexOf(this.object), 1).forEach(o => {
            const oCols = o.getComponents(BoxCollider) as Array<BoxCollider>;
            const transform = o.getComponents(Transform)[0] as Transform;
            oCols.forEach(col => {
                this.colliders.push(col);
                this.transforms.push(transform);
            })
        });
    }

    override onUpdate(): void {
        if (!this.transform || !this.object) { return }
        this.object.isColliding = false;

        const tb = this.bounds;
        const tp = this.transform.position;

        for (let i = 0; i < this.colliders.length; i++) {
            const b = this.colliders[i]?.bounds;
            const p = this.transforms[i]?.position;
            if (!b || !p) { return }

            if (tp.x + tb.x / 2 > p.x - b.x / 2) {
                this.object.isColliding = true
            }

            if (tp.x - tb.x / 2 > p.x + b.x / 2) {
                this.object.isColliding = true
            }

            if (tp.y + tb.y / 2 > p.y - b.y / 2) {
                this.object.isColliding = true
            }

            if (tp.y - tb.y / 2 > p.y + b.y / 2) {
                this.object.isColliding = true
            }
        }

        if (tp.y + tb.y / 2 > this.object.app.canvas.height) {
            this.object.isColliding = true
        }

        console.log(this.object.isColliding);
    }
}

export class Rigidbody extends ComponentBase {
    velocity: vector = {x:0, y:0};
    transform: Transform | null = null;
    lastPos: vector | null = null;

    override onInitialized(): void {
        this.transform = this.object?.getComponents(Transform)[0] as Transform;
        this.lastPos = this.transform.position;
    }

    override onUpdate(): void {
        if (this.transform) {
            this.transform.position = {
                x:this.transform?.position.x as number + this.velocity.x,
                y:this.transform?.position.y as number + this.velocity.y
            }
        }
        if (!this.object?.isColliding) {
            this.velocity = {x:this.velocity.x, y:(this.velocity.y+0.2)}
        }
    }

    override onCollisionStay(): void {
        if (this.transform && this.object) {
            this.transform.position = {
                x:this.transform?.position.x as number - this.velocity.x,
                y:this.object?.app.canvas.height - 7
            }
        }
        this.velocity = {
            x:0, 
            y:0
        }
        console.log("COLLISION");
    }

    override onLateUpdate(): void {
        this.lastPos = this.transform?.position ? this.transform.position : null;
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
        if (this.transform && this.rigidbody) {
            if (this.keys["w"]) {
                this.transform.position = {x: this.transform?.position.x, y: (this.transform?.position.y as number)-1}
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x, y: this.rigidbody.velocity.y-0.5}
            }
            if (this.keys["s"]) {
                this.transform.position = {x: this.transform?.position.x, y: (this.transform?.position.y as number)+1}
            }

            if (this.keys["a"]) {
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x-0.1, y: this.rigidbody.velocity.y}
            }
            if (this.keys["d"]) {
                this.rigidbody.velocity = {x: this.rigidbody?.velocity.x+0.1, y: this.rigidbody.velocity.y}
            }
        }
    }
}

export class GameObject {
    public Components: Array<ComponentBase> = [];
    public isColliding: boolean = false;
    public isTriggerred: boolean = false;

    private isCollidingOld: boolean = false;
    private isTriggerredOld: boolean = false;

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
        this.Components.forEach(m => {
            m.onInitialized();
        })
    }

    public onUpdate() {

        for (const m of this.Components) {
            m.onUpdate();
        }

        if (this.isColliding && !this.isCollidingOld) {
            for (const m of this.Components) {
                m.onCollisionEnter();
            }
        } else if (!this.isColliding && this.isCollidingOld) {
            for (const m of this.Components) {
                m.onCollisionExit();
            }
        }

        if (this.isColliding && this.isCollidingOld) {
            for (const m of this.Components) {
                m.onCollisionStay();
            }
        }
        
        if (this.isTriggerred && this.isTriggerredOld) {
            for (const m of this.Components) {
                m.onTriggerStay();
            }
        }

        if (this.isTriggerred && !this.isTriggerredOld) {
            for (const m of this.Components) {
                m.onTriggerEnter();
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

    options: ApplicationOptions;

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
    }

    addObject(obj: GameObject) {
        this.objects.push(obj);
    }

    start() {
        console.log("[Info] App starting!")
        document.addEventListener("DOMContentLoaded", () => {
            let t = 0;
            this.objects.forEach(object => {
                object.onInitialized();
            });
            setInterval(() => {
                const dsf = this.options.downscaleFactor
                fixScale(this.canvas, dsf ? dsf : 1)
                this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
                for (const object of this.objects) {
                    object.onUpdate();
                }
                t++;
            }, 1000/60)
        })
    }
}