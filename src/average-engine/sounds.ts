export let audioContext: AudioContext

export class SoundManager {

    public static init() {
        // @ts-ignore
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        console.log(audioContext)
        console.log("Sound System initialized.")
    }


}

export class Sound {
    constructor(public readonly buffer: AudioBuffer) {
    }
}

export class SoundSource {
    private source: AudioBufferSourceNode

    constructor() {
        this.source = audioContext.createBufferSource()
        this.source.connect(audioContext.destination)
    }

    public set sound(audio: Sound) {
        this.source.buffer = audio.buffer
    }

    play() {
        this.source.start()
    }

    dispose() {
        this.source.disconnect()
    }
}