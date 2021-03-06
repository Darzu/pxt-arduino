namespace pxsim {
    export class DalBoard extends BaseBoard {
        id: string;

        // the bus
        bus: EventBus;

        // state & update logic for component services
        ledMatrixState: LedMatrixState;
        edgeConnectorState: EdgeConnectorState;
        serialState: SerialState;
        accelerometerState: AccelerometerState;
        compassState: CompassState;
        thermometerState: ThermometerState;
        lightSensorState: LightSensorState;
        buttonPairState: ButtonPairState;
        radioState: RadioState;
        neopixelState: NeoPixelState;

        constructor() {
            super()
            this.id = "b" + Math_.random(2147483647);
            this.bus = new EventBus(runtime);

            // components
            this.ledMatrixState = new LedMatrixState(runtime);
            this.buttonPairState = new ButtonPairState();
            this.edgeConnectorState = new EdgeConnectorState();
            this.radioState = new RadioState(runtime);
            this.accelerometerState = new AccelerometerState(runtime);
            this.serialState = new SerialState();
            this.thermometerState = new ThermometerState();
            this.lightSensorState = new LightSensorState();
            this.compassState = new CompassState();
            this.neopixelState = new NeoPixelState();
        }

        receiveMessage(msg: SimulatorMessage) {
            if (!runtime || runtime.dead) return;

            switch (msg.type || "") {
                case "eventbus":
                    let ev = <SimulatorEventBusMessage>msg;
                    this.bus.queue(ev.id, ev.eventid, ev.value);
                    break;
                case "serial":
                    let data = (<SimulatorSerialMessage>msg).data || "";
                    this.serialState.recieveData(data);
                    break;
                case "radiopacket":
                    let packet = <SimulatorRadioPacketMessage>msg;
                    this.radioState.recievePacket(packet);
                    break;
            }
        }

        kill() {
            super.kill();
            AudioContextManager.stop();
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            let options = (msg.options || {}) as RuntimeOptions;

            let boardDef = ARDUINO_ZERO; //TODO: read from pxt.json/pxttarget.json
            let cmpsList = msg.parts;
            cmpsList.sort();
            let cmpDefs = COMPONENT_DEFINITIONS; //TODO: read from pxt.json/pxttarget.json
            let fnArgs = msg.fnArgs;

            let mb = true;
            let view: visuals.GenericBoardSvg | visuals.MicrobitBoardSvg;
            if (mb) {
                view = new visuals.MicrobitBoardSvg({
                    runtime: runtime,
                    theme: visuals.randomTheme(),
                    activeComponents: cmpsList,
                    fnArgs: fnArgs,
                    disableTilt: false
                });
            } else {
                view = new visuals.GenericBoardSvg({
                    boardDef: boardDef,
                    activeComponents: cmpsList,
                    componentDefinitions: cmpDefs,
                    runtime: runtime,
                    fnArgs: fnArgs
                })
            }

            document.body.innerHTML = ""; // clear children
            document.body.appendChild(view.hostElement);

            return Promise.resolve();
        }
    }
}