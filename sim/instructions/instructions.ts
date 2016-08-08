/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtrunner.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

//HACK: allows instructions.html to access pxtblocks without requiring simulator.html to import blocks as well 
if (!(<any>window).pxt) (<any>window).pxt = {};
import pxtrunner = pxt.runner;
import pxtdocs = pxt.docs;

namespace pxsim.instructions {
    const LOC_LBL_SIZE = 10;
    const QUANT_LBL_SIZE = 30;
    const QUANT_LBL = (q: number) => `${q}x`;
    const WIRE_QUANT_LBL_SIZE = 20;
    const LBL_VERT_PAD = 3;
    const LBL_RIGHT_PAD = 5;
    const REQ_WIRE_HEIGHT = 45;
    const REQ_CMP_HEIGHT = 55;
    const REQ_CMP_SCALE = 0.5;
    const WIRE_CURVE_OFF = 15;
    const WIRE_LENGTH = 100;
    type Orientation = "landscape" | "portrait";
    const ORIENTATION: Orientation = "portrait";
    const PPI = 96.0;
    const [FULL_PAGE_WIDTH, FULL_PAGE_HEIGHT] 
        = (ORIENTATION == "portrait" ? [PPI * 8.5, PPI * 11.0] : [PPI * 11.0, PPI * 8.5]);
    const PAGE_MARGIN = PPI * 0.45;
    const PAGE_WIDTH = FULL_PAGE_WIDTH - PAGE_MARGIN * 2;
    const PAGE_HEIGHT = FULL_PAGE_HEIGHT - PAGE_MARGIN * 2;
    const BORDER_COLOR = "gray";
    const BORDER_RADIUS = 5;
    const BORDER_WIDTH = 2;
    const [PANEL_ROWS, PANEL_COLS] = [2, 2];
    const PANEL_MARGIN = 20;
    const PANEL_PADDING = 8;
    const PANEL_WIDTH = PAGE_WIDTH / PANEL_COLS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_COLS;
    const PANEL_HEIGHT = PAGE_HEIGHT / PANEL_ROWS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_ROWS;
    const BOARD_WIDTH = 240;
    const BOARD_LEFT = (PANEL_WIDTH - BOARD_WIDTH) / 2.0 + PANEL_PADDING;
    const BOARD_BOT = PANEL_PADDING;
    const NUM_BOX_SIZE = 60;
    const NUM_FONT = 40;
    const NUM_MARGIN = 5;
    const STYLE = `
            ${boardsvg.BOARD_SYTLE}
            ${boardsvg.BUTTON_PAIR_STYLE/*TODO: generalize for all components*/}
            ${boardsvg.LED_MATRIX_STYLE}
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
                overflow: hidden;
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
            .cmp-div {
                display: inline-block;
            }
            .reqs-div {
                margin-left: ${PANEL_PADDING + NUM_BOX_SIZE}px;
            }
            .partslist-wire,
            .partslist-cmp {
                margin: 5px;
            }
            .partslist-wire {
                display: inline-block;
            }
            `;

