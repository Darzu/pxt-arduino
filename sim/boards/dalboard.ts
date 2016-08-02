/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

// themes
namespace pxsim {
    const accents = ["#3ADCFE", "#FFD43A", "#3AFFB3", "#FF3A54"];

    export function mkTheme(accent: string): boardsvg.IBoardTheme {
        return {
            accent: accent,
        }
    }
    export function mkRandomTheme(): boardsvg.IBoardTheme {
        let accent = accents[Math.floor(Math.random() * accents.length)];
        return mkTheme(accent);
    }
}

namespace pxsim {
    export class DalBoard extends BaseBoard {
        id: string;

        // the bus
        bus: EventBus;
        
        // components
        //TODO(DZ): allow different component selections
        displayCmp: LedMatrixCmp;
        edgeConnectorState: EdgeConnectorCmp;
        serialCmp: SerialCmp;
        accelerometerCmp: AccelerometerCmp;
        compassCmp: CompassCmp;
        thermometerCmp: ThermometerCmp;
        lightSensorCmp: LightSensorCmp;
        buttonPairState: ButtonPairCmp;
        radioCmp: RadioCmp;

        constructor() {
            super()
            this.id = "b" + Math_.random(2147483647);
            this.bus = new EventBus(runtime);
            
            // components
            this.displayCmp = new LedMatrixCmp(runtime);
            this.buttonPairState = new ButtonPairCmp();
            this.edgeConnectorState = new EdgeConnectorCmp();
            this.radioCmp = new RadioCmp(runtime);
            this.accelerometerCmp = new AccelerometerCmp(runtime);
            this.serialCmp = new SerialCmp();
            this.thermometerCmp = new ThermometerCmp();
            this.lightSensorCmp = new LightSensorCmp();
            this.compassCmp = new CompassCmp();
        }

        receiveMessage(msg: SimulatorMessage) {
            if (!runtime || runtime.dead) return;

            switch (msg.type || "") {
                case "eventbus":
                    let ev = <SimulatorEventBusMessage>msg;
                    this.bus.queue(ev.id, ev.eventid, ev.value);
                    break;
                case "serial":
                    let data = (<SimulatorSerialMessage>msg).data || "";
                    this.serialCmp.recieveData(data);
                    break;
                case "radiopacket":
                    let packet = <SimulatorRadioPacketMessage>msg;
                    this.radioCmp.recievePacket(packet);
                    break;
            }
        }

        kill() {
            super.kill();
            AudioContextManager.stop();
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            let options = (msg.options || {}) as RuntimeOptions;
            let theme = mkRandomTheme();
            
            let desc = boardsvg.ARDUINO_ZERO;
            let view = new boardsvg.DalBoardSvg({
                boardDesc: desc,
                theme: theme,
                runtime: runtime
            })

            document.body.innerHTML = ""; // clear children
            document.body.appendChild(view.element);

            return Promise.resolve();
        }
    }
}

namespace pxsim.boardsvg {
    const svg = pxsim.svg;

    export interface IBoardTheme {
        accent?: string;
    }

    export interface IBoardSvgProps {
        runtime: pxsim.Runtime;
        boardDesc: BoardDescription;
        theme?: IBoardTheme;
        disableTilt?: boolean;
        blank?: boolean; //useful for generating instructions
    }

    export const PIN_DIST = 15; //original dist: 15.25
    export const BOARD_BASE_WIDTH = 498;
    export const BOARD_BASE_HEIGHT = 725;
    export const BB_WIDTH = BOARD_BASE_WIDTH;
    export const BB_HEIGHT = 323; //TODO: relate to PIN_DIST
    const TOP_MARGIN = 20;
    const MID_MARGIN = 40;
    const BOT_MARGIN = 20;

    export type BoardDimensions = {scaleFn: (n: number)=>number, height: number, width: number, xOff: number, yOff: number};
    export function getBoardDimensions(b: BoardDescription): BoardDimensions {
        let scaleFn = (n: number) => n * (PIN_DIST / b.pinDist);
        let width = scaleFn(b.width);
        return {
            scaleFn: scaleFn,
            height: scaleFn(b.height),
            width: width,
            xOff: (BOARD_BASE_WIDTH - width)/2.0,
            yOff: TOP_MARGIN
        }
    }

