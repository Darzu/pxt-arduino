/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    export interface IAccelerometerTheme {
        gestureButtonOuter?: string;
        gestureButtonUp?: string;
        gestureButtonDown?: string;
    }

    export var defaultAccelerometerTheme: IAccelerometerTheme = {
        gestureButtonOuter: "#333",
        gestureButtonUp: "#fff",
        gestureButtonDown: "#FFA500",
    };
    export class AccelerometerView implements IBoardComponent<AccelerometerState> {
        private shakeButton: SVGCircleElement;
        private shakeText: SVGTextElement;
        private state: AccelerometerState;
        private bus: EventBus;
        public element: SVGElement;
        private theme: IAccelerometerTheme;
        public defs: SVGElement[];
        public style = ``;
        private enableTilt = false;
        private tiltTarget: SVGSVGElement;

        public init(bus: EventBus, state: AccelerometerState) {
            this.theme = defaultAccelerometerTheme;
            this.state = state;
            this.bus = bus;
            this.defs = [];
            this.element = this.buildDom();
            this.updateState();
            this.attachEvents();
        }

        public updateTheme() {
            //TODO(DZ): decouple theme
            if (this.shakeButton) svg.fill(this.shakeButton, this.theme.gestureButtonUp);
        }

        private buildDom() {
            let g = svg.elt("g");
            return g;
        }

        public moveToCoord(xy: Coord) {
            //TODO
        }

        public updateState() {
            // update gestures
            if (this.state.useShake && !this.shakeButton) {
                this.shakeButton = svg.child(this.element, "circle", { cx: 380, cy: 100, r: 16.5 }) as SVGCircleElement;
                svg.fill(this.shakeButton, this.theme.gestureButtonUp)
                this.shakeButton.addEventListener(pointerEvents.down, ev => {
                    svg.fill(this.shakeButton, this.theme.gestureButtonDown);
                })
                this.shakeButton.addEventListener(pointerEvents.leave, ev => {
                    svg.fill(this.shakeButton, this.theme.gestureButtonUp);
                })
                this.shakeButton.addEventListener(pointerEvents.up, ev => {
                    svg.fill(this.shakeButton, this.theme.gestureButtonUp);
                    this.bus.queue(DAL.MICROBIT_ID_GESTURE, 11); // GESTURE_SHAKE
                })
                this.shakeText = svg.child(this.element, "text", { x: 400, y: 110, class: "sim-text" }) as SVGTextElement;
                this.shakeText.textContent = "SHAKE"
            }

            this.updateTilt()
        }

        private updateTilt() {
            if (!this.enableTilt) return;
            let accel = this.state.accelerometer;
            if (!this.state || !accel.isActive) return;

            let x = accel.getX();
            let y = accel.getY();
            let af = 8 / 1023;

            this.tiltTarget.style.transform = "perspective(30em) rotateX(" + y * af + "deg) rotateY(" + x * af + "deg)"
            this.tiltTarget.style.perspectiveOrigin = "50% 50% 50%";
            this.tiltTarget.style.perspective = "30em";
        }

        public attachEvents() {
            let tiltDecayer = 0;
            this.tiltTarget.addEventListener(pointerEvents.move, (ev: MouseEvent) => {
                if (!this.state.accelerometer.isActive) return;

                if (tiltDecayer) {
                    clearInterval(tiltDecayer);
                    tiltDecayer = 0;
                }

                let ax = (ev.clientX - this.tiltTarget.clientWidth / 2) / (this.tiltTarget.clientWidth / 3);
                let ay = (ev.clientY - this.tiltTarget.clientHeight / 2) / (this.tiltTarget.clientHeight / 3);

                let x = - Math.max(- 1023, Math.min(1023, Math.floor(ax * 1023)));
                let y = Math.max(- 1023, Math.min(1023, Math.floor(ay * 1023)));
                let z2 = 1023 * 1023 - x * x - y * y;
                let z = Math.floor((z2 > 0 ? -1 : 1) * Math.sqrt(Math.abs(z2)));

                this.state.accelerometer.update(x, y, z);
                this.updateTilt();
            }, false);
            this.tiltTarget.addEventListener(pointerEvents.leave, (ev: MouseEvent) => {
                let accel = this.state.accelerometer;
                if (!accel.isActive) return;

                if (!tiltDecayer) {
                    tiltDecayer = setInterval(() => {
                        let accx = accel.getX(MicroBitCoordinateSystem.RAW);
                        accx = Math.floor(Math.abs(accx) * 0.85) * (accx > 0 ? 1 : -1);
                        let accy = accel.getY(MicroBitCoordinateSystem.RAW);
                        accy = Math.floor(Math.abs(accy) * 0.85) * (accy > 0 ? 1 : -1);
                        let accz = -Math.sqrt(Math.max(0, 1023 * 1023 - accx * accx - accy * accy));
                        if (Math.abs(accx) <= 24 && Math.abs(accy) <= 24) {
                            clearInterval(tiltDecayer);
                            tiltDecayer = 0;
                            accx = 0;
                            accy = 0;
                            accz = -1023;
                        }
                        accel.update(accx, accy, accz);
                        this.updateTilt();
                    }, 50)
                }
            }, false);
        }
    }
}