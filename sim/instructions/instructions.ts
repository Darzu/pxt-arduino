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
    export function drawInstructions() {
        pxsim.runtime = new Runtime("");
        pxsim.runtime.board = null;
        pxsim.initCurrentRuntime();

        let style = document.createElement("style");
        document.head.appendChild(style);

        const BOARD_WIDTH = 200;
        const BOARD_HEIGHT = 400;
        style.textContent += `
            .instr-panel {
                margin: 30px;
                padding: 10px;
                border-width: 2px;
                border-color: grey;
                display: inline-block;
                border-style: solid;
            }
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
                "height": BOARD_HEIGHT
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
        const mkPanel = (board: boardsvg.DalBoardSvg) => {
            let div = document.createElement("div");
            addClass(div, "instr-panel");
            div.appendChild(board.element);
            return div;
        }
        
        let panels = document.createElement("div");
        document.body.appendChild(panels);

        //TODO:
        // <a href="https://www.adafruit.com/wishlist/408673">parts list</a>
        // <hr>

        for (let s = 0; s <= lastStep; s++){
            let b1 = mkBoard(s);
            let p = mkPanel(b1);
            panels.appendChild(p);
        }

        document.body.appendChild(document.createElement("h1"))
    }
}