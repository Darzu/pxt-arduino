/// <reference path="../../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../../libs/microbit/dal.d.ts"/>

namespace pxsim.instructions {
    export function drawInstructions() {
        pxsim.runtime = new Runtime("");
        pxsim.runtime.board = null;
        pxsim.initCurrentRuntime();

        document.body.innerHTML = "";

        const w = 200;
        const h = 400;
        const m = 30;

        let view = new pxsim.boardsvg.Nrf51dkSvg({
            theme: pxsim.mkRandomTheme(),
            runtime: pxsim.runtime,
            boardDesc: boardsvg.ARDUINO_ZERO,
            blank: true
        })
        svg.hydrate(view.element, {
            "width": w,
            "height": h,
            "style": `margin: ${m}px;`
        });
        document.body.appendChild(view.element);

        let view2 = new pxsim.boardsvg.Nrf51dkSvg({
            theme: pxsim.mkRandomTheme(),
            runtime: pxsim.runtime,
            boardDesc: boardsvg.ARDUINO_ZERO
        })
        svg.hydrate(view2.element, {
            "width": w,
            "height": h,
            "style": `margin: ${m}px;`
        });
        document.body.appendChild(view2.element);
    }
}