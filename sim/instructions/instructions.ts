/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.instructions {
    function addClass(el: HTMLElement, cls: string) {
        //TODO move to library
        if (el.classList) el.classList.add(cls);
        //BUG: won't work if element has class that is prefix of new class
        //TODO: make github issue (same issue exists svg.addClass)
        else if (!el.className.indexOf(cls)) el.className += ' ' + cls;
    }
    function mkTxt(p: [number, number], txt: string, size: number) {
        let el = svg.elt("text")
        let [x,y] = p;
        svg.hydrate(el, { x: x, y: y, style: `font-size:${size}px;` });
        el.textContent = txt;
        return el;
    }
    const mkWireSeg = (p1: [number, number], p2: [number, number], clr: string): SVGPathElement => {
        const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
        let [x1, y1] = p1;
        let [x2, y2] = p2
        let yLen = (y2 - y1);
        let c1: [number, number] = [x1, y1 + yLen*.8];
        let c2: [number, number] = [x2, y2 - yLen*.8];
        let w = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
        (<any>w).style["stroke"] = clr;
        return w;
    }
    const mkWireEnd = (p: [number, number], top: boolean, clr: string): SVGElement => {
        const endW = boardsvg.PIN_DIST/4.0;
        let k = boardsvg.WIRE_WIDTH*.6;
        let [cx, cy] = p; 
        let o = top ? -1 : 1;
        let g = svg.elt('g')

        let el = svg.elt("rect");
        let h1 = k*10;
        let w1 = k*2;
        svg.hydrate(el, {x: cx - w1/2, y: cy - (h1/2), width: w1, height: h1, rx: 0.5, ry: 0.5, class: "sim-bb-wire-end"});
        (<any>el).style["stroke-width"] = `${endW}px`;

        let el2 = svg.elt("rect");
        let h2 = k*6;
        let w2 = k;
        let cy2 = cy + o * (h1/2 + h2/2);
        svg.hydrate(el2, {x: cx - w2/2, y: cy2 - (h2/2), width: w2, height: h2});
        (<any>el2).style["fill"] = `#bbb`;

        g.appendChild(el2);
        g.appendChild(el);
        return g;
    }
    const mkWire = (p: [number, number], desc: boardsvg.WireDescription): SVGGElement => {
        const LENGTH = 100;
        let g = <SVGGElement>svg.elt('g');
        let [cx, cy] = p;
        let offset = 0;
        let p1: boardsvg.Coord = [cx - offset, cy - LENGTH/2];
        let p2: boardsvg.Coord = [cx + offset, cy + LENGTH/2];
        let clr = boardsvg.mapWireColor(desc.color);
        let e1 = mkWireEnd(p1, true, clr);
        let s = mkWireSeg(p1, p2, clr);
        let e2 = mkWireEnd(p2, false, clr);
        g.appendChild(s);
        g.appendChild(e1);
        g.appendChild(e2);
        let tOff = 70;
        let tSize = 30;
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let nm1 = desc.pin;
        let nm2 = boardsvg.bbLocToCoordStr(desc.bb);
        let t1 = boardsvg.mkTxt(x1, y1 - tOff, tSize, 0, nm1, "wire-lbl");
        g.appendChild(t1);
        let t2 = boardsvg.mkTxt(x2, y2 + tOff, tSize, 0, nm2, "wire-lbl");
        g.appendChild(t2);
        return g;
    }
    export function drawInstructions() {
        const CODE = "";
        pxsim.runtime = new Runtime(CODE);
        pxsim.runtime.board = null;
        pxsim.initCurrentRuntime();

        let style = document.createElement("style");
        document.head.appendChild(style);

        type Orientation = "landscape" | "portrait";
        const ORIENTATION: Orientation = "portrait";
        const PPI = 96.0;
        const [FULL_PAGE_WIDTH, FULL_PAGE_HEIGHT] 
            = (ORIENTATION == "portrait" ? [PPI * 8.5, PPI * 11.0] : [PPI * 11.0, PPI * 8.5]);
        const PAGE_MARGIN = PPI * 0.45;
        const PAGE_WIDTH = FULL_PAGE_WIDTH - PAGE_MARGIN * 2;
        const PAGE_HEIGHT = FULL_PAGE_HEIGHT - PAGE_MARGIN * 2;
        const BORDER_COLOR = "grey";
        const BORDER_RADIUS = 5;
        const BORDER_WIDTH = 2;
        const [PANEL_ROWS, PANEL_COLS] = [2, 2];
        const PANEL_MARGIN = 20;
        const PANEL_PADDING = 10;
        const PANEL_WIDTH = PAGE_WIDTH / PANEL_COLS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_COLS;
        const PANEL_HEIGHT = PAGE_HEIGHT / PANEL_ROWS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_ROWS;
        const BOARD_WIDTH = 240;
        const BOARD_LEFT = (PANEL_WIDTH - BOARD_WIDTH) / 2.0 + PANEL_PADDING;
        const BOARD_BOT = PANEL_PADDING;
        const NUM_BOX_SIZE = 60;
        const NUM_FONT = 40;
        const NUM_MARGIN = 5;

        style.textContent += `
            .instr-panel {
                margin: ${PANEL_MARGIN}px;
                padding: ${PANEL_PADDING}px;
                border-width: ${BORDER_WIDTH}px;
                border-color: ${BORDER_COLOR};
                border-style: solid;
                border-radius: ${BORDER_RADIUS}px;
                display: inline-block;
                width: ${PANEL_WIDTH}px;
                height: ${PANEL_HEIGHT}px;
                position: relative;
            }
            .board-svg {
                margin: 0 auto;
                display: block;
                position: absolute;
                bottom: ${BOARD_BOT}px;
                left: ${BOARD_LEFT}px;
            }
            .panel-num-outer {
                position: absolute;
                left: ${-BORDER_WIDTH}px;
                top: ${-BORDER_WIDTH}px;
                width: ${NUM_BOX_SIZE}px;
                height: ${NUM_BOX_SIZE}px;
                border-width: ${BORDER_WIDTH}px;
                border-style: solid;
                border-color: ${BORDER_COLOR};
                border-radius: ${BORDER_RADIUS}px 0 ${BORDER_RADIUS}px 0;
            }
            .panel-num {
                margin: ${NUM_MARGIN}px 0;
                text-align: center;
                font-size: ${NUM_FONT}px;
            }
            .parts-svg {
                ${
                    // `
                    // border-width: 1px;
                    // border-color: #9e9e9e;
                    // border-style: solid;
                    // border-radius: 5px;
                    // background-color: #eeeeee;
                    // `
                    ""
                }
            }
            ${boardsvg.WIRE_STYLE}
            `

        let desc = boardsvg.ARDUINO_ZERO;
        
        let wireGroups = desc.components.map(c => c.wires)
        wireGroups.push(desc.basicWires || []);
        let allWires = wireGroups.reduce((pre, cur) => pre.concat(cur));
        let stepToWires: boardsvg.WireDescription[][] = [];
        allWires.forEach(w => {
            let step = w.instructionStep;
            if (!stepToWires[step]) {
                stepToWires[step] = []
            }
             stepToWires[step].push(w);
        })
        let allComponents = desc.components;
        let stepToCmps: boardsvg.ComponentDescription[][] = [];
        allComponents.forEach(c => {
            let step = c.instructionStep;
            if (!stepToCmps[step]) {
                stepToCmps[step] = []
            }
             stepToCmps[step].push(c);
        })
        let lastStep = Math.max(stepToWires.length - 1, stepToCmps.length - 1);

        const mkBoard = (step: number) => {
            let board = new pxsim.boardsvg.DalBoardSvg({
                theme: pxsim.mkRandomTheme(),
                runtime: pxsim.runtime,
                boardDesc: desc,
                blank: true
            })
            svg.hydrate(board.element, {
                "width": BOARD_WIDTH,
                "class": "board-svg"
            });

            //TODO handle in a general way
            board.board.buttonPairState.used = true;
            board.board.displayCmp.used = true;

            //draw steps
            for (let i = 0; i <= step; i++) {
                let wires = stepToWires[i];
                if (wires) {
                    wires.forEach(w => board.addWire(w));
                }
                let cmps = stepToCmps[i];
                if (cmps) {
                    cmps.forEach(c => board.addComponent(c));
                }
            }
            return board;
        }
        const mkPanel = (step: number) => {
            //panel
            let panel = document.createElement("div");
            addClass(panel, "instr-panel");

            //board
            let board = mkBoard(step)
            panel.appendChild(board.element);
            
            //number
            let numDiv = document.createElement("div");
            addClass(numDiv, "panel-num-outer");
            panel.appendChild(numDiv)
            let num = document.createElement("div");
            addClass(num, "panel-num");
            num.textContent = (step+1)+"";
            numDiv.appendChild(num)

            //parts
            let partsSvg = <SVGSVGElement>document.createElementNS("http://www.w3.org/2000/svg", "svg")
            const PARTS_WIDTH = PANEL_WIDTH - NUM_BOX_SIZE - PANEL_PADDING*2;
            const PARTS_HEIGHT = 70;
            const PARTS_SCALE = 4.5;
            const PARTS_VIEW_WIDTH = PARTS_WIDTH*PARTS_SCALE;
            const PARTS_VIEW_HEIGHT = PARTS_HEIGHT*PARTS_SCALE;
            svg.hydrate(partsSvg, {
                "viewBox": `0 0 ${PARTS_VIEW_WIDTH} ${PARTS_VIEW_HEIGHT}`,
                'class': "parts-svg",
                "style": `width: ${PARTS_WIDTH}px; height: ${PARTS_HEIGHT}px; margin-left: ${NUM_BOX_SIZE + PANEL_PADDING}px`
            });
            panel.appendChild(partsSvg);

            //wires
            let wx = 70;
            let wy = 150;
            let xSpace = 150;
            let reqWire = (desc: boardsvg.WireDescription) => {
                let w = mkWire([wx, wy], desc);
                partsSvg.appendChild(w);
                wx += xSpace;
            }
            (stepToWires[step] || []).forEach(w => reqWire(w))

            return panel;
        }
        
        let panels = document.createElement("div");
        document.body.appendChild(panels);

        //TODO:
        // <a href="https://www.adafruit.com/wishlist/408673">parts list</a>
        // <hr>

        for (let s = 0; s <= lastStep; s++){
            let p = mkPanel(s);
            panels.appendChild(p);
        }

        document.body.appendChild(document.createElement("h1"))
    }
}