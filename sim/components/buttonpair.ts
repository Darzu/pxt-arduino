/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.input {
    export function onButtonPressed(button: number, handler: RefAction): void {
        let b = board().buttonPairState;
        if (button == DAL.MICROBIT_ID_BUTTON_AB && !b.usesButtonAB) {
            b.usesButtonAB = true;
            runtime.queueDisplayUpdate();
        }
        pxt.registerWithDal(button, DAL.MICROBIT_BUTTON_EVT_CLICK, handler);
    }

    export function buttonIsPressed(button: number): boolean {
        let b = board().buttonPairState;
        if (button == DAL.MICROBIT_ID_BUTTON_AB && !b.usesButtonAB) {
            b.usesButtonAB = true;
            runtime.queueDisplayUpdate();
        }
        if (button == DAL.MICROBIT_ID_BUTTON_A) return b.aBtn.pressed;
        if (button == DAL.MICROBIT_ID_BUTTON_B) return b.bBtn.pressed;
        return b.abBtn.pressed || (b.aBtn.pressed && b.bBtn.pressed);
    }
}

namespace pxsim.boardsvg {
    export class ButtonPairSvg implements IBoardComponent<ButtonPairCmp> {
        private theme = {
            buttonOuter: "#979797",
            buttonUp: "#000",
            buttonDown: "#FFA500",
            virtualButtonOuter: "#333",
            virtualButtonUp: "#fff",
        };
        public element: SVGElement;
        public defs: SVGElement[];
        private BTN_DOWN_CLS = "sim-button-down";
        public style = `
            .sim-button {
                pointer-events: none;   
                fill: ${this.theme.buttonUp}; 
            }
            .${this.BTN_DOWN_CLS} {
                fill: ${this.theme.buttonDown}; 
            }
            .sim-button-outer {
                fill: ${this.theme.buttonOuter};
            }
            .sim-button-outer:hover {
                stroke:grey;
                stroke-width: 3px;
            }
            .sim-button-virtual {
                fill: ${this.theme.virtualButtonUp}; 
            }
            .sim-button-virtual-outer {
                fill: ${this.theme.virtualButtonOuter}; 
            }
            .sim-button-nut {
                fill:#000;
                pointer-events:none;
            }
            .sim-button-nut:hover {
                stroke:1px solid #704A4A; 
            }
            .sim-button-tab {
                fill:#FFF;
                pointer-events:none;
            }
            `;
        private state: ButtonPairCmp;
        private bus: EventBus;
        private aBtn: SVGGElement;
        private bBtn: SVGGElement;
        private abBtn: SVGGElement;

        public constructor(bus: EventBus, state: ButtonPairCmp) {
            this.state = state;
            this.bus = bus;
            this.element = this.mkBtns();
            this.updateState();
            this.attachEvents();
        }

        public setLocations(...xys: [number, number][]) {
            xys.forEach((xy, i) => {
                let el = [this.aBtn, this.bBtn, this.abBtn][i];
                translateEl(el, xy)
            })
        }

        public updateState() {
            let stateBtns = [this.state.aBtn, this.state.bBtn, this.state.abBtn];
            let svgBtns = [this.aBtn, this.bBtn, this.abBtn];
            stateBtns.forEach((btn, index) => {
                if (btn.pressed)
                    svg.addClass(svgBtns[index], this.BTN_DOWN_CLS)
                else
                    svg.removeClass(svgBtns[index], this.BTN_DOWN_CLS)
            });

            if (this.state.usesButtonAB && this.abBtn.style.visibility != "visible") {
                this.abBtn.style.visibility = "visible";
            }
        }

