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

    const PIN_DIST = 15.25;

    declare type PinFn = (p: SVGElement, i: number, j: number, x: number, y: number)=>string;

    export class Breadboard {
        private bb: SVGGElement;
        private background: SVGElement;

        //TODO relate font size to PIN_DIST 
        public style = `
/* bread board */
.sim-bb-pin {
    fill:#333;
}
.sim-bb-az {
    font-family:"Lucida Console", Monaco, monospace;
    fill:red;
    pointer-events: none;
}`

        public updateLocation(x: number, y: number) {
            //TODO(DZ): come up with a better abstraction/interface for customizing placement
            let els = [this.bb, this.background];
            translateEls(els, x, y);
        }
        
        public buildDom(g: SVGElement, width: number, height: number) {
            const midRatio = 0.66666666;
            const midH = height*midRatio;
            const barRatio = 0.16666666;
            const barH = height*barRatio;

            const midCols = 30;
            const midGridW = (midCols-1) * PIN_DIST;
            const midRows = 12;
            const midGridH = (midRows-1) * PIN_DIST;
            const midGridX = (width - midGridW)/2;
            const midGridY = barH + (midH - midGridH)/2;

            const barRows = 2;
            const barGridH = (barRows-1) * PIN_DIST;
            const barCols = 5*5+4
            const barGridW = (barCols-1) * PIN_DIST;
            const topBarGridX = (width - barGridW)/2;
            const topBarGridY = (barH - barGridH)/2;
            const botBarGridX = topBarGridX;
            const botBarGridY = topBarGridY + barH + midH;

            this.background = svg.child(g, "image", 
                { class: "sim-board", x: 0, y: 0, width: width, height: height, 
                    "href": "/images/breadboard-photo-sml.png"});

            const mkGrid = (l: number, t: number, rs: number, cs: number,  pinFn: PinFn): SVGGElement => {
                const size = PIN_DIST/2.5;
                const rounding = size/3;
                const x = l - size/2;
                const y = t - size/2;

                let grid = <SVGGElement>svg.elt("g");
                for (let i = 0; i < rs; i++) {
                    for (let j = 0; j < cs; j++) {
                        let pin = svg.elt("rect")
                        let pinX = x+j*PIN_DIST;
                        let pinY = y+i*PIN_DIST;
                        let name = pinFn(pin, i, j, pinX+size/2, pinY+size/2);
                        let props = { class: "sim-bb-pin", x: pinX, y: pinY, rx: rounding, ry: rounding, width: size, height: size, title: name };
                        svg.hydrate(pin, props)
                        grid.appendChild(pin);

                    }
                }
                return grid;
            }

            const mkBar = (x: number, y: number, pinFn: PinFn) => {
                return [
                     mkGrid(x + 0*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+0, x, y)),
                     mkGrid(x + 6*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+5, x, y)),
                     mkGrid(x + 12*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+10, x, y)),
                     mkGrid(x + 18*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+15, x, y)),
                     mkGrid(x + 24*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+20, x, y)),
                ]
            }

            let nameToPin: Map<SVGElement> = {};
            let nameToLoc: Map<[number, number]> = {};
            const notePin = (getNm: (i: number, j: number) => string): PinFn => {
                return (p, i, j, x, y) => {
                    let name = getNm(i, j);
                    nameToPin[name] = p;
                    nameToLoc[name] = [x, y];
                    return name;
                }
            }

            this.bb = <SVGGElement>svg.child(g, "g")

            let ae = ["e", "d", "c", "b", "a", ];
            let fj = ["j", "i", "h", "g", "f", ];
            let nums = ["1","2","3","4","5","6","7","8","9","10",
                "11","12","13","14","15","16","17","18","19","20",
                "21","22","23","24","25","26","27","28","29","30",
                "31","32","33","34","35","36","37","38","39","40",
                "41","42","43","44","45","46","47","48","49","50"];
            let mp = ["-", "+"];

            let midGrid1 = mkGrid(midGridX,midGridY,5,30, notePin((i, j) => fj[i]+nums[j]));
            this.bb.appendChild(midGrid1);
            let midGrid2 = mkGrid(midGridX,midGridY+7*PIN_DIST,5,30, notePin((i, j) => ae[i]+nums[j]));
            this.bb.appendChild(midGrid2);
            let topGrid = mkBar(topBarGridX, topBarGridY, notePin((i, j) => mp[i]+nums[j+25]));
            topGrid.forEach(e => this.bb.appendChild(e));
            let botGrid = mkBar(botBarGridX, botBarGridY, notePin((i, j) => mp[i]+nums[j]));
            botGrid.forEach(e => this.bb.appendChild(e));

            //labels
            const txtSize = 15.0;
            const txtWRatio = 6.27/15;
            const txtHRatio = 13.0/15;
            const txtW = txtWRatio*txtSize;
            const txtH = txtHRatio*txtSize;

            const mkTxt = (l: number, t: number, txt: string) => {
                const x = t - txtW / 2.0;
                const y = l - txtH / 2.0;
                svg.child(this.bb, "circle", {cx: l, cy: t, r: txtW/2, style: `fill:green;`})
                let el = svg.child(this.bb, "text", { class: "sim-bb-az", x: x, y: y, style: `font-size:${txtSize}px;` }) as SVGTextElement;
                el.textContent = txt;
            }
            let loc = nameToLoc["h5"];
            console.log(`h5: (${loc[0]}, ${loc[1]})`);
            mkTxt(loc[0], loc[1], "a")
            mkTxt(topBarGridX + txtSize, topBarGridY, "b")
            mkTxt(topBarGridX, topBarGridY + txtSize, "1")
            mkTxt(topBarGridX, topBarGridY + txtSize*2, "2")
            mkTxt(topBarGridX + txtSize, topBarGridY + txtSize, "-")
            mkTxt(topBarGridX + txtSize*2, topBarGridY + txtSize*2, "+")
        }
    }

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

        private buildDom() {
            const WIDTH = 498;
            const HEIGHT = 812;
            const BOARD_HEIGHT = 380;
            const BREADBOARD_HEIGHT = 323; //TODO: relate to PIN_DIST
            const TOP_MARGIN = 20;
            const MID_MARGIN = 40;
            const BB_X = 0;
            const BB_Y = TOP_MARGIN + BOARD_HEIGHT + MID_MARGIN;

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
            this.breadboard.buildDom(this.g, WIDTH, BREADBOARD_HEIGHT);
            this.breadboard.updateLocation(BB_X, BB_Y);

            // display 
            this.displaySvg.buildDom(this.g, PIN_DIST);
            this.displaySvg.updateLocation(PIN_DIST*8.3, 482+PIN_DIST*2)

            // compass
            this.compassSvg.buildDom(this.g);
            this.compassSvg.hide();

            // pins
            this.edgeConnectorSvg.buildDom(this.g, this.defs);
            this.edgeConnectorSvg.hide();

            // buttons
            this.buttonPairSvg.buildDom(this.g, PIN_DIST);
            this.buttonPairSvg.updateLocation(0, 25.9, 176.4+370);
            this.buttonPairSvg.updateLocation(1, 418.1, 176.4+370);
            this.buttonPairSvg.updateLocation(2, 417, 250+370);
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