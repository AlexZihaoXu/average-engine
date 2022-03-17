import {Clock} from "./average-engine/system";
import {Game, Texture} from "./average-engine/graphics";
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
        this.eventRegistries.render.register(async (renderer, dt) => {
            renderer.clear()
            renderer.fillRect(0, 0, 100, 100)
            renderer.setFont(font)
            renderer.setTextSize((Math.cos(timer.elapsedTime.seconds * 5) + 1) / 2 * 10 + 40)
            renderer.fillText("Hello world", 500, 500)
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
