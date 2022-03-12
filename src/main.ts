import {Clock} from "./average-engine/system";
import {Game, Texture} from "./average-engine/graphics";
import {AsyncResourceLoader} from "./average-engine/resources";

class MyGame extends Game {
    constructor() {
        super();
        const timer = new Clock()
        let texture: Texture
        this.eventRegistries.setup.register(async () => {
            texture = await AsyncResourceLoader.loadTexture('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png')
            console.log("Game started")
        })
        this.eventRegistries.dispose.register(async () => {
            console.log("Game stopped")
        })
        this.eventRegistries.render.register(async (renderer, dt) => {
            renderer.clear()
            if (this.width < 1000)
                this.width += Math.ceil((1000 - this.width) * 1.5 * dt.seconds)
            if (this.height < 800)
                this.height += Math.ceil((800 - this.height) * 1.5 * dt.seconds)
            renderer.setFillColor(1, 0, 0)
            this.renderer.fillRect(this.width * 2 / 3, (Math.sin(timer.elapsedTime.seconds) - Math.cos(timer.elapsedTime.seconds * 3) * Math.sin(timer.elapsedTime.seconds* 20) + 1) * 150 + 100, 25, 25)
            renderer.render(texture, this.width * 2 / 3, (Math.cos(timer.elapsedTime.seconds * 10) + 1) * 150 + 100)
        })
    }
}

export const GAME = new MyGame()
// @ts-ignore
window.GAME = GAME
document.body.appendChild(GAME.htmlElement)
GAME.start()

//
// const ta = document.createElement('textarea')
// ta.style.position = 'absolute'
// ta.style.backgroundColor = 'orange'
// ta.style.width = '100px'
// ta.style.height = '100px'
// ta.style.top = '30px'
// ta.style.left = '30px'
// ta.innerText = 'Hello world'
// document.body.appendChild(ta)