        private mkBtns() {
            const tabSize = PIN_DIST/2.5;
            const pegR = PIN_DIST/5;
            const btnR = PIN_DIST*.8;
            const pegMargin = PIN_DIST/8;
            const plateR = PIN_DIST/12;

            const pegOffset = pegMargin + pegR;
            const left = 0 - tabSize/2;
            const top = 0 - tabSize/2; 
            const plateH = 3*PIN_DIST-tabSize;
            const plateW = 2*PIN_DIST+tabSize;

            const mkBtn = (innerCls: string, outerCls: string) => {
                let btng = <SVGGElement>svg.elt("g");
                let btnOuter = svg.child(btng, "g");
                //tabs
                const mkTab = (x: number, y: number) => {
                    svg.child(btnOuter, "rect", { class: "sim-button-tab", x: x, y: y, width: tabSize, height: tabSize})
                }
                mkTab(left, top);
                mkTab(left + 2*PIN_DIST, top);
                mkTab(left, top + 3*PIN_DIST);
                mkTab(left + 2*PIN_DIST, top + 3*PIN_DIST);

                //plate
                const plateL = left;
                const plateT = top + tabSize;
                svg.child(btnOuter, "rect", { class: outerCls, x: plateL, y: plateT, rx: plateR, ry: plateR, width: plateW, height: plateH });

                //pegs
                const mkPeg = (x: number, y: number) => {
                    svg.child(btnOuter, "circle", { class: "sim-button-nut", cx: x, cy: y, r: pegR });
                }
                mkPeg(plateL + pegOffset, plateT + pegOffset)
                mkPeg(plateL + plateW - pegOffset, plateT + pegOffset)
                mkPeg(plateL + pegOffset, plateT + plateH - pegOffset)
                mkPeg(plateL + plateW - pegOffset, plateT + plateH - pegOffset)

                //inner btn
                let innerBtn = svg.child(btng, "circle", { class: innerCls, cx: plateL + plateW/2, cy: plateT + plateH/2, r: btnR });
                return btng;
            }

            this.aBtn = mkBtn("sim-button", "sim-button-outer");
            this.bBtn = mkBtn("sim-button", "sim-button-outer");
            this.abBtn = mkBtn("sim-button-virtual", "sim-button-virtual-outer");
            this.abBtn.style.visibility = "hidden";
            this.abBtn.style.visibility = "hidden";

            let el = svg.elt("g");
            svg.addClass(el, "sim-buttonpair")
            el.appendChild(this.aBtn);
            el.appendChild(this.bBtn);
            el.appendChild(this.abBtn);

            return el;
        }

        private attachEvents() {
            let btnStates = [this.state.aBtn, this.state.bBtn];
            let btnSvgs = [this.aBtn, this.bBtn];
            btnSvgs.forEach((btn, index) => {
                btn.addEventListener(pointerEvents.down, ev => {
                    btnStates[index].pressed = true;
                    svg.addClass(btnSvgs[index], this.BTN_DOWN_CLS)
                })
                btn.addEventListener(pointerEvents.leave, ev => {
                    btnStates[index].pressed = false;
                    svg.removeClass(btnSvgs[index], this.BTN_DOWN_CLS)
                })
                btn.addEventListener(pointerEvents.up, ev => {
                    btnStates[index].pressed = false;
                    svg.removeClass(btnSvgs[index], this.BTN_DOWN_CLS)
                    this.bus.queue(btnStates[index].id, DAL.MICROBIT_BUTTON_EVT_CLICK);
                })
            })
            let updateBtns = (s: boolean) => {
                btnStates.forEach(b => b.pressed = s)
                btnSvgs.forEach(b => s ? svg.addClass(b, this.BTN_DOWN_CLS) : svg.removeClass(b, this.BTN_DOWN_CLS));
            };
            this.abBtn.addEventListener(pointerEvents.down, ev => {
                updateBtns(true);
            })
            this.abBtn.addEventListener(pointerEvents.leave, ev => {
                updateBtns(false);
            })
            this.abBtn.addEventListener(pointerEvents.up, ev => {
                updateBtns(false);
                this.bus.queue(this.state.abBtn.id, DAL.MICROBIT_BUTTON_EVT_CLICK);
            })
        }
    }
}

namespace pxsim {
    export class Button {
        constructor(public id: number) { }
        pressed: boolean;
    }

    export class ButtonPairCmp {
        usesButtonAB: boolean = false;
        aBtn: Button;
        bBtn: Button;
        abBtn: Button;

        constructor() {
            this.aBtn = new Button(DAL.MICROBIT_ID_BUTTON_A);
            this.bBtn = new Button(DAL.MICROBIT_ID_BUTTON_B);
            this.abBtn = new Button(DAL.MICROBIT_ID_BUTTON_AB);
        }
    }
}