    export const WIRE_WIDTH = PIN_DIST/2.5;
    export const WIRE_STYLE = `
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
        .sim-board-pin {
            fill:#999;
            stroke:#000;
            stroke-width:${PIN_DIST/3.0}px;
        }
        .sim-bb-wire-hover {
            stroke-width: ${WIRE_WIDTH}px;
            visibility: hidden;
            stroke-dasharray: ${PIN_DIST/2.0},${PIN_DIST/1.0};
        }
        `
    export const BOARD_SYTLE = `
        .noselect {
            -webkit-touch-callout: none; /* iOS Safari */
            -webkit-user-select: none;   /* Chrome/Safari/Opera */
            -khtml-user-select: none;    /* Konqueror */
            -moz-user-select: none;      /* Firefox */
            -ms-user-select: none;       /* Internet Explorer/Edge */
            user-select: none;           /* Non-prefixed version, currently
                                            not supported by any browser */
        }
        svg.sim {
            margin-bottom:1em;
        }
        svg.sim.grayscale {    
            -moz-filter: grayscale(1);
            -webkit-filter: grayscale(1);
            filter: grayscale(1);
        }

        .sim-text {
        font-family:"Lucida Console", Monaco, monospace;
        font-size:25px;
        fill:#fff;
        pointer-events: none;
        }

        /* animations */
        .sim-theme-glow {
            animation-name: sim-theme-glow-animation;
            animation-timing-function: ease-in-out;
            animation-direction: alternate;
            animation-iteration-count: infinite;
            animation-duration: 1.25s;
        }
        @keyframes sim-theme-glow-animation {  
            from { opacity: 1; }
            to   { opacity: 0.75; }
        }

        .sim-flash {
            animation-name: sim-flash-animation;
            animation-duration: 0.1s;
        }

        @keyframes sim-flash-animation {  
            from { fill: yellow; }
            to   { fill: default; }
        }

        .sim-flash-stroke {
            animation-name: sim-flash-stroke-animation;
            animation-duration: 0.4s;
            animation-timing-function: ease-in;
        }

        @keyframes sim-flash-stroke-animation {  
            from { stroke: yellow; }
            to   { stroke: default; }
        }
        ${WIRE_STYLE}
        `;

    export class DalBoardSvg {
        public element: SVGSVGElement;
        private style: SVGStyleElement;
        private defs: SVGDefsElement;
        private g: SVGElement;
        public board: pxsim.DalBoard;
        public background: SVGElement;
        private components: Map<IBoardComponent<any>>;
        private breadboard: Breadboard;
        private underboard: SVGGElement;
        private boardDesc: BoardDescription;
        private boardDim: BoardDimensions;
        private boardEdges: number[];

        //locations
        private nameToLoc: Map<[number, number]> = {};

        constructor(public props: IBoardSvgProps) {
            this.boardDesc = props.boardDesc;
            this.boardDim = getBoardDimensions(this.boardDesc);
            this.board = this.props.runtime.board as pxsim.DalBoard;
            this.board.updateView = () => this.updateState();
            this.element = <SVGSVGElement>svg.elt("svg")
            svg.hydrate(this.element, {
                "version": "1.0",
                "viewBox": `0 0 ${BOARD_BASE_WIDTH} ${BOARD_BASE_HEIGHT}`,
                "enable-background": `new 0 0 ${BOARD_BASE_WIDTH} ${BOARD_BASE_HEIGHT}`,
                "class": "sim",
                "x": "0px",
                "y": "0px"
            });
            this.style = <SVGStyleElement>svg.child(this.element, "style", {});
            this.style.textContent += BOARD_SYTLE;
            this.defs = <SVGDefsElement>svg.child(this.element, "defs", {});
            this.g = svg.elt("g");
            this.element.appendChild(this.g);
            this.underboard = <SVGGElement>svg.child(this.g, "g");
            this.components = {};

            this.buildDom();

            this.updateTheme();
            this.updateState();

            if (!props.blank) {
                this.boardDesc.basicWires.forEach(w => this.addWire(w));
                this.boardDesc.components.forEach(c => this.addComponentAndWiring(c));
            }
        }

        private loc(name: string): [number, number] {
            if (!(name in this.nameToLoc)) {
                console.error("Unknown location: " + name)
                return [0,0];
            }
            return this.nameToLoc[name];
        }

        private getCmpClass = (type: Component) => `sim-${type}-cmp`;
        private getCmpHideClass = (type: Component) => `sim-hide-${type}-cmp`;

