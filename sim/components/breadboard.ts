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

    export type BBPin = {p: SVGRectElement, i: number, j: number, x: number, y: number, rowNm: string, colNm: string, pinNm: string};
    export type BBLbl = {l: SVGGElement, cx: number, cy: number, size: number, rot: number, nm: string, nearestPin: BBPin};
    type NegPosBar = {e: SVGRectElement, nm: string};

    const MK_PIN_NM = (rowNm: string, colNm: string) => rowNm + colNm;
    const BRK_PIN_NM = (pinNm: string) => {return {rowNm: pinNm[0], colNm: name[1] + (name[2] || "") + (name[3] || "")}};

    let bbId = 0;
    export class Breadboard {
        public bb: SVGGElement;
        private styleEl: SVGStyleElement;
        private id: number;
        private width: number;
        private height: number;
        
        private allPins: BBPin[] = [];
        private pinNmToPin: Map<BBPin> = {};
        private pinNmToLoc: Map<Coord> = {};
        private allLbls: BBLbl[] = [];
        private lblNmToLbls: Map<BBLbl[]> = {};
        private pinNmToLbls: Map<BBLbl[]> = {};
        private barNmToBar: Map<NegPosBar> = {};

        public defs: SVGElement[] = [];

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
            }
            /*Outline mode*/
            .sim-bb-outline .sim-bb-background {
                stroke-width: 1px;
                fill: #FFF;
                stroke: #000;
            }
            .sim-bb-outline .sim-bb-mid-channel {
                fill: #FFF;
                stroke: #888;
                stroke-width: 1px;
            }
            /*Greyed out*/
            .greyed .sim-bb-red,
            .greyed .sim-bb-blue {
                fill: #BBB;
            }
            .greyed .sim-bb-pin {
                fill: #BBB;
            }
            .greyed .sim-bb-label {
                fill: #BBB;
            }
            /*Highlighted*/
            .sim-bb-label.highlight {
                fill: red;
                font-weight: bold;
            }
            .sim-bb-blue.highlight {
                fill:#1AA5D7;
            }
            .sim-bb-red.highlight {
                fill:#DD4BA0;
            }
            `
        constructor(width: number, height: number, addLoc?: (nm: string, xy: [number, number])=>void) {
            this.id = bbId++;
            this.width = width;
            this.height = height;
            this.buildDom(addLoc);
        }

        public updateLocation(x: number, y: number) {
            translateEl(this.bb, [x, y]);
        }
        
        private buildDom(addLoc?: (nm: string, xy: [number, number])=>void) 
        {
            const [width, height] = [this.width, this.height];
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

            //wrapper
            let bb = <SVGGElement>svg.elt("g")
            this.bb = bb;
            svg.addClass(bb, "sim-bb");

            //background
            const bckRnd = PIN_DIST*0.3;
            svg.child(bb, "rect", { class: "sim-bb-background", width: width, height: height, rx: bckRnd, ry: bckRnd});

            //mid channel
            let channelGid = "gradient-channel";
            let channelGrad = <SVGLinearGradientElement>svg.elt("linearGradient")
            svg.hydrate(channelGrad, { id: channelGid, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
            this.defs.push(channelGrad);
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

            //pins
            const mkPinGrid = (l: number, t: number, rs: number, cs: number, rowNm: (i: number) => string, colNm: (i: number) => string) => {
                const size = PIN_DIST/2.5;
                const rounding = size/3;
                let props = { class: "sim-bb-pin", rx: rounding, ry: rounding }
                let pinFn: PinFn = (p, i, j, x, y) => {
                    let rNm = rowNm(i);
                    let cNm = colNm(j);
                    let pNm = MK_PIN_NM(rNm, cNm);
                    this.allPins.push({p: p, i: i, j: j, x: x, y: y, rowNm: rNm, colNm: cNm, pinNm: pNm});
                }
                return mkGrid(l, t, rs, cs, size, props, pinFn);
            }

            const mkBar = (x: number, y: number, rowNm: (i: number) => string, colNm: (i: number) => string) => {
                return [
                        mkPinGrid(x + 0*PIN_DIST, y, 2, 5, rowNm, j => colNm(j+0)),
                        mkPinGrid(x + 6*PIN_DIST, y, 2, 5, rowNm, j => colNm(j+5)),
                        mkPinGrid(x + 12*PIN_DIST, y, 2, 5, rowNm, j => colNm(j+10)),
                        mkPinGrid(x + 18*PIN_DIST, y, 2, 5, rowNm, j => colNm(j+15)),
                        mkPinGrid(x + 24*PIN_DIST, y, 2, 5, rowNm, j => colNm(j+20)),
                ]
            }

            let ae = ["e", "d", "c", "b", "a", ];
            let fj = ["j", "i", "h", "g", "f", ];
            let mp = ["-", "+"];
            const jStr = (j: number):string => {return (j+1)+""};

            let midGrid1 = mkPinGrid(midGridX,midGridY,5,30, i => fj[i], jStr);
            bb.appendChild(midGrid1);
            let midGrid2 = mkPinGrid(midGridX,midGridY+7*PIN_DIST,5,30, i => ae[i], jStr);
            bb.appendChild(midGrid2);
            let topGrid = mkBar(topBarGridX, topBarGridY, i => mp[i], j => jStr(j+25));
            topGrid.forEach(e => bb.appendChild(e));
            let botGrid = mkBar(botBarGridX, botBarGridY, i => mp[i], jStr);
            botGrid.forEach(e => bb.appendChild(e));

            //tooltip
            this.allPins.forEach(pin => {
                let {p, rowNm, colNm} = pin
                let title = `(${rowNm}, ${colNm})`;
                svg.hydrate(p, {title: title});
            })

            //catalog pins
            this.allPins.forEach(pin => {
                let {p, x, y, rowNm, colNm, pinNm} = pin
                this.pinNmToPin[pinNm] = pin;
                this.pinNmToLoc[pinNm] = [x, y];
            })
            
            //labels
            const drawLbl = (cx: number, cy: number, size: number, rot: number, txt: string, nearestPin: BBPin | string, cls?: string[]): SVGTextElement => {
                let el = mkTxt(cx, cy, size, rot, txt);
                svg.addClass(el, "sim-bb-label");
                if (cls)
                    cls.forEach(c => svg.addClass(el, c));
                bb.appendChild(el);
                let nP: BBPin;
                if (typeof nearestPin === "string") {
                    nP = this.pinNmToPin[nearestPin];
                } else {
                    nP = nearestPin;
                }
                this.allLbls.push({l: el, cx: cx, cy: cy, size: size, rot: rot, nm: txt, nearestPin: nP});
                return el;
            }
            const drawLblAtPin = (pinName: string, label: string, xOff: number, yOff: number, r: number, s: number): SVGTextElement => {
                let pin = this.pinNmToPin[pinName];
                let loc = [pin.x, pin.y];
                let t = drawLbl(loc[0] + xOff, loc[1] + yOff, s, r, label, pin);
                return t;
            }

            for (let n = 1; n <= 30; n++)
                drawLblAtPin("j"+n, ""+n, 0, -PIN_DIST, -90, PIN_LBL_SIZE);
            for (let n = 1; n <= 30; n++)
                drawLblAtPin("a"+n, ""+n, 0, PIN_DIST, -90, PIN_LBL_SIZE);
            ae.forEach(a => drawLblAtPin(a+"1", a, -PIN_DIST, 0, -90, PIN_LBL_SIZE))
            fj.forEach(a => drawLblAtPin(a+"1", a, -PIN_DIST, 0, -90, PIN_LBL_SIZE))
            ae.forEach(a => drawLblAtPin(a+"30", a, PIN_DIST, 0, -90, PIN_LBL_SIZE))
            fj.forEach(a => drawLblAtPin(a+"30", a, PIN_DIST, 0, -90, PIN_LBL_SIZE))

            //+- labels
            const pLblSize = PIN_DIST * 1.7;
            const mLblSize = PIN_DIST * 2;
            const mpLblOff = PIN_DIST * 0.8;
            const mXOff = PIN_DIST*0.07;
            //TL
            drawLbl(0 + mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, "-26", [`sim-bb-label`, `sim-bb-blue`]);
            drawLbl(0 + mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, "+26", [`sim-bb-label`, `sim-bb-red`]);
            //TR
            drawLbl(width - mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, "-60", [`sim-bb-label`, `sim-bb-blue`]);
            drawLbl(width - mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, "+60", [`sim-bb-label`, `sim-bb-red`]);
            //BL
            drawLbl(0 + mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, "-1", [`sim-bb-label`, `sim-bb-blue`]);
            drawLbl(0 + mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, "+1", [`sim-bb-label`, `sim-bb-red`]);
            //BR
            drawLbl(width - mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, "-25", [`sim-bb-label`, `sim-bb-blue`]);
            drawLbl(width - mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, "+25", [`sim-bb-label`, `sim-bb-red`]);
        
            //catalog lbls
            this.allLbls.forEach(lbl => {
                let {l, nm} = lbl;
                (this.lblNmToLbls[nm] = this.lblNmToLbls[nm] || []).push(lbl);
            });
            this.allPins.forEach(pin => {
                let {rowNm, colNm, pinNm} = pin;
                let rowLbls = this.lblNmToLbls[rowNm];
                let colLbls: BBLbl[] = [];
                if (rowNm != "-" && rowNm != "+")
                    colLbls = this.lblNmToLbls[colNm];
                this.pinNmToLbls[pinNm] = (this.pinNmToLbls[pinNm] || []).concat(rowLbls, colLbls);
            })

            //blue & red lines
            const lnLen = barGridW + PIN_DIST*1.5;
            const lnThickness = PIN_DIST/5.0;
            const lnYOff = PIN_DIST*.6;
            const lnXOff = (lnLen - barGridW)/2;
            const drawLn = (x: number, y: number, nm: string, cls: string) => {
                let ln = <SVGRectElement>svg.child(bb, "rect", { class: cls, x: x, y: y - lnThickness/2, width: lnLen, height: lnThickness});
                this.barNmToBar[nm] = {e: ln, nm: nm};
            }
            drawLn(topBarGridX - lnXOff, topBarGridY - lnYOff, "-t", "sim-bb-blue");
            drawLn(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, "+t", "sim-bb-red");
            drawLn(botBarGridX - lnXOff, botBarGridY - lnYOff, "-b", "sim-bb-blue");
            drawLn(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, "+b", "sim-bb-red");

            //add id
            this.styleEl = <SVGStyleElement>svg.child(this.bb, "style");
            svg.addClass(this.bb, `sim-bb-id-${this.id}`)

            //report locations
            if (addLoc) {
                for (let nm in this.pinNmToLoc) {
                    addLoc(nm, this.pinNmToLoc[nm]);
                }
            }
        }

        public getSVGAndSize(): SVGAndSize<SVGElement> {
            return {e: this.bb, t: 0, l: 0, w: this.width, h: this.height};
        }


        private distSqrd(a: Coord, b: Coord): number {
            let x = a[0] - b[0];
            let y = a[1] - b[1];
            return x*x + y*y;
        }
        private getClosestPointIdx(xy: Coord, points: Coord[]) {
            let dists = points.map(p => this.distSqrd(xy, p));
            let minIdx = 0;
            let minDist = dists[0];
            dists.forEach((d, i) => {
                if (d < minDist) {
                    minDist = d;
                    minIdx = i;
                }
            });
            return minIdx;
        }  
        public highlightLoc(pinNm: string): BBLbl[] {
            let {rowNm, colNm, x, y} = this.pinNmToPin[pinNm];
            let lbls = this.pinNmToLbls[pinNm];
            if (rowNm == "-" || rowNm == "+") {
                //+/- sign
                let lblCoords = lbls.map((l):Coord => [l.cx, l.cy]);
                let lblIdx = this.getClosestPointIdx([x, y], lblCoords);
                let lbl = lbls[lblIdx];
                lbls = [lbl]
                svg.addClass(lbl.l, "highlight");

                //bar
                let colNumber = Number(colNm);
                let barNm = rowNm + (colNumber <= 25 ? "b" : "t")
                let bar = this.barNmToBar[barNm];
                svg.addClass(bar.e, "highlight");
            } else {
                if (lbls) {
                    lbls.forEach(l => svg.addClass(l.l, "highlight"));
                }
            }
            return lbls;
        }
    }
}