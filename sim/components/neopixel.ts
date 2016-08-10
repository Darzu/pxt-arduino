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
    export class NeoPixelCmp {
        public buffers: {[pin: number]: Uint8Array[]} = {};

        public sendBuffer(buffer: Buffer, pin: DigitalPin) {
            let data = <Uint8Array[]>(<any>buffer).data;
            this.buffers[pin] = data;
        }
    }
}

//TODO move to utils
namespace pxsim {
    //expects rgb from 0,255, gives h in [0,260], s in [0, 100], l in [0, 100]
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
    const PIXEL_SPACING = PIN_DIST*3;
    const PIXEL_RADIUS = PIN_DIST;

    // For the instructions parts list
    export function mkNeoPixelPart(xy: Coord): SVGAndSize<SVGCircleElement> {
        //TODO
        return mkNeoPixel(xy);
    }
    export function mkNeoPixel(xy: Coord): NeoPixel {
        //TODO
        //let box = <SVGRectElement>svg.elt("rect");
        let circle = <SVGCircleElement>svg.elt("circle");
        let r = PIXEL_RADIUS;
        let [cx, cy] = xy;
        svg.hydrate(circle, {cx: cx, cy: cy, r: r, class: "sim-neopixel"});
        let p = new NeoPixel;
        p.e = circle;
        p.w = r*2;
        p.h = r*2;
        p.l = cx - r;
        p.t = cy - r;
        return p;
    }
    export class NeoPixel implements SVGAndSize<SVGCircleElement> {
        public e: SVGCircleElement;
        public w: number;
        public h: number;
        public l: number;
        public t: number;

        public setRgb(rgb: [number, number, number]) {
            let hsl = rgbToHsl(rgb);
            let [h, s, l] = hsl;
            //We ignore luminosity since it doesn't map well to real-life brightness
            let fill = `hsl(${h}, ${s}%, 70%)`;
            this.e.setAttribute("fill", fill);
        }
        public setLoc(cxy: boardsvg.Coord) {
            let [cx, cy] = cxy;
            this.l = cx - this.w/2;
            this.t = cy - this.h/2;
            svg.hydrate(this.e, {cx: cx, cy: cy});
        }
    }

    export class NeoPixelSvg implements IBoardComponent<NeoPixelCmp> {
        public style: string = `
        `;
        public element: SVGElement;
        public defs: SVGElement[];
        state: NeoPixelCmp;
        pixels: {[pin: number]: NeoPixel[]} = {};
        pixelGroups: {[pin: number]: SVGGElement} = {};

        public init(bus: EventBus, state: NeoPixelCmp, svgEl: SVGSVGElement): void {
            this.state = state;

            let initG = this.mkGroup();
            this.pixelGroups[7/*DigitalPin.P0*/] = initG; //TODO: don't hardcode to P0
            this.element = initG;
        }
        public setLocations (...xys: Coord[]): void {
            xys.forEach(xy => {
                //TODO: handle all pixels
                svg.hydrate(this.element, {cx: xy[0], cy: xy[1]});
            });
        }
        private mkGroup(): SVGGElement {
            return <SVGGElement>svg.elt("g");
        }
        
        public updateState(): void {
            const mapRange = (v: number, from: [number, number], to: [number, number]) =>
                (v - from[0]) / (from[1] - from[0]) * (to[1] - to[0]) + to[0];
                
            for (let pin in this.state.buffers) {
                let buf = this.state.buffers[pin];
                if (buf && buf.length >= 3 && buf.length % 3 == 0) {
                    let pixelCount = buf.length / 3;
                    let group = this.pixelGroups[pin];
                    if (!group)
                        group = this.pixelGroups[pin] = this.mkGroup();
                    this.element = group //HACK
                    let pixels = this.pixels[pin];
                    if (!pixels)
                        pixels = this.pixels[pin] = [];
                    if (pixels.length != pixelCount) {
                        //resize
                        if (pixels.length < pixelCount) {
                            for (let i = pixels.length; i < pixelCount; i++) {
                                let p = mkNeoPixel([0, i*PIXEL_SPACING]);
                                pixels[i] = p;
                                group.appendChild(p.e);
                            }
                        } else {
                            //Fewer pixels; do anything?
                        }
                    }
                    for (let [i, gi, ri, bi] = [0, 0, 1, 2]; bi < buf.length; i++,ri+=3,gi+=3,bi+=3) {
                        let rgb: [number, number, number] = [buf[ri] as any as number, buf[gi] as any as number, buf[bi] as any as number];
                        let pixel = pixels[i];
                        pixel.setRgb(rgb);
                    }
                }
            }
         }
        public updateTheme (): void { }
    }
}