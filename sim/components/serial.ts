/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    export interface ISerialTheme {
        systemLedStroke: string,
        systemLedFill: string
    }
    export var defaultSerialTheme: ISerialTheme = {
        systemLedStroke: "#555",
        systemLedFill: "#333"
    }

    export class SerialSvg implements IBoardComponent<SerialCmp> {
        private systemLed: SVGCircleElement;

        public style = `
            .sim-systemled {
                stroke-width: 1px;
            }`;

        private state: SerialCmp;
        public element: SVGElement;
        public defs: SVGElement[];
        private theme: ISerialTheme;
        private bus: EventBus;

        public init(bus: EventBus, state: SerialCmp) {
            this.bus = bus;
            this.state = state;
            this.defs = [];
            this.theme = defaultSerialTheme;
            this.element = this.buildDom();
            this.attachEvents();
        }

        public moveToCoord(xy: Coord) {
            //TODO
        }

        public updateTheme() {
            if (this.systemLed) {
                this.systemLed.style.stroke = this.theme.systemLedStroke
                this.systemLed.style.fill = this.theme.systemLedFill
            }
        }

        private buildDom() {
            return svg.elt("g");
        }

        private lastFlashTime: number = 0;
        public flashSystemLed() {
            if (!this.systemLed) {
                this.systemLed = <SVGCircleElement>svg.child(this.element, "circle", { class: "sim-systemled", cx: 300, cy: 20, r: 5 })
                this.updateTheme();
            }
            let now = Date.now();
            if (now - this.lastFlashTime > 150) {
                this.lastFlashTime = now;
                svg.animate(this.systemLed, "sim-flash")
            }
        }

        public updateState() {
            
        }

        public attachEvents() {
            Runtime.messagePosted = (msg) => {
                switch (msg.type || '') {
                    case 'serial': this.flashSystemLed(); break;
                }
            }
        }
    }
}