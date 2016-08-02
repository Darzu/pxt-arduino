/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/microbit/dal.d.ts"/>

namespace pxsim {

    pxsim.initCurrentRuntime = () => {
        U.assert(!runtime.board);
        let b = new DalBoard();
        runtime.board = b;
    }

    export function board() {
        return runtime.board as DalBoard;
    }

    /**
      * Error codes used in the micro:bit runtime.
      */
    export enum PanicCode {
        // PANIC Codes. These are not return codes, but are terminal conditions.
        // These induce a panic operation, where all code stops executing, and a panic state is
        // entered where the panic code is diplayed.

        // Out out memory error. Heap storage was requested, but is not available.
        MICROBIT_OOM = 20,

        // Corruption detected in the micro:bit heap space
        MICROBIT_HEAP_ERROR = 30,

        // Dereference of a NULL pointer through the ManagedType class,
        MICROBIT_NULL_DEREFERENCE = 40,
    };

    export function panic(code: number) {
        console.log("PANIC:", code)
        led.setBrightness(255);
        let img = board().displayCmp.image;
        img.clear();
        img.set(0, 4, 255);
        img.set(1, 3, 255);
        img.set(2, 3, 255);
        img.set(3, 3, 255);
        img.set(4, 4, 255);
        img.set(0, 0, 255);
        img.set(1, 0, 255);
        img.set(0, 1, 255);
        img.set(1, 1, 255);
        img.set(3, 0, 255);
        img.set(4, 0, 255);
        img.set(3, 1, 255);
        img.set(4, 1, 255);
        runtime.updateDisplay();

        throw new Error("PANIC " + code)
    }

    export namespace AudioContextManager {
        let _context: any; // AudioContext
        let _vco: any; // OscillatorNode;
        let _vca: any; // GainNode;

        function context(): any {
            if (!_context) _context = freshContext();
            return _context;
        }

        function freshContext(): any {
            (<any>window).AudioContext = (<any>window).AudioContext || (<any>window).webkitAudioContext;
            if ((<any>window).AudioContext) {
                try {
                    // this call my crash.
                    // SyntaxError: audio resources unavailable for AudioContext construction
                    return new (<any>window).AudioContext();
                } catch (e) { }
            }
            return undefined;
        }

        export function stop() {
            if (_vca) _vca.gain.value = 0;
        }

        export function tone(frequency: number, gain: number) {
            if (frequency <= 0) return;
            let ctx = context();
            if (!ctx) return;

            gain = Math.max(0, Math.min(1, gain));
            if (!_vco) {
                try {
                    _vco = ctx.createOscillator();
                    _vca = ctx.createGain();
                    _vco.connect(_vca);
                    _vca.connect(ctx.destination);
                    _vca.gain.value = gain;
                    _vco.start(0);
                } catch (e) {
                    _vco = undefined;
                    _vca = undefined;
                    return;
                }
            }

            _vco.frequency.value = frequency;
            _vca.gain.value = gain;
        }
    }
}

namespace pxsim.basic {
    export var pause = thread.pause;
    export var forever = thread.forever;
}

namespace pxsim.control {
    export var inBackground = thread.runInBackground;

    export function reset() {
        U.userError("reset not implemented in simulator yet")
    }

    export function deviceName(): string {
        let b = board();
        return b && b.id
            ? b.id.slice(0, 4)
            : "abcd";
    }

    export function deviceSerialNumber(): number {
        let b = board();
        return parseInt(b && b.id
            ? b.id.slice(1)
            : "42");
    }

    export function onEvent(id: number, evid: number, handler: RefAction) {
        pxt.registerWithDal(id, evid, handler)
    }

    export function raiseEvent(id: number, evid: number, mode: number) {
        // TODO mode?
        board().bus.queue(id, evid)
    }
}

namespace pxsim.pxt {
    export function registerWithDal(id: number, evid: number, handler: RefAction) {
        board().bus.listen(id, evid, handler);
    }
}

namespace pxsim.input {
    export function runningTime(): number {
        return runtime.runningTime();
    }

    export function calibrate() {
    }
}

namespace pxsim.pins {
    export function onPulsed(name: number, pulse: number, body: RefAction) {
    }

    export function pulseDuration(): number {
        return 0;
    }

    export function createBuffer(sz: number) {
        return pxsim.BufferMethods.createBuffer(sz)
    }

    export function i2cReadBuffer(address: number, size: number, repeat?: boolean): RefBuffer {
        // fake reading zeros
        return createBuffer(size)
    }

    export function i2cWriteBuffer(address: number, buf: RefBuffer, repeat?: boolean): void {
        // fake - noop
    }
}

namespace pxsim.bluetooth {
    export function startIOPinService(): void {
        // TODO
    }
    export function startLEDService(): void {
        // TODO
    }
    export function startTemperatureService(): void {
        // TODO
    }
    export function startMagnetometerService(): void {
        // TODO
    }
    export function startAccelerometerService(): void {
        // TODO
    }
    export function startButtonService(): void {
        // TODO
    }
}

namespace pxsim.boardsvg {
    export interface IPointerEvents {
        up: string,
        down: string,
        move: string,
        leave: string
    }

    export const pointerEvents: IPointerEvents = !!(window as any).PointerEvent ? {
        up: "pointerup",
        down: "pointerdown",
        move: "pointermove",
        leave: "pointerleave"
    } : {
        up: "mouseup",
        down: "mousedown",
        move: "mousemove",
        leave: "mouseleave"
    };

    export function translateEl(el: SVGElement, xy: [number, number]) {
        //TODO append translation instead of replacing the full transform
        svg.hydrate(el, {transform: `translate(${xy[0]} ${xy[1]})`});
    }

    export type Coord = [number, number];

    export interface IBoardComponent<T> {
        style: string,
        element: SVGElement,
        defs: SVGElement[],
        init(bus: EventBus, state: T, svgEl: SVGSVGElement): void, //NOTE: constructors not supported in interfaces
        setLocations (...xys: Coord[]): void,
        updateState (): void,
        updateTheme (): void,
    }

    export function mkTxt(cx: number, cy: number, size: number, r: number, txt: string, cls: string, txtXOffFactor?: number, txtYOffFactor?: number): SVGElement {
        //HACK: these constants (txtXOffFactor, txtYOffFactor) tweak the way this algorithm knows how to center the text
        txtXOffFactor = txtXOffFactor || -0.33333;
        txtYOffFactor = txtYOffFactor || 0.3;
        const xOff = txtXOffFactor*size*txt.length;
        const yOff = txtYOffFactor*size;
        let g = svg.elt("g");
        svg.hydrate(g, {transform: `translate(${cx} ${cy})`});
        let el = svg.child(g, "text", { class: "noselect " + cls, x: xOff, y: yOff, style: `font-size:${size}px;`,
            transform: `translate(${0} ${0}) rotate(${r})` }) as SVGTextElement;
        el.textContent = txt;
        return g
    }

    export const WIRE_COLOR: Map<string> = {
        black: "#514f4d",
        white: "#fcfdfc",
        grey: "#acabab",
        purple: "#a772a1",
        blue: "#01a6e8",
        green: "#3cce73",
        yellow: "#ece600",
        orange: "#fdb262",
        red: "#f44f43",
        brown: "#c89764",
    }
    export function mapWireColor(clr: string) {
        return WIRE_COLOR[clr] || clr;
    }

    // board description
    // arduino zero description
    export type Component = ("buttonpair" | "display" | "edgeconnector" | "serial" 
        | "radio" | "thermometer" | "accelerometer" | "compass" | "lightsensor");
    //TODO this type decleration without the last ", any" goofs VS Code's syntax highlighting
    export type CnstrAndStateFns = [ () => IBoardComponent<any>, (d: DalBoard) => any, any ];
    export const ComponenetToCnstrAndState: {[key: string]: CnstrAndStateFns} = {
        "buttonpair": [() => new ButtonPairSvg(), (d: DalBoard) => d.buttonPairState, null],
        "display": [() => new LedMatrixSvg(), (d: DalBoard) => d.displayCmp, null],
        "edgeconnector": [() => new EdgeConnectorSvg(), (d: DalBoard) => d.edgeConnectorState, null],
        "serial": [() => new SerialSvg(), (d: DalBoard) => d.serialCmp, null],
        "radio": [() => new RadioSvg(), (d: DalBoard) => d.radioCmp, null],
        "thermometer": [() => new ThermometerSvg(), (d: DalBoard) => d.thermometerCmp, null],
        "accelerometer": [() => new AccelerometerSvg(), (d: DalBoard) => d.accelerometerCmp, null],
        "compass": [() => new CompassSvg(), (d: DalBoard) => d.compassCmp, null],
        "lightsensor": [() => new LightSensorSvg(), (d: DalBoard) => d.lightSensorCmp, null]
    }
    export type WireDescription = {bb: string, pin:  string, color: string, component?: Component, instructionStep: number};
    export type ComponentDescription = {type: Component, locations: string[], instructionStep: number, wires: WireDescription[]} 
    export interface BoardDescription {
        photo: string,
        outlineImg: string,
        width: number,
        height: number,
        pinDist: number,
        pins: { x: number, y: number, labels: string[] }[],
        basicWires: WireDescription[], 
        components: ComponentDescription[],
    }
    export type SVGAndSize<T extends SVGElement> = {e: T, t: number, l: number, w: number, h: number};
    export function mkComponent(type: Component, xy: Coord): SVGAndSize<SVGElement> {
        if (type == "buttonpair") {
            return mkBtnSvg(xy);
        } else if (type == "display") {
            return mkLedMatrixSvg(xy, 8, 8);
        } else {
            throw `unsupported compoment type: ${type}`;
        }
    }
    export const ARDUINO_ZERO: BoardDescription = {
        photo: "arduino-zero-photo-sml.png",
        outlineImg:  "arduino-outline.svg",
        width: 1000,
        height: 762,
        pinDist: 35.5,
        pins: [
            {x: 276.8, y: 17.8, labels: ["SCL", "SDA","AREF", "GND0", "~13", "~12", "~11", "~10", "~9", "~8"]},
            {x: 655.5, y: 17.8, labels: ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"]},
            {x: 411.7, y: 704.6, labels: ["ATN", "IOREF", "RESET", "3.3V", "5V", "GND1", "GND2", "VIN"]},
            {x: 732.9, y: 704.6, labels: ["A0", "A1", "A2", "A3", "A4", "A5"]},
        ],
        basicWires: [
            {bb: "-1", pin: "GND0", color: "black", instructionStep: 1},
        ],
        components: [
            {type: "display", locations:["h12"], instructionStep: 2, wires: [
                {bb: "a12", pin: "~5", color: "blue", instructionStep: 3},
                {bb: "a13", pin: "~4", color: "blue", instructionStep: 3},
                {bb: "a14", pin: "~3", color: "blue", instructionStep: 3},
                {bb: "a15", pin: "2", color: "blue", instructionStep: 3},
                {bb: "j16", pin: "TX->1", color: "blue", instructionStep: 3},
                {bb: "a16", pin: "A0", color: "green", instructionStep: 4},
                {bb: "a17", pin: "A1", color: "green", instructionStep: 4},
                {bb: "a18", pin: "A2", color: "green", instructionStep: 4},
                {bb: "a19", pin: "A3", color: "green", instructionStep: 4},
                {bb: "j12", pin: "A4", color: "green", instructionStep: 4},
            ]},
            {type: "buttonpair", locations:["f1", "f28", "d28"], instructionStep: 5, wires: [
                {bb: "j1", pin: "7", color: "yellow", instructionStep: 6},
                {bb: "a3", pin: "-2", color: "black", instructionStep: 6},
                {bb: "j28", pin: "~6", color: "orange", instructionStep: 7},
                {bb: "a30", pin: "-25", color: "black", instructionStep: 7},
            ]},
        ]
    }
}

namespace pxsim {
    export interface RuntimeOptions {
        theme: string;
    }

    export class EventBus {
        private queues: Map<EventQueue<number>> = {};

        constructor(private runtime: Runtime) { }

        listen(id: number, evid: number, handler: RefAction) {
            let k = id + ":" + evid;
            let queue = this.queues[k];
            if (!queue) queue = this.queues[k] = new EventQueue<number>(this.runtime);
            queue.handler = handler;
        }

        queue(id: number, evid: number, value: number = 0) {
            let k = id + ":" + evid;
            let queue = this.queues[k];
            if (queue) queue.push(value);
        }
    }
}