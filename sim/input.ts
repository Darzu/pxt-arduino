/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/arduino/dal.d.ts"/>
/// <reference path="../libs/arduino/enums.d.ts"/>

namespace pxsim.pxt {
    export function registerWithDal(id: number, evid: number, handler: RefAction) {
        var bd = board();
        var bus = bd.bus
        bus.listen(id, evid, handler);
    }
}

namespace pxsim.input {
    export function onButtonPressed(button: number, handler: RefAction): void {
        let b = board();
        if (button == DAL.MICROBIT_ID_BUTTON_AB && !board().usesButtonAB) {
            b.usesButtonAB = true;
            runtime.queueDisplayUpdate();
        }
        pxt.registerWithDal(button, DAL.MICROBIT_BUTTON_EVT_CLICK, handler);
    }

    export function buttonIsPressed(button: number): boolean {
        let b = board();
        if (button == DAL.MICROBIT_ID_BUTTON_AB && !board().usesButtonAB) {
            b.usesButtonAB = true;
            runtime.queueDisplayUpdate();
        }
        let bts = b.buttons;
        if (button == DAL.MICROBIT_ID_BUTTON_A) return bts[0].pressed;
        if (button == DAL.MICROBIT_ID_BUTTON_B) return bts[1].pressed;
        return bts[2].pressed || (bts[0].pressed && bts[1].pressed);
    }
}