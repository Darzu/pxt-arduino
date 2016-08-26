namespace pxsim.visuals {
    const WIRE_WIDTH = PIN_DIST / 2.5;
    const BB_WIRE_SMOOTH = 0.6;
    const INSTR_WIRE_SMOOTH = 0.8;
    const WIRE_PART_CURVE_OFF = 15;
    const WIRE_PART_LENGTH = 100;
    export const WIRES_CSS = `
        .sim-bb-wire {
            fill:none;
            stroke-linecap: round;
            stroke-width:${WIRE_WIDTH}px;
            pointer-events: none;
        }
        .sim-bb-wire-end {
            stroke:#333;
            fill:#333;
        }
        .sim-bb-wire-hover {
            stroke-width: ${WIRE_WIDTH}px;
            visibility: hidden;
            stroke-dasharray: ${PIN_DIST / 10.0},${PIN_DIST / 1.5};
            /*stroke-opacity: 0.4;*/
        }
        .grayed .sim-bb-wire-end:not(.highlight) {
            stroke: #777;
        }
        .grayed .sim-bb-wire:not(.highlight) {
            stroke: #CCC;
        }
        .sim-bb-wire-ends-g:hover .sim-bb-wire-end {
            stroke: red;
        }
        `;

    export interface Wire {
        endG: SVGGElement;
        end1: SVGElement;
        end2: SVGElement;
        wires: SVGElement[];
    }

    let nextWireId = 0; //TODO remove

    function cssEncodeColor(color: string): string {
        //HACK/TODO: do real CSS encoding.
        return color
            .replace(/\#/g, "-")
            .replace(/\(/g, "-")
            .replace(/\)/g, "-")
            .replace(/\,/g, "-")
            .replace(/\./g, "-")
            .replace(/\s/g, "");
    }
    function mkWireOpenEnd(p: [number, number], top: boolean, clr: string): visuals.SVGElAndSize {
        const endW = visuals.PIN_DIST / 4.0;
        let k = visuals.PIN_DIST * 0.24;
        let [cx, cy] = p;
        let o = top ? -1 : 1;
        let g = svg.elt("g")

        let el = svg.elt("rect");
        let h1 = k * 10;
        let w1 = k * 2;
        let x1 = cx - w1 / 2;
        let y1 = cy - (h1 / 2);
        svg.hydrate(el, {x: x1, y: y1, width: w1, height: h1, rx: 0.5, ry: 0.5, class: "sim-bb-wire-end"});
        (<any>el).style["stroke-width"] = `${endW}px`;

        let el2 = svg.elt("rect");
        let h2 = k * 6;
        let w2 = k;
        let cy2 = cy + o * (h1 / 2 + h2 / 2);
        let x2 = cx - w2 / 2;
        let y2 = cy2 - (h2 / 2);
        svg.hydrate(el2, {x: x2, y: y2, width: w2, height: h2});
        (<any>el2).style["fill"] = `#bbb`;

        g.appendChild(el2);
        g.appendChild(el);
        return {el: g, x: x1 - endW, y: Math.min(y1, y2), w: w1 + endW * 2, h: h1 + h2};
    }
    export function mkWirePart(cp: [number, number], clr: string): visuals.SVGAndSize<SVGGElement> {
        let g = <SVGGElement>svg.elt("g");
        let [cx, cy] = cp;
        let offset = WIRE_PART_CURVE_OFF;
        let p1: visuals.Coord = [cx - offset, cy - WIRE_PART_LENGTH / 2];
        let p2: visuals.Coord = [cx + offset, cy + WIRE_PART_LENGTH / 2];
        clr = visuals.mapWireColor(clr);
        let e1 = mkWireOpenEnd(p1, true, clr);
        let s = mkWirePartSeg(p1, p2, clr);
        let e2 = mkWireOpenEnd(p2, false, clr);
        g.appendChild(s.el);
        g.appendChild(e1.el);
        g.appendChild(e2.el);
        let l = Math.min(e1.x, e2.x);
        let r = Math.max(e1.x + e1.w, e2.x + e2.w);
        let t = Math.min(e1.y, e2.y);
        let b = Math.max(e1.y + e1.h, e2.y + e2.h);
        return {el: g, x: l, y: t, w: r - l, h: b - t};
    }
    function mkCurvedWireSeg(p1: [number, number], p2: [number, number], smooth: number, clrClass: string): SVGPathElement {
        const coordStr = (xy: [number, number]): string => {return `${xy[0]}, ${xy[1]}`};
        let [x1, y1] = p1;
        let [x2, y2] = p2
        let yLen = (y2 - y1);
        let c1: [number, number] = [x1, y1 + yLen * .6];
        let c2: [number, number] = [x2, y2 - yLen * .6];
        let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
        svg.addClass(w, `wire-stroke-${clrClass}`);
        return w;
    }
    function mkWirePartSeg(p1: [number, number], p2: [number, number], clr: string): visuals.SVGAndSize<SVGPathElement> {
        //TODO: merge with mkCurvedWireSeg
        const coordStr = (xy: [number, number]): string => {return `${xy[0]}, ${xy[1]}`};
        let [x1, y1] = p1;
        let [x2, y2] = p2
        let yLen = (y2 - y1);
        let c1: [number, number] = [x1, y1 + yLen * .8];
        let c2: [number, number] = [x2, y2 - yLen * .8];
        let e = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
        (<any>e).style["stroke"] = clr;
        return {el: e, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x1 - x2), h: Math.abs(y1 - y2)};
    }
    function mkWireSeg(p1: [number, number], p2: [number, number], clrClass: string): SVGPathElement {
        const coordStr = (xy: [number, number]): string => {return `${xy[0]}, ${xy[1]}`};
        let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} L${coordStr(p2)}`);
        svg.addClass(w, `wire-stroke-${clrClass}`);
        return w;
    }
    function mkWireBBEnd(p: [number, number], clrClass: string): SVGElement {
        const endW = PIN_DIST / 4;
        let w = svg.elt("circle");
        let x = p[0];
        let y = p[1];
        let r = WIRE_WIDTH / 2 + endW / 2;
        svg.hydrate(w, {cx: x, cy: y, r: r, class: "sim-bb-wire-end"});
        svg.addClass(w, `wire-fill-${clrClass}`);
        (<any>w).style["stroke-width"] = `${endW}px`;
        return w;
    }

    //TODO: make this stupid class obsolete
    export class WireFactory {
        private underboard: SVGGElement;
        private overboard: SVGGElement;
        private boardEdges: number[];
        private getLocCoord: (loc: Loc) => Coord;
        public styleEl: SVGStyleElement;

        constructor(underboard: SVGGElement, overboard: SVGGElement, boardEdges: number[], styleEl: SVGStyleElement, getLocCoord: (loc: Loc) => Coord) {
            this.styleEl = styleEl;
            this.styleEl.textContent += WIRES_CSS;
            this.underboard = underboard;
            this.overboard = overboard;
            this.boardEdges = boardEdges;
            this.getLocCoord = getLocCoord;
        }

        private indexOfMin(vs: number[]): number {
            let minIdx = 0;
            let min = vs[0];
            for (let i = 1; i < vs.length; i++) {
                if (vs[i] < min) {
                    min = vs[i];
                    minIdx = i;
                }
            }
            return minIdx;
        }
        private closestEdgeIdx(p: [number, number]): number {
            let dists = this.boardEdges.map(e => Math.abs(p[1] - e));
            let edgeIdx = this.indexOfMin(dists);
            return edgeIdx;
        }
        private closestEdge(p: [number, number]): number {
            return this.boardEdges[this.closestEdgeIdx(p)];
        }

        private drawWire(pin1: Coord, pin2: Coord, color: string): Wire {
            let wires: SVGElement[] = [];
            let g = svg.child(this.overboard, "g", {class: "sim-bb-wire-group"});
            const closestPointOffBoard = (p: [number, number]): [number, number] => {
                const offset = PIN_DIST / 2;
                let e = this.closestEdge(p);
                let y: number;
                if (e - p[1] < 0)
                    y = e - offset;
                else
                    y = e + offset;
                return [p[0], y];
            }
            let wireId = nextWireId++;
            let clrClass = cssEncodeColor(color);
            let end1 = mkWireBBEnd(pin1, clrClass);
            let end2 = mkWireBBEnd(pin2, clrClass);
            let endG = <SVGGElement>svg.child(g, "g", {class: "sim-bb-wire-ends-g"});
            endG.appendChild(end1);
            endG.appendChild(end2);
            let edgeIdx1 = this.closestEdgeIdx(pin1);
            let edgeIdx2 = this.closestEdgeIdx(pin2);
            if (edgeIdx1 == edgeIdx2) {
                let seg = mkWireSeg(pin1, pin2, clrClass);
                g.appendChild(seg);
                wires.push(seg);
            } else {
                let offP1 = closestPointOffBoard(pin1);
                let offP2 = closestPointOffBoard(pin2);
                let offSeg1 = mkWireSeg(pin1, offP1, clrClass);
                let offSeg2 = mkWireSeg(pin2, offP2, clrClass);
                let midSeg: SVGElement;
                let midSegHover: SVGElement;
                let isBetweenMiddleTwoEdges = (edgeIdx1 == 1 || edgeIdx1 == 2) && (edgeIdx2 == 1 || edgeIdx2 == 2);
                if (isBetweenMiddleTwoEdges) {
                    midSeg = mkCurvedWireSeg(offP1, offP2, BB_WIRE_SMOOTH, clrClass);
                    midSegHover =  mkCurvedWireSeg(offP1, offP2, BB_WIRE_SMOOTH, clrClass);
                } else {
                    midSeg = mkWireSeg(offP1, offP2, clrClass);
                    midSegHover = mkWireSeg(offP1, offP2, clrClass);
                }
                svg.addClass(midSegHover, "sim-bb-wire-hover");
                g.appendChild(offSeg1);
                wires.push(offSeg1);
                g.appendChild(offSeg2);
                wires.push(offSeg2);
                this.underboard.appendChild(midSeg);
                wires.push(midSeg);
                g.appendChild(midSegHover);
                wires.push(midSegHover);
                //set hover mechanism
                let wireIdClass = `sim-bb-wire-id-${wireId}`;
                const setId = (e: SVGElement) => svg.addClass(e, wireIdClass);
                setId(endG);
                setId(midSegHover);
                this.styleEl.textContent += `
                    .${wireIdClass}:hover ~ .${wireIdClass}.sim-bb-wire-hover {
                        visibility: visible;
                    }`
            }

            // wire colors
            let colorCSS =  `
                .wire-stroke-${clrClass} {
                    stroke: ${mapWireColor(color)};
                }
                .wire-fill-${clrClass} {
                    fill: ${mapWireColor(color)};
                }
                `
            this.styleEl.textContent += colorCSS;

            return {endG: endG, end1: end1, end2: end2, wires: wires};
        }

        public addWire(start: Loc, end: Loc, color: string): Wire {
            let startLoc = this.getLocCoord(start);
            let endLoc = this.getLocCoord(end);
            let wireEls = this.drawWire(startLoc, endLoc, color);
            return wireEls;
        }
    }
}
