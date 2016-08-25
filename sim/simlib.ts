/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/microbit/dal.d.ts"/>

namespace pxsim {
    export function initRuntimeWithDalBoard() {
        U.assert(!runtime.board);
        let b = new DalBoard();
        runtime.board = b;
    }
    if (!pxsim.initCurrentRuntime) {
        pxsim.initCurrentRuntime = initRuntimeWithDalBoard;
    }

    export function board() {
        return runtime.board as DalBoard;
    }
}

namespace pxsim {
    export function mkRange(a: number, b: number): number[] {
        let res: number[] = [];
        for (; a < b; a++)
            res.push(a);
        return res;
    }

    export function bbLocToCoordStr(loc: BBRowCol) {
        let [row, col] = loc;
        return `(${row},${col})`
    }
}

namespace pxsim.visuals {
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
    export function findDistSqrd(a: Coord, b: Coord): number {
        let x = a[0] - b[0];
        let y = a[1] - b[1];
        return x * x + y * y;
    }
    export function findClosestCoordIdx(a: Coord, bs: Coord[]): number {
        let dists = bs.map(b => findDistSqrd(a, b));
        let minIdx = dists.reduce((prevIdx, currDist, currIdx, arr) => {
            return currDist < arr[prevIdx] ? currIdx : prevIdx;
        }, 0);
        return minIdx;
    }

    export interface IBoardComponent<T> {
        style: string,
        element: SVGElement,
        defs: SVGElement[],
        init(bus: EventBus, state: T, svgEl: SVGSVGElement): void, //NOTE: constructors not supported in interfaces
        moveToCoord(xy: Coord): void,
        updateState(): void,
        updateTheme(): void,
    }

    export function mkTxt(cx: number, cy: number, size: number, rot: number, txt: string, txtXOffFactor?: number, txtYOffFactor?: number): SVGTextElement {
        let el = <SVGTextElement>svg.elt("text")
         //HACK: these constants (txtXOffFactor, txtYOffFactor) tweak the way this algorithm knows how to center the text
        txtXOffFactor = txtXOffFactor || -0.33333;
        txtYOffFactor = txtYOffFactor || 0.3;
        const xOff = txtXOffFactor * size * txt.length;
        const yOff = txtYOffFactor * size;
        svg.hydrate(el, {style: `font-size:${size}px;`,
            transform: `translate(${cx} ${cy}) rotate(${rot}) translate(${xOff} ${yOff})` });
        svg.addClass(el, "noselect");
        el.textContent = txt;
        return el;
    }

    export type WireColor =
        "black" | "white" | "gray" | "purple" | "blue" | "green" | "yellow" | "orange" | "red" | "brown";
    export const WIRE_COLOR_MAP: Map<string> = {
        black: "#514f4d",
        white: "#fcfdfc",
        gray: "#acabab",
        purple: "#a772a1",
        blue: "#01a6e8",
        green: "#3cce73",
        yellow: "#ece600",
        orange: "#fdb262",
        red: "#f44f43",
        brown: "#c89764",
    }
    export function mapWireColor(clr: WireColor | string): string {
        return WIRE_COLOR_MAP[clr] || clr;
    }

    export interface SVGAndSize<T extends SVGElement> {e: T, t: number, l: number, w: number, h: number};
    export type SVGElAndSize = SVGAndSize<SVGElement>;

    export const PIN_DIST = 15;
}