        public addWire(w: WireDescription, cmp?: Component) {
            let wireEls = this.drawWire(w.bb, w.pin, mapWireColor(w.color))
            if (cmp)
                wireEls.forEach(e => svg.addClass(e, this.getCmpClass(cmp)));
        }
        public addComponent(cmpDesc: ComponentDescription) {
            const mkCmp = (type: Component): IBoardComponent<any> => {
                let [cnstr, stateFn] = ComponenetToCnstrAndState[cmpDesc.type];
                let cmp = cnstr();
                cmp.init(this.board.bus, stateFn(this.board), this.element);
                return cmp;
            }
            let cmp = mkCmp(cmpDesc.type);
            this.components[cmpDesc.type] = cmp;
            this.g.appendChild(cmp.element);
            if (cmp.defs)
                cmp.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += cmp.style || "";
            let locCoords = (cmpDesc.locations || []).map(locStr => this.loc(locStr));
            cmp.setLocations(...locCoords);
            let cls = this.getCmpClass(cmpDesc.type);
            svg.addClass(cmp.element, cls);
            let hideCls = this.getCmpHideClass(cmpDesc.type);
            this.style.textContent += `
                .${hideCls} .${cls} {
                    display: none;
                }`
            cmp.updateTheme();
            cmp.updateState();
        }
        public addComponentAndWiring(cmpDesc: ComponentDescription) {
            this.addComponent(cmpDesc);
            cmpDesc.wires.forEach(w => this.addWire(w));
        }

        private updateTheme() {
            let theme = this.props.theme;

            for (let nm in this.components) {
                this.components[nm].updateTheme();
            }
        }

        public updateState() {
            let state = this.board;
            if (!state) return;
            let theme = this.props.theme;

            for (let nm in this.components) {
                this.components[nm].updateState();
            }

            if (!runtime || runtime.dead) svg.addClass(this.element, "grayscale");
            else svg.removeClass(this.element, "grayscale");

            //show/hide
            //TODO generalize for all components
            if (this.board.displayCmp.used){
                svg.removeClass(this.g, this.getCmpHideClass("display"))
            } else {
                svg.addClass(this.g, this.getCmpHideClass("display"))
            }
            if (this.board.buttonPairState.used){
                svg.removeClass(this.g, this.getCmpHideClass("buttonpair"))
            } else {
                svg.addClass(this.g, this.getCmpHideClass("buttonpair"))
            }
        }

        private buildDom() {
            // filters
            let glow = svg.child(this.defs, "filter", { id: "filterglow", x: "-5%", y: "-5%", width: "120%", height: "120%" });
            svg.child(glow, "feGaussianBlur", { stdDeviation: "5", result: "glow" });
            let merge = svg.child(glow, "feMerge", {});
            for (let i = 0; i < 3; ++i) 
                svg.child(merge, "feMergeNode", { in: "glow" })

            // main board
            this.background = svg.child(this.g, "image", 
                { class: "sim-board", x: this.boardDim.xOff, y: this.boardDim.yOff, width: this.boardDim.width, height: this.boardDim.height, 
                    "href": `/images/${this.boardDesc.photo}`});
            const mkPinGrid = (l: number, t: number, rs: number, cs: number, getNm: (i: number, j: number) => string) => {
                const size = PIN_DIST*0.66666;
                let props = { class: "sim-board-pin" }
                let pinFn = (p: SVGElement, i: number, j: number, x: number, y: number) => {
                    let name = getNm(i, j);
                    this.nameToLoc[name] = [x, y];
                    svg.hydrate(p, {title: name});
                };
                return mkGrid(l, t, rs, cs, size, props, pinFn);
            }
            this.boardDesc.pins.forEach(pinDisc => {
                let l = this.boardDim.xOff + this.boardDim.scaleFn(pinDisc.x) + PIN_DIST/2.0;
                let t = this.boardDim.yOff + this.boardDim.scaleFn(pinDisc.y) + PIN_DIST/2.0;
                let rs = 1;
                let cs = pinDisc.labels.length;
                let pins = mkPinGrid(l, t, rs, cs, (i, j) => pinDisc.labels[j]);
                this.g.appendChild(pins);
            })

            // breadboard
            const bbX = 0;                        
            const bbY = TOP_MARGIN + this.boardDim.height + MID_MARGIN;

            const addBBLoc = (name: string, relativeXY: [number, number]): void => {
                this.nameToLoc[name] = [bbX + relativeXY[0], bbY + relativeXY[1]];
            }
            this.breadboard = new Breadboard()
            this.breadboard.buildDom(this.g, this.defs, BB_WIDTH, BB_HEIGHT, addBBLoc);
            this.style.textContent += this.breadboard.style;
            this.breadboard.updateLocation(bbX, bbY);

            // edges
            this.boardEdges = [TOP_MARGIN, TOP_MARGIN+this.boardDim.height, bbY, bbY+BB_HEIGHT]
        }

        // wires
        private mkCurvedWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
            const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
            let c1: [number, number] = [p1[0], p2[1]];
            let c2: [number, number] = [p2[0], p1[1]];
            let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
            (<any>w).style["stroke"] = clr;
            return w;
        }
        private mkWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
            const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
            let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} L${coordStr(p2)}`);
            (<any>w).style["stroke"] = clr;
            return w;
        }
        private mkWireEnd = (p: [number, number], clr: string): SVGElement => {
            const endW = PIN_DIST/4;
            let w = svg.elt("circle");
            let x = p[0];
            let y = p[1];
            let r = WIRE_WIDTH/2 + endW/2;
            svg.hydrate(w, {cx: x, cy: y, r: r, class: "sim-bb-wire-end"});
            (<any>w).style["fill"] = clr;
            (<any>w).style["stroke-width"] = `${endW}px`;
            return w;
        }                
        private nextWireId = 0;
        private drawWire = (pin1: string, pin2: string, clr: string) => {
            let result: SVGElement[] = [];
            let p1 = this.loc(pin1);
            let p2 = this.loc(pin2);
            const indexOfMin = (vs: number[]): number => {
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
            const closestEdgeIdx = (p: [number, number]): number => {
                let dists = this.boardEdges.map(e => Math.abs(p[1] - e));
                let edgeIdx =  indexOfMin(dists);
                return edgeIdx;
            }
            const closestEdge = (p: [number, number]): number => {
                return this.boardEdges[closestEdgeIdx(p)];
            }
            const closestPointOffBoard = (p: [number, number]): [number, number] => {
                const offset = PIN_DIST/2;
                let e = closestEdge(p);
                let y: number;
                if (e - p[1] < 0)
                    y = e - offset;
                else
                    y = e + offset;
                return [p[0], y];
            }
            let wireId = this.nextWireId++;
            let end1 = this.mkWireEnd(p1, clr);
            let end2 = this.mkWireEnd(p2, clr);
            let endG = svg.child(this.g, "g", {class: "sim-bb-wire-ends-g"});
            result.push(endG);
            endG.appendChild(end1);
            endG.appendChild(end2);
            let edgeIdx1 = closestEdgeIdx(p1);
            let edgeIdx2 = closestEdgeIdx(p2);
            if (edgeIdx1 == edgeIdx2) {
                let seg = this.mkWireSeg(p1, p2, clr);
                this.g.appendChild(seg);
                result.push(seg);
            } else {
                let offP1 = closestPointOffBoard(p1);
                let offP2 = closestPointOffBoard(p2);
                let offSeg1 = this.mkWireSeg(p1, offP1, clr);
                let offSeg2 = this.mkWireSeg(p2, offP2, clr);
                let midSeg: SVGElement;
                let midSegHover: SVGElement;
                let isBetweenMiddleTwoEdges = (edgeIdx1 == 1 || edgeIdx1 == 2) && (edgeIdx2 == 1 || edgeIdx2 == 2);
                if (isBetweenMiddleTwoEdges) {
                    midSeg = this.mkCurvedWireSeg(offP1, offP2, clr);
                    midSegHover =this. mkCurvedWireSeg(offP1, offP2, clr);
                } else {
                    midSeg = this.mkWireSeg(offP1, offP2, clr);
                    midSegHover = this.mkWireSeg(offP1, offP2, clr);
                } 
                svg.addClass(midSegHover, "sim-bb-wire-hover");
                this.g.appendChild(offSeg1);
                result.push(offSeg1);
                this.g.appendChild(offSeg2);
                result.push(offSeg2);
                this.underboard.appendChild(midSeg);
                result.push(midSeg);
                this.g.appendChild(midSegHover);
                result.push(midSegHover);
                //set hover mechanism
                let wireIdClass = `sim-bb-wire-id${wireId}`;
                const setId = (e: SVGElement) => svg.addClass(e, wireIdClass);
                setId(endG);
                setId(midSegHover);
                this.style.textContent += `
                    .${wireIdClass}:hover ~ .${wireIdClass}.sim-bb-wire-hover { 
                        visibility: visible; 
                    }
                    .sim-bb-wire-ends-g:hover .sim-bb-wire-end { 
                        stroke: red; 
                    }`
            }
            return result;
        }
    }
}