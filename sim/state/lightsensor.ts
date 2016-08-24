namespace pxsim {
    export class LightSensorCmp {
        usesLightLevel = false;
        lightLevel = 128;
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