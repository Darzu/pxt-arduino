namespace pxsim.boardsvg {
    export const PIN_DIST = 15.25;

    declare type PinFn = (p: SVGElement, i: number, j: number, x: number, y: number)=>string;

    export class Breadboard {
        private bb: SVGGElement;
        private nameToPin: Map<SVGElement> = {};
        private nameToLoc: Map<[number, number]> = {};

        //TODO relate font size to PIN_DIST 
        public style = `
/* bread board */
.sim-bb-background {
    fill:#E0E0E0;
}
.sim-bb-channel {
}
.sim-bb-pin {
    fill:#999;
}
.sim-bb-label {
    font-family:"Lucida Console", Monaco, monospace;
    fill:#555;
    pointer-events: none;
}
.sim-bb-blue {
    fill:#1AA5D7;
}
.sim-bb-red {
    fill:#DD4BA0;
}`

        public updateLocation(x: number, y: number) {
            //TODO(DZ): come up with a better abstraction/interface for customizing placement
            let els = [this.bb];
            translateEls(els, x, y);
        }

        public getPinLoc(pinName: string): [number, number] {
            if (!(pinName in this.nameToLoc)) {
                console.error("Unknown pin: " + pinName)
                return [0,0];
            }
            return this.nameToLoc[pinName];
        }
        
        public buildDom(g: SVGElement, defs: SVGDefsElement, width: number, height: number) {
            const midRatio = 0.66666666;
            const midH = height*midRatio;
            const barRatio = 0.16666666;
            const barH = height*barRatio;

            const midCols = 30;
            const midGridW = (midCols-1) * PIN_DIST;
            const midRows = 12;
            const midGridH = (midRows-1) * PIN_DIST;
            const midGridX = (width - midGridW)/2;
            const midGridY = barH + (midH - midGridH)/2;

            const barRows = 2;
            const barGridH = (barRows-1) * PIN_DIST;
            const barCols = 5*5+4
            const barGridW = (barCols-1) * PIN_DIST;
            const topBarGridX = (width - barGridW)/2;
            const topBarGridY = (barH - barGridH)/2;
            const botBarGridX = topBarGridX;
            const botBarGridY = topBarGridY + barH + midH;

            // this.background = svg.child(g, "image", 
            //     { class: "sim-board", x: 0, y: 0, width: width, height: height, 
            //         "href": "/images/breadboard-photo-sml.png"});

            const mkGrid = (l: number, t: number, rs: number, cs: number,  pinFn: PinFn): SVGGElement => {
                const size = PIN_DIST/2.5;
                const rounding = size/3;
                const x = l - size/2;
                const y = t - size/2;

                let grid = <SVGGElement>svg.elt("g");
                for (let i = 0; i < rs; i++) {
                    for (let j = 0; j < cs; j++) {
                        let pin = svg.elt("rect")
                        let pinX = x+j*PIN_DIST;
                        let pinY = y+i*PIN_DIST;
                        let name = pinFn(pin, i, j, pinX+size/2, pinY+size/2);
                        let props = { class: "sim-bb-pin", x: pinX, y: pinY, rx: rounding, ry: rounding, width: size, height: size, title: name };
                        svg.hydrate(pin, props)
                        grid.appendChild(pin);

                    }
                }
                return grid;
            }

            const mkBar = (x: number, y: number, pinFn: PinFn) => {
                return [
                     mkGrid(x + 0*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+0, x, y)),
                     mkGrid(x + 6*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+5, x, y)),
                     mkGrid(x + 12*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+10, x, y)),
                     mkGrid(x + 18*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+15, x, y)),
                     mkGrid(x + 24*PIN_DIST, y, 2, 5, (p, i, j, x, y) => pinFn(p, i, j+20, x, y)),
                ]
            }

            const notePin = (getNm: (i: number, j: number) => string): PinFn => {
                return (p, i, j, x, y) => {
                    let name = getNm(i, j);
                    this.nameToPin[name] = p;
                    this.nameToLoc[name] = [x, y];
                    return name;
                }
            }

            //wrapper
            this.bb = <SVGGElement>svg.child(g, "g")
            svg.hydrate(this.bb, {class: "sim-bb"});

            //background
            const bckRnd = PIN_DIST*0.3;
            svg.child(this.bb, "rect", { class: "sim-bb-background", width: width, height: height, rx: bckRnd, ry: bckRnd});

            //mid channel
            let channelGid = "gradient-channel";
            let channelGrad = <SVGLinearGradientElement>svg.child(defs, "linearGradient", 
                { id: channelGid, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
            let channelDark = "#AAA";
            let channelLight = "#CCC";
            let stop1 = svg.child(channelGrad, "stop", { offset: "0%", style: `stop-color: ${channelDark};` })
            let stop2 = svg.child(channelGrad, "stop", { offset: "20%", style: `stop-color: ${channelLight};` })
            let stop3 = svg.child(channelGrad, "stop", { offset: "80%", style: `stop-color: ${channelLight};` })
            let stop4 = svg.child(channelGrad, "stop", { offset: "100%", style: `stop-color: ${channelDark};` })

            const mkChannel = (cy: number, h: number) => {
                let channel = svg.child(this.bb, "rect", { class: "sim-bb-channel", y: cy - h/2, width: width, height: h});
                channel.setAttribute("fill", `url(#${channelGid})`);
                return channel;
            }

            const midChannelH = PIN_DIST;
            const smlChannelH = PIN_DIST*0.05;
            mkChannel(barH + midH/2, midChannelH);
            mkChannel(barH, smlChannelH);
            mkChannel(barH+midH, smlChannelH);

            //grids
            let ae = ["e", "d", "c", "b", "a", ];
            let fj = ["j", "i", "h", "g", "f", ];
            let nums =[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,]
            let numsAlph = nums.map(n => ""+n)
            let mp = ["-", "+"];

            let midGrid1 = mkGrid(midGridX,midGridY,5,30, notePin((i, j) => fj[i]+numsAlph[j]));
            this.bb.appendChild(midGrid1);
            let midGrid2 = mkGrid(midGridX,midGridY+7*PIN_DIST,5,30, notePin((i, j) => ae[i]+numsAlph[j]));
            this.bb.appendChild(midGrid2);
            let topGrid = mkBar(topBarGridX, topBarGridY, notePin((i, j) => mp[i]+numsAlph[j+25]));
            topGrid.forEach(e => this.bb.appendChild(e));
            let botGrid = mkBar(botBarGridX, botBarGridY, notePin((i, j) => mp[i]+numsAlph[j]));
            botGrid.forEach(e => this.bb.appendChild(e));

            //labels
            const mkTxt = (l: number, t: number, size: number, r: number, txt: string, classStr: string) => {
                const txtXOffFactor = -0.33333;//Found by trial and error
                const txtYOffFactor = 0.3;
                const xOff = txtXOffFactor*size*txt.length;
                const yOff = txtYOffFactor*size;
                let g = svg.child(this.bb, "g", {transform: `translate(${l} ${t})`})
                let el = svg.child(g, "text", { class: classStr, x: xOff, y: yOff, style: `font-size:${size}px;`,
                    transform: `translate(${0} ${0}) rotate(${r})` }) as SVGTextElement;
                el.textContent = txt;
                return el
            }
            const mkLabel = (pinName: string, label: string, xOff: number, yOff: number, r: number, s: number) => {
                let loc = this.getPinLoc(pinName);
                return mkTxt(loc[0] + xOff, loc[1] + yOff, s, r, label, "sim-bb-label");
            }

            const lblSize = PIN_DIST * 0.7;
            nums.forEach(n => mkLabel("j"+n, ""+n, 0, -PIN_DIST, -90, lblSize));
            nums.forEach(n => mkLabel("a"+n, ""+n, 0, PIN_DIST, -90, lblSize));
            ae.forEach(a => mkLabel(a+"1", a, -PIN_DIST, 0, -90, lblSize))
            fj.forEach(a => mkLabel(a+"1", a, -PIN_DIST, 0, -90, lblSize))
            ae.forEach(a => mkLabel(a+"30", a, PIN_DIST, 0, -90, lblSize))
            fj.forEach(a => mkLabel(a+"30", a, PIN_DIST, 0, -90, lblSize))

            //+- labels
            const pLblSize = PIN_DIST * 1.7;
            const mLblSize = PIN_DIST * 2;
            const mpLblOff = PIN_DIST * 0.8;
            const mXOff = PIN_DIST*0.07;
            //TL
            mkTxt(0 + mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            mkTxt(0 + mpLblOff, barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //TR
            mkTxt(width - mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            mkTxt(width - mpLblOff, barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //BL
            mkTxt(0 + mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            mkTxt(0 + mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //BR
            mkTxt(width - mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            mkTxt(width - mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
        
            //blue & red lines
            const lnLen = barGridW + PIN_DIST*1.5;
            const lnThickness = PIN_DIST/5.0;
            const lnYOff = PIN_DIST*.6;
            const lnXOff = (lnLen - barGridW)/2;
            const mkLn = (x: number, y: number, classStr: string) => {
                return svg.child(this.bb, "rect", { class: classStr, x: x, y: y - lnThickness/2, width: lnLen, height: lnThickness});
            }
            mkLn(topBarGridX - lnXOff, topBarGridY - lnYOff, "sim-bb-blue");
            mkLn(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, "sim-bb-red");
            mkLn(botBarGridX - lnXOff, botBarGridY - lnYOff, "sim-bb-blue");
            mkLn(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, "sim-bb-red");
        }
    }
}