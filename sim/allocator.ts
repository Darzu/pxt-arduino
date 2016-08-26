
namespace pxsim.visuals {
    export class Allocator {
        private boardDef: BoardDefinition;
        private cmpDefs: Map<ComponentDefinition>;
        private getBBCoord: (loc: BBRowCol) => Coord;

        private availablePowerPins = {
            top: {
                threeVolt: mkRange(26, 51).map(n => <BBRowCol>["+", `${n}`]),
                ground: mkRange(26, 51).map(n => <BBRowCol>["-", `${n}`]),
            },
            bottom: {
                threeVolt: mkRange(1, 26).map(n => <BBRowCol>["+", `${n}`]),
                ground: mkRange(1, 26).map(n => <BBRowCol>["-", `${n}`]),
            },
        };

        constructor(boardDef: BoardDefinition, cmpDefs: Map<ComponentDefinition>, getBBCoord: (loc: BBRowCol) => Coord) {
            this.boardDef = boardDef;
            this.cmpDefs = cmpDefs;
            this.getBBCoord = getBBCoord;
        }

        private allocateLocation(location: LocationDefinition,
            opts: {
                nearestBBPin?: BBRowCol,
                startColumn?: number,
                availableGPIOPins?: string[],
            }): Loc
        {
            if (location === "ground" || location === "threeVolt") {
                U.assert(!!opts.nearestBBPin);
                let nearLoc = opts.nearestBBPin;
                let nearestCoord = this.getBBCoord(nearLoc);
                let firstTopAndBot = [
                    this.availablePowerPins.top.ground[0] || this.availablePowerPins.top.threeVolt[0],
                    this.availablePowerPins.bottom.ground[0] || this.availablePowerPins.bottom.threeVolt[0]
                ].map(loc => {
                    return this.getBBCoord(loc);
                });
                if (!firstTopAndBot[0] || !firstTopAndBot[1]) {
                    console.debug(`No more available "${location}" locations!`);
                    //TODO
                }
                let nearTop = findClosestCoordIdx(nearestCoord, firstTopAndBot) == 0;
                let pins: BBRowCol[];
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
                let pinCoords = pins.map(rowCol => {
                    return this.getBBCoord(rowCol);
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
                return {type: "breadboard", rowCol: pin};
            } else if (location[0] === "breadboard") {
                U.assert(!!opts.startColumn);
                let row = <string>location[1];
                let col = (<number>location[2] + opts.startColumn).toString();
                return {type: "breadboard", rowCol: [row, col]}
            } else if (location[0] === "GPIO") {
                U.assert(!!opts.availableGPIOPins);
                let idx = <number>location[1];
                let pin = opts.availableGPIOPins[idx];
                return {type: "dalboard", pin: pin};
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
            let topLeft: BBRowCol = ["-", "26"];
            let botLeft: BBRowCol = ["-", "1"];
            let topRight: BBRowCol = ["-", "50"];
            let botRight: BBRowCol = ["-", "25"];
            let top: BBRowCol, bot: BBRowCol;
            if (this.boardDef.attachPowerOnRight) {
                top = topRight;
                bot = botRight;
            } else {
                top = topLeft;
                bot = botLeft;
            }
            const GROUND_COLOR = "blue";
            const POWER_COLOR = "red";
            const wires: WireInstance[] = [
                {start: this.allocateLocation("ground", {nearestBBPin: top}),
                 end: this.allocateLocation("ground", {nearestBBPin: bot}),
                 color: GROUND_COLOR, assemblyStep: 0},
                {start: this.allocateLocation("ground", {nearestBBPin: top}),
                 end: {type: "dalboard", pin: boardGround},
                color: GROUND_COLOR, assemblyStep: 0},
                {start: this.allocateLocation("threeVolt", {nearestBBPin: top}),
                 end: this.allocateLocation("threeVolt", {nearestBBPin: bot}),
                 color: POWER_COLOR, assemblyStep: 1},
                {start: this.allocateLocation("threeVolt", {nearestBBPin: top}),
                 end: {type: "dalboard", pin: threeVoltPin},
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
            endInsts = endInsts.map((e, idx) => {
                if (e)
                    return e;
                let locInst = <BBLoc>endInsts[1 - idx];
                let l = this.allocateLocation(ends[idx], {
                    nearestBBPin: locInst.rowCol,
                    startColumn: opts.startColumn,
                    availableGPIOPins: opts.availableGPIOPins
                });
                return l;
            });
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
                let cmpDefs = cmps.map(c => this.cmpDefs[c] || null).filter(d => !!d);
                cmpsAndWires = this.allocateComponentsAndWiring(cmpDefs);
            }
            return [basicWires, cmpsAndWires];
        }
    }
}