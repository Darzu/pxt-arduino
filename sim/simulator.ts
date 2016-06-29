/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/arduino/enums.d.ts"/>

//TODO find home
declare namespace pxsim.svg {
    function cursorPoint(pt: SVGPoint, svg: SVGSVGElement, evt: MouseEvent): SVGPoint;
    function rotateElement(el: SVGElement, originX: number, originY: number, degrees: number): void;
    function addClass(el: SVGElement, cls: string): void;
    function removeClass(el: SVGElement, cls: string): void;
    function elt(name: string): SVGElement;
    function hydrate(el: SVGElement, props: any): void;
    function child(parent: Element, name: string, props?: any): SVGElement;
    function path(parent: Element, cls: string, data: string, title?: string): SVGElement;
    function fill(el: SVGElement, c: string): void;
    function fills(els: SVGElement[], c: string): void;
    function buttonEvents(el: Element, move: (ev: MouseEvent) => void, start?: (ev: MouseEvent) => void, stop?: (ev: MouseEvent) => void): void;
    function linearGradient(defs: SVGDefsElement, id: string): SVGLinearGradientElement;
    function setGradientColors(lg: SVGLinearGradientElement, start: string, end: string): void;
    function setGradientValue(lg: SVGLinearGradientElement, percent: string): void;
    function animate(el: SVGElement, cls: string): void;
    function title(el: SVGElement, txt: string): void;
}

//TODO find home
namespace pxsim {
    export const pointerEvents = !!(window as any).PointerEvent ? {
        up: "pointerup",
        down: "pointerdown",
        move: "pointermove",
        leave: "pointerleave"
    } : {
            up: "mouseup",
            down: "mousedown",
            move: "mousemove",
            leave: "mouseleave"
        };
}

namespace pxsim {
    initCurrentRuntime = () => {
        runtime.board = new Board();
    };

    export function board() : Board {
        return runtime.board as Board;
    }

    export class Button {
        constructor(public id: number) { }
        pressed: boolean;
    }

    export class EventBus {
        private queues: Map<EventQueue<number>> = {};

        constructor(private runtime: Runtime) { }

        listen(id: number, evid: number, handler: RefAction) {
            let k = id + ":" + evid;
            let queue = this.queues[k];
            if (!queue) queue = this.queues[k] = new EventQueue<number>(this.runtime);
            queue.handler = handler;
        }

        queue(id: number, evid: number, value: number = 0) {
            let k = id + ":" + evid;
            let queue = this.queues[k];
            if (queue) queue.push(value);
        }
    }

    export class Board extends pxsim.BaseBoard {
        public element : SVGSVGElement;
        public spriteElement: SVGCircleElement;
        public sprite : Sprite;
        private g : SVGElement;

        // the bus
        bus: EventBus;

        // buttons    
        usesButtonAB: boolean = false;
        buttons: Button[];
        btnEles: SVGElement[];
        btnOuterEles: SVGElement[];
        buttonABText: SVGTextElement;

        themeButtonOuter: string;
        themeButtonDown: string;
        themeButtonUp: string;
        themeVirtualButtonOuter: string;
        themeVirtualButtonUp: string;
        
        constructor() {
            super();
            this.bus = new EventBus(runtime);
            this.element = <SVGSVGElement><any>document.getElementById('svgcanvas');
            this.spriteElement = <SVGCircleElement>this.element.getElementById('svgsprite');
            this.sprite = new Sprite()

            this.buttons = [
                new Button(DAL.MICROBIT_ID_BUTTON_A),
                new Button(DAL.MICROBIT_ID_BUTTON_B),
                new Button(DAL.MICROBIT_ID_BUTTON_AB)
            ];

            this.themeButtonOuter = "#979797";
            this.themeButtonDown = "#FFA500";
            this.themeButtonUp = "#000";
            this.themeVirtualButtonOuter = "#333";
            this.themeVirtualButtonUp = "#fff";

            this.buildDom();
            this.updateView();
            this.attachEvents();
        }

        buildDom() {
            svg.hydrate(this.element, {
                "version": "1.0",
                "viewBox": "0 0 498 406",
                "enable-background": "new 0 0 498 406",
                "class": "sim",
                "x": "0px",
                "y": "0px"
            });
            
            this.g = svg.elt("g");
            this.element.appendChild(this.g);

            this.addBtns();
        }

