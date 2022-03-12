import {EventRegistry, Clock} from "./system";
import {Time} from "./units";

export interface Displayable {
    get width(): number

    get height(): number
}

export interface Renderable extends Displayable {
    get context(): CanvasRenderingContext2D

    get renderer(): Renderer

}

export class Renderer {
    private _r = 1
    private _g = 1
    private _b = 1
    private _a = 1
    public readonly context: CanvasRenderingContext2D
    public readonly renderable: Renderable

    constructor(renderable: Renderable) {
        this.context = renderable.context
        this.renderable = renderable
    }

    private applySettings() {
        this.context.fillStyle = `rgba(${Math.floor(Math.min(255, Math.max(0, this._r * 255)))}, ${Math.floor(Math.min(255, Math.max(0, this._g * 255)))}, ${Math.floor(Math.max(255, Math.min(0, this._b * 255)))}, ${this._a})`
    }

    public setFillColor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this._r = r
        this._g = g
        this._b = b
        this._a = a
    }

    public fillRect(x: number, y: number, w: number, h: number) {
        this.applySettings()
        this.context.fillRect(x, y, w, h)
    }

    public clear() {
        this.context.clearRect(0, 0, this.renderable.width, this.renderable.height)
    }
}

export abstract class Game implements Renderable {

    private static _activeWindowCount = 0
    public readonly htmlElement: HTMLCanvasElement
    public readonly eventRegistries = {
        setup: new EventRegistry<() => Promise<void>>(),
        update: new EventRegistry<(deltaTime: Time) => Promise<void>>(),
        render: new EventRegistry<(deltaTime: Time) => Promise<void>>(),
        lateUpdate: new EventRegistry<(deltaTime: Time) => Promise<void>>(),
        dispose: new EventRegistry<() => Promise<void>>(),

        keydown: new EventRegistry<(key: string) => Promise<void>>(),
        keyup: new EventRegistry<(key: string) => Promise<void>>(),
        mousemove: new EventRegistry<(x: number, y: number, deltaX: number, deltaY: number) => Promise<void>>(),
        mousedown: new EventRegistry<(button: number, x: number, y: number) => Promise<void>>(),
        mouseup: new EventRegistry<(button: number, x: number, y: number) => Promise<void>>(),
        click: new EventRegistry<(button: number, x: number, y: number) => Promise<void>>(),
        // 'touchstart': new CallbackRegistry<(w: number, h: number) => Promise<void>>(),
        // 'touchend': new CallbackRegistry<(w: number, h: number) => Promise<void>>(),
        // 'touchmove': new CallbackRegistry<(w: number, h: number) => Promise<void>>(),
    }

    protected constructor() {
        this.htmlElement = document.createElement('canvas')
        this.htmlElement.style.backgroundColor = 'black'

        this.htmlElement.oncontextmenu = (ev) => {
            ev.preventDefault()
        }
        window.onkeydown = (ev) => {
            if (Game._activeWindowCount > 0) {
                if (!(ev.ctrlKey && ev.shiftKey && ev.code === 'KeyI'))
                    ev.preventDefault()
            }
        }
        this.htmlElement.onmouseenter = () => {
            Game._activeWindowCount++
        }
        this.htmlElement.onmouseleave = () => {
            Game._activeWindowCount--
        }
    }

    get context(): CanvasRenderingContext2D {
        return this.htmlElement.getContext('2d') as CanvasRenderingContext2D
    }

    get width(): number {
        return this.htmlElement.width;
    }

    set width(w) {
        this.htmlElement.width = w
    }

    get height(): number {
        return this.htmlElement.height;
    }

    set height(h) {
        this.htmlElement.height = h
    }

    get renderer(): Renderer {
        return new Renderer(this);
    }

    public start() {

        (
            async () => {
                await this.eventRegistries.setup.execute(async callback => {
                    await callback()
                })
                const dtClock = new Clock()

                const eventQueue: { event: Event, type: number }[] = []
                const MOUSE_MOVE = 0
                const MOUSE_DOWN = 1
                const MOUSE_UP = 2
                const MOUSE_CLICK = 3
                const KEY_DOWN = 0
                const KEY_UP = 1

                // Setup Events
                window.addEventListener('keydown', ev => {
                    if (!ev.repeat)
                        eventQueue.push({event: ev, type: KEY_DOWN})
                })
                window.addEventListener('keyup', ev => {
                    eventQueue.push({event: ev, type: KEY_UP})
                })
                this.htmlElement.addEventListener('mousemove', ev => {
                    eventQueue.push({event: ev, type: MOUSE_MOVE})
                })
                this.htmlElement.addEventListener('mousedown', ev => {
                    eventQueue.push({event: ev, type: MOUSE_DOWN})
                })
                this.htmlElement.addEventListener('mouseup', ev => {
                    eventQueue.push({event: ev, type: MOUSE_UP})
                })
                this.htmlElement.addEventListener('click', ev => {
                    eventQueue.push({event: ev, type: MOUSE_UP})
                })

                // Loop
                const loop = async () => {
                    const dt = dtClock.delta

                    while (eventQueue.length) {
                        const event = eventQueue[0]
                        const domEvent = event.event
                        eventQueue.splice(0, 1)

                        if (domEvent instanceof MouseEvent) {
                            if (event.type === MOUSE_MOVE) {
                                await this.eventRegistries.mousemove.execute(async callback => {
                                    await callback(domEvent.offsetX, domEvent.offsetY, domEvent.movementX, domEvent.movementY)
                                })
                            } else if (event.type === MOUSE_DOWN) {
                                await this.eventRegistries.mousedown.execute(async callback => {
                                    await callback(domEvent.button, domEvent.offsetX, domEvent.offsetY)
                                })
                            } else if (event.type === MOUSE_UP) {
                                await this.eventRegistries.mouseup.execute(async callback => {
                                    await callback(domEvent.button, domEvent.offsetX, domEvent.offsetY)
                                })
                            } else if (event.type === MOUSE_CLICK) {
                                await this.eventRegistries.click.execute(async callback => {
                                    await callback(domEvent.button, domEvent.offsetX, domEvent.offsetY)
                                })
                            }
                        } else if (domEvent instanceof KeyboardEvent) {
                            if (event.type === 0) {
                                await this.eventRegistries.keydown.execute(async callback => {
                                    await callback(domEvent.code)
                                })
                            } else {
                                await this.eventRegistries.keyup.execute(async callback => {
                                    await callback(domEvent.code)
                                })
                            }
                        }
                    }

                    await this.eventRegistries.update.execute(async callback => {
                        await callback(dt)
                    })

                    await this.eventRegistries.render.execute(async callback => {
                        await callback(dt)
                    })

                    await this.eventRegistries.lateUpdate.execute(async callback => {
                        await callback(dt)
                    })

                    requestAnimationFrame(loop)

                }

                window.addEventListener('beforeunload', async () => {
                    await this.eventRegistries.dispose.execute(async callback => {
                        await callback()
                    })
                })
                requestAnimationFrame(loop)
            }
        )();

    }


}
