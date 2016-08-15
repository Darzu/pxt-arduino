/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>


namespace pxsim {
    export class ThermometerCmp {
        usesTemperature = false;
        temperature = 21;

    }
}

namespace pxsim.visuals {
    export interface IThermometerTheme {
        foreground: string,
        background: string
    }
    export var defaultThermometerTheme: IThermometerTheme = {
        foreground: "#ff7f7f",
        background: "#202020"
    }

    const TMIN = -5;
    const TMAX = 50;

    export class ThermometerSvg implements IBoardComponent<ThermometerCmp> {
        private thermometerGradient: SVGLinearGradientElement;
        private thermometer: SVGRectElement;
        private thermometerText: SVGTextElement;
        private state: ThermometerCmp;
        private bus: EventBus;
        public element: SVGElement;
        public defs: SVGElement[];
        private theme: IThermometerTheme;
        private svgEl: SVGSVGElement;

        //TODO(DZ): parameterize stroke
        public style = `
.sim-thermometer {
    stroke:#aaa;
    stroke-width: 3px;
}`;

        public init(bus: EventBus, state: ThermometerCmp, svgEl: SVGSVGElement) {
            this.defs = [];
            this.state = state;
            this.bus = bus;
            this.svgEl = svgEl;
            this.element = this.buildDom();
        }

        public setLocations(...xys: Coord[]){
            //TODO
        }
        
        public updateTheme() {
            svg.setGradientColors(this.thermometerGradient, this.theme.background, this.theme.foreground);
        }

        private buildDom() {
            let g = svg.elt('g');

            let gid = "gradient-thermometer";
            this.thermometerGradient = svg.mkLinearGradient(gid);
            this.defs.push(this.thermometerGradient);
            this.thermometer = <SVGRectElement>svg.child(g, "rect", {
                class: "sim-thermometer",
                x: 120,
                y: 110,
                width: 20,
                height: 160,
                rx: 5, ry: 5,
                fill: `url(#${gid})`
            });
            this.thermometerText = svg.child(g, "text", { class: 'sim-text', x: 58, y: 130 }) as SVGTextElement;
            this.updateTheme();

            let pt = this.svgEl.createSVGPoint();
            svg.buttonEvents(this.thermometer,
                (ev) => {
                    let cur = svg.cursorPoint(pt, this.svgEl, ev);
                    let t = Math.max(0, Math.min(1, (260 - cur.y) / 140))
                    this.state.temperature = Math.floor(TMIN + t * (TMAX - TMIN));
                    this.updateState();
                }, ev => { }, ev => { })

            return g;
        }

        public updateState() {
            if (!this.state || !this.state.usesTemperature) return;

            let t = Math.max(TMIN, Math.min(TMAX, this.state.temperature))
            let per = Math.floor((this.state.temperature - TMIN) / (TMAX - TMIN) * 100)
            svg.setGradientValue(this.thermometerGradient, 100 - per + "%");
            this.thermometerText.textContent = t + "°C";
        }
    }
}

namespace pxsim.input {
    export function temperature(): number {
        let b = board();
        if (!b.thermometerCmp.usesTemperature) {
            b.thermometerCmp.usesTemperature = true;
            runtime.queueDisplayUpdate();
        }
        return b.thermometerCmp.temperature;
    }
}