/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    const svg = pxsim.svg;

    export interface IBoardSvgProps {
        runtime: pxsim.Runtime;
        boardDef: BoardDefinition;
        disableTilt?: boolean;
        activeComponents: string[];
        componentDefinitions: Map<ComponentDefinition>;
    }

    export const BOARD_BASE_WIDTH = 498;
    export const BOARD_BASE_HEIGHT = 725;
    const TOP_MARGIN = 20;
    const MID_MARGIN = 40;
    const BOT_MARGIN = 20;
    const PIN_LBL_SIZE = PIN_DIST * 0.7;
    const PIN_LBL_HOVER_SIZE = PIN_LBL_SIZE * 1.5;
    const SQUARE_PIN_WIDTH = PIN_DIST * 0.66666;
    const SQUARE_PIN_HOVER_WIDTH = PIN_DIST * 0.66666 + PIN_DIST / 3.0;

    export type ComputedBoardDimensions = {
        scaleFn: (n: number) => number,
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
            xOff: (BOARD_BASE_WIDTH - width) / 2.0,
            yOff: TOP_MARGIN
        }
    }

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
            stroke-width:${PIN_DIST / 3.0}px;
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
            stroke-width:${PIN_DIST / 6.0}px;
        }
        .sim-board-pin-hover:hover {
            visibility: visible;
        }
        .sim-board-pin-lbl {
            visibility: hidden;
        }
        .sim-board-outline .sim-board-pin-lbl {
            visibility: visible;
        }
        .sim-board-pin-lbl {
            fill: #555;
        }
        .sim-board-pin-lbl-hover {
            fill: red;
        }
        .sim-board-outline .sim-board-pin-lbl-hover {
            fill: black;
        }
        .sim-board-pin-lbl,
        .sim-board-pin-lbl-hover {
            font-family:"Lucida Console", Monaco, monospace;
            pointer-events: all;
            stroke-width: 0;
        }
        .sim-board-pin-lbl-hover {
            visibility: hidden;
        }
        .sim-board-outline .sim-board-pin-hover:hover + .sim-board-pin-lbl,
        .sim-board-pin-lbl.highlight {
            visibility: hidden;
        }
        .sim-board-outline .sim-board-pin-hover:hover + * + .sim-board-pin-lbl-hover,
        .sim-board-pin-lbl-hover.highlight {
            visibility: visible;
        }
        /* Graying out */
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
    export class DalBoardSvg {
        public element: SVGSVGElement;
        private style: SVGStyleElement;
        private defs: SVGDefsElement;
        private g: SVGGElement;
        public board: pxsim.DalBoard;
        public background: SVGElement;
        private components: IBoardComponent<any>[];
        public breadboard: Breadboard;
        private underboard: SVGGElement;
        public boardDef: BoardDefinition;
        private boardDim: ComputedBoardDimensions;
        public componentDefs: Map<ComponentDefinition>;
        private boardEdges: number[];
        private id: number;
        public bbX: number;
        public bbY: number;
        private boardTopEdge: number;
        private boardBotEdge: number;
        private wireFactory: WireFactory;
        //truth
        private allPins: GridPin[] = [];
        private allLabels: GridLabel[] = [];
        //cache
        private pinNmToLbl: Map<GridLabel> = {};
        private pinNmToPin: Map<GridPin> = {};

        private availablePowerPins = {
            top: {
                threeVolt: mkRange(26, 51).map(n => <BreadboardLocation>["+", `${n}`]),
                ground: mkRange(26, 51).map(n => <BreadboardLocation>["-", `${n}`]),
            },
            bottom: {
                threeVolt: mkRange(1, 26).map(n => <BreadboardLocation>["+", `${n}`]),
                ground: mkRange(1, 26).map(n => <BreadboardLocation>["-", `${n}`]),
            },
        };

        constructor(public props: IBoardSvgProps) {
            this.id = nextBoardId++;
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
            this.g = <SVGGElement>svg.elt("g");
            this.element.appendChild(this.g);
            this.underboard = <SVGGElement>svg.child(this.g, "g", {class: "sim-underboard"});
            this.components = [];
            this.componentDefs = props.componentDefinitions;

            // breadboard
            this.breadboard = new Breadboard()
            this.g.appendChild(this.breadboard.bb);
            this.breadboard.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += this.breadboard.style;
            let bbSize = this.breadboard.getSVGAndSize();
            let [bbWidth, bbHeight] = [bbSize.w, bbSize.h];
            const bbX = (BOARD_BASE_WIDTH - bbWidth) / 2;
            this.bbX = bbX;
            const bbY = TOP_MARGIN + this.boardDim.height + MID_MARGIN;
            this.bbY = bbY;
            this.breadboard.updateLocation(bbX, bbY);

            // edges
            this.boardTopEdge = TOP_MARGIN;
            this.boardBotEdge = TOP_MARGIN + this.boardDim.height;
            this.boardEdges = [this.boardTopEdge, this.boardBotEdge, bbY, bbY + bbHeight]

            this.wireFactory = new WireFactory(this.underboard, this.g, this.boardEdges, this.style);

            this.buildDom();

            this.updateTheme();
            this.updateState();

            let cmps = props.activeComponents;
            if (cmps.length) {
                let alloc = this.allocateAll(cmps);
                this.addAll(alloc);
            }
        }

        private getGPIOCoord(pinNm: string): Coord {
            let pin = this.pinNmToPin[pinNm];
            if (!pin)
                return null;
            return [pin.cx, pin.cy];
        }
        private getBBCoord(row: string, col: string): Coord {
            let bbCoord = this.breadboard.getCoord(row, col);
            if (!bbCoord)
                return null;
            let [x, y] = bbCoord;
            return [x + this.bbX, y + this.bbY];
        }

        public getPinCoord(loc: LocationInstance): Coord {
            let coord: Coord;
            if (loc[0] === "breadboard") {
                let [row, col] = <BreadboardLocation>loc[1];
                coord = this.getBBCoord(row, col);
            } else {
                let pinNm = <DALBoardLocation>loc[1];
                coord = this.getGPIOCoord(pinNm);
            }
            if (!coord) {
                console.error("Unknown location: " + name)
                return [0, 0];
            }
            return coord;
        }

        private mkGrayCover(x: number, y: number, w: number, h: number) {
            let rect = <SVGRectElement>svg.elt("rect");
            svg.hydrate(rect, {x: x, y: y, width: w, height: h, class: "gray-cover"});
            return rect;
        }

        private getCmpClass = (type: string) => `sim-${type}-cmp`;

        private allocateLocation(location: LocationDefinition,
            opts: {
                nearestBBPin?: BreadboardLocation,
                startColumn?: number,
                availableGPIOPins?: string[],
            }): LocationInstance
        {
            if (location === "ground" || location === "threeVolt") {
                U.assert(!!opts.nearestBBPin);
                let [nearRow, nearCol] = opts.nearestBBPin;
                let nearestCoord = this.getBBCoord(nearRow, nearCol);
                let firstTopAndBot = [
                    this.availablePowerPins.top.ground[0] || this.availablePowerPins.top.threeVolt[0],
                    this.availablePowerPins.bottom.ground[0] || this.availablePowerPins.bottom.threeVolt[0]
                ].map(l => {
                    let [row, col] = l;
                    return this.getBBCoord(row, col)
                });
                if (!firstTopAndBot[0] || !firstTopAndBot[1]) {
                    console.debug(`No more available "${location}" locations!`);
                    //TODO
                }
                let nearTop = findClosestCoordIdx(nearestCoord, firstTopAndBot) == 0;
                let pins: BreadboardLocation[];
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
                let pinCoords = pins.map(p => {
                    let [row, col] = p;
                    return this.getBBCoord(row, col)
                });
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
                let col = (<number>location[2] + opts.startColumn).toString();
                return ["breadboard", [row, col]]
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
            let topLeft: BreadboardLocation = ["-", "26"];
            let botLeft: BreadboardLocation = ["-", "1"];
            const GROUND_COLOR = "blue";
            const POWER_COLOR = "red";
            const wires: WireInstance[] = [
                {start: this.allocateLocation("ground", {nearestBBPin: topLeft}),
                 end: this.allocateLocation("ground", {nearestBBPin: botLeft}),
                 color: GROUND_COLOR, assemblyStep: 0},
                {start: this.allocateLocation("ground", {nearestBBPin: topLeft}),
                 end: ["dalboard", boardGround],
                color: GROUND_COLOR, assemblyStep: 0},
                {start: this.allocateLocation("threeVolt", {nearestBBPin: topLeft}),
                 end: this.allocateLocation("threeVolt", {nearestBBPin: botLeft}),
                 color: POWER_COLOR, assemblyStep: 1},
                {start: this.allocateLocation("threeVolt", {nearestBBPin: topLeft}),
                 end: ["dalboard", threeVoltPin],
                color: POWER_COLOR, assemblyStep: 1},
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
                    nearestBBPin: <BreadboardLocation>endInsts[1 - idx][1],
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
                        smallestAvailableBlockThatFits.splice(0, 1);
                        assignment.gpioAssigned.push(pin);
                    }
                    sortBlockAssignments();
                } while (0 < blockAssignments[0].gpioNeeded);
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
            let totalAvailableSpace = 30; //TODO allow multiple breadboards
            let totalSpaceNeeded = cmpDefs.map(d => d.breadboardColumnsNeeded).reduce((p, n) => p + n, 0);
            let extraSpace = totalAvailableSpace - totalSpaceNeeded;
            if (extraSpace <= 0) {
                console.log("Not enough breadboard space!");
                //TODO
            }
            let padding = Math.floor(extraSpace / (componentsCount - 1 + 2));
            let componentSpacing = padding; //Math.floor(extraSpace/(componentsCount-1));
            let totalCmpPadding = extraSpace - componentSpacing * (componentsCount - 1);
            let leftPadding = Math.floor(totalCmpPadding / 2);
            let rightPadding = Math.ceil(totalCmpPadding / 2);
            let nextAvailableCol = 1 + leftPadding;
            let cmpStartCol = cmpDefs.map(cmp => {
                let col = nextAvailableCol;
                nextAvailableCol += cmp.breadboardColumnsNeeded + componentSpacing;
                return col;
            });
            return cmpStartCol;
        }
        public allocateComponent(cmpDef: ComponentDefinition, startColumn: number): ComponentInstance {
            return {
                breadboardStartColumn: startColumn,
                breadboardStartRow: cmpDef.breadboardStartRow,
                assemblyStep: cmpDef.assemblyStep,
                builtinPartVisual: cmpDef.builtinPartVisual,
                builtinSimSate: cmpDef.builtinSimSate,
                builtinSimVisual: cmpDef.builtinSimVisual,
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
        public allocateAll(cmps: string[]): [WireInstance[], [ComponentInstance, WireInstance[]][]] {
            let basicWires: WireInstance[] = [];
            let cmpsAndWires: [ComponentInstance, WireInstance[]][] = [];
            if (cmps.length > 0) {
                basicWires = this.allocateBasicWires();
                let cmpDefs = cmps.map(c => this.componentDefs[c] || null).filter(d => !!d);
                cmpsAndWires = this.allocateComponentsAndWiring(cmpDefs);
            }
            return [basicWires, cmpsAndWires];
        }
        public addAll(basicWiresAndCmpsAndWires: [WireInstance[], [ComponentInstance, WireInstance[]][]]) {
            let [basicWires, cmpsAndWires] = basicWiresAndCmpsAndWires;
            basicWires.forEach(w => this.addWire(w));
            cmpsAndWires.forEach((cAndWs, idx) => {
                let [cmpDef, wireDefs] = cAndWs;
                wireDefs.forEach(w => this.addWire(w));
                this.addComponent(cmpDef);
            });
        }

        public addWire(w: WireInstance): {endG: SVGGElement, end1: SVGElement, end2: SVGElement, wires: SVGElement[]} {
            let startLoc = this.getPinCoord(w.start);
            let endLoc = this.getPinCoord(w.end);
            let wireEls = this.wireFactory.drawWire(startLoc, endLoc, w.color);
            return wireEls;
        }
        public addComponent(cmpDesc: ComponentInstance): IBoardComponent<any> {
            let cnstr = builtinComponentSimVisual[cmpDesc.builtinSimVisual];
            let stateFn = builtinComponentSimState[cmpDesc.builtinSimSate];
            let cmp = cnstr();
            cmp.init(this.board.bus, stateFn(this.board), this.element);
            this.components.push(cmp);
            this.g.appendChild(cmp.element);
            if (cmp.defs)
                cmp.defs.forEach(d => this.defs.appendChild(d));
            this.style.textContent += cmp.style || "";
            let [row, col] = [`${cmpDesc.breadboardStartRow}`, `${cmpDesc.breadboardStartColumn}`];
            let coord = this.getBBCoord(row, col);
            cmp.moveToCoord(coord);
            let cls = this.getCmpClass(name);
            svg.addClass(cmp.element, cls);
            svg.addClass(cmp.element, "sim-cmp");
            cmp.updateTheme();
            cmp.updateState();
            return cmp;
        }

        private updateTheme() {
            this.components.forEach(c => c.updateTheme());
        }

        public updateState() {
            let state = this.board;
            if (!state) return;

            this.components.forEach(c => c.updateState());

            if (!runtime || runtime.dead) svg.addClass(this.element, "grayscale");
            else svg.removeClass(this.element, "grayscale");
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
                    "href": `${this.boardDef.visual.image}`});
            let backgroundCover = this.mkGrayCover(this.boardDim.xOff, this.boardDim.yOff, this.boardDim.width, this.boardDim.height);
            this.g.appendChild(backgroundCover);

            // ----- pins
            const mkSquarePin = (): SVGElAndSize => {
                let el = svg.elt("rect");
                let width = SQUARE_PIN_WIDTH;
                svg.hydrate(el, {
                    class: "sim-board-pin",
                    width: width,
                    height: width,
                });
                return {e: el, w: width, h: width, l: 0, t: 0};
            }
            const mkSquareHoverPin = (): SVGElAndSize => {
                let el = svg.elt("rect");
                let width = SQUARE_PIN_HOVER_WIDTH;
                svg.hydrate(el, {
                    class: "sim-board-pin-hover",
                    width: width,
                    height: width
                });
                return {e: el, w: width, h: width, l: 0, t: 0};
            }
            const mkPinBlockGrid = (pinBlock: PinBlockDefinition, blockIdx: number) => {
                let xOffset = this.boardDim.xOff + this.boardDim.scaleFn(pinBlock.x) + PIN_DIST / 2.0;
                let yOffset = this.boardDim.yOff + this.boardDim.scaleFn(pinBlock.y) + PIN_DIST / 2.0;
                let rowCount = 1;
                let colCount = pinBlock.labels.length;
                let getColName = (colIdx: number) => pinBlock.labels[colIdx];
                let getRowName = () => `${blockIdx + 1}`
                let getGroupName = () => pinBlock.labels.join(" ");
                let gridRes = mkGrid({
                    xOffset: xOffset,
                    yOffset: yOffset,
                    rowCount: rowCount,
                    colCount: colCount,
                    pinDist: PIN_DIST,
                    mkPin: mkSquarePin,
                    mkHoverPin: mkSquareHoverPin,
                    getRowName: getRowName,
                    getColName: getColName,
                    getGroupName: getGroupName,
                });
                let pins = gridRes.allPins;
                let pinsG = gridRes.g;
                svg.addClass(gridRes.g, "sim-board-pin-group");
                return gridRes;
            };
            let pinBlocks = this.boardDef.visual.pinBlocks.map(mkPinBlockGrid);
            pinBlocks.forEach(blk => blk.allPins.forEach(p => {
                this.allPins.push(p);
            }));
            //tooltip
            this.allPins.forEach(p => {
                let tooltip = p.col;
                svg.hydrate(p.el, {title: tooltip});
                svg.hydrate(p.hoverEl, {title: tooltip});
            });
            //attach pins
            this.allPins.forEach(p => {
                this.g.appendChild(p.el);
                this.g.appendChild(p.hoverEl);
            });
            //catalog pins
            this.allPins.forEach(p => {
                this.pinNmToPin[p.col] = p;
            });

            // ----- labels
            const mkLabelTxtEl = (pinX: number, pinY: number, size: number, txt: string): SVGTextElement => {
                //TODO: extract constants
                let lblY: number;
                let lblX: number;
                let edges = [this.boardTopEdge, this.boardBotEdge];
                let distFromTopBot = edges.map(e => Math.abs(e - pinY));
                let closestEdgeIdx = distFromTopBot.reduce((pi, n, ni) => n < distFromTopBot[pi] ? ni : pi, 0);
                let topEdge = closestEdgeIdx == 0;
                if (topEdge) {
                    let lblLen = size * 0.25 * txt.length;
                    lblX = pinX;
                    lblY = pinY + 12 + lblLen;
                } else {
                    let lblLen = size * 0.32 * txt.length;
                    lblX = pinX;
                    lblY = pinY - 11 - lblLen;
                }
                let el = mkTxt(lblX, lblY, size, -90, txt);
                return el;
            };
            const mkLabel = (pinX: number, pinY: number, txt: string): GridLabel => {
                let el = mkLabelTxtEl(pinX, pinY, PIN_LBL_SIZE, txt);
                svg.addClass(el, "sim-board-pin-lbl");
                let hoverEl = mkLabelTxtEl(pinX, pinY, PIN_LBL_HOVER_SIZE, txt);
                svg.addClass(hoverEl, "sim-board-pin-lbl-hover");
                let label: GridLabel = {el: el, hoverEl: hoverEl, txt: txt};
                return label;
            }
            this.allLabels = this.allPins.map(p => {
                return mkLabel(p.cx, p.cy, p.col);
            });
            //attach labels
            this.allLabels.forEach(l => {
                this.g.appendChild(l.el);
                this.g.appendChild(l.hoverEl);
            });
            //catalog labels
            this.allPins.forEach((pin, pinIdx) => {
                let lbl = this.allLabels[pinIdx];
                this.pinNmToLbl[pin.col] = lbl;
            });

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

        public highlightLoc(pinNm: string) {
            let lbl = this.pinNmToLbl[pinNm];
            let pin = this.pinNmToPin[pinNm];
            if (lbl && pin) {
                svg.addClass(lbl.el, "highlight");
                svg.addClass(lbl.hoverEl, "highlight");
                svg.addClass(pin.el, "highlight");
                svg.addClass(pin.hoverEl, "highlight");
            }
        }
    }
}