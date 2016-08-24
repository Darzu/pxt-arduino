namespace pxsim {
    export function sendBufferAsm(buffer: Buffer, pin: DigitalPin) {
        let b = board();
        if (b) {
            let np = b.neopixelCmp;
            if (np) {
                np.sendBuffer(buffer, pin);
                runtime.queueDisplayUpdate();
            }
        }
    }
}

namespace pxsim {
    export enum NeoPixelMode {RGB, RGBW};
    export type RGBW = [number, number, number, number];

    export class NeoPixelCmp {
        private buffers: {[pin: number]: Uint8Array[]} = {};
        public pixelColors: {[pin: number]: RGBW[]} = {};
        public pinModes: {[pin: number]: NeoPixelMode};

        constructor() {
            this.pinModes = visuals.NEOPIXEL_LAYOUT; //TODO: don't hardcode
        }

        public sendBuffer(buffer: Buffer, pin: DigitalPin) {
            //update buffers
            let buf = <Uint8Array[]>(<any>buffer).data;
            this.buffers[pin] = buf;

            //update colors
            let stride = this.pinModes[pin] === NeoPixelMode.RGBW ? 4 : 3;

            let pixelCount = Math.floor(buf.length / stride);
            let pixelColors = (this.pixelColors[pin] || (this.pixelColors[pin] = []));

            for (let i = 0; i < pixelCount; i++) {
                // NOTE: for whatever reason, NeoPixels pack GRB not RGB
                let r = buf[i * stride + 1] as any as number
                let g = buf[i * stride + 0] as any as number
                let b = buf[i * stride + 2] as any as number
                let w = 0;
                if (stride === 4)
                    w = buf[i * stride + 3] as any as number
                pixelColors[i] = [r, g, b, w]
            }
        }
    }
}