/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim {

    export class Nrf51dkBoard extends DalBoard {

        private accents = ["#3ADCFE", "#FFD43A", "#3AFFB3", "#FF3A54"];

        private mkTheme(accent: string): boardsvg.INrf51dkTheme {
            return {
                accent: accent,
                buttonPairTheme: boardsvg.defaultButtonPairTheme,
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
        public mkRandomTheme(): boardsvg.INrf51dkTheme {
            let accent = this.accents[Math.floor(Math.random() * this.accents.length)];
            return this.mkTheme(accent);
        }

        constructor() {
            super()
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            let options = (msg.options || {}) as RuntimeOptions;
            let theme: boardsvg.INrf51dkTheme;
            switch (options.theme) {
                case 'blue': theme = this.mkTheme(this.accents[0]); break;
                case 'yellow': theme = this.mkTheme(this.accents[1]); break;
                case 'green': theme = this.mkTheme(this.accents[2]); break;
                case 'red': theme = this.mkTheme(this.accents[3]); break;
                default: theme = this.mkRandomTheme();
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
        buttonPairTheme: IButtonPairTheme;
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

    const WIDTH = 498;
    const HEIGHT = 812;
    const BOARD_HEIGHT = 380;
    const BREADBOARD_HEIGHT = 323; //TODO: relate to PIN_DIST
    const TOP_MARGIN = 20;
    const MID_MARGIN = 40;
    const BB_X = 0;
    const BB_Y = TOP_MARGIN + BOARD_HEIGHT + MID_MARGIN;

    export class Nrf51dkSvg {
        public element: SVGSVGElement;
        private style: SVGStyleElement;
        private defs: SVGDefsElement;
        private g: SVGElement;

        public board: pxsim.Nrf51dkBoard;

        private compassSvg = new CompassSvg();
        private displaySvg = new LedMatrixSvg();
        private buttonPairSvg = new ButtonPairSvg();
        private edgeConnectorSvg = new EdgeConnectorSvg();
        private serialSvg = new SerialSvg();
        private radioSvg = new RadioSvg();
        private thermometerSvg = new ThermometerSvg();
        private accelerometerSvg = new AccelerometerSvg();
        private lightSensorSvg = new LightSensorSvg();
        private breadboard = new Breadboard();

        constructor(public props: INrf51dkProps) {
            this.board = this.props.runtime.board as pxsim.Nrf51dkBoard;
            this.board.updateView = () => this.updateState();
            this.buildDom();
            this.updateTheme();
            this.updateState();
            this.attachEvents();
        }

        private updateTheme() {
            let theme = this.props.theme;

            this.buttonPairSvg.updateTheme(theme.buttonPairTheme);
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

            this.displaySvg.updateState(state.displayCmp);
            this.buttonPairSvg.updateState(state.buttonPairState, this.props.theme.buttonPairTheme);
            this.edgeConnectorSvg.updateState(this.g, state.edgeConnectorState, this.props.theme.edgeConnectorTheme);
            this.accelerometerSvg.updateState(this.g, state.accelerometerCmp, this.props.theme.accelerometerTheme, pointerEvents, state.bus, !this.props.disableTilt, this.element);
            this.thermometerSvg.updateState(state.thermometerCmp, this.g, this.element, this.props.theme.thermometerTheme, this.defs);
            this.lightSensorSvg.updateState(state.lightSensorCmp, this.g, this.element, this.props.theme.lightSensorTheme, this.defs);
            this.compassSvg.updateState(state.compassCmp, this.props.theme.compassTheme, this.element);

            if (!runtime || runtime.dead) svg.addClass(this.element, "grayscale");
            else svg.removeClass(this.element, "grayscale");
        }

        private bbLoc(pinName: string): [number, number] {
            let bbLoc = this.breadboard.getPinLoc(pinName);
            return [bbLoc[0] + BB_X, bbLoc[1] + BB_Y];
        }

        private buildDom() {

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
            //TODO(DZ): generalize flash animation for components 
            this.style.textContent = `
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
}
.sim-bb-wire-end {
    stroke:#333;
}
            `;
            this.style.textContent += this.buttonPairSvg.style;
            this.style.textContent += this.edgeConnectorSvg.style;
            this.style.textContent += this.radioSvg.style;
            this.style.textContent += this.displaySvg.style;
            this.style.textContent += this.serialSvg.style;
            this.style.textContent += this.thermometerSvg.style;
            this.style.textContent += this.lightSensorSvg.style;
            this.style.textContent += this.breadboard.style;

            this.defs = <SVGDefsElement>svg.child(this.element, "defs", {});
            this.g = svg.elt("g");
            this.element.appendChild(this.g);

            // filters
            let glow = svg.child(this.defs, "filter", { id: "filterglow", x: "-5%", y: "-5%", width: "120%", height: "120%" });
            svg.child(glow, "feGaussianBlur", { stdDeviation: "5", result: "glow" });
            let merge = svg.child(glow, "feMerge", {});
            for (let i = 0; i < 3; ++i) svg.child(merge, "feMergeNode", { in: "glow" })

            // backgrounds
            svg.child(this.g, "image", 
                { class: "sim-board", x: 0, y: TOP_MARGIN, width: WIDTH, height: BOARD_HEIGHT, 
                    "href": "/images/arduino-zero-photo-sml.png"});

            // hand-drawn breadboard
            this.breadboard.buildDom(this.g, this.defs, WIDTH, BREADBOARD_HEIGHT);
            this.breadboard.updateLocation(BB_X, BB_Y);

            // display 
            this.displaySvg.buildDom(this.g, PIN_DIST);
            this.displaySvg.updateLocation(this.bbLoc("h12"))

            // compass
            this.compassSvg.buildDom(this.g);
            this.compassSvg.hide();

            // pins
            this.edgeConnectorSvg.buildDom(this.g, this.defs);
            this.edgeConnectorSvg.hide();

            // buttons
            this.buttonPairSvg.buildDom(this.g, PIN_DIST);
            this.buttonPairSvg.updateLocation(0, this.bbLoc("f1"));
            this.buttonPairSvg.updateLocation(1, this.bbLoc("f28"));
            this.buttonPairSvg.updateLocation(2, this.bbLoc("d28"));//TODO move to virtual space

            // wires
            const wireWidth = PIN_DIST/2.5;
            const red = "rgb(240,80,80)";
            const mkWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
                const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
                let c1: [number, number] = [p1[0], p2[1]];
                let c2: [number, number] = [p2[0], p1[1]];
                let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
                (<any>w).style["stroke"] = clr;
                (<any>w).style["stroke-width"] = `${wireWidth}px`;
                return w;
            }
            const mkWireEnd = (p: [number, number], clr: string): SVGElement => {
                const endW = PIN_DIST/5;
                let wg = svg.elt("g");
                let x = p[0];
                let y = p[1];
                let r = wireWidth/2 + endW/2;
                let w = svg.child(wg, "circle", {cx: x, cy: y, r: r, class: "sim-bb-wire-end"});
                (<any>w).style["fill"] = clr;
                (<any>w).style["stroke-width"] = `${endW}px`;
                return wg;
            }
            const boardEdges = [TOP_MARGIN, TOP_MARGIN+BOARD_HEIGHT, TOP_MARGIN+BOARD_HEIGHT+MID_MARGIN, 
                TOP_MARGIN+BOARD_HEIGHT+MID_MARGIN+BREADBOARD_HEIGHT];
            const mkWire = (p1: [number, number], p2: [number, number], clr: string): SVGElement => {
                let g = svg.elt("g");
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
                const closestEdge = (p: [number, number]): number => {
                    let dists = boardEdges.map(e => Math.abs(p[1] - e));
                    let edgeIdx =  indexOfMin(dists);
                    return boardEdges[edgeIdx];
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
                let end1 = mkWireEnd(p1, clr);
                g.appendChild(end1);
                let offP1 = closestPointOffBoard(p1);
                let offSeg1 = mkWireSeg(p1, offP1, clr);
                g.appendChild(offSeg1);
                let end2 = mkWireEnd(p2, clr);
                g.appendChild(end2);
                let offP2 = closestPointOffBoard(p2);
                let offSeg2 = mkWireSeg(p2, offP2, clr);
                g.appendChild(offSeg2);
                let midSeg = mkWireSeg(offP1, offP2, clr);
                g.appendChild(midSeg);
                return g;
            }
            const drawWire = (p1: [number, number], p2: [number, number], clr: string): SVGElement => {
                let w = mkWire(p1, p2, clr);
                this.g.appendChild(w);
                return w;
            }
            drawWire(this.bbLoc("a1"), this.bbLoc("j6"), red);
        }

        private attachEvents() {
            this.serialSvg.attachEvents(this.g, this.props.theme.serialTheme);
            this.radioSvg.attachEvents(this.g, this.props.theme.radioTheme);
            this.accelerometerSvg.attachEvents(this.board.accelerometerCmp, !this.props.disableTilt, this.element);
            this.edgeConnectorSvg.attachEvents(this.board.bus, this.board.edgeConnectorState, this.element);
            this.buttonPairSvg.attachEvents(this.board.bus, this.board.buttonPairState, this.props.theme.accelerometerTheme);
        }
    }
}