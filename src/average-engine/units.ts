export class Time {
    private readonly record: number

    public constructor(milliseconds: number) {
        this.record = milliseconds
    }

    public get milliseconds() {
        return this.record
    }

    public get seconds() {
        return this.milliseconds / 1000.0
    }

    public get minutes() {
        return this.seconds / 60.0
    }

    public get hours() {
        return this.minutes / 60.0
    }

    public get days() {
        return this.hours / 24.0
    }

    public get string() {
        if (this.days > 0.8) {
            return this.days + 'd'
        } else if (this.hours > 0.8) {
            return this.hours + 'h'
        } else if (this.minutes > 0.8) {
            return this.minutes + 'min'
        } else if (this.seconds > 0.8) {
            return this.seconds + 's'
        } else {
            return this.milliseconds + 'ms'
        }
    }

    public static get now() {
        return new Time(Date.now())
    }

    public toString() {
        return this.string
    }

    public plus(x: Time | number): Time {
        if (typeof x === 'number') {
            return new Time(this.record + x)
        } else {
            return new Time(this.record + x.record)
        }
    }

    public divide(x: number): Time {
        return new Time(this.record / x)
    }

    public times(x: number): Time {
        return new Time(this.record * x)
    }

    public minus(x: Time | number): Time {
        if (typeof x === 'number') {
            return new Time(this.record - x)
        } else {
            return new Time(this.record - x.record)
        }
    }
}

export class Vector2 {
    private _x: number
    private _y: number

    constructor(x: number, y: number) {
        this._x = x
        this._y = y
    }

    get x() {
        return this._x
    }

    get y() {
        return this._y
    }

    set x(x) {
        this._x = x
    }

    set y(y) {
        this._y = y
    }

    get magnitude() {
        return Math.sqrt(this._x * this._x + this._y * this._y)
    }

    get direction() {
        return Math.atan2(this._y, this._x)
    }

    get string() {
        return 'Vector{x=' + this.x + ', y=' + this.y + '}'
    }

    get generalString() {
        return this.magnitude + '[' + this.direction + '°]'
    }

    public plus(v: Vector2) {
        return new Vector2(this.x + v.x, this.y + v.y)
    }

    public minus(v: Vector2) {
        return new Vector2(this.x - v.x, this.y - v.y)
    }

    public times(x: number) {
        return new Vector2(this.x * x, this.y * x)
    }

    public divide(x: number) {
        return new Vector2(this.x / x, this.y / 2)
    }

    public static fromGeneralForm(magnitude: number, direction: number) {
        return new Vector2(
            Math.cos(direction) * magnitude,
            Math.sin(direction) * magnitude
        )
    }
}
