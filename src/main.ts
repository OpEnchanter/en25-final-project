import * as Engine from "./lib/engine.ts";
import chalk from "chalk";

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
        this.transform.position.y += (Math.min(this.playerTransform.position.y+app.viewportScale.y/4, 150) - this.transform.position.y) / 4
    }
}

class SpriteChanger extends Engine.ComponentBase {
    private sprite: Engine.Sprite | null = null
    private rigidbody: Engine.Rigidbody | null = null;
    private transform: Engine.Transform | null = null;
    override onInitialized(): void {
        this.sprite = this.object?.getComponents(Engine.Sprite)[0] as Engine.Sprite;
        this.rigidbody = this.object?.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody;
        this.transform = this.object?.getComponents(Engine.Transform)[0] as Engine.Transform;
    }

    override onUpdate(): void {
        if (!this.sprite || !this.rigidbody || !this.transform) return
        if (Math.abs(this.rigidbody.velocity.x) > 0.3) {
            this.sprite.texture.src = "/src/assets/crouch.png"
            this.transform.rotation += this.rigidbody.velocity.x*4;
        } else {
            this.sprite.texture.src = "/src/assets/run.png"
            this.transform.rotation += (0 - this.transform.rotation) / 2
        }
    }
}

console.log(chalk.black(`
┌-------------------------------------------------------┐
|                    ${chalk.bold("Super Mr. Bennet")}                   |
|           ${chalk.italic("By Nathan Le and Tristan Greenhagen")}         |
└-------------------------------------------------------┘
`));

console.log(chalk.italic("Based on works by Nintendo and Jane Austen"))

const app = new Engine.App({
    downscaleFactor: 4
});

for (let b = 0; b < 0; b++) {
    for (let i = 0; i < 0; i++) {
        let o: Engine.GameObject = new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:64+(16*b), y:64+(16*i)}, 0, {x:16, y:16}))
            .addComponent(new Engine.Sprite("/src/assets/image.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Engine.BoxCollider({x: 16, y: 16}))
            .addComponent(new Engine.Rigidbody({
                bounciness: 1,
                friction: 0.98,
                drag: 0.98,
                density: 1
            }))
            .build();
        (o.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody).velocity = {x:4, y:4}
        app.addObject(o)
    }
}

const player = new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/mario.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:64, y:64}, 0, {x:16, y:16}))
    .addComponent(new Engine.BoxCollider({x: 16, y: 16}))
    .addComponent(new SpriteChanger())
    .addComponent(new Engine.Rigidbody({
        bounciness: 0,
        friction: 0.98,
        drag: 0.98,
        density: 9
    }))
    .addComponent(new Engine.PlayerController())
    .build()

app.addObject(player)

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Transform({x:0, y:0}, 0, {x:0, y:0}))
    .addComponent(new Engine.Camera())
    .addComponent(new CameraController(player.getComponents(Engine.Transform)[0] as Engine.Transform))
    .build())

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/image.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:256, y:256}, 0, {x:512, y:96}))
    .addComponent(new Engine.BoxCollider({x: 512, y: 96}))
    .build())

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/image.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:0, y:256}, 0, {x:96, y:512}))
    .addComponent(new Engine.BoxCollider({x: 96, y: 512}))
    .build())

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/image.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:512, y:256}, 0, {x:96, y:512}))
    .addComponent(new Engine.BoxCollider({x: 96, y: 512}))
    .build())

app.start(60);