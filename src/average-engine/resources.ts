import {Texture} from "./graphics";

export class Font {
    constructor(protected readonly font: FontFace) {
    }
}

export class AsyncResourceLoader {
    public static loadTexture(url: string): Promise<Texture> {
        return new Promise<Texture>(resolve => {
            const image = new Image()
            const listener = () => {
                resolve(new Texture(image, true))
                image.removeEventListener('load', listener)
            }
            image.addEventListener('load', listener)
            image.src = url
        })
    }

    public static async loadFont(url: string) {
        const name = 'font_' + Date.now().toString() + '_' + Math.floor(Math.random() * 1000).toString()
        const font = new FontFace(name, `url(${url})`)
        await font.load()
        // @ts-ignore
        await document.fonts.add(font)
        return new Font(font)
    }
}