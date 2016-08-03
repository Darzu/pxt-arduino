namespace pxsim.boardsvg {
    export declare type PinFn = (p: SVGRectElement, i: number, j: number, x: number, y: number)=>void;

    export const mkGrid = (l: number, t: number, rs: number, cs: number, size: number, props: any, pinFn: PinFn): SVGGElement => {
        const x = l - size/2;
        const y = t - size/2;

        let grid = <SVGGElement>svg.elt("g");
        for (let i = 0; i < rs; i++) {
            for (let j = 0; j < cs; j++) {
                let pin = <SVGRectElement>svg.elt("rect")
                let pinX = x+j*PIN_DIST;
                let pinY = y+i*PIN_DIST;
                svg.hydrate(pin, props)
                svg.hydrate(pin, { x: pinX, y: pinY, width: size, height: size })
                grid.appendChild(pin);
                pinFn(pin, i, j, pinX+size/2, pinY+size/2);

            }
        }
        return grid;
    }

    export function mkBreadboardSvg(width: number, height: number): 
        {e: SVGGElement, defs: SVGElement[], nameToPin: Map<SVGElement>, nameToLoc: Map<[number, number]>, t: number, l: number, w: number, h: number} {
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

        //locations
        let nameToPin: Map<SVGElement> = {};
        let nameToLoc: Map<[number, number]> = {};

        //wrapper
        let bb = <SVGGElement>svg.elt("g")
        svg.hydrate(bb, {class: "sim-bb"});

        //background
        const bckRnd = PIN_DIST*0.3;
        svg.child(bb, "rect", { class: "sim-bb-background", width: width, height: height, rx: bckRnd, ry: bckRnd});

        //mid channel
        let defs: SVGElement[] = [];
        let channelGid = "gradient-channel";
        let channelGrad = <SVGLinearGradientElement>svg.elt("linearGradient")
        svg.hydrate(channelGrad, { id: channelGid, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
        defs.push(channelGrad);
        let channelDark = "#AAA";
        let channelLight = "#CCC";
        let stop1 = svg.child(channelGrad, "stop", { offset: "0%", style: `stop-color: ${channelDark};` })
        let stop2 = svg.child(channelGrad, "stop", { offset: "20%", style: `stop-color: ${channelLight};` })
        let stop3 = svg.child(channelGrad, "stop", { offset: "80%", style: `stop-color: ${channelLight};` })
        let stop4 = svg.child(channelGrad, "stop", { offset: "100%", style: `stop-color: ${channelDark};` })

        const mkChannel = (cy: number, h: number, cls?: string) => {
            let channel = svg.child(bb, "rect", { class: `sim-bb-channel ${cls || ""}`, y: cy - h/2, width: width, height: h});
            channel.setAttribute("fill", `url(#${channelGid})`);
            return channel;
        }

        const midChannelH = PIN_DIST;
        const smlChannelH = PIN_DIST*0.05;
        mkChannel(barH + midH/2, midChannelH, 'sim-bb-mid-channel');
        mkChannel(barH, smlChannelH);
        mkChannel(barH+midH, smlChannelH);

        //grids
        const mkBBGrid = (l: number, t: number, rs: number, cs: number, getNm: (i: number, j: number)=>string) => {
            const size = PIN_DIST/2.5;
            const rounding = size/3;
            let props = { class: "sim-bb-pin", rx: rounding, ry: rounding }
            let pinFn: PinFn = (p, i, j, x, y) => {
                let name = getNm(i, j);
                nameToPin[name] = p;
                nameToLoc[name] = [x, y];
                let rowNm = name[0];
                let colNm = name[1] + (name[2] || "") + (name[3] || "");
                let title = `${rowNm}, ${colNm}`;
                svg.hydrate(p, {title: title});
                svg.addClass(p, `bb-loc-${rowNm}`)
                svg.addClass(p, `bb-loc-${colNm}`)
            }
            return mkGrid(l, t, rs, cs, size, props, pinFn);
        }

        const mkBar = (x: number, y: number, getNm: (i: number, j: number)=>string) => {
            return [
                    mkBBGrid(x + 0*PIN_DIST, y, 2, 5, (i, j) => getNm(i, j+0)),
                    mkBBGrid(x + 6*PIN_DIST, y, 2, 5, (i, j) => getNm(i, j+5)),
                    mkBBGrid(x + 12*PIN_DIST, y, 2, 5, (i, j) => getNm(i, j+10)),
                    mkBBGrid(x + 18*PIN_DIST, y, 2, 5, (i, j) => getNm(i, j+15)),
                    mkBBGrid(x + 24*PIN_DIST, y, 2, 5, (i, j) => getNm(i, j+20)),
            ]
        }

        let ae = ["e", "d", "c", "b", "a", ];
        let fj = ["j", "i", "h", "g", "f", ];
        let mp = ["-", "+"];
        const jStr = (j: number):string => {return (j+1)+""};

        let midGrid1 = mkBBGrid(midGridX,midGridY,5,30, (i, j) => fj[i]+jStr(j));
        bb.appendChild(midGrid1);
        let midGrid2 = mkBBGrid(midGridX,midGridY+7*PIN_DIST,5,30, (i, j) => ae[i]+jStr(j));
        bb.appendChild(midGrid2);
        let topGrid = mkBar(topBarGridX, topBarGridY, (i, j) => mp[i]+jStr(j+25));
        topGrid.forEach(e => bb.appendChild(e));
        let botGrid = mkBar(botBarGridX, botBarGridY, (i, j) => mp[i]+jStr(j));
        botGrid.forEach(e => bb.appendChild(e));

        //labels
        const drawTxt = (cx: number, cy: number, size: number, r: number, txt: string, cls: string): SVGElement => {
            let g = mkTxt(cx, cy, size, r, txt, cls);
            bb.appendChild(g);
            return g;
        }
        const drawLbl = (pinName: string, label: string, xOff: number, yOff: number, r: number, s: number): SVGElement => {
            let loc = nameToLoc[pinName];
            let t = drawTxt(loc[0] + xOff, loc[1] + yOff, s, r, label, "sim-bb-label");
            svg.addClass(t, `bb-loc-${label}`)
            return t;
        }

        for (let n = 1; n <= 30; n++)
            drawLbl("j"+n, ""+n, 0, -PIN_DIST, -90, PIN_LBL_SIZE);
        for (let n = 1; n <= 30; n++)
            drawLbl("a"+n, ""+n, 0, PIN_DIST, -90, PIN_LBL_SIZE);
        ae.forEach(a => drawLbl(a+"1", a, -PIN_DIST, 0, -90, PIN_LBL_SIZE))
        fj.forEach(a => drawLbl(a+"1", a, -PIN_DIST, 0, -90, PIN_LBL_SIZE))
        ae.forEach(a => drawLbl(a+"30", a, PIN_DIST, 0, -90, PIN_LBL_SIZE))
        fj.forEach(a => drawLbl(a+"30", a, PIN_DIST, 0, -90, PIN_LBL_SIZE))

        //+- labels
        const pLblSize = PIN_DIST * 1.7;
        const mLblSize = PIN_DIST * 2;
        const mpLblOff = PIN_DIST * 0.8;
        const mXOff = PIN_DIST*0.07;
        //TL
        drawTxt(0 + mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, `sim-bb-label sim-bb-blue bb-loc-top- `);
        drawTxt(0 + mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, `sim-bb-label sim-bb-red bb-loc-top+`);
        //TR
        drawTxt(width - mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, `sim-bb-label sim-bb-blue bb-loc-top-`);
        drawTxt(width - mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, `sim-bb-label sim-bb-red bb-loc-top+`);
        //BL
        drawTxt(0 + mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, `sim-bb-label sim-bb-blue bb-loc-bot-`);
        drawTxt(0 + mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, `sim-bb-label sim-bb-red bb-loc-bot+`);
        //BR
        drawTxt(width - mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, `sim-bb-label sim-bb-blue bb-loc-bot-`);
        drawTxt(width - mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, `sim-bb-label sim-bb-red bb-loc-bot+`);
    
        //blue & red lines
        const lnLen = barGridW + PIN_DIST*1.5;
        const lnThickness = PIN_DIST/5.0;
        const lnYOff = PIN_DIST*.6;
        const lnXOff = (lnLen - barGridW)/2;
        const mkLn = (x: number, y: number, cls: string) => {
            return svg.child(bb, "rect", { class: cls, x: x, y: y - lnThickness/2, width: lnLen, height: lnThickness});
        }
        mkLn(topBarGridX - lnXOff, topBarGridY - lnYOff, "sim-bb-blue bb-loc-top-");
        mkLn(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, "sim-bb-red bb-loc-top+");
        mkLn(botBarGridX - lnXOff, botBarGridY - lnYOff, "sim-bb-blue bb-loc-bot-");
        mkLn(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, "sim-bb-red bb-loc-bot+");

        return {e: bb, defs: defs, nameToLoc, nameToPin, l: 0, t: 0, w: width, h: height};
    }

    let bbId = 0;
    export class Breadboard {
        public bb: SVGGElement;
        private nameToPin: Map<SVGElement> = {};
        private nameToLoc: Map<[number, number]> = {};
        private styleEl: SVGStyleElement;
        private id: number;

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
        constructor() {
            this.id = bbId++;
        }

        public updateLocation(x: number, y: number) {
            translateEl(this.bb, [x, y]);
        }
        
        public buildDom(g: SVGElement, defs: SVGDefsElement, width: number, height: number, 
            addLoc: (nm: string, xy: [number, number])=>void) 
        {
            let res = mkBreadboardSvg(width, height);
            this.bb = res.e;
            g.appendChild(this.bb);
            res.defs.forEach(d => defs.appendChild(d));
            this.nameToLoc = res.nameToLoc;
            this.nameToPin = res.nameToPin;
            for (let nm in this.nameToLoc) {
                addLoc(nm, this.nameToLoc[nm]);
            }
            this.styleEl = <SVGStyleElement>svg.child(this.bb, "style");
            svg.addClass(this.bb, `sim-bb-id-${this.id}`)
        }

        public highlightLoc(locNm: string) {
            let rowStr = locNm[0]
            let colStr = locNm[1] + (locNm[2] || "") + (locNm[3] || "");
            let colNum = Number(colStr);

            if (rowStr == "-") {
                this.styleEl.textContent +=
                    `
                    .sim-bb-id-${this.id} .bb-loc-${colNum <= 25 ? "bot" : "top"}${rowStr}.sim-bb-blue {
                        fill: blue;
                    }
                    `
            } else if (colStr == "+") {
                this.styleEl.textContent +=
                    `
                    .sim-bb-id-${this.id} .bb-loc-${colNum <= 25 ? "bot" : "top"}${rowStr}.sim-bb-red {
                        fill: red;
                    }
                    `
            } else {
                this.styleEl.textContent +=
                    `
                    .sim-bb-id-${this.id} .bb-loc-${rowStr} .sim-bb-label,
                    .sim-bb-id-${this.id} .bb-loc-${colStr} .sim-bb-label {
                        fill: red;
                    }
                    `
            }
        }
    }
}