import * as Engine from "./lib/engine.ts";
const app = new Engine.App({
    downscaleFactor: 4
});

app.addObject(new Engine.GameObjectBuilder(app)
    .addComponent(new Engine.Transform({x:12, y:12}, 0, {x:24, y:24}))
    .addComponent(new Engine.Sprite("/src/assets/test.png"))
    .addComponent(new Engine.Renderer(app.ctx))
    .addComponent(new Engine.PlayerController())
    .addComponent(new Engine.BoxCollider({x: 16, y: 16}))
    .addComponent(new Engine.Rigidbody())
    .build())

app.start();