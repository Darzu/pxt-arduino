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
        let bts = b.buttons;
        if (button == DAL.MICROBIT_ID_BUTTON_A) return bts[0].pressed;
        if (button == DAL.MICROBIT_ID_BUTTON_B) return bts[1].pressed;
        return bts[2].pressed || (bts[0].pressed && bts[1].pressed);
    }
}

namespace pxsim.boardsvg {
    export interface IButtonPairTheme {
        buttonOuter?: string;
        buttonUp?: string;
        buttonDown?: string;
        virtualButtonOuter?: string;
        virtualButtonUp?: string;
        virtualButtonDown?: string;
    }

    export var defaultButtonPairTheme: IButtonPairTheme = {
        buttonOuter: "#979797",
        buttonUp: "#000",
        buttonDown: "#FFA500",
        virtualButtonOuter: "#333",
        virtualButtonUp: "#fff",
    };

    export class ButtonPairSvg implements IBoardComponent<ButtonPairCmp> {
        public element: SVGElement;
        public defs: SVGElement[];
        public style = `
            .sim-button {
                pointer-events: none;    
            }
            .sim-button-outer:hover {
                stroke:grey;
                stroke-width: 3px;
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

        private aBtn: SVGElement;
        private bBtn: SVGElement;
        private abBtn: SVGElement;

        public updateLocations(...xys: [number, number][]) {
            //TODO(DZ): come up with a better abstraction/interface for customizing placement
            xys.forEach((xy, i) => {
                let el = [this.aBtn, this.bBtn, this.abBtn][i];
                translateEl(el, xy)
            })
        }

        public updateState(state: ButtonPairCmp, buttonPairTheme: IButtonPairTheme) {
            state.buttons.forEach((btn, index) => {
                svg.fill(this.buttons[index], btn.pressed ? buttonPairTheme.buttonDown : buttonPairTheme.buttonUp);
            });

            if (state.usesButtonAB && this.buttonABText.style.visibility != "visible") {
                (<any>this.buttonsOuter[2]).style.visibility = "visible";
                (<any>this.buttons[2]).style.visibility = "visible";
                this.buttonABText.style.visibility = "visible";
                this.updateTheme(buttonPairTheme);
            }
        }

        public buildDom(g: SVGElement, pinDist: number) {
            //TODO:
            /*
            svg.fills(this.buttonsOuter.slice(0, 2), buttonPairTheme.buttonOuter);
            svg.fills(this.buttons.slice(0, 2), buttonPairTheme.buttonUp);
            svg.fill(this.buttonsOuter[2], buttonPairTheme.virtualButtonOuter);
            svg.fill(this.buttons[2], buttonPairTheme.virtualButtonUp);
            */
            this.buttonsOuter = []; this.buttons = [];

            const tabSize = pinDist/2.5;
            const pegR = pinDist/5;
            const btnR = pinDist*.8;
            const pegMargin = pinDist/8;
            const plateR = pinDist/12;

            const pegOffset = pegMargin + pegR;
            const left = 0 - tabSize/2;
            const top = 0 - tabSize/2; 
            const plateH = 3*pinDist-tabSize;
            const plateW = 2*pinDist+tabSize;

            const mkBtn = () => {
                let btng = svg.child(g, "g");
                this.buttonsOuter.push(btng);

                //tabs
                const mkTab = (x: number, y: number) => {
                    svg.child(btng, "rect", { class: "sim-button-tab", x: x, y: y, width: tabSize, height: tabSize})
                }
                mkTab(left, top);
                mkTab(left + 2*pinDist, top);
                mkTab(left, top + 3*pinDist);
                mkTab(left + 2*pinDist, top + 3*pinDist);

                //plate
                const plateL = left;
                const plateT = top + tabSize;
                svg.child(btng, "rect", { class: "sim-button-outer", x: plateL, y: plateT, rx: plateR, ry: plateR, width: plateW, height: plateH });

                //pegs
                const mkPeg = (x: number, y: number) => {
                    svg.child(btng, "circle", { class: "sim-button-nut", cx: x, cy: y, r: pegR });
                }
                mkPeg(plateL + pegOffset, plateT + pegOffset)
                mkPeg(plateL + plateW - pegOffset, plateT + pegOffset)
                mkPeg(plateL + pegOffset, plateT + plateH - pegOffset)
                mkPeg(plateL + plateW - pegOffset, plateT + plateH - pegOffset)

                //inner btn
                let innerBtn = svg.child(g, "circle", { class: "sim-button", cx: plateL + plateW/2, cy: plateT + plateH/2, r: btnR });
                this.buttons.push(innerBtn);
            }

            mkBtn();
            mkBtn();
            mkBtn();
            (<any>this.buttonsOuter[2]).style.visibility = "hidden";
            (<any>this.buttons[2]).style.visibility = "hidden";

            //TODO parameterize text location
            this.buttonABText = svg.child(g, "text", { class: "sim-text", x: 370, y: 272 }) as SVGTextElement;
            this.buttonABText.textContent = "A+B";
            this.buttonABText.style.visibility = "hidden";
        }

        public attachEvents(bus: EventBus, state: ButtonPairCmp, buttonPairTheme: IButtonPairTheme) {
            this.buttonsOuter.slice(0, 2).forEach((btn, index) => {
                btn.addEventListener(pointerEvents.down, ev => {
                    state.buttons[index].pressed = true;
                    svg.fill(this.buttons[index], buttonPairTheme.buttonDown);
                })
                btn.addEventListener(pointerEvents.leave, ev => {
                    state.buttons[index].pressed = false;
                    svg.fill(this.buttons[index], buttonPairTheme.buttonUp);
                })
                btn.addEventListener(pointerEvents.up, ev => {
                    state.buttons[index].pressed = false;
                    svg.fill(this.buttons[index], buttonPairTheme.buttonUp);

                    bus.queue(state.buttons[index].id, DAL.MICROBIT_BUTTON_EVT_CLICK);
                })
            })
            this.buttonsOuter[2].addEventListener(pointerEvents.down, ev => {
                state.buttons[0].pressed = true;
                state.buttons[1].pressed = true;
                state.buttons[2].pressed = true;
                svg.fill(this.buttons[0], buttonPairTheme.buttonDown);
                svg.fill(this.buttons[1], buttonPairTheme.buttonDown);
                svg.fill(this.buttons[2], buttonPairTheme.buttonDown);
            })
            this.buttonsOuter[2].addEventListener(pointerEvents.leave, ev => {
                state.buttons[0].pressed = false;
                state.buttons[1].pressed = false;
                state.buttons[2].pressed = false;
                svg.fill(this.buttons[0], buttonPairTheme.buttonUp);
                svg.fill(this.buttons[1], buttonPairTheme.buttonUp);
                svg.fill(this.buttons[2], buttonPairTheme.virtualButtonUp);
            })
            this.buttonsOuter[2].addEventListener(pointerEvents.up, ev => {
                state.buttons[0].pressed = false;
                state.buttons[1].pressed = false;
                state.buttons[2].pressed = false;
                svg.fill(this.buttons[0], buttonPairTheme.buttonUp);
                svg.fill(this.buttons[1], buttonPairTheme.buttonUp);
                svg.fill(this.buttons[2], buttonPairTheme.virtualButtonUp);

                bus.queue(state.buttons[2].id, DAL.MICROBIT_BUTTON_EVT_CLICK);
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
        buttons: Button[];

        constructor() {
            this.buttons = [
                new Button(DAL.MICROBIT_ID_BUTTON_A),
                new Button(DAL.MICROBIT_ID_BUTTON_B),
                new Button(DAL.MICROBIT_ID_BUTTON_AB)
            ];
        }
    }
}