import {Texture} from "./graphics";

export class AsyncResourceLoader {
    public static loadTexture(url: string): Promise<Texture>{
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
}