        addBtns() {
            
            this.btnEles = [];
            this.btnOuterEles = [];

            const outerBtn = (left: number, top: number) => {
                const btnr = 4;
                const btnw = 56.2;
                const btnn = 6;
                const btnnm = 10
                let btng = svg.child(this.g, "g");
                this.btnOuterEles.push(btng);
                svg.child(btng, "rect", { class: "sim-button-outer", x: left, y: top, rx: btnr, ry: btnr, width: btnw, height: btnw });
                svg.child(btng, "circle", { class: "sim-button-nut", cx: left + btnnm, cy: top + btnnm, r: btnn });
                svg.child(btng, "circle", { class: "sim-button-nut", cx: left + btnnm, cy: top + btnw - btnnm, r: btnn });
                svg.child(btng, "circle", { class: "sim-button-nut", cx: left + btnw - btnnm, cy: top + btnw - btnnm, r: btnn });
                svg.child(btng, "circle", { class: "sim-button-nut", cx: left + btnw - btnnm, cy: top + btnnm, r: btnn });
            }

            outerBtn(25.9, 176.4);
            this.btnEles.push(svg.path(this.g, "sim-button", "M69.7,203.5c0,8.7-7,15.7-15.7,15.7s-15.7-7-15.7-15.7c0-8.7,7-15.7,15.7-15.7S69.7,194.9,69.7,203.5"));
            outerBtn(418.1, 176.4);
            this.btnEles.push(svg.path(this.g, "sim-button", "M461.9,203.5c0,8.7-7,15.7-15.7,15.7c-8.7,0-15.7-7-15.7-15.7c0-8.7,7-15.7,15.7-15.7C454.9,187.8,461.9,194.9,461.9,203.5"));
            outerBtn(417, 250);
            this.btnEles.push(svg.child(this.g, "circle", { class: "sim-button", cx: 446, cy: 278, r: 16.5 }));
            (<any>this.btnOuterEles[2]).style.visibility = "hidden";
            (<any>this.btnEles[2]).style.visibility = "hidden";
        }

        private updateTheme() {
            svg.fills(this.btnOuterEles.slice(0, 2), this.themeButtonOuter);
            svg.fills(this.btnEles.slice(0, 2), this.themeButtonUp);
            svg.fill(this.btnOuterEles[2], this.themeVirtualButtonOuter);
            svg.fill(this.btnEles[2], this.themeVirtualButtonUp);
        }
        
        initAsync(msg: pxsim.SimulatorRunMessage): Promise<void> {
            console.log('setting simulator')
            
            //TODO(DZ) why do we do this refresh?
            document.body.innerHTML = ''; // clear children
            document.body.appendChild(this.element);

            return Promise.resolve();
        }       
        
        updateView() {
            this.spriteElement.cx.baseVal.value = this.sprite.x;
            this.spriteElement.cy.baseVal.value = this.sprite.y;
            
            //btns
            this.buttons.forEach((btn, index) => {
                svg.fill(this.btnEles[index], btn.pressed ? this.themeButtonDown : this.themeButtonUp);
            });

            this.updateButtonAB();
        }

        private updateButtonAB() {
            if (this.usesButtonAB && !this.buttonABText) {
                (<any>this.btnOuterEles[2]).style.visibility = "visible";
                (<any>this.btnEles[2]).style.visibility = "visible";
                this.buttonABText = svg.child(this.g, "text", { class: "sim-text", x: 370, y: 272 }) as SVGTextElement;
                this.buttonABText.textContent = "A+B";
                this.updateTheme();
            }

            if (!runtime || runtime.dead) svg.addClass(this.element, "grayscale");
            else svg.removeClass(this.element, "grayscale");
        }

        private attachEvents() {
            this.btnOuterEles.slice(0, 2).forEach((btn, index) => {
                btn.addEventListener(pointerEvents.down, ev => {                    
                    this.buttons[index].pressed = true;
                    svg.fill(this.btnEles[index], this.themeButtonDown);
                })
                btn.addEventListener(pointerEvents.leave, ev => {
                    this.buttons[index].pressed = false;
                    svg.fill(this.btnEles[index], this.themeButtonUp);
                })
                btn.addEventListener(pointerEvents.up, ev => {
                    this.buttons[index].pressed = false;
                    svg.fill(this.btnEles[index], this.themeButtonUp);

                    this.bus.queue(this.buttons[index].id, DAL.MICROBIT_BUTTON_EVT_CLICK);
                })
            })
            this.btnOuterEles[2].addEventListener(pointerEvents.down, ev => {
                this.buttons[0].pressed = true;
                this.buttons[1].pressed = true;
                this.buttons[2].pressed = true;
                svg.fill(this.btnEles[0], this.themeButtonDown);
                svg.fill(this.btnEles[1], this.themeButtonDown);
                svg.fill(this.btnEles[2], this.themeButtonDown);
            })
            this.btnOuterEles[2].addEventListener(pointerEvents.leave, ev => {
                this.buttons[0].pressed = false;
                this.buttons[1].pressed = false;
                this.buttons[2].pressed = false;
                svg.fill(this.btnEles[0], this.themeButtonUp);
                svg.fill(this.btnEles[1], this.themeButtonUp);
                svg.fill(this.btnEles[2], this.themeVirtualButtonUp);
            })
            this.btnOuterEles[2].addEventListener(pointerEvents.up, ev => {
                this.buttons[0].pressed = false;
                this.buttons[1].pressed = false;
                this.buttons[2].pressed = false;
                svg.fill(this.btnEles[0], this.themeButtonUp);
                svg.fill(this.btnEles[1], this.themeButtonUp);
                svg.fill(this.btnEles[2], this.themeVirtualButtonUp);

                this.bus.queue(this.buttons[2].id, DAL.MICROBIT_BUTTON_EVT_CLICK);
            })
        }
    }
}