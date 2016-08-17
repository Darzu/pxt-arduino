/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>
/// <reference path="../../libs/microbit/shims.d.ts"/>
/// <reference path="../../libs/microbit/enums.d.ts"/>

namespace pxsim {
    export enum NeoPixelMode {RGB, RGBW};
    export type RGBW = [number, number, number, number];
}

namespace pxsim.visuals {
    //TODO: determine this from static analysis
    export const NEOPIXEL_LAYOUT: {[pin: number]: NeoPixelMode} = (() => {
        let map: {[pin: number]: NeoPixelMode} = {};
        map[7/*DigitalPin.P0*/] = pxsim.NeoPixelMode.RGB;
        //map[8/*DigitalPin.P1*/] = NeoPixelMode.RGBW;
        //map[9/*DigitalPin.P2*/] = NeoPixelMode.RGB;
        return map
    })();
}

namespace pxsim {
    export function sendBufferAsm(buffer: Buffer, pin: DigitalPin) {
        let b = board();
        if (b) {
            let np = b.neopixelCmp;
            if (np) {
                np.sendBuffer(buffer, pin);
                runtime.queueDisplayUpdate();
            }
        }
    }
}

namespace pxsim {

    export class NeoPixelCmp {
        private buffers: {[pin: number]: Uint8Array[]} = {};
        public pixelColors: {[pin: number]: RGBW[]} = {};
        public pinModes: {[pin: number]: NeoPixelMode};
        public used = false;

        constructor(pinModes: {[pin: number]: NeoPixelMode}) {
            this.pinModes = pinModes;
        }

        public sendBuffer(buffer: Buffer, pin: DigitalPin) {
            this.used = true;

            //update buffers
            let buf = <Uint8Array[]>(<any>buffer).data;
            this.buffers[pin] = buf;

            //update colors
            let stride = this.pinModes[pin] === NeoPixelMode.RGBW ? 4 : 3;
            
            let pixelCount = Math.floor(buf.length / stride);
            let pixelColors = (this.pixelColors[pin] || (this.pixelColors[pin] = []));
                
            for (let i = 0; i < pixelCount; i++) {
                // NOTE: for whatever reason, NeoPixels pack GRB not RGB
                let r = buf[i * stride + 1] as any as number
                let g = buf[i * stride + 0] as any as number
                let b = buf[i * stride + 2] as any as number
                let w = 0;
                if (stride === 4)
                    w = buf[i * stride + 3] as any as number
                pixelColors[i] = [r,g,b,w]
            }
        }
    }
}

//TODO move to utils
namespace pxsim {
    //expects rgb from 0,255, gives h in [0,360], s in [0, 100], l in [0, 100]
    export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
        let [r, g, b] = rgb;
        let [r$, g$, b$] = [r/255, g/255, b/255];
        let cMin = Math.min(r$, g$, b$);
        let cMax = Math.max(r$, g$, b$);
        let cDelta = cMax - cMin;
        let h: number, s: number, l: number;
        let maxAndMin = cMax + cMin;

        //lum
        l = (maxAndMin / 2)*100
        
        if (cDelta === 0)
            s = h = 0;
        else {
            //hue
            if (cMax === r$)
                h = 60 * (((g$-b$)/cDelta) % 6);
            else if (cMax === g$)
                h = 60 * (((b$-r$)/cDelta) + 2);
            else if (cMax === b$)
                h = 60 * (((r$-g$)/cDelta) + 4);

            //sat
            if (l > 50)
                s = 100*(cDelta / (2 - maxAndMin));
            else
                s = 100*(cDelta / maxAndMin);
        }

        return [Math.floor(h), Math.floor(s), Math.floor(l)];
    }
}

namespace pxsim.visuals {
    const PIXEL_SPACING = PIN_DIST*3;
    const PIXEL_RADIUS = PIN_DIST;

