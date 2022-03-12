import {Time} from "./units";

export class Clock {
    private record = Time.now

    public reset() {
        this.record = Time.now
    }

    public get elapsedTime(): Time {
        return Time.now.minus(this.record)
    }

    public get delta(): Time {
        const now = Time.now
        const dt = now.minus(this.record)
        this.record = now
        return dt
    }
}

export class EventRegistry<T extends Function> {

    private readonly callbacks: T[] = []
    private readonly callbackSet = new Set<T>()

    public register(callback: T) {
        if (!this.callbackSet.has(callback)) {
            this.callbackSet.add(callback)
            this.callbacks.push(callback)
        }
    }

    public remove(callback: T) {
        if (this.callbackSet.has(callback)) {
            this.callbackSet.delete(callback)
            this.callbacks.splice(this.callbacks.indexOf(callback), 1)
        }
    }

    public async execute(executor: (callback: T) => Promise<void>) {
        for (let callback of this.callbacks) {
            await executor(callback)
        }
    }
}

export function sleep(time: number | Time) {
    return new Promise(resolve => setTimeout(resolve, typeof time === 'number' ? time : time.milliseconds));
}
