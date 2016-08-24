namespace pxsim {
    export class ThermometerCmp {
        usesTemperature = false;
        temperature = 21;

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