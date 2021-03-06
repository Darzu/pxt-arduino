/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    export interface ICompassTheme {
        color: string
    }
    export var defaultCompassTheme: ICompassTheme = {
        color: "green"
    }

    export class CompassView implements IBoardComponent<CompassState> {
        private head: SVGGElement;
        private headInitialized = false;
        private headText: SVGTextElement;
        private headPieces: SVGElement[];
        public style = ``;
        public element: SVGElement;
        public defs: SVGElement[];
        private bus: EventBus;
        private state: CompassState;
        private theme: ICompassTheme;
        private svgEl: SVGSVGElement;

        public init(bus: EventBus, state: CompassState, svgEl: SVGSVGElement) {
            this.bus = bus;
            this.state = state;
            this.svgEl = svgEl;
            this.defs = [];
            this.element = this.buildDom();
            this.theme = defaultCompassTheme;
            this.hide();
        }

        public hide() {
            let els =  [].concat(this.head, this.headText).concat(this.headPieces);
            els.forEach(e => (<any>e).style.visibility = "hidden")
        }

        public moveToCoord(xy: Coord) {
            //TODO
        }

        public updateState() {
            let xc = 258;
            let yc = 75;
            if (!this.state || !this.state.usesHeading) return;
            if (!this.headInitialized) {
                let p = this.head.firstChild.nextSibling as SVGPathElement;
                p.setAttribute("d", "m269.9,50.134647l0,0l-39.5,0l0,0c-14.1,0.1 -24.6,10.7 -24.6,24.8c0,13.9 10.4,24.4 24.3,24.7l0,0l39.6,0c14.2,0 40.36034,-22.97069 40.36034,-24.85394c0,-1.88326 -26.06034,-24.54606 -40.16034,-24.64606m-0.2,39l0,0l-39.3,0c-7.7,-0.1 -14,-6.4 -14,-14.2c0,-7.8 6.4,-14.2 14.2,-14.2l39.1,0c7.8,0 14.2,6.4 14.2,14.2c0,7.9 -6.4,14.2 -14.2,14.2l0,0l0,0z");
                this.updateTheme();
                let pt = this.svgEl.createSVGPoint();
                svg.buttonEvents(
                    this.head,
                    (ev: MouseEvent) => {
                        let cur = svg.cursorPoint(pt, this.svgEl, ev);
                        this.state.heading = Math.floor(Math.atan2(cur.y - yc, cur.x - xc) * 180 / Math.PI + 90);
                        if (this.state.heading < 0) this.state.heading += 360;
                        this.updateState();
                    });
                this.headInitialized = true;
            }

            let txt = this.state.heading.toString() + "°";
            if (txt != this.headText.textContent) {
                svg.rotateElement(this.head, xc, yc, this.state.heading + 180);
                this.headText.textContent = txt;
            }
        }

        public updateTheme() {
            svg.fills(this.headPieces, this.theme.color);
        }

        public buildDom(){
            let g = svg.elt("g");
            this.headPieces = [];
            this.head = <SVGGElement>svg.child(g, "g", {});
            svg.child(this.head, "circle", { cx: 258, cy: 75, r: 100, fill: "transparent" })
            this.headPieces.push(svg.path(this.head, "sim-theme sim-theme-glow", "M269.9,50.2L269.9,50.2l-39.5,0v0c-14.1,0.1-24.6,10.7-24.6,24.8c0,13.9,10.4,24.4,24.3,24.7v0h39.6c14.2,0,24.8-10.6,24.8-24.7C294.5,61,284,50.3,269.9,50.2 M269.7,89.2L269.7,89.2l-39.3,0c-7.7-0.1-14-6.4-14-14.2c0-7.8,6.4-14.2,14.2-14.2h39.1c7.8,0,14.2,6.4,14.2,14.2C283.9,82.9,277.5,89.2,269.7,89.2"));
            this.headPieces.push(svg.path(this.head, "sim-theme sim-theme-glow", "M230.6,69.7c-2.9,0-5.3,2.4-5.3,5.3c0,2.9,2.4,5.3,5.3,5.3c2.9,0,5.3-2.4,5.3-5.3C235.9,72.1,233.5,69.7,230.6,69.7"));
            this.headPieces.push(svg.path(this.head, "sim-theme sim-theme-glow", "M269.7,80.3c2.9,0,5.3-2.4,5.3-5.3c0-2.9-2.4-5.3-5.3-5.3c-2.9,0-5.3,2.4-5.3,5.3C264.4,77.9,266.8,80.3,269.7,80.3"));
            this.headText = <SVGTextElement>svg.child(g, "text", { x: 310, y: 100, class: "sim-text" })
            return g;
        }
    }
}