    function bbLocToCoordStr(loc: string) {
        let {rowNm, colNm} = boardsvg.BRK_PIN_NM(loc);
        return `(${rowNm},${colNm})`
    }
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
    function mkWireSeg(p1: [number, number], p2: [number, number], clr: string): boardsvg.SVGAndSize<SVGPathElement> {
        const coordStr = (xy: [number, number]):string => {return `${xy[0]}, ${xy[1]}`};
        let [x1, y1] = p1;
        let [x2, y2] = p2
        let yLen = (y2 - y1);
        let c1: [number, number] = [x1, y1 + yLen*.8];
        let c2: [number, number] = [x2, y2 - yLen*.8];
        let e = <SVGPathElement>svg.mkPath("sim-bb-wire", `M${coordStr(p1)} C${coordStr(c1)} ${coordStr(c2)} ${coordStr(p2)}`);
        (<any>e).style["stroke"] = clr;
        return {e: e, l: Math.min(x1, x2), t: Math.min(y1, y2), w: Math.abs(x1-x2), h: Math.abs(y1-y2)};
    }
    function mkWireEnd(p: [number, number], top: boolean, clr: string): boardsvg.SVGAndSize<SVGElement> {
        const endW = boardsvg.PIN_DIST/4.0;
        let k = boardsvg.WIRE_WIDTH*.6;
        let [cx, cy] = p; 
        let o = top ? -1 : 1;
        let g = svg.elt('g')

        let el = svg.elt("rect");
        let h1 = k*10;
        let w1 = k*2;
        let x1 = cx - w1/2;
        let y1 = cy - (h1/2);
        svg.hydrate(el, {x: x1, y: y1, width: w1, height: h1, rx: 0.5, ry: 0.5, class: "sim-bb-wire-end"});
        (<any>el).style["stroke-width"] = `${endW}px`;

        let el2 = svg.elt("rect");
        let h2 = k*6;
        let w2 = k;
        let cy2 = cy + o * (h1/2 + h2/2);
        let x2 = cx - w2/2;
        let y2 = cy2 - (h2/2);
        svg.hydrate(el2, {x: x2, y: y2, width: w2, height: h2});
        (<any>el2).style["fill"] = `#bbb`;

        g.appendChild(el2);
        g.appendChild(el);
        return {e: g, l: x1 - endW, t: Math.min(y1, y2), w: w1 + endW*2, h: h1 + h2};
    }
    function mkWire(cp: [number, number], clr: string): boardsvg.SVGAndSize<SVGGElement> {
        let g = <SVGGElement>svg.elt('g');
        let [cx, cy] = cp;
        let offset = WIRE_CURVE_OFF;
        let p1: boardsvg.Coord = [cx - offset, cy - WIRE_LENGTH/2];
        let p2: boardsvg.Coord = [cx + offset, cy + WIRE_LENGTH/2];
        clr = boardsvg.mapWireColor(clr);
        let e1 = mkWireEnd(p1, true, clr);
        let s = mkWireSeg(p1, p2, clr);
        let e2 = mkWireEnd(p2, false, clr);
        g.appendChild(s.e);
        g.appendChild(e1.e);
        g.appendChild(e2.e);
        let l = Math.min(e1.l, e2.l);
        let r = Math.max(e1.l + e1.w, e2.l + e2.w);
        let t = Math.min(e1.t, e2.t);
        let b = Math.max(e1.t + e1.h, e2.t + e2.h);
        return {e: g, l: l, t: t, w: r - l, h: b - t};
    }
    type mkCmpDivOpts = {
        top?: string,
        topSize?: number,
        right?: string,
        rightSize?: number,
        bot?: string,
        botSize?: number,
        wireClr?: string,
        cmpWidth?: number,
        cmpHeight?: number,
        cmpScale?: number
    };
    function mkBoardImgSvg(desc: boardsvg.BoardDescription): boardsvg.SVGAndSize<SVGElement> {
        let img = svg.elt( "image");
        let [l, t] = [0,0];
        let w = desc.width;
        let h = desc.height;
        svg.hydrate(img, { 
            class: "sim-board", 
            x: l, 
            y: t, 
            width: desc.width, 
            height: desc.height, 
            "href": `/images/${desc.photo}`});

        return {e: img, w: w, h: h, l: l, t};
    }
    function mkBBSvg(): boardsvg.SVGAndSize<SVGElement> {
        let w = boardsvg.BB_WIDTH;
        let h = boardsvg.BB_HEIGHT;
        let bb = new boardsvg.Breadboard(w, h);
        return bb.getSVGAndSize();
    }
    function wrapSvg(el: boardsvg.SVGAndSize<SVGElement>, opts: mkCmpDivOpts): HTMLElement { 
        //TODO: Refactor this function; it is too complicated. There is a lot of error-prone math being done
        // to scale and place all elements which could be simplified with more forethought.
        let svgEl = <SVGSVGElement>document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let dims = {l: 0, t: 0, w: 0, h: 0};

        let cmpSvgEl = <SVGSVGElement>document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgEl.appendChild(cmpSvgEl);
        
        cmpSvgEl.appendChild(el.e);
        let cmpSvgAtts = {
            "viewBox": `${el.l} ${el.t} ${el.w} ${el.h}`,
            "preserveAspectRatio": "xMidYMid",
        };
        dims.w = el.w;
        dims.h = el.h;
        let scale = (scaler: number) => {
            dims.h *= scaler;
            dims.w *= scaler;
            (<any>cmpSvgAtts).width = dims.w;
            (<any>cmpSvgAtts).height = dims.h;
        }
        if (opts.cmpScale) {
            scale(opts.cmpScale)
        }
        if (opts.cmpWidth && opts.cmpWidth < dims.w) {
            scale(opts.cmpWidth / dims.w);
        } else if (opts.cmpHeight && opts.cmpHeight < dims.h) {
            scale(opts.cmpHeight / dims.h)
        }
        svg.hydrate(cmpSvgEl, cmpSvgAtts);
        let elDims = {l: dims.l, t: dims.t, w: dims.w, h: dims.h};

        let updateL = (newL: number) => {
            if (newL < dims.l) {
                let extraW = dims.l - newL;
                dims.l = newL;
                dims.w += extraW;
            }
        }
        let updateR = (newR: number) => {
            let oldR = dims.l + dims.w;
            if (oldR < newR) {
                let extraW = newR - oldR;
                dims.w += extraW;
            }
        }
        let updateT = (newT: number) => {
            if (newT < dims.t) {
                let extraH = dims.t - newT;
                dims.t = newT;
                dims.h += extraH;
            }
        }
        let updateB = (newB: number) => {
            let oldB = dims.t + dims.h;
            if (oldB < newB) {
                let extraH = newB - oldB;
                dims.h += extraH;
            }
        }

        //labels
        let [xOff, yOff] = [-0.3, 0.3]; //HACK: these constants tweak the way "mkTxt" knows how to center the text
        const txtAspectRatio = [1.4, 1.0];
        if (opts && opts.top) {
            let size = opts.topSize;
            let txtW = size / txtAspectRatio[0];
            let txtH = size / txtAspectRatio[1];
            let [cx, y] = [elDims.l + elDims.w/2, elDims.t - LBL_VERT_PAD - txtH/2];
            let lbl = boardsvg.mkTxt(cx, y, size, 0, opts.top, xOff, yOff);
            svg.addClass(lbl, "cmp-lbl");
            svgEl.appendChild(lbl);

            let len = txtW*opts.top.length;
            updateT(y - txtH/2);
            updateL(cx - len/2);
            updateR(cx + len/2);
        }
        if (opts && opts.bot) {
            let size = opts.botSize;
            let txtW = size / txtAspectRatio[0];
            let txtH = size / txtAspectRatio[1];
            let [cx, y] = [elDims.l + elDims.w/2, elDims.t + elDims.h + LBL_VERT_PAD + txtH/2];
            let lbl = boardsvg.mkTxt(cx, y, size, 0, opts.bot, xOff, yOff);
            svg.addClass(lbl, "cmp-lbl");
            svgEl.appendChild(lbl);

            let len = txtW*opts.bot.length;
            updateB(y + txtH/2);
            updateL(cx - len/2);
            updateR(cx + len/2);
        }
        if (opts && opts.right) {
            let size = opts.rightSize;
            let txtW = size / txtAspectRatio[0];
            let txtH = size / txtAspectRatio[1];
            let len = txtW*opts.right.length;
            let [cx, cy] = [elDims.l + elDims.w + LBL_RIGHT_PAD + len/2, elDims.t + elDims.h/2];
            let lbl = boardsvg.mkTxt(cx, cy, size, 0, opts.right, xOff, yOff);
            svg.addClass(lbl, "cmp-lbl");
            svgEl.appendChild(lbl);

            updateT(cy - txtH/2);
            updateR(cx + len/2);
            updateB(cy + txtH/2);
        }
        
        let svgAtts = {
            "viewBox": `${dims.l} ${dims.t} ${dims.w} ${dims.h}`,
            "width": dims.w,
            "height": dims.h,
            "preserveAspectRatio": "xMidYMid",
        };
        svg.hydrate(svgEl, svgAtts);
        let div = document.createElement("div");
        div.appendChild(svgEl);
        return div;
    }
    function mkCmpDiv(type: boardsvg.Component | "wire", opts: mkCmpDivOpts): HTMLElement {
        let el: boardsvg.SVGAndSize<SVGElement>;
        if (type == "wire") {
            el = mkWire([0,0], opts.wireClr || "red");
        } else {
            el = boardsvg.mkComponent(<boardsvg.Component>type, [0,0]);
        }
        return wrapSvg(el, opts);
    }
    type BoardProps = {
        board: boardsvg.BoardDescription,
        stepToWires: boardsvg.WireDescription[][], 
        stepToCmps: boardsvg.ComponentDescription[][]
        allWires: boardsvg.WireDescription[],
        allCmps: boardsvg.ComponentDescription[],
        lastStep: number,
        colorToWires: Map<boardsvg.WireDescription[]>,
        allWireColors: string[],
    };
    function mkBoardProps(desc: boardsvg.BoardDescription) {
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
        let colorToWires: Map<boardsvg.WireDescription[]> = {}
        let allWireColors: string[] = [];
        allWires.forEach(w => {
            if (!colorToWires[w.color]) {
                colorToWires[w.color] = [];
                allWireColors.push(w.color);
            }
            colorToWires[w.color].push(w);
        });
        return {board: desc, stepToWires: stepToWires, stepToCmps: stepToCmps, 
            allWires: allWires, allCmps: allComponents, lastStep: lastStep, 
            colorToWires: colorToWires, allWireColors: allWireColors};
    }
    function mkBoard(props: BoardProps, step: number, width: number, buildMode: boolean = false) {
        let board = new pxsim.boardsvg.DalBoardSvg({
            theme: pxsim.mkRandomTheme(),
            runtime: pxsim.runtime,
            boardDesc: props.board,
            blank: true,
            labeledPins: buildMode,
        })
        svg.hydrate(board.element, {
            "width": width,
        });
        svg.addClass(board.element, "board-svg");
        if (buildMode){
            svg.hydrate(board.background, {
                "href": `/images/${props.board.outlineImg}`
            })
            let bb = board.breadboard.bb;
            svg.addClass(bb, "sim-bb-outline")
            let style = <SVGStyleElement>svg.child(bb, "style", {});
        }

        //TODO handle in a general way
        board.board.buttonPairState.used = true;
        board.board.displayCmp.used = true;
        board.updateState();
        
        //set smiley
        //HACK
        // let img = board.board.displayCmp.image;
        // img.set(1, 0, 255);
        // img.set(3, 0, 255);
        // img.set(0, 2, 255);
        // img.set(1, 3, 255);
        // img.set(2, 3, 255);
        // img.set(3, 3, 255);
        // img.set(4, 2, 255);
        // board.updateState();

        //old steps
        if (buildMode && step > 0) {
            svg.addClass(board.element, "grayed");
        }
        for (let i = 0; i < step; i++) {
            let wires = props.stepToWires[i];
            if (wires) {
                wires.forEach(w => {
                    let wEls = board.addWire(w)
                });
            }
            let cmps = props.stepToCmps[i];
            if (cmps) {
                cmps.forEach(c => {
                    let cmp = board.addComponent(c)
                });
            }
        }

        //last steps
        let wires = props.stepToWires[step];
        if (wires) {
            wires.forEach(w => {
                let wEls = board.addWire(w)
                if (buildMode) {
                    //location highlights
                    if (w.start[0] == "bb") {
                        let lbls = board.breadboard.highlightLoc(w.start[1]);
                    } else {
                        board.highlightLoc(w.start[1]);
                    }
                    if (w.end[0] == "bb") {
                        let lbls = board.breadboard.highlightLoc(w.end[1]);
                    } else {
                        board.highlightLoc(w.end[1]);
                    }

                    //underboard wires
                    wEls.wires.forEach(e => {
                        (<any>e).style["visibility"] = "visible";
                    });

                    //un greyed out
                    if (buildMode) {
                        [wEls.end1, wEls.end2].forEach(e => {
                            svg.addClass(e, "notgrayed");
                        });
                        wEls.wires.forEach(e => {
                            svg.addClass(e, "notgrayed");
                        });
                    }
                }
            });
        }
        let cmps = props.stepToCmps[step];
        if (cmps) {
            cmps.forEach(c => {
                let cmp = board.addComponent(c)
                if (buildMode) {
                    board.breadboard.highlightLoc(c.locations[0]);
                    svg.addClass(cmp.element, "notgrayed");
                }
            });
        }

        return board;
    }
    function mkPanel() {
        //panel
        let panel = document.createElement("div");
        addClass(panel, "instr-panel");
        
        return panel;
    }
    function mkPartsPanel(props: BoardProps) {
        let panel = mkPanel();

        const BOARD_SCALE = 0.15;
        const BB_SCALE = 0.4;
        const CMP_SCALE = 0.5;
        const WIRE_SCALE = 0.3;

        // board and breadboard
        let boardImg = mkBoardImgSvg(props.board);
        let board = wrapSvg(boardImg, {right: QUANT_LBL(1), rightSize: QUANT_LBL_SIZE, cmpScale: BOARD_SCALE});
        panel.appendChild(board);
        let bbRaw = mkBBSvg();
        let bb = wrapSvg(bbRaw, {right: QUANT_LBL(1), rightSize: QUANT_LBL_SIZE, cmpScale: BB_SCALE});
        panel.appendChild(bb);
    
        // components
        let cmps = props.allCmps;
        cmps.forEach(c => {
            let quant = 1;
            if (c.type == "buttonpair") { //TODO don't specialcase this
                quant = 2;
            }
            let cmp = mkCmpDiv(c.type, {
                right: QUANT_LBL(quant),
                rightSize: QUANT_LBL_SIZE,
                cmpScale: CMP_SCALE,
            });
            addClass(cmp, "partslist-cmp");
            panel.appendChild(cmp);
        });

        // wires
        props.allWireColors.forEach(clr => {
            let quant = props.colorToWires[clr].length;
            let cmp = mkCmpDiv("wire", {
                right: QUANT_LBL(quant),
                rightSize: WIRE_QUANT_LBL_SIZE,
                wireClr: clr,
                cmpScale: WIRE_SCALE
            })
            addClass(cmp, "partslist-wire");
            panel.appendChild(cmp);
        })

        return panel;
    }
    function mkStepPanel(step: number, props: BoardProps) {
        let panel = mkPanel();
        
        //board
        let board = mkBoard(props, step, BOARD_WIDTH, true)
        panel.appendChild(board.element);
        
        //number
        let numDiv = document.createElement("div");
        addClass(numDiv, "panel-num-outer");
        addClass(numDiv, "noselect");
        panel.appendChild(numDiv)
        let num = document.createElement("div");
        addClass(num, "panel-num");
        num.textContent = (step+1)+"";
        numDiv.appendChild(num)

        // add requirements
        let reqsDiv = document.createElement("div");
        addClass(reqsDiv, "reqs-div")
        panel.appendChild(reqsDiv);
        let wires = (props.stepToWires[step] || []);
        wires.forEach(w => {
            let cmp = mkCmpDiv("wire", {
                top: w.end[1],
                topSize: LOC_LBL_SIZE, 
                bot: bbLocToCoordStr(w.start[1]),
                botSize: LOC_LBL_SIZE,
                wireClr: w.color,
                cmpHeight: REQ_WIRE_HEIGHT
            })
            addClass(cmp, "cmp-div");
            reqsDiv.appendChild(cmp);
        });
        let cmps = (props.stepToCmps[step] || []);
        cmps.forEach(c => {
            let cmp = mkCmpDiv(c.type, {
                top: bbLocToCoordStr(c.locations[0]), 
                topSize: LOC_LBL_SIZE, 
                cmpHeight: REQ_CMP_HEIGHT,
                cmpScale: REQ_CMP_SCALE
            })
            addClass(cmp, "cmp-div");
            reqsDiv.appendChild(cmp);
            //TODO: find a generalization so we don't have to specialize for buttonpair
            if (c.type == "buttonpair") {
                cmp = mkCmpDiv(c.type, {
                    top: bbLocToCoordStr(c.locations[1]), 
                    topSize: LOC_LBL_SIZE, 
                    cmpHeight: REQ_CMP_HEIGHT,
                    cmpScale: REQ_CMP_SCALE
                })
                addClass(cmp, "cmp-div");
                reqsDiv.appendChild(cmp);
            }
        });

        return panel;  
    }
    function updateFrontPanel(props: BoardProps) {
        const FRONT_PAGE_BOARD_WIDTH = 200;
        let panel = document.getElementById("front-panel");

        let board = mkBoard(props, props.lastStep, FRONT_PAGE_BOARD_WIDTH);
        panel.appendChild(board.element);
        
        return panel;
    }
    function mkFinalPanel(props: BoardProps) {
        const BACK_PAGE_BOARD_WIDTH = PANEL_WIDTH - 20;

        let panel = mkPanel();
        addClass(panel, "back-panel");
        let board = mkBoard(props, props.lastStep, BACK_PAGE_BOARD_WIDTH, false)
        panel.appendChild(board.element);

        return panel;
    }
    function parseQs(): (key: string)=>string {
        let qs = window.location.search.substring(1);
        let getQsVal = (key: string) => decodeURIComponent((qs.split(`${key}=`)[1] || "").split("&")[0] || "").replace(/\+/g, " ");
        return getQsVal;
    }
    export function drawInstructions() {
        let getQsVal = parseQs();

        //project name
        let name = getQsVal("name") || "Untitled";
        if (name) {
            $("#proj-title").text(name);
        }

        //project code
        let tsCode = getQsVal("code");  
        var codeDiv = document.getElementById('proj-code'); 
        var codeHiddenDiv = document.getElementById('proj-code-hidden'); 
        if (tsCode) {
            //we use the docs renderer to decompile the code to blocks and render it
            //TODO: render the blocks code directly
            let md = "```blocks\n" + tsCode + "```"
            pxtdocs.requireMarked = function() { return (<any>window).marked; }
            pxtrunner.renderMarkdownAsync(codeHiddenDiv, md).done(function() {
                //takes the svg out of the wrapper markdown
                let codeSvg = $("#proj-code-hidden svg")[0]; 
                codeDiv.innerHTML = "";
                codeDiv.appendChild(codeSvg);
            });
        }

        //init runtime
        const COMP_CODE = "";
        if (!pxsim.initCurrentRuntime)
            pxsim.initCurrentRuntime = initRuntimeWithDalBoard; 
        pxsim.runtime = new Runtime(COMP_CODE);
        pxsim.runtime.board = null;
        pxsim.initCurrentRuntime();

        let style = document.createElement("style");
        document.head.appendChild(style);

        style.textContent += STYLE;

        let desc = boardsvg.ARDUINO_ZERO;
        
        let props = mkBoardProps(desc);

        //front page
        let frontPanel = updateFrontPanel(props);

        //all required parts
        let partsPanel = mkPartsPanel(props);
        document.body.appendChild(partsPanel);

        //steps
        for (let s = 0; s <= props.lastStep; s++){
            let p = mkStepPanel(s, props);
            document.body.appendChild(p);
        }

        //final
        let finalPanel = mkFinalPanel(props);
        document.body.appendChild(finalPanel);
    }
}