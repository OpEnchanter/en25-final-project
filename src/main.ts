import * as Engine from "./lib/engine.ts";
import chalk from "chalk";
const app = new Engine.App({
    downscaleFactor: 4
});

console.log(chalk.black(`
┌-------------------------------------------------------┐
|                    ${chalk.bold("Super Mr. Bennet")}                   |
|           ${chalk.italic("By Nathan Le and Tristan Greenhagen")}         |
└-------------------------------------------------------┘
`));

console.log(chalk.italic("Based on works by Nintendo and Jane Austen"))

for (let b = 0; b < 0; b++) {
    for (let i = 0; i < 6; i++) {
        let o: Engine.GameObject = new Engine.GameObjectBuilder(app)
            .addComponent(new Engine.Transform({x:64+(16*b), y:64+(16*i)}, 0, {x:16, y:16}))
            .addComponent(new Engine.Sprite("/src/assets/smorf.png"))
            .addComponent(new Engine.Renderer(app.ctx))
            .addComponent(new Engine.BoxCollider({x: 16, y: 16}))
            .addComponent(new Engine.Rigidbody({
                bounciness: 0,
                friction: 0,
                drag: 0.9,
                density: 1
            }))
            .build();
        (o.getComponents(Engine.Rigidbody)[0] as Engine.Rigidbody).velocity = {x:4, y:4}
        app.addObject(o)
    }
}

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Sprite("/src/assets/mario.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.Transform({x:64, y:64}, 0, {x:16, y:16}))
    .addComponent(new Engine.BoxCollider({x: 16, y: 16}))
    .addComponent(new Engine.Camera())
    .addComponent(new Engine.Rigidbody({
        bounciness: 0,
        friction: 0.98,
        drag: 0.98,
        density: 1
    }))
    .addComponent(new Engine.PlayerController())
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