/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    export interface IRadioTheme {
        antenna?: string
        //TODO(DZ): parameterize flash color
    }

    export var defaultRadioTheme = {
        antenna: "#555"
    };

    export class RadioSvg implements IBoardComponent<RadioCmp> {
        private antenna: SVGPolylineElement;
        public style = `
            .sim-antenna {
                stroke-width: 2px;
            }
            `;
        private state: RadioCmp;
        public element: SVGElement;
        public defs: SVGElement[];
        private bus: EventBus;  
        private theme: IRadioTheme;   

        public init(bus: EventBus, state: RadioCmp) {
            this.state = state;
            this.bus = bus;
            this.defs = [];
            this.theme = defaultRadioTheme;
            this.element = this.buildDom();
            this.attachEvents();
        }   

        public moveToCoord(xy: Coord) {
            //TODO
        }

        public updateTheme() {
            if (this.antenna) this.antenna.style.stroke = this.theme.antenna;
        }

        private buildDom() {
            return svg.elt("g");
        }

        public updateState() {

        }

        private lastAntennaFlash: number = 0;
        public flashAntenna() {
            if (!this.antenna) {
                let ax = 380;
                let dax = 18;
                let ayt = 10;
                let ayb = 40;
                this.antenna = <SVGPolylineElement>svg.child(this.element, "polyline", { class: "sim-antenna", points: `${ax},${ayb} ${ax},${ayt} ${ax += dax},${ayt} ${ax},${ayb} ${ax += dax},${ayb} ${ax},${ayt} ${ax += dax},${ayt} ${ax},${ayb} ${ax += dax},${ayb} ${ax},${ayt} ${ax += dax},${ayt}` })
                this.updateTheme();
            }
            let now = Date.now();
            if (now - this.lastAntennaFlash > 200) {
                this.lastAntennaFlash = now;
                svg.animate(this.antenna, 'sim-flash-stroke')
            }
        }

        public attachEvents() {
            Runtime.messagePosted = (msg) => {
                switch (msg.type || '') {
                    case 'radiopacket': this.flashAntenna(); break;
                }
            }
        }
    }
}