/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim {

    const accents = ["#3ADCFE", "#FFD43A", "#3AFFB3", "#FF3A54"];

    export function mkTheme(accent: string): boardsvg.INrf51dkTheme {
        return {
            accent: accent,
            edgeConnectorTheme: boardsvg.defaultEdgeConnectorTheme,
            accelerometerTheme: boardsvg.defaultAccelerometerTheme,
            radioTheme: boardsvg.defaultRadioTheme,
            displayTheme: boardsvg.defaultLedMatrixTheme,
            serialTheme: boardsvg.defaultSerialTheme,
            thermometerTheme: boardsvg.defaultThermometerTheme,
            lightSensorTheme: boardsvg.defaultLightSensorTheme,
            compassTheme: boardsvg.defaultCompassTheme,
        }
    }
    export function mkRandomTheme(): boardsvg.INrf51dkTheme {
        let accent = accents[Math.floor(Math.random() * accents.length)];
        return mkTheme(accent);
    }

    export class Nrf51dkBoard extends DalBoard {

        constructor() {
            super()
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            let options = (msg.options || {}) as RuntimeOptions;
            let theme: boardsvg.INrf51dkTheme;
            switch (options.theme) {
                case 'blue': theme = mkTheme(accents[0]); break;
                case 'yellow': theme = mkTheme(accents[1]); break;
                case 'green': theme = mkTheme(accents[2]); break;
                case 'red': theme = mkTheme(accents[3]); break;
                default: theme = mkRandomTheme();
            }
            
            theme.compassTheme.color = theme.accent;

            console.log("setting up nrf51dk simulator")
            let view = new pxsim.boardsvg.Nrf51dkSvg({
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

    export interface INrf51dkTheme {
        accent?: string;
        edgeConnectorTheme: IEdgeConnectorTheme;
        accelerometerTheme: IAccelerometerTheme;
        radioTheme: IRadioTheme;
        displayTheme: ILedMatrixTheme;
        serialTheme: ISerialTheme;
        thermometerTheme: IThermometerTheme;
        lightSensorTheme: ILightSensorTheme;
        compassTheme: ICompassTheme;
    }

    export interface INrf51dkProps {
        runtime: pxsim.Runtime;
        theme?: INrf51dkTheme;
        disableTilt?: boolean;
    }

    export const PIN_DIST = 15; //original dist: 15.25
    const WIDTH = 498;
    const HEIGHT = 725;
    const TOP_MARGIN = 20;
    const MID_MARGIN = 40;
    const BOT_MARGIN = 20;
    const WIRE_WIDTH = PIN_DIST/2.5;
    const BOARD_SYTLE = `
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

        .sim-bb-wire {
            fill:none;
            stroke-linecap: round;
            stroke-width:${WIRE_WIDTH}px;
            pointer-events: none;
        }
        .sim-bb-wire-end {
            stroke:#333;
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
        }`;

    export class Nrf51dkSvg {
        public element: SVGSVGElement;
        private style: SVGStyleElement;
        private defs: SVGDefsElement;
        private g: SVGElement;

        public board: pxsim.Nrf51dkBoard;

        //Legacy componenets
        private compassSvg = new CompassSvg();
        private displaySvg = new LedMatrixSvg();
        private edgeConnectorSvg = new EdgeConnectorSvg();
        private serialSvg = new SerialSvg();
        private radioSvg = new RadioSvg();
        private thermometerSvg = new ThermometerSvg();
        private accelerometerSvg = new AccelerometerSvg();
        private lightSensorSvg = new LightSensorSvg();
        private breadboard = new Breadboard();

        //IBoardComponents
        private buttonPairSvg: ButtonPairSvg;

        //locations
        private nameToLoc: Map<[number, number]> = {};

        constructor(public props: INrf51dkProps) {
            this.board = this.props.runtime.board as pxsim.Nrf51dkBoard;
            this.board.updateView = () => this.updateState();
            this.element = <SVGSVGElement>svg.elt("svg")
            svg.hydrate(this.element, {
                "version": "1.0",
                "viewBox": `0 0 ${WIDTH} ${HEIGHT}`,
                "enable-background": `new 0 0 ${WIDTH} ${HEIGHT}`,
                "class": "sim",
                "x": "0px",
                "y": "0px"
            });
            this.style = <SVGStyleElement>svg.child(this.element, "style", {});
            this.style.textContent += BOARD_SYTLE;
            this.defs = <SVGDefsElement>svg.child(this.element, "defs", {});
            this.g = svg.elt("g");
            this.element.appendChild(this.g);

            this.buildDom();

            this.buttonPairSvg = new ButtonPairSvg(this.board.bus, this.board.buttonPairState);
            this.attachComponent(this.buttonPairSvg);
            this.buttonPairSvg.setLocations(this.loc("f1"), this.loc("f28"), this.loc("d28"));
            
            this.updateTheme();
            this.updateState();
            this.attachEvents();
        }

        private loc(name: string): [number, number] {
            if (!(name in this.nameToLoc)) {
                console.error("Unknown location: " + name)
                return [0,0];
            }
            return this.nameToLoc[name];
        }

        private attachComponent<T>(comp: IBoardComponent<T>) {
            this.g.appendChild(comp.element);
            if (comp.defs)
                comp.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += comp.style || "";
        }

        private updateTheme() {
            let theme = this.props.theme;

            this.edgeConnectorSvg.updateTheme(theme.edgeConnectorTheme);
            this.accelerometerSvg.updateTheme(theme.accelerometerTheme);
            this.radioSvg.updateTheme(theme.radioTheme);
            this.displaySvg.updateTheme(theme.displayTheme);
            this.serialSvg.updateTheme(theme.serialTheme);
            this.thermometerSvg.updateTheme(theme.thermometerTheme);
            this.lightSensorSvg.updateTheme(theme.lightSensorTheme);
        }

        public updateState() {
            let state = this.board;
            if (!state) return;
            let theme = this.props.theme;

            this.buttonPairSvg.updateState();

            this.displaySvg.updateState(state.displayCmp);
            this.edgeConnectorSvg.updateState(this.g, state.edgeConnectorState, this.props.theme.edgeConnectorTheme);
            this.accelerometerSvg.updateState(this.g, state.accelerometerCmp, this.props.theme.accelerometerTheme, state.bus, !this.props.disableTilt, this.element);
            this.thermometerSvg.updateState(state.thermometerCmp, this.g, this.element, this.props.theme.thermometerTheme, this.defs);
            this.lightSensorSvg.updateState(state.lightSensorCmp, this.g, this.element, this.props.theme.lightSensorTheme, this.defs);
            this.compassSvg.updateState(state.compassCmp, this.props.theme.compassTheme, this.element);

            if (!runtime || runtime.dead) svg.addClass(this.element, "grayscale");
            else svg.removeClass(this.element, "grayscale");
        }

        private buildDom() {
            this.style.textContent += this.edgeConnectorSvg.style;
            this.style.textContent += this.radioSvg.style;
            this.style.textContent += this.displaySvg.style;
            this.style.textContent += this.serialSvg.style;
            this.style.textContent += this.thermometerSvg.style;
            this.style.textContent += this.lightSensorSvg.style;
            this.style.textContent += this.breadboard.style;

            // filters
            let glow = svg.child(this.defs, "filter", { id: "filterglow", x: "-5%", y: "-5%", width: "120%", height: "120%" });
            svg.child(glow, "feGaussianBlur", { stdDeviation: "5", result: "glow" });
            let merge = svg.child(glow, "feMerge", {});
            for (let i = 0; i < 3; ++i) svg.child(merge, "feMergeNode", { in: "glow" })

            // underboard
            let underboard = svg.child(this.g, "g");

            // arduino zero description
            const arduinoZero = {
                photo: "arduino-zero-photo-sml.png",
                scale: 0.422654269,
                width: 2366,
                height: 1803,
                pinDist: 84,
                pins: [
                    {x: 655, y: 42, labels: ["SCL", "SDA","AREF", "GND0", "~13", "~12", "~11", "~10", "~9", "~8"]},
                    {x: 1551, y: 42, labels: ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"]},
                    {x: 974, y: 1667, labels: ["ATN", "IOREF", "RESET", "3.3V", "5V", "GND1", "GND2", "VIN"]},
                    {x: 1734, y: 1667, labels: ["A0", "A1", "A2", "A3", "A4", "A5"]},
                ]
            }
            const azScale = (n: number) => n * (PIN_DIST / arduinoZero.pinDist);
            const boardHeight = azScale(arduinoZero.height);
            const boardWidth = azScale(arduinoZero.width);
            const boardXOff = (WIDTH - boardWidth)/2.0;
            const boardYOff = TOP_MARGIN;

            // main board
            svg.child(this.g, "image", 
                { class: "sim-board", x: boardXOff, y: boardYOff, width: boardWidth, height: boardHeight, 
                    "href": `/images/${arduinoZero.photo}`});
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
            arduinoZero.pins.forEach(pinDisc => {
                let l = boardXOff + azScale(pinDisc.x) + PIN_DIST/2.0;
                let t = boardYOff + azScale(pinDisc.y) + PIN_DIST/2.0;
                let rs = 1;
                let cs = pinDisc.labels.length;
                let pins = mkPinGrid(l, t, rs, cs, (i, j) => pinDisc.labels[j]);
                this.g.appendChild(pins);
            })

            // breadboard
            const bbHeight = 323; //TODO: relate to PIN_DIST
            const bbX = 0;
            const bbY = TOP_MARGIN + boardHeight + MID_MARGIN;

            const addBBLoc = (name: string, relativeXY: [number, number]): void => {
                this.nameToLoc[name] = [bbX + relativeXY[0], bbY + relativeXY[1]];
            }
            this.breadboard.buildDom(this.g, this.defs, WIDTH, bbHeight, addBBLoc);
            this.breadboard.updateLocation(bbX, bbY);

            // display 
            this.displaySvg.buildDom(this.g, PIN_DIST);
            this.displaySvg.updateLocation(this.loc("h12"))

            // compass
            this.compassSvg.buildDom(this.g);
            this.compassSvg.hide();

            // pins
            this.edgeConnectorSvg.buildDom(this.g, this.defs);
            this.edgeConnectorSvg.hide();

            // wires
            const mkCurvedWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
                const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
                let c1: [number, number] = [p1[0], p2[1]];
                let c2: [number, number] = [p2[0], p1[1]];
                let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
                (<any>w).style["stroke"] = clr;
                return w;
            }
            const mkWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
                const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
                let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} L${coordStr(p2)}`);
                (<any>w).style["stroke"] = clr;
                return w;
            }
            const mkWireEnd = (p: [number, number], clr: string): SVGElement => {
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
            const boardEdges = [TOP_MARGIN, TOP_MARGIN+boardHeight, TOP_MARGIN+boardHeight+MID_MARGIN, 
                TOP_MARGIN+boardHeight+MID_MARGIN+bbHeight];
            let nextWireId = 0;
            const drawWire = (pin1: string, pin2: string, clr: string) => {
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
                    let dists = boardEdges.map(e => Math.abs(p[1] - e));
                    let edgeIdx =  indexOfMin(dists);
                    return edgeIdx;
                }
                const closestEdge = (p: [number, number]): number => {
                    return boardEdges[closestEdgeIdx(p)];
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
                let wireId = nextWireId++;
                let end1 = mkWireEnd(p1, clr);
                let end2 = mkWireEnd(p2, clr);
                let endG = svg.child(this.g, "g", {class: "sim-bb-wire-ends-g"});
                endG.appendChild(end1);
                endG.appendChild(end2);
                let edgeIdx1 = closestEdgeIdx(p1);
                let edgeIdx2 = closestEdgeIdx(p2);
                if (edgeIdx1 == edgeIdx2) {
                    let seg = mkWireSeg(p1, p2, clr);
                    this.g.appendChild(seg);
                } else {
                    let offP1 = closestPointOffBoard(p1);
                    let offP2 = closestPointOffBoard(p2);
                    let offSeg1 = mkWireSeg(p1, offP1, clr);
                    let offSeg2 = mkWireSeg(p2, offP2, clr);
                    let midSeg: SVGElement;
                    let midSegHover: SVGElement;
                    let isBetweenMiddleTwoEdges = (edgeIdx1 == 1 || edgeIdx1 == 2) && (edgeIdx2 == 1 || edgeIdx2 == 2);
                    if (isBetweenMiddleTwoEdges) {
                        midSeg = mkCurvedWireSeg(offP1, offP2, clr);
                        midSegHover = mkCurvedWireSeg(offP1, offP2, clr);
                    } else {
                        midSeg = mkWireSeg(offP1, offP2, clr);
                        midSegHover = mkWireSeg(offP1, offP2, clr);
                    } 
                    svg.addClass(midSegHover, "sim-bb-wire-hover");
                    this.g.appendChild(offSeg1);
                    this.g.appendChild(offSeg2);
                    underboard.appendChild(midSeg);
                    this.g.appendChild(midSegHover);
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
            }

            // draw wires
            let wireClrs = {
                red: "rgb(240,80,80)",
                black: "#444",
                green: "#1bbe5f",
                blue: "#2d90df",
                yellow: "rgb(245,230,50)",
                orange: "#dc8628",
            }
            let wireDisc = [
                //btn1
                ["j1","7", wireClrs.yellow],
                ["a3","-2", wireClrs.black],
                //btn2
                ["j28","~6", wireClrs.orange],
                ["a30","-25", wireClrs.black],
                //display
                ["a12","~5", wireClrs.blue],
                ["a13","~4", wireClrs.blue],
                ["a14","~3", wireClrs.blue],
                ["a15","2", wireClrs.blue],
                ["j16","TX->1", wireClrs.blue],
                ["a16","A0", wireClrs.green],
                ["a17","A1", wireClrs.green],
                ["a18","A2", wireClrs.green],
                ["a19","A3", wireClrs.green],
                ["j12","A4", wireClrs.green],
                //gnd
                ["-1", "GND1", wireClrs.black],
            ]
            wireDisc.forEach(w => drawWire(w[0], w[1], w[2]));
        }

        private attachEvents() {
            this.serialSvg.attachEvents(this.g, this.props.theme.serialTheme);
            this.radioSvg.attachEvents(this.g, this.props.theme.radioTheme);
            this.accelerometerSvg.attachEvents(this.board.accelerometerCmp, !this.props.disableTilt, this.element);
            this.edgeConnectorSvg.attachEvents(this.board.bus, this.board.edgeConnectorState, this.element);
        }
    }
}