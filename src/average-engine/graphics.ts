import {EventRegistry, Clock} from "./system";
import {Time} from "./units";
import {Font} from "./resources";

export abstract class Displayable {
    abstract get width(): number

    abstract get height(): number

    protected abstract _render(context: CanvasRenderingContext2D, x: number, y: number, w: number | null, h: number | null): void
}

export abstract class Renderable extends Displayable {
    abstract get context(): CanvasRenderingContext2D

    abstract get renderer(): Renderer

}

function RGBAToHex(r: number, g: number, b: number, a: number) {
    let red = Math.max(0, Math.min(255, Math.round(r * 255))).toString(16)
    let green = Math.max(0, Math.min(255, Math.round(g * 255))).toString(16)
    let blue = Math.max(0, Math.min(255, Math.round(b * 255))).toString(16)
    let alpha = Math.max(0, Math.min(255, Math.round(a * 255))).toString(16)

    while (red.length < 2) {
        red = '0' + red
    }
    while (green.length < 2) {
        green = '0' + green
    }
    while (blue.length < 2) {
        blue = '0' + blue
    }
    while (alpha.length < 2) {
        alpha = '0' + alpha
    }

    return '#' + red + green + blue + alpha

}

abstract class FontFamilyChecker extends Font {
    public static getFamily(font: Font): string {
        return (font as FontFamilyChecker).font.family
    }
}

export class Renderer {
    private _fill = '#fff'
    private _stroke = '#fff'
    private _w = 1
    private _textSize = 16
    private _font: Font | null = null
    public readonly context: CanvasRenderingContext2D
    public readonly renderable: Renderable
    public transformMatrices: DOMMatrix[] = []

    constructor(renderable: Renderable) {
        this.context = renderable.context
        this.renderable = renderable
        this.transformMatrices.push(new DOMMatrix())
    }

    private applySettings() {

        this.context.setTransform(this.transformMatrices[this.transformMatrices.length - 1])
        if (this._font)
            this.context.font = Math.round(this._textSize).toString() + 'px ' + FontFamilyChecker.getFamily(this._font)
        else
            this.context.font = Math.round(this._textSize).toString() + 'px Arial'

        this.context.lineWidth = this._w
        this.context.strokeStyle = this._stroke
        this.context.fillStyle = this._fill
        this.context.textBaseline = 'top'
    }

    // Setters

    public setFillColor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this._fill = RGBAToHex(r, g, b, a)
    }

    public setStrokeColor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this._stroke = RGBAToHex(r, g, b, a)
    }

    public setStrokeWeight(w: number) {
        this._w = w
    }

    public setFont(font: Font) {
        this._font = font
    }

    public setTextSize(size: number) {
        this._textSize = size
    }

    // Getters

    public getTextSize() {
        return this._textSize
    }

    public getStrokeWeight() {
        return this._w
    }

    // Fill Shapes

    public clear() {
        this.applySettings()
        this.context.clearRect(0, 0, this.renderable.width, this.renderable.height)
    }

    public fillRect(x: number, y: number, w: number, h: number) {
        this.applySettings()
        this.context.fillRect(x, y, w, h)
    }

    public image(displayable: Displayable, x: number, y: number, w: number | null = null, h: number | null = null) {
        DisplayableRenderer.draw(this.context, displayable, x, y, w, h)
    }

    public fillText(text: string, x: number, y: number) {
        this.applySettings()
        this.context.fillText(text, x, y)
    }

    public getTextWidth(text: string) {
        this.applySettings()
        return this.context.measureText(text).width
    }

    // Stroke Shapes

    public strokeRect(x: number, y: number, w: number, h: number) {
        this.applySettings()
        this.context.strokeRect(x, y, w, h)
    }

    public strokeLine(x1: number, y1: number, x2: number, y2: number) {
        this.applySettings()
        this.context.beginPath()
        this.context.moveTo(x1, y1)
        this.context.lineTo(x2, y2)
        this.context.stroke()
    }

    public strokeText(text: string, x: number, y: number) {
        this.applySettings()
        this.context.strokeText(text, x, y)
    }

    // Transformations

    public translate(x: number, y: number) {
        this.context.translate(x, y)
        this.transformMatrices[this.transformMatrices.length - 1] = DOMMatrix.fromMatrix(this.context.getTransform())
    }

    public rotate(angle: number) {
        this.context.rotate(angle)
        this.transformMatrices[this.transformMatrices.length - 1] = DOMMatrix.fromMatrix(this.context.getTransform())
    }

    public pushMatrix() {
        this.transformMatrices.push(DOMMatrix.fromMatrix(this.context.getTransform()))
    }

    public popMatrix() {
        this.transformMatrices.pop()
        this.applySettings()
    }
}

abstract class DisplayableRenderer extends Displayable {
    public static draw(context: CanvasRenderingContext2D, displayable: Displayable, x: number, y: number, w: number | null = null, h: number | null = null) {
        (displayable as DisplayableRenderer)._render(context, x, y, w, h)
    }
}

export type GameStatistics = {
    fps: {
        average: number,
        max: number,
        min: number,
        now: number
    },
    dt: Time,
    elapsedTime: Time,
    dimension: { w: number, h: number }
}

export class Game extends Renderable {

    private static _activeWindowCount = 0
    public readonly htmlElement: HTMLCanvasElement
    private _statistic: GameStatistics | null = null
    public readonly eventRegistries = {
        setup: new EventRegistry<() => Promise<void>>(),
        update: new EventRegistry<(deltaTime: Time) => Promise<void>>(),
        render: new EventRegistry<(renderer: Renderer, deltaTime: Time) => Promise<void>>(),
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

    constructor() {
        super();
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

    get statistics(): GameStatistics {
        return Object.assign({}, this._statistic)
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
                    eventQueue.push({event: ev, type: MOUSE_CLICK})
                })

                const elapseClock = new Clock()
                const fpsStatisticList: { time: number, dt: number }[] = []

                // Loop
                const loop = async () => {
                    const dt = dtClock.delta
                    {
                        const now = elapseClock.elapsedTime.milliseconds
                        fpsStatisticList.push({time: now, dt: dt.milliseconds})

                        while (now - fpsStatisticList[0].time > 1000) {
                            fpsStatisticList.splice(0, 1)
                        }

                        let lowest: number = 1 / 0
                        let highest: number = -1 / 0
                        let average = 0
                        let current = 1 / dt.seconds

                        for (let stat of fpsStatisticList) {
                            const fps = 1000 / stat.dt
                            if (fps > highest)
                                highest = fps
                            if (fps < lowest)
                                lowest = fps
                            average += fps
                        }

                        average /= fpsStatisticList.length

                        this._statistic = {
                            fps: {
                                average: average,
                                max: highest,
                                min: lowest,
                                now: current
                            },
                            dt: new Time(dt.milliseconds),
                            elapsedTime: new Time(now),
                            dimension: {w: this.width, h: this.height}
                        }
                    }

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
                        await callback(this.renderer, dt)
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

    protected _render(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    }

}

export class Texture extends Displayable {

    private _loaded = false

    constructor(private readonly image: HTMLImageElement, loaded: boolean) {
        super()
        this._loaded = loaded
        if (!loaded) {
            const listener = () => {
                image.removeEventListener('load', listener)
                this._loaded = true
            }
            image.addEventListener('load', listener)
        }
    }

    get loaded(): boolean {
        return this._loaded
    }

    protected _render(context: CanvasRenderingContext2D, x: number, y: number, w: number | null = null, h: number | null = null): void {
        if (this.image) {
            if (w || h)
                context.drawImage(this.image, x, y, w === null ? this.image.width : w, h === null ? this.image.height : h)
            else
                context.drawImage(this.image, x, y)
        }
    }

    get width(): number {
        return this.image.width;
    }

    get height(): number {
        return this.image.height;
    }

}