/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>


namespace pxsim {
    export class LightSensorCmp {
        usesLightLevel = false;
        lightLevel = 128;
    }
}

namespace pxsim.boardsvg {
    export interface ILightSensorTheme {
        lightLevelOn?: string;
        lightLevelOff?: string;
    }
    export var defaultLightSensorTheme: ILightSensorTheme = {
        lightLevelOn: "yellow",
        lightLevelOff: "#555"
    }

    export class LightSensorSvg implements IBoardComponent<LightSensorCmp>{
        private lightLevelButton: SVGCircleElement;
        private lightLevelGradient: SVGLinearGradientElement;
        private lightLevelText: SVGTextElement;
        private state: LightSensorCmp;
        private bus: EventBus;
        public element: SVGElement;
        public defs: SVGElement[];
        private theme: ILightSensorTheme;
        private svgEl: SVGSVGElement;

        //TODO(DZ): Parameterize stroke
        public style = `
.sim-light-level-button {
    stroke:#fff;
    stroke-width: 3px;
}`; 

        public init(bus: EventBus, state: LightSensorCmp, svgEl: SVGSVGElement) {
            this.bus = bus;
            this.state = state;
            this.theme = defaultLightSensorTheme;
            this.defs = [];
            this.svgEl = svgEl;
            this.element = this.buildDom();
        }

        public setLocations(...xys: Coord[]) {
            //TODO
        }
        
        public updateTheme() {
            svg.setGradientColors(this.lightLevelGradient, this.theme.lightLevelOn, this.theme.lightLevelOff);
        }

        public buildDom() {
            let g = svg.elt("g");

            let gid = "gradient-light-level";
            this.lightLevelGradient = svg.mkLinearGradient(gid)
            this.defs.push(this.lightLevelGradient);
            let cy = 50;
            let r = 35;
            this.lightLevelButton = svg.child(g, "circle", {
                cx: `50px`, cy: `${cy}px`, r: `${r}px`,
                class: 'sim-light-level-button',
                fill: `url(#${gid})`
            }) as SVGCircleElement;
            let pt = this.svgEl.createSVGPoint();
            svg.buttonEvents(this.lightLevelButton,
                (ev) => {
                    let pos = svg.cursorPoint(pt, this.svgEl, ev);
                    let rs = r / 2;
                    let level = Math.max(0, Math.min(255, Math.floor((pos.y - (cy - rs)) / (2 * rs) * 255)));
                    if (level != this.state.lightLevel) {
                        this.state.lightLevel = level;
                        this.applyLightLevel();
                    }
                }, ev => { },
                ev => { })
            this.lightLevelText = svg.child(g, "text", { x: 85, y: cy + r - 5, text: '', class: 'sim-text' }) as SVGTextElement;
            this.updateTheme();

            return g;
        }

        public updateState() {
            if (!this.state || !this.state.usesLightLevel) return;

            svg.setGradientValue(this.lightLevelGradient, Math.min(100, Math.max(0, Math.floor(this.state.lightLevel * 100 / 255))) + '%')
            this.lightLevelText.textContent = this.state.lightLevel.toString();
        }

        private applyLightLevel() {
            let lv = this.state.lightLevel;
            svg.setGradientValue(this.lightLevelGradient, Math.min(100, Math.max(0, Math.floor(lv * 100 / 255))) + '%')
            this.lightLevelText.textContent = lv.toString();
        }
    }
}

namespace pxsim.input {
    export function lightLevel(): number {
        let b = board().lightSensorCmp;
        if (!b.usesLightLevel) {
            b.usesLightLevel = true;
            runtime.queueDisplayUpdate();
        }
        return b.lightLevel;
    }
}