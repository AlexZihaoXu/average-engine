import {Clock} from "./average-engine/system";
import {Game, Renderer, Texture} from "./average-engine/graphics";
import {AsyncResourceLoader, Font} from "./average-engine/resources";

class MyGame extends Game {
    constructor() {
        super();
        const timer = new Clock()
        let texture: Texture
        let font: Font
        this.eventRegistries.setup.register(async () => {
            texture = await AsyncResourceLoader.loadTexture('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png')
            font = await AsyncResourceLoader.loadFont('awa.ttf')
            console.log("Game started")
        })
        this.eventRegistries.dispose.register(async () => {
            console.log("Game stopped")
        })
        this.eventRegistries.click.register(async (button, x, y) => {
            console.log(button)
        })
        let angle = 0
        this.eventRegistries.render.register(async (renderer, dt) => {
            renderer.clear()
            // renderer.fillRect(0, 0, 100, 100)
            renderer.setFont(font)
            renderer.setTextSize((Math.cos(timer.elapsedTime.seconds * 5) + 1) / 2 * 25 + 100)
            // renderer.setTextSize(100)

            angle += dt.seconds

            let m = 'awa'

            const width = renderer.getTextWidth(m)

            renderer.pushMatrix()

            renderer.translate(this.width / 2, this.height / 2)
            renderer.rotate(angle)
            renderer.translate(-width / 2, - renderer.getTextSize() / 2)
            renderer.setStrokeColor(1, 0, 0)
            renderer.strokeRect(0, 0, width, renderer.getTextSize())
            renderer.setStrokeColor(0, 1, 0)
            renderer.fillText(m, 0, 0)

            renderer.popMatrix()

            renderer.setTextSize(24)
            renderer.fillText('FPS: 233', 0, 0)
            renderer.fillRect(0, 24, 100, 1)


        })
    }
}

export const GAME = new MyGame()
// @ts-ignore
window.GAME = GAME
document.body.appendChild(GAME.htmlElement)
GAME.width = window.innerWidth
GAME.height = window.innerHeight
window.addEventListener('resize', ev => {
    GAME.width = window.innerWidth
    GAME.height = window.innerHeight
})
GAME.start()

document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

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
