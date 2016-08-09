/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>
/// <reference path="../../libs/microbit/shims.d.ts"/>
/// <reference path="../../libs/microbit/enums.d.ts"/>


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
    // class NPBuffer implements Buffer {
    // }
    export class NeopixelCmp {
        public buffers: {[pin: number]: Uint8Array[]} = {};

        public sendBuffer(buffer: Buffer, pin: DigitalPin) {
            let data = <Uint8Array[]>(<any>buffer).data;
            this.buffers[pin] = data;
        }
    }
}

//TODO move to utils
namespace pxsim {
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

namespace pxsim.boardsvg {
    // For the instructions parts list
    export function mkNeoPixelPart(xy: Coord): SVGAndSize<SVGCircleElement> {
        //TODO
        return mkNeoPixel(xy);
    }
    export function mkNeoPixel(xy: Coord): SVGAndSize<SVGCircleElement> {
        //TODO
        //let box = <SVGRectElement>svg.elt("rect");
        let circle = <SVGCircleElement>svg.elt("circle");
        let r = PIN_DIST;
        let [cx, cy] = xy;
        svg.hydrate(circle, {cx: cx, cy: cy, r: r, class: "sim-neopixel"});
        return {e: circle, w: r*2, h: r*2, l: cx - r, t: cy - r};
    }

    export class NeopixelSvg implements IBoardComponent<NeopixelCmp> {
        public style: string = `
        `;
        public element: SVGElement;
        public defs: SVGElement[];
        state: NeopixelCmp;

        public init(bus: EventBus, state: NeopixelCmp, svgEl: SVGSVGElement): void {
            this.state = state;

            //TODO:
            this.element = mkNeoPixel([0,0]).e;
        }
        public setLocations (...xys: Coord[]): void {
            xys.forEach(xy => {
                //TODO
                svg.hydrate(this.element, {cx: xy[0], cy: xy[1]});
            });
        }
        
        public updateState(): void {
            const mapRange = (v: number, from: [number, number], to: [number, number]) =>
                (v - from[0]) / (from[1] - from[0]) * (to[1] - to[0]) + to[0];
                
            for (let pin in this.state.buffers) {
                let buf = this.state.buffers[pin];
                if (buf && buf.length >= 3 && buf.length % 3 == 0) {
                    for (let [ri, gi, bi] = [0, 1, 2]; bi < buf.length; ri+=3,gi+=3,bi+=3) {
                        let rgb: [number, number, number] = [buf[ri] as any as number, buf[gi] as any as number, buf[bi] as any as number];
                        let hsl = rgbToHsl(rgb);
                        let [h, s, l] = hsl;

                        //We ignore luminosity since it doesn't map well to real-life brightness
                        this.element.setAttribute("fill", `hsl(${h}, ${s}%, 70%)`);
                    }
                }
            }
         }
        public updateTheme (): void { }
    }
}

//TODO: for reference
function showColor(rgb: number) {
    let red = (rgb >> 16) & 0x0ff;
    let green = (rgb >> 8) & 0x0ff;
    let blue = (rgb) & 0x0ff;

    let br = this.brightness;
    if (br < 255) {
        red = (red * br) >> 8;
        green = (green * br) >> 8;
        blue = (blue * br) >> 8;
    }
    let buf = this.buf;
    let end = this.start + this._length;
    for (let i = this.start; i < end; ++i) {
        let ledoffset = i * 3;
        buf[ledoffset + 0] = green;
        buf[ledoffset + 1] = red;
        buf[ledoffset + 2] = blue;
    }
    this.show();
}
function setPixelColor(ledoffset: number, color: number): void {
    if (ledoffset < 0
        || ledoffset >= this._length)
        return;

    ledoffset = (ledoffset + this.start) * 3;

    let red = (color >> 16) & 0x0ff;
    let green = (color >> 8) & 0x0ff;
    let blue = (color) & 0x0ff;

    let br = this.brightness;
    if (br < 255) {
        red = (red * br) >> 8;
        green = (green * br) >> 8;
        blue = (blue * br) >> 8;
    }
    let buf = this.buf;
    buf[ledoffset + 0] = green;
    buf[ledoffset + 1] = red;
    buf[ledoffset + 2] = blue;
}