    // For the instructions parts list
    export function mkNeoPixelPart(xy: Coord = [0,0]): SVGAndSize<SVGElement> {
        const NP_PART_XOFF = -13.5;
        const NP_PART_YOFF = -11;
        const NP_PART_WIDTH = 87.5;
        const NP_PART_HEIGHT = 190;
        const NEOPIXEL_PART_IMG = "neopixel-black-60-vert.svg";
        let [x,y] = xy;
        let l = x + NP_PART_XOFF;
        let t = y + NP_PART_YOFF;
        let w = NP_PART_WIDTH;
        let h = NP_PART_HEIGHT;
        let img = <SVGImageElement>svg.elt("image");
        svg.hydrate(img, {class: "sim-neopixel-strip", x: l, y: t, width: w, height: h,
            href: `/images/${NEOPIXEL_PART_IMG}`});
        return {e: img, l: l, t: t, w: w, h: h};
    }
    export class NeoPixel implements SVGAndSize<SVGCircleElement> {
        public e: SVGCircleElement;
        public w: number;
        public h: number;
        public l: number;
        public t: number;
        public cx: number;
        public cy: number;

        constructor(xy: Coord = [0,0]) {
            let circle = <SVGCircleElement>svg.elt("circle");
            let r = PIXEL_RADIUS;
            let [cx, cy] = xy;
            svg.hydrate(circle, {cx: cx, cy: cy, r: r, class: "sim-neopixel"});
            this.e = circle;
            this.w = r*2;
            this.h = r*2;
            this.l = cx - r;
            this.t = cy - r;
            this.cx = cx;
            this.cy = cy;
        }

        public setRgb(rgb: [number, number, number]) {
            let hsl = rgbToHsl(rgb);
            let [h, s, l] = hsl;
            //We ignore luminosity since it doesn't map well to real-life brightness
            let fill = `hsl(${h}, ${s}%, 70%)`;
            this.e.setAttribute("fill", fill);
        }
    }


    const CANVAS_WIDTH = 1.2*PIN_DIST;
    const CANVAS_HEIGHT = 12*PIN_DIST;
    const CANVAS_VIEW_WIDTH = CANVAS_WIDTH;
    const CANVAS_VIEW_HEIGHT = CANVAS_HEIGHT;
    const CANVAS_VIEW_PADDING = PIN_DIST*4;
    const CANVAS_LEFT = 1.4*PIN_DIST;
    const CANVAS_TOP = PIN_DIST;
    export class NeoPixelCanvas {
        public canvas: SVGSVGElement;
        public pin: number;
        public pixels: NeoPixel[];
        private viewBox: [number, number, number, number];
        private background: SVGRectElement;
        
        constructor(pin: number) {
            this.pixels = [];
            this.pin = pin;
            let el = <SVGSVGElement>svg.elt("svg");
            svg.hydrate(el, {
                "class": `sim-neopixel-canvas`,
                "x": "0px",
                "y": "0px",
                "width": `${CANVAS_WIDTH}px`,
                "height": `${CANVAS_HEIGHT}px`,
            });
            this.canvas = el;
            this.background = <SVGRectElement>svg.child(el, "rect", { class: "sim-neopixel-background hidden"});
            this.updateViewBox(-CANVAS_VIEW_WIDTH/2, 0, CANVAS_VIEW_WIDTH, CANVAS_VIEW_HEIGHT);
        }

        private updateViewBox(x: number, y: number, w: number, h: number) {
            this.viewBox = [x,y,w,h];
            svg.hydrate(this.canvas, {"viewBox": `${x} ${y} ${w} ${h}`});
            svg.hydrate(this.background, {"x": x, "y": y, "width": w, "height": h});
        }
        
        public update(colors: RGBW[]) {
            for (let i = 0; i < colors.length; i++) {
                let pixel = this.pixels[i];
                if (!pixel) {
                    let cxy: Coord = [0, CANVAS_VIEW_PADDING + i*PIXEL_SPACING];
                    pixel = this.pixels[i] = new NeoPixel(cxy);
                    this.canvas.appendChild(pixel.e);
                }
                let color = colors[i];
                pixel.setRgb(color);
                svg.hydrate(pixel.e, {title: `offset: ${i}`});
            }

            //show the canvas if it's hidden
            if (colors.length > 0)
                svg.removeClass(this.background, "hidden");

            //resize if necessary
            let [first, last] = [this.pixels[0], this.pixels[this.pixels.length-1]]
            let yDiff = last.cy - first.cy;
            let newH = yDiff + CANVAS_VIEW_PADDING*2;
            let [oldX, oldY, oldW, oldH] = this.viewBox;
            if (oldH < newH) {
                let scalar = newH/oldH;
                let newW = oldW*scalar;
                this.updateViewBox(-newW/2, oldY, newW, newH);
            }
        }

        public setLoc(xy: Coord) {
            let [x,y] = xy;
            svg.hydrate(this.canvas, {x: x, y: y});
        }
    };

    export type NeoPixelStrip = {canvas: NeoPixelCanvas, part: SVGAndSize<SVGElement>};

    export class NeoPixelSvg implements IBoardComponent<NeoPixelCmp> {
        public style: string = `
            .sim-neopixel-canvas {
            }
            .sim-neopixel-canvas-parent:hover {
                transform-origin: center;
                transform: scale(4) translateY(-60px);
            }
            .sim-neopixel-canvas .hidden {
                visibility:hidden;
            }
            .sim-neopixel-background {
                fill: rgba(255,255,255,0.9);
            }
            .sim-neopixel-strip {
            }
        `;
        public element: SVGElement;
        public defs: SVGElement[];
        private state: NeoPixelCmp;
        private strips: {[pin: number]: NeoPixelStrip} = {};
        private stripsGroup: SVGGElement;
        private lastLocations: Coord[] = [];

        public init(bus: EventBus, state: NeoPixelCmp, svgEl: SVGSVGElement): void {
            this.state = state;

            this.stripsGroup = <SVGGElement>svg.elt("g");
            this.element = this.stripsGroup;
        }
        private getStripsList() {
            let strips: NeoPixelStrip[] = [];
            for (let pinNm in this.strips) {
                let pin = Number(pinNm);
                let strip = this.strips[pin];
                strips.push(strip);
            }
            return strips;
        }
        public setLocations(...xys: Coord[]): void {
            this.lastLocations = xys;
            this.updateStripLocs();
        }
        private updateStripLocs() {
            let xys = this.lastLocations;
            let strips = this.getStripsList();
            xys.forEach((xy, i) => {
                let s = strips[i];
                if (s) {
                    let [x,y] = xy;
                    s.canvas.setLoc([x+CANVAS_LEFT, y+CANVAS_TOP]);
                    svg.hydrate(s.part.e, {transform: `translate(${x} ${y})`});//TODO: update part's l,h, etc.
                }
            });
        }
        public mkStrip(pin: DigitalPin) {
            let part = mkNeoPixelPart();
            this.stripsGroup.appendChild(part.e);
            let canvas = new NeoPixelCanvas(pin);
            let canvasG = svg.child(this.stripsGroup, "g", {class: "sim-neopixel-canvas-parent"});
            canvasG.appendChild(canvas.canvas);
            let strip = {canvas: canvas, part: part};
            this.strips[pin] = strip;
            this.updateStripLocs();
            return strip;
        }
        public updateState(): void {
            //update canvases
            for (let pinStr in this.state.pixelColors) {
                let pin = Number(pinStr);
                let colors = this.state.pixelColors[pin];
                let strip = this.strips[pin];
                if (!strip) {
                    strip = this.mkStrip(pin);
                }
                let canvas = strip.canvas;
                canvas.update(colors);
            }

            //TODO: update NeoPixel part
         }
        public updateTheme (): void { }
    }
}