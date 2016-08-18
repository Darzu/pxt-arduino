/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

// themes
namespace pxsim {
    const accents = ["#3ADCFE", "#FFD43A", "#3AFFB3", "#FF3A54"];

    export function mkTheme(accent: string): visuals.IBoardTheme {
        return {
            accent: accent,
        }
    }
    export function mkRandomTheme(): visuals.IBoardTheme {
        let accent = accents[Math.floor(Math.random() * accents.length)];
        return mkTheme(accent);
    }
}

namespace pxsim {
    export class DalBoard extends BaseBoard {
        id: string;

        // the bus
        bus: EventBus;
        
        // state & update logic for component services
        ledMatrixCmp: LedMatrixCmp;
        edgeConnectorState: EdgeConnectorCmp;
        serialCmp: SerialCmp;
        accelerometerCmp: AccelerometerCmp;
        compassCmp: CompassCmp;
        thermometerCmp: ThermometerCmp;
        lightSensorCmp: LightSensorCmp;
        buttonPairState: ButtonPairCmp;
        radioCmp: RadioCmp;
        neopixelCmp: NeoPixelCmp;

        constructor() {
            super()
            this.id = "b" + Math_.random(2147483647);
            this.bus = new EventBus(runtime);
            
            // components
            this.ledMatrixCmp = new LedMatrixCmp(runtime);
            this.buttonPairState = new ButtonPairCmp();
            this.edgeConnectorState = new EdgeConnectorCmp();
            this.radioCmp = new RadioCmp(runtime);
            this.accelerometerCmp = new AccelerometerCmp(runtime);
            this.serialCmp = new SerialCmp();
            this.thermometerCmp = new ThermometerCmp();
            this.lightSensorCmp = new LightSensorCmp();
            this.compassCmp = new CompassCmp();
            this.neopixelCmp = new NeoPixelCmp();
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
            
            let boardDef = ARDUINO_ZERO; //TODO: read from pxt.json/pxttarget.json
            let cmpsList = HACK_STATIC_ANALYSIS_RESULTS; //TODO: derive from static analysis
            let cmpDefs = COMPONENT_DEFINITIONS; //TODO: read from pxt.json/pxttarget.json

            let view = new visuals.DalBoardSvg({
                boardDef: boardDef,
                activeComponents: cmpsList,
                componentDefinitions: cmpDefs,
                theme: theme,
                runtime: runtime
            })

            document.body.innerHTML = ""; // clear children
            document.body.appendChild(view.element);

            return Promise.resolve();
        }
    }
}

namespace pxsim.visuals {
    const svg = pxsim.svg;

    export interface IBoardTheme {
        accent?: string;
    }

    export interface IBoardSvgProps {
        runtime: pxsim.Runtime;
        boardDef: BoardDefinition;
        theme?: IBoardTheme;
        disableTilt?: boolean;
        shouldLabelPins?: boolean;
        activeComponents: string[];
        componentDefinitions: Map<ComponentDefinition>;
    }

    export const BOARD_BASE_WIDTH = 498;
    export const BOARD_BASE_HEIGHT = 725;
    export const BB_WIDTH = BOARD_BASE_WIDTH - 2;
    export const BB_HEIGHT = 323; //TODO: relate to PIN_DIST
    const TOP_MARGIN = 20;
    const MID_MARGIN = 40;
    const BOT_MARGIN = 20;
    export const PIN_LBL_SIZE = PIN_DIST * 0.7;
    export const BREADBOARD_COLUMN_COUNT = 30;
    export const BREADBOARD_ROW_COUNT = 12;

    export type ComputedBoardDimensions = {
        scaleFn: (n: number)=>number, 
        height: number, 
        width: number, 
        xOff: number, 
        yOff: number
    };
    export function getBoardDimensions(b: BoardDefinition): ComputedBoardDimensions {
        let vis = b.visual;
        let scaleFn = (n: number) => n * (PIN_DIST / vis.pinDist);
        let width = scaleFn(vis.width);
        return {
            scaleFn: scaleFn,
            height: scaleFn(vis.height),
            width: width,
            xOff: (BOARD_BASE_WIDTH - width)/2.0,
            yOff: TOP_MARGIN
        }
    }

    export const WIRE_WIDTH = PIN_DIST/2.5;
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

        .sim-board-pin {
            fill:#999;
            stroke:#000;
            stroke-width:${PIN_DIST/3.0}px;
        }
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
            stroke-dasharray: ${PIN_DIST/10.0},${PIN_DIST/1.5};
            /*stroke-opacity: 0.4;*/
        }
        .sim-board-pin-lbl {
            fill: #333;
        }
        .gray-cover {
            fill:#FFF;
            opacity: 0.7;
            stroke-width:0;
            visibility: hidden;
        }
        .sim-board-pin-hover {
            visibility: hidden;
            pointer-events: all;
            stroke-width:${PIN_DIST/6.0}px;
        }
        .sim-board-pin-hover:hover {
            visibility: visible;
        }
        /* Graying out */
        .grayed .sim-bb-wire-end:not(.notgrayed) {
            stroke: #777;
        }
        .grayed .sim-bb-wire:not(.notgrayed) {
            stroke: #CCC;
        }
        .grayed .sim-board-pin-lbl:not(.highlight) {
            fill: #AAA;
        }
        .grayed .sim-board-pin:not(.highlight) {
            fill:#BBB;
            stroke:#777;
        }
        .grayed .gray-cover {
            visibility: inherit;
        }
        .grayed .sim-cmp:not(.notgrayed) {
            opacity: 0.3;
        }
        /* Highlighting */
        .sim-board-pin-lbl.highlight {
            fill: #000;
            font-weight: bold;
        }
        .sim-board-pin.highlight {
            fill:#999;
            stroke:#000;
        }
        `;

    let nextBoardId = 0;
    let nextWireId = 0;
    export class DalBoardSvg {
        public element: SVGSVGElement;
        private style: SVGStyleElement;
        private defs: SVGDefsElement;
        private g: SVGElement;
        public board: pxsim.DalBoard;
        public background: SVGElement;
        private components: Map<IBoardComponent<any>>;
        public breadboard: Breadboard;
        private underboard: SVGGElement;
        private boardDef: BoardDefinition;
        private boardDim: ComputedBoardDimensions;
        private componentDefs: Map<ComponentDefinition>;
        private boardEdges: number[];
        private id: number;
        private labeledPins: boolean;
        public bbX: number;
        public bbY: number;
        private allPins: BBPin[] = [];
        private allLbls: BBLbl[] = [];
        private pinNmToLbl: Map<BBLbl> = {};
        private nameToLoc: Map<[number, number]> = {};
        private availablePowerPins = {
            top: {
                threeVolt: mkRange(26,51).map(n => `-${n}`),
                ground: mkRange(26,51).map(n => `+${n}`),
            },
            bottom: {
                threeVolt: mkRange(1,26).map(n => `-${n}`),
                ground: mkRange(1,26).map(n => `+${n}`),
            },
        };

        constructor(public props: IBoardSvgProps) {
            this.id = nextBoardId++;
            this.labeledPins = props.shouldLabelPins;
            this.boardDef = props.boardDef;
            this.boardDim = getBoardDimensions(this.boardDef);
            this.board = this.props.runtime.board as pxsim.DalBoard;
            this.board.updateView = () => this.updateState();
            this.element = <SVGSVGElement>svg.elt("svg")
            svg.hydrate(this.element, {
                "version": "1.0",
                "viewBox": `0 0 ${BOARD_BASE_WIDTH} ${BOARD_BASE_HEIGHT}`,
                "enable-background": `new 0 0 ${BOARD_BASE_WIDTH} ${BOARD_BASE_HEIGHT}`,
                "class": `sim sim-board-id-${this.id}`,
                "x": "0px",
                "y": "0px"
            });
            this.style = <SVGStyleElement>svg.child(this.element, "style", {});
            this.style.textContent += BOARD_SYTLE;
            this.defs = <SVGDefsElement>svg.child(this.element, "defs", {});
            this.g = svg.elt("g");
            this.element.appendChild(this.g);
            this.underboard = <SVGGElement>svg.child(this.g, "g", {class: "sim-underboard"});
            this.components = {};
            this.componentDefs = props.componentDefinitions;

            this.buildDom();

            this.updateTheme();
            this.updateState();

            let cmps = props.activeComponents;

            //TODO
            if (cmps.length > 0) {
                this.addBasicWires();
                let cmpDefs = cmps.map(c => this.componentDefs[c] || null);
                let cmpsAndWires = this.allocateComponentsAndWiring(cmpDefs);
                cmpsAndWires.forEach((cAndWs, idx) => {                    
                    let [cmpDef, wireDefs] = cAndWs;
                    let cmpNm = cmps[idx];
                    wireDefs.forEach(w => this.addWire(w, cmpNm));
                    this.addComponent(cmpDef, cmpNm);
                });
            }
        }

        public loc(name: string): [number, number] {
            if (!(name in this.nameToLoc)) {
                console.error("Unknown location: " + name)
                return [0,0];
            }
            return this.nameToLoc[name];
        }

        private mkGrayCover(x: number, y: number, w: number, h: number) {
            let rect = <SVGRectElement>svg.elt("rect");
            svg.hydrate(rect, {x: x, y: y, width: w, height: h, class: "gray-cover"});
            return rect;
        }

        private getCmpClass = (type: string) => `sim-${type}-cmp`;
        private getCmpHideClass = (type: string) => `sim-hide-${type}-cmp`;

        private allocateLocation(location: LocationDefinition, 
            opts: {
                nearestPin?: string,
                startColumn?: number,
                availableGPIOPins?: string[],
            }): LocationInstance 
        {
            if (location === "ground" || location === "threeVolt") {
                U.assert(!!opts.nearestPin);
                let nearestCoord = this.loc(opts.nearestPin);
                let firstTopAndBot = [
                    this.availablePowerPins.top.ground[0] || this.availablePowerPins.top.threeVolt[0], 
                    this.availablePowerPins.bottom.ground[0] || this.availablePowerPins.bottom.threeVolt[0]
                ].map(l => this.loc(l)); 
                if (!firstTopAndBot[0] || !firstTopAndBot[1]) {
                    console.debug(`No more available "${location}" locations!`);
                    //TODO
                }
                let nearTop = findClosestCoordIdx(nearestCoord, firstTopAndBot) == 0;
                let pins: string[];
                if (nearTop) {
                    if (location === "ground") {
                        pins = this.availablePowerPins.top.ground;
                    } else if (location === "threeVolt") {
                        pins = this.availablePowerPins.top.threeVolt;
                    }
                } else {
                    if (location === "ground") {
                        pins = this.availablePowerPins.bottom.ground;
                    } else if (location === "threeVolt") {
                        pins = this.availablePowerPins.bottom.threeVolt;
                    }
                }
                let pinCoords = pins.map(p => this.loc(p));
                let pinIdx = findClosestCoordIdx(nearestCoord, pinCoords);
                let pin = pins[pinIdx];
                if (nearTop) {
                    this.availablePowerPins.top.ground.splice(pinIdx, 1);
                    this.availablePowerPins.top.threeVolt.splice(pinIdx, 1);
                } else {
                    this.availablePowerPins.bottom.ground.splice(pinIdx, 1);
                    this.availablePowerPins.bottom.threeVolt.splice(pinIdx, 1);
                }
                return ["breadboard", pin];
            } else if (location[0] === "breadboard") {
                U.assert(!!opts.startColumn);
                let row = <string>location[1];
                let col = (<number>location[2] + opts.startColumn);
                return ["breadboard", `${row}${col}`]
            } else if (location[0] === "GPIO") {
                U.assert(!!opts.availableGPIOPins);
                let idx = <number>location[1];
                let pin = opts.availableGPIOPins[idx];
                return ["dalboard", pin];
            } else {
                //TODO
                U.assert(false);
                return null;
            }
        }
        public allocateBasicWires(): WireInstance[] {
            let boardGround = this.boardDef.groundPins[0] || null;
            if (!boardGround) {
                console.log("No available ground pin on board!");
                //TODO
            }
            let threeVoltPin = this.boardDef.threeVoltPins[0] || null;
            if (!threeVoltPin) {
                console.log("No available 3.3V pin on board!");
                //TODO
            }
            let topLeft = "-26";
            let botLeft = "-1";
            const wires: WireInstance[] = [
                {start: this.allocateLocation("ground", {nearestPin: topLeft}), 
                 end: this.allocateLocation("ground", {nearestPin: botLeft}), 
                 color: "blue", assemblyStep: 0},
                {start: this.allocateLocation("ground", {nearestPin: topLeft}), 
                 end: ["dalboard", boardGround], 
                color: "blue", assemblyStep: 0},
                {start: this.allocateLocation("threeVolt", {nearestPin: topLeft}), 
                 end: this.allocateLocation("threeVolt", {nearestPin: botLeft}), 
                 color: "red", assemblyStep: 1},
                {start: this.allocateLocation("threeVolt", {nearestPin: topLeft}), 
                 end: ["dalboard", threeVoltPin], 
                color: "red", assemblyStep: 1},
            ];
            return wires;
        }
        public allocateWire(wireDef: WireDefinition,
            opts: {
                startColumn: number,
                availableGPIOPins: string[],
            }): WireInstance
        {
            let ends = [wireDef.start, wireDef.end];
            let endIsPower = ends.map(e => e === "ground" || e === "threeVolt");
            let endInsts = ends.map((e, idx) => !endIsPower[idx] ? this.allocateLocation(e, opts) : null)
            endInsts = endInsts.map((e, idx) => e ? e : this.allocateLocation(ends[idx], {
                    nearestPin: endInsts[1 - idx][1],
                    startColumn: opts.startColumn,
                    availableGPIOPins: opts.availableGPIOPins
                })); 
            return {start: endInsts[0], end: endInsts[1], color: wireDef.color, assemblyStep: wireDef.assemblyStep};
        }
        private allocateGPIOPins(cmpDefs: ComponentDefinition[]): string[][][] {
            // determine blocks needed
            let blockAssignments: {cmpIdx: number, blkIdx: number, gpioNeeded: number, gpioAssigned: string[]}[] = [];
            cmpDefs.forEach((def, idx) => {
                if (def) {
                    if (typeof def.gpioPinsNeeded === "number") {
                        //individual pins
                        for (let i = 0; i < def.gpioPinsNeeded; i++) {
                            blockAssignments.push(
                                {cmpIdx: idx, blkIdx: 0, gpioNeeded: 1, gpioAssigned: []});
                        }
                    } else {
                        //blocks of pins
                        let blocks = <number[]>def.gpioPinsNeeded;
                        blocks.forEach((numNeeded, blkIdx) => {
                            blockAssignments.push(
                                {cmpIdx: idx, blkIdx: blkIdx, gpioNeeded: numNeeded, gpioAssigned: []});
                        });
                    }
                }
            });
            // sort by size of blocks
            let sortBlockAssignments = () => blockAssignments.sort((a, b) => b.gpioNeeded - a.gpioNeeded); //largest blocks first
            let sortAvailableGPIOBlocks = () => availableGPIOBlocks.sort((a, b) => b.length - a.length); //largest blocks first
            // allocate each block
            let copyDoubleArray = (a: string[][]) => a.map(b => b.map(p => p));
            let availableGPIOBlocks = copyDoubleArray(this.boardDef.gpioPinBlocks);
            if (0 < blockAssignments.length && 0 < availableGPIOBlocks.length) {
                do {
                    sortBlockAssignments();
                    sortAvailableGPIOBlocks();
                    let assignment = blockAssignments[0];
                    let smallestAvailableBlockThatFits = availableGPIOBlocks[0];
                    for (let j = 0; j < availableGPIOBlocks.length; j++) {
                        if (assignment.gpioNeeded <= availableGPIOBlocks[j].length) {
                            smallestAvailableBlockThatFits = availableGPIOBlocks[j];
                        }
                    }
                    if (smallestAvailableBlockThatFits.length <= 0) {
                        break; // out of pins
                    }
                    while (0 < assignment.gpioNeeded && 0 < smallestAvailableBlockThatFits.length) {
                        assignment.gpioNeeded--;
                        let pin = smallestAvailableBlockThatFits[0];
                        smallestAvailableBlockThatFits.splice(0,1);
                        assignment.gpioAssigned.push(pin);
                    }
                    sortBlockAssignments();
                } while(0 < blockAssignments[0].gpioNeeded);
            }
            if (0 < blockAssignments.length && 0 < blockAssignments[0].gpioNeeded) {
                //TODO: out of pins
                console.debug("Not enough GPIO pins!");
                return null;
            }
            let cmpGPIOPins: string[][][] = cmpDefs.map((def, cmpIdx) => {
                if (!def)
                    return null;
                let assignments = blockAssignments.filter(a => a.cmpIdx === cmpIdx);
                let gpioPins: string[][] = [];
                for (let i = 0; i < assignments.length; i++) {
                    let a = assignments[i];
                    let blk = gpioPins[a.blkIdx] || (gpioPins[a.blkIdx] = []);
                    a.gpioAssigned.forEach(p => blk.push(p));
                }
                return gpioPins;
            });
            return cmpGPIOPins;
        }
        private allocateColumns(cmpDefs: ComponentDefinition[]): number[] {
            let componentsCount = cmpDefs.length;
            let totalAvailableSpace = BREADBOARD_COLUMN_COUNT;//TODO allow multiple breadboards
            let totalSpaceNeeded = cmpDefs.map(d => d.breadboardColumnsNeeded).reduce((p, n) => p + n, 0);
            let extraSpace = totalAvailableSpace - totalSpaceNeeded;
            if (extraSpace <= 0) {
                console.log("Not enough breadboard space!");
                //TODO
            }
            let padding = Math.floor(extraSpace/(componentsCount-1+2));
            let componentSpacing = padding;//Math.floor(extraSpace/(componentsCount-1));
            let totalCmpPadding = extraSpace - componentSpacing*(componentsCount-1);
            let leftPadding = Math.floor(totalCmpPadding/2);
            let rightPadding = Math.ceil(totalCmpPadding/2);
            let nextAvailableCol = 1 + leftPadding;
            let cmpStartCol = cmpDefs.map(cmp => {
                let col = nextAvailableCol;
                nextAvailableCol += cmp.breadboardColumnsNeeded + componentSpacing;
                return col;
            });
            return cmpStartCol;
        }
        private allocatePowerPins(cmpDefs: ComponentDefinition[]): {ground: string[], threeVolt: string[]} {
            let ground: string[] = [];
            let threeVolt: string[] = []; 
            
            let cmpWires = cmpDefs.map(d => d.wires);
            //let groundWires = 
            //TODO

            return {ground: ground, threeVolt: threeVolt};
        }
        public allocateComponent(cmpDef: ComponentDefinition, startColumn: number): ComponentInstance {
            return {
                breadboardStartColumn: startColumn,
                assemblyStep: cmpDef.assemblyStep,
            };
        }
        public allocateComponentsAndWiring(cmpDefs: ComponentDefinition[]): [ComponentInstance, WireInstance[]][] {
            let cmpGPIOPinBlocks = this.allocateGPIOPins(cmpDefs);
            let availableGPIOPins = cmpGPIOPinBlocks.map(blks => blks.reduce((p, n) => p.concat(n), []));
            let cmpStartCol = this.allocateColumns(cmpDefs);            
            let wires = cmpDefs.map((c, idx) => c.wires.map(d => this.allocateWire(d, {
                availableGPIOPins: availableGPIOPins[idx],
                startColumn: cmpStartCol[idx],
            })));
            let cmps = cmpDefs.map((c, idx) => this.allocateComponent(c, cmpStartCol[idx]));
            let cmpsAndWires = cmps.map((c, idx) => <[ComponentInstance, WireInstance[]]>[c, wires[idx]]);
            return cmpsAndWires;
        }

        public addBasicWires() {
            let wires = this.allocateBasicWires();
            console.log("basic wires:");
            console.dir(wires);
            wires.forEach(w => this.addWire(w));
        }
        public addWire(w: WireInstance, cmp?: string): {endG: SVGGElement, end1: SVGElement, end2: SVGElement, wires: SVGElement[]} {
            let startLoc = this.loc(w.start[1]);
            let endLoc = this.loc(w.end[1]);
            let wireEls = this.drawWire(startLoc, endLoc, w.color)
            if (cmp) {
                let cls = this.getCmpClass(cmp);
                svg.addClass(wireEls.endG, cls)
                wireEls.wires.forEach(e => svg.addClass(e, cls));
            }
            return wireEls;
        }
        public addComponent(cmpDesc: ComponentInstance, name: string): IBoardComponent<any> {
            const mkCmp = (type: string): IBoardComponent<any> => {
                let cnstr = builtinComponentSimVisual[type];
                let stateFn = builtinComponentSimState[type];
                let cmp = cnstr();
                cmp.init(this.board.bus, stateFn(this.board), this.element);
                return cmp;
            }
            let cmp = mkCmp(name);
            this.components[name] = cmp;
            this.g.appendChild(cmp.element);
            if (cmp.defs)
                cmp.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += cmp.style || "";
            let loc = `j${cmpDesc.breadboardStartColumn}`;
            let coord = this.loc(loc);
            cmp.moveToCoord(coord);
            let cls = this.getCmpClass(name);
            svg.addClass(cmp.element, cls);
            svg.addClass(cmp.element, "sim-cmp");
            let hideCls = this.getCmpHideClass(name);
            this.style.textContent += `
                .${hideCls} .${cls} {
                    display: none;
                }`
            cmp.updateTheme();
            cmp.updateState();
            return cmp;
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
            if (this.board.ledMatrixCmp.used){
                svg.removeClass(this.g, this.getCmpHideClass("display"))
            } else {
                svg.addClass(this.g, this.getCmpHideClass("display"))
            }
            if (this.board.buttonPairState.used){
                svg.removeClass(this.g, this.getCmpHideClass("buttonpair"))
            } else {
                svg.addClass(this.g, this.getCmpHideClass("buttonpair"))
            }
            if (this.board.neopixelCmp.used){
                svg.removeClass(this.g, this.getCmpHideClass("neopixel"))
            } else {
                svg.addClass(this.g, this.getCmpHideClass("neopixel"))
            }
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
        private resetLbl(lbl: SVGTextElement, pinX: number, pinY: number, size: number, name: string) {
            let [x,y] = [pinX, pinY];
            let lblY: number;
            let lblX: number;
            let topEdge = this.closestEdgeIdx([x,y]) == 0;
            if (topEdge) {
                let lblLen = size * 0.25 * name.length;
                lblY = y + 12 + lblLen;
                lblX = x;
            } else {
                let lblLen = size * 0.32 * name.length;
                lblY = y - 11 - lblLen;
                lblX = x;
            }
            resetTxt(lbl, lblX, lblY, size, 270, name);
            svg.addClass(lbl, "sim-board-pin-lbl");
        }

        private buildDom() {
            const bbX = (BOARD_BASE_WIDTH - BB_WIDTH)/2;              
            this.bbX = bbX;          
            const bbY = TOP_MARGIN + this.boardDim.height + MID_MARGIN;
            this.bbY = bbY;

            // edges
            this.boardEdges = [TOP_MARGIN, TOP_MARGIN+this.boardDim.height, bbY, bbY+BB_HEIGHT]

            // filters
            let glow = svg.child(this.defs, "filter", { id: "filterglow", x: "-5%", y: "-5%", width: "120%", height: "120%" });
            svg.child(glow, "feGaussianBlur", { stdDeviation: "5", result: "glow" });
            let merge = svg.child(glow, "feMerge", {});
            for (let i = 0; i < 3; ++i) 
                svg.child(merge, "feMergeNode", { in: "glow" })

            // main board
            this.background = svg.child(this.g, "image", 
                { class: "sim-board", x: this.boardDim.xOff, y: this.boardDim.yOff, width: this.boardDim.width, height: this.boardDim.height, 
                    "href": `/images/${this.boardDef.visual.image}`});
            let backgroundCover = this.mkGrayCover(this.boardDim.xOff, this.boardDim.yOff, this.boardDim.width, this.boardDim.height);
            this.g.appendChild(backgroundCover);
            const mkPinGrid = (l: number, t: number, rs: number, cs: number, getNm: (i: number, j: number) => string) => {
                const size = PIN_DIST*0.66666;
                const hoverSize = PIN_DIST*0.66666 + PIN_DIST/3.0;
                let props = { class: "sim-board-pin" }
                let pinFn = (p: SVGRectElement, i: number, j: number, x: number, y: number, overP: SVGRectElement) => {
                    let name = getNm(i, j);
                    this.nameToLoc[name] = [x, y];
                    svg.hydrate(p, {title: name});
                    let pin: BBPin = {p: p, x: x, y: y, rowNm: name, colNm: name, pinNm: name};
                    this.allPins.push(pin);
                    //label
                    if (this.labeledPins) {
                        let lbl = <SVGTextElement>svg.elt("text");    
                        this.resetLbl(lbl, x, y, PIN_LBL_SIZE, name);
                        let bbLbl: BBLbl = {l: lbl, cx: x, cy: y, size: PIN_LBL_SIZE, rot: 270, nm: name, nearestPin: pin};
                        this.g.appendChild(lbl);
                        this.allLbls.push(bbLbl);
                        this.pinNmToLbl[name] = bbLbl;
                    }
                    //hover
                    svg.addClass(overP, "sim-board-pin-hover");
                    svg.hydrate(overP, {title: name});
                };
                return mkGrid(l, t, rs, cs, size, size, props, pinFn);
            }
            this.boardDef.visual.pinBlocks.forEach(pinBlock => {
                let l = this.boardDim.xOff + this.boardDim.scaleFn(pinBlock.x) + PIN_DIST/2.0;
                let t = this.boardDim.yOff + this.boardDim.scaleFn(pinBlock.y) + PIN_DIST/2.0;
                let rs = 1;
                let cs = pinBlock.labels.length;
                let pins = mkPinGrid(l, t, rs, cs, (i, j) => pinBlock.labels[j]);
                svg.addClass(pins, "sim-board-pin-group");
                this.g.appendChild(pins);
            })

            // breadboard
            const addBBLoc = (name: string, relativeXY: [number, number]): void => {
                this.nameToLoc[name] = [bbX + relativeXY[0], bbY + relativeXY[1]];
            }
            this.breadboard = new Breadboard(BB_WIDTH, BB_HEIGHT, addBBLoc)
            this.g.appendChild(this.breadboard.bb);
            this.breadboard.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += this.breadboard.style;
            this.breadboard.updateLocation(bbX, bbY);

            // wire colors
            //TODO: handle all wire colors even ones not in WIRE_COLOR_MAP
            for (let clr in WIRE_COLOR_MAP) {
                this.style.textContent += `
                .wire-stroke-${clr} {
                    stroke: ${mapWireColor(clr)};
                }
                .wire-fill-${clr} {
                    fill: ${mapWireColor(clr)};
                }
                `
            } 
        }

        // wires
        private mkCurvedWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
            const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
            let c1: [number, number] = [p1[0], p2[1]];
            let c2: [number, number] = [p2[0], p1[1]];
            let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
            if (clr in WIRE_COLOR_MAP) {
                svg.addClass(w, `wire-stroke-${clr}`);
            } else {
                (<any>w).style["stroke"] = clr;
            }
            return w;
        }
        private mkWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
            const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
            let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} L${coordStr(p2)}`);
            if (clr in WIRE_COLOR_MAP) {
                svg.addClass(w, `wire-stroke-${clr}`);
            } else {
                (<any>w).style["stroke"] = clr;
            }
            return w;
        }
        private mkWireEnd = (p: [number, number], clr: string): SVGElement => {
            const endW = PIN_DIST/4;
            let w = svg.elt("circle");
            let x = p[0];
            let y = p[1];
            let r = WIRE_WIDTH/2 + endW/2;
            svg.hydrate(w, {cx: x, cy: y, r: r, class: "sim-bb-wire-end"});
            if (clr in WIRE_COLOR_MAP) {
                svg.addClass(w, `wire-fill-${clr}`);
            } else {
                (<any>w).style["fill"] = clr;
            }
            (<any>w).style["stroke-width"] = `${endW}px`;
            return w;
        }                
        private drawWire(pin1: Coord, pin2: Coord, clr: string): {endG: SVGGElement, end1: SVGElement, end2: SVGElement, wires: SVGElement[]} {
            let wires: SVGElement[] = [];
            let g = svg.child(this.g, "g", {class: "sim-bb-wire-group"});
            const closestPointOffBoard = (p: [number, number]): [number, number] => {
                const offset = PIN_DIST/2;
                let e = this.closestEdge(p);
                let y: number;
                if (e - p[1] < 0)
                    y = e - offset;
                else
                    y = e + offset;
                return [p[0], y];
            }
            let wireId = nextWireId++;
            let end1 = this.mkWireEnd(pin1, clr);
            let end2 = this.mkWireEnd(pin2, clr);
            let endG = <SVGGElement>svg.child(g, "g", {class: "sim-bb-wire-ends-g"});
            endG.appendChild(end1);
            endG.appendChild(end2);
            let edgeIdx1 = this.closestEdgeIdx(pin1);
            let edgeIdx2 = this.closestEdgeIdx(pin2);
            if (edgeIdx1 == edgeIdx2) {
                let seg = this.mkWireSeg(pin1, pin2, clr);
                g.appendChild(seg);
                wires.push(seg);
            } else {
                let offP1 = closestPointOffBoard(pin1);
                let offP2 = closestPointOffBoard(pin2);
                let offSeg1 = this.mkWireSeg(pin1, offP1, clr);
                let offSeg2 = this.mkWireSeg(pin2, offP2, clr);
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
                this.style.textContent += `
                    .${wireIdClass}:hover ~ .${wireIdClass}.sim-bb-wire-hover { 
                        visibility: visible; 
                    }
                    .sim-bb-wire-ends-g:hover .sim-bb-wire-end { 
                        stroke: red; 
                    }`
            }
            return {endG: endG, end1: end1, end2: end2, wires: wires};
        }

        public highlightLoc(pinNm: string) {
            let lbl = this.pinNmToLbl[pinNm];
            if (lbl) {
                svg.addClass(lbl.l, "highlight");
                const SIZE_SCALAR = 1.3;
                this.resetLbl(lbl.l, lbl.cx, lbl.cy, lbl.size * SIZE_SCALAR, lbl.nm);
                svg.addClass(lbl.nearestPin.p, "highlight");
                this.element.appendChild(lbl.l);
            }
        }
    }
}