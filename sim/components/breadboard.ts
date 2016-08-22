namespace pxsim.visuals {
    const BREADBOARD_CSS = (pinDist: number) => `
        /* bread board */
        .sim-bb-background {
            fill:#E0E0E0;
        }
        .sim-bb-channel {
        }
        .sim-bb-pin {
            fill:#999;
        }
        .sim-bb-pin-hover {
            visibility: hidden;
            pointer-events: all;
            stroke-width: ${pinDist / 2}px;
            stroke: transparent;
            fill: #777;
        }
        .sim-bb-pin-hover:hover {
            visibility: visible;
            fill:#444;
        }
        .sim-bb-group-wire {
            stroke: #999;
            stroke-width: ${pinDist / 3.5}px;
            visibility: hidden;
        }
        .sim-bb-pin-group {
            pointer-events: all;
        }
        .sim-bb-label,
        .sim-bb-label-hover {
            font-family:"Lucida Console", Monaco, monospace;
            fill:#555;
            pointer-events: all;
            stroke-width: 0;
        }
        .sim-bb-label-hover {
            visibility: hidden;
            fill:#000;
            font-weight: bold;
        }
        .sim-bb-pin-group:hover .sim-bb-label:not(.highlight) {
            visibility: hidden;
        }
        .sim-bb-bar {
            stroke-width: 0;
        }
        .sim-bb-blue {
            fill:#1AA5D7;
            stroke:#1AA5D7
        }
        .sim-bb-red {
            fill:#DD4BA0;
            stroke:#DD4BA0;
        }
        .sim-bb-pin-group:hover .sim-bb-pin-hover,
        .sim-bb-pin-group:hover .sim-bb-group-wire,
        .sim-bb-pin-group:hover .sim-bb-label-hover {
            visibility: visible;
        }
        /*Outline mode*/
        .sim-bb-outline .sim-bb-background {
            stroke-width: ${pinDist / 7}px;
            fill: #FFF;
            stroke: #000;
        }
        .sim-bb-outline .sim-bb-mid-channel {
            fill: #FFF;
            stroke: #888;
            stroke-width: 1px;
        }
        /*Grayed out*/
        .grayed .sim-bb-red,
        .grayed .sim-bb-blue {
            fill: #BBB;
        }
        .grayed .sim-bb-pin {
            fill: #BBB;
        }
        .grayed .sim-bb-label {
            fill: #BBB;
        }
        .grayed .sim-bb-background {
            stroke: #BBB;
        }
        .grayed .sim-bb-group-wire {
            stroke: #DDD;
        }
        /*Highlighted*/
        .sim-bb-label.highlight {
            visibility: hidden;
        }
        .sim-bb-label-hover.highlight {
            visibility: visible;
        }
        .sim-bb-blue.highlight {
            fill:#1AA5D7;
        }
        .sim-bb-red.highlight {
            fill:#DD4BA0;
        }
        `
    const PIN_HOVER_SCALAR = 1.3;
    const LABEL_HOVER_SCALAR = 1.3;
    const BB_MID_RATIO = 0.66666666;
    const PINS_PER_BAR_ROW = 5 * 5;

    export declare type PinFn = (p: SVGRectElement, i: number, j: number, x: number, y: number, overPin: SVGRectElement, grid: SVGGElement)=>void;

    export function mkGrid(l: number, t: number, rs: number, cs: number, size: number, hoverSize: number, props: any, pinFn: PinFn): SVGGElement {
        const x = l - size/2;
        const y = t - size/2;

        let grid = <SVGGElement>svg.elt("g");
        for (let i = 0; i < rs; i++) {
            for (let j = 0; j < cs; j++) {
                let mkPin = (x: number, y: number, size: number) => {
                    let pin = <SVGRectElement>svg.elt("rect")
                    svg.hydrate(pin, props)
                    svg.hydrate(pin, { x: x, y: y, width: size, height: size })
                    return pin;
                }
                let pinX = x+j*PIN_DIST;
                let pinY = y+i*PIN_DIST;
                let pin = mkPin(pinX, pinY, size);
                let sizeDiff = hoverSize - size;
                let overX = pinX - sizeDiff/2;
                let overY = pinY - sizeDiff/2;
                let overPin = mkPin(overX, overY, hoverSize);
                grid.appendChild(pin);
                grid.appendChild(overPin);
                pinFn(pin, i, j, pinX+size/2, pinY+size/2, overPin, grid);
            }
        }
        return grid;
    }

    export interface BreadboardOptions {
        pinDistance: number
    };

    export type BBPin = {
        el: SVGRectElement,
        hoverEl: SVGRectElement,
        cx: number,
        cy: number,
        row: string,
        col: number,
        group?: string
    };
    export type BBLbl = {
        el: SVGTextElement, 
        hoverEl: SVGTextElement
        cx: number, 
        cy: number, 
        size: number, 
        rotation: number, 
        txt: string, 
        group?: string,
    };
    type BBBar = {
        e: SVGRectElement, 
        group?: string
    };

    export const MK_PIN_NM = (rowNm: string, colNm: number) => `${rowNm}${colNm}`;
    export const BRK_PIN_NM = (pinNm: string) => {return {rowNm: pinNm[0], colNm: Number(pinNm[1] + (pinNm[2] || "") + (pinNm[3] || ""))}};

    let bbId = 0;
    export class Breadboard {
        public bb: SVGGElement;
        private styleEl: SVGStyleElement;
        private id: number;
        private opts: BreadboardOptions;
        private width: number;
        private height: number;
        public defs: SVGElement[] = [];
        public style: string;

        //truth
        public allPins: BBPin[] = [];
        private allLbls: BBLbl[] = [];

        //quick lookup map
        private pinNmToPin: Map<BBPin> = {};
        private pinNmToLbls: Map<BBLbl[]> = {};
        private lblNmToLbls: Map<BBLbl[]> = {};
        private barNmToBar: Map<BBBar> = {};
        public rowColToCoord: Map<Coord[]> = {};

        private recordCoord(row: string, col: number, xy: Coord) {
            let column = this.rowColToCoord[row] || (this.rowColToCoord[row] = []);
            column[col] = xy;
        }

        constructor(opts: BreadboardOptions) {
            this.id = bbId++;
            this.opts = opts;
            this.width = this.opts.pinDistance * 33;
            this.height = this.opts.pinDistance * 21.5;
            this.style = BREADBOARD_CSS(this.opts.pinDistance);
            this.buildDom();
        }

        public updateLocation(x: number, y: number) {
            translateEl(this.bb, [x, y]);
        }

        private drawLbl = (cx: number, cy: number, size: number, rot: number, txt: string, group: string, cls?: string[]): SVGTextElement => {
            //lbl
            let el = mkTxt(cx, cy, size, rot, txt);
            svg.addClass(el, "sim-bb-label");
            if (cls)
                cls.forEach(c => svg.addClass(el, c));
            this.bb.appendChild(el);

            //hover lbl
            let hoverEl = mkTxt(cx, cy, size*LABEL_HOVER_SCALAR, rot, txt);
            svg.addClass(hoverEl, "sim-bb-label-hover");
            if (cls)
                cls.forEach(c => svg.addClass(hoverEl, c));
            this.bb.appendChild(hoverEl);

            //record
            this.allLbls.push({el: el, cx: cx, cy: cy, size: size, rotation: rot, txt: txt, group: group, hoverEl: hoverEl});
            return el;
        }
        
        private buildDom() 
        {
            const [width, height] = [this.width, this.height];
            const midH = height * BB_MID_RATIO;
            const barRatio = (1.0 - BB_MID_RATIO) / 2.0;
            const barH = height * barRatio;

            const midCols = BREADBOARD_COLUMN_COUNT;
            const midGridW = (midCols-1) * PIN_DIST;
            const midRows = BREADBOARD_ROW_COUNT;
            const midGridH = (midRows-1) * PIN_DIST;
            const midGridX = (width - midGridW)/2;
            const midGridY = barH + (midH - midGridH)/2;

            const barRows = 2;
            const barGridH = (barRows-1) * PIN_DIST;
            const barCols = PINS_PER_BAR_ROW + 4/*spacers*/;
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
            let getGrpNm = (rowNm: string, colNm: number) => {
                if (mp.indexOf(rowNm) >= 0) {
                    return `${rowNm}${colNm <= PINS_PER_BAR_ROW ? "b" : "t"}`
                } else if (ae.indexOf(rowNm) >= 0) {
                    return `b${colNm}`
                } else {
                    return `t${colNm}`
                }
            }
            const mkPinGrid = (l: number, t: number, rs: number, cs: number, rowNm: (i: number) => string, colNm: (i: number) => number) => {
                const size = PIN_DIST/2.5;
                const rounding = size/3;
                let props = { class: "sim-bb-pin", rx: rounding, ry: rounding }
                let pinFn: PinFn = (p, i, j, x, y, overP) => {
                    let rNm = rowNm(i);
                    let cNm = colNm(j);
                    let gNm = getGrpNm(rNm, cNm);
                    this.allPins.push({el: p, cx: x, cy: y, row: rNm, col: cNm, hoverEl: overP, group: gNm});
                    svg.addClass(overP, "sim-bb-pin-hover");
                    bb.appendChild(p);
                    bb.appendChild(overP);
                }
                return mkGrid(l, t, rs, cs, size, size * PIN_HOVER_SCALAR, props, pinFn);
            }

            const mkBar = (x: number, y: number, rowNm: (i: number) => string, colNm: (i: number) => number) => {
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
            const jStr = (j: number):number => j+1;

            mkPinGrid(midGridX,midGridY,5,30, i => fj[i], jStr);
            mkPinGrid(midGridX,midGridY+7*PIN_DIST,5,30, i => ae[i], jStr);
            mkBar(topBarGridX, topBarGridY, i => mp[i], j => jStr(j+25));
            mkBar(botBarGridX, botBarGridY, i => mp[i], jStr);

            //tooltip
            this.allPins.forEach(pin => {
                let {el, row, col, hoverEl} = pin
                let title = `(${row}, ${col})`;
                svg.hydrate(el, {title: title});
                svg.hydrate(hoverEl, {title: title});
            })

            //catalog pins
            this.allPins.forEach(pin => {
                let {el, cx, cy, row, col} = pin
                let pinNm = MK_PIN_NM(row, col);
                this.pinNmToPin[pinNm] = pin;
                this.recordCoord(row, Number(col), [cx, cy]);
            })

            //labels
            const drawLblAtPin = (pinName: string, label: string, xOff: number, yOff: number, r: number, s: number, group?: string): SVGTextElement => {
                let pin = this.pinNmToPin[pinName];
                let loc = [pin.cx, pin.cy];
                let t = this.drawLbl(loc[0] + xOff, loc[1] + yOff, s, r, label, group);
                return t;
            }

            //columns
            for (let n = 1; n <= 30; n++)
                drawLblAtPin("j"+n, `${n}`, 0, -PIN_DIST, -90, PIN_LBL_SIZE, `t${n}`);
            for (let n = 1; n <= 30; n++)
                drawLblAtPin("a"+n, `${n}`, 0, PIN_DIST, -90, PIN_LBL_SIZE, `b${n}`);
            //rows
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
            this.drawLbl(0 + mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, "-t", [`sim-bb-blue`]);
            this.drawLbl(0 + mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, "+t", [`sim-bb-red`]);
            //TR
            this.drawLbl(width - mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, `-`, "-t", [`sim-bb-blue`]);
            this.drawLbl(width - mpLblOff, barH - mpLblOff, pLblSize, -90, `+`, "+t", [`sim-bb-red`]);
            //BL
            this.drawLbl(0 + mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, "-b", [`sim-bb-blue`]);
            this.drawLbl(0 + mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, "+b", [`sim-bb-red`]);
            //BR
            this.drawLbl(width - mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, `-`, "-b", [`sim-bb-blue`]);
            this.drawLbl(width - mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, `+`, "+b", [`sim-bb-red`]);
        
            //catalog lbls
            this.allLbls.forEach(lbl => {
                let {el, txt} = lbl;
                (this.lblNmToLbls[txt] = this.lblNmToLbls[txt] || []).push(lbl);
            });
            this.allPins.forEach(pin => {
                let {row, col} = pin;
                let pinNm = MK_PIN_NM(row, col);
                let rowLbls = this.lblNmToLbls[row];
                let colLbls: BBLbl[] = [];
                if (row != "-" && row != "+")
                    colLbls = this.lblNmToLbls[col];
                this.pinNmToLbls[pinNm] = (this.pinNmToLbls[pinNm] || []).concat(rowLbls, colLbls);
            })

            //blue & red lines
            const lnLen = barGridW + PIN_DIST*1.5;
            const lnThickness = PIN_DIST/5.0;
            const lnYOff = PIN_DIST*.6;
            const lnXOff = (lnLen - barGridW)/2;
            let barGrpNms: string[] = [];
            const drawLn = (x: number, y: number, nm: string, cls: string) => {
                let ln = <SVGRectElement>svg.child(bb, "rect", { class: cls, x: x, y: y - lnThickness/2, width: lnLen, height: lnThickness});
                this.barNmToBar[nm] = {e: ln, group: nm};
                barGrpNms.push(nm);
            }
            drawLn(topBarGridX - lnXOff, topBarGridY - lnYOff, "-t", "sim-bb-blue sim-bb-bar");
            drawLn(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, "+t", "sim-bb-red sim-bb-bar");
            drawLn(botBarGridX - lnXOff, botBarGridY - lnYOff, "-b", "sim-bb-blue sim-bb-bar");
            drawLn(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, "+b", "sim-bb-red sim-bb-bar");

            //electrically connected groups
            let allGrpNms = this.allPins.map(p => p.group).filter((g, i, a) => a.indexOf(g) == i);
            let grpNmToPins: Map<BBPin[]> = {};
            this.allPins.forEach((p, i) => {
                let g = p.group;
                (grpNmToPins[g] = grpNmToPins[g] || []).push(p);
            });
            let groups: SVGGElement[] = allGrpNms.map(grpNm => {
                let g = <SVGGElement>svg.elt("g");
                return g;
            });
            groups.forEach(g => svg.addClass(g, "sim-bb-pin-group"));
            groups.forEach((g, i) => svg.addClass(g, `group-${allGrpNms[i]}`));
            groups.forEach(g => bb.appendChild(g)); //attach to breadboard
            let grpNmToGroup: Map<SVGGElement> = {};
            allGrpNms.forEach((g, i) => grpNmToGroup[g] = groups[i]);
            //connecting wire
            allGrpNms.forEach(grpNm => {
                let pins = grpNmToPins[grpNm];
                let [xs, ys] = [pins.map(p => p.cx), pins.map(p => p.cy)];
                let minFn = (arr: number[]) => arr.reduce((a, b) => a < b ? a : b);
                let maxFn = (arr: number[]) => arr.reduce((a, b) => a > b ? a : b);
                let [minX, maxX, minY, maxY] = [minFn(xs), maxFn(xs), minFn(ys), maxFn(ys)];
                let wire = svg.elt("rect");
                let width = Math.max(maxX - minX, 0.0001/*rects with no width aren't displayed*/);
                let height =  Math.max(maxY - minY, 0.0001);
                svg.hydrate(wire, {x: minX, y: minY, width: width, height: height});
                svg.addClass(wire, "sim-bb-group-wire")
                let g = grpNmToGroup[grpNm];
                g.appendChild(wire);
            });
            //group pins
            this.allPins.forEach(p => {
                let g = grpNmToGroup[p.group];
                g.appendChild(p.el);
                g.appendChild(p.hoverEl);
            })
            //group lbls
            let otherLblGroup = svg.child(bb, "g", {class: "group-misc"})
            this.allLbls.forEach(l => {
                if (ae.indexOf(l.txt) < 0 && fj.indexOf(l.txt) < 0 && l.group){//don't include a-j lbls
                    let g = grpNmToGroup[l.group];
                    g.appendChild(l.el);
                    g.appendChild(l.hoverEl);
                } else {
                    otherLblGroup.appendChild(l.el);
                    otherLblGroup.appendChild(l.hoverEl);
                }
            })
            //group bars
            barGrpNms.forEach(grpNm => {
                let bar = this.barNmToBar[grpNm];
                let grp = grpNmToGroup[grpNm];
                grp.appendChild(bar.e);
            })

            //add id
            this.styleEl = <SVGStyleElement>svg.child(this.bb, "style");
            svg.addClass(this.bb, `sim-bb-id-${this.id}`)
        }

        public getSVGAndSize(): SVGAndSize<SVGElement> {
            return {e: this.bb, t: 0, l: 0, w: this.width, h: this.height};
        }

        private getClosestPointIdx(xy: Coord, points: Coord[]) {
            let dists = points.map(p => findDistSqrd(xy, p));
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
            let {row, col, cx, cy} = this.pinNmToPin[pinNm];
            let lbls = this.pinNmToLbls[pinNm];
            const highlightLbl = (lbl: BBLbl) => {
                svg.addClass(lbl.el, "highlight");
                svg.addClass(lbl.hoverEl, "highlight");
            };
            if (row == "-" || row == "+") {
                //+/- sign
                let lblCoords = lbls.map((l):Coord => [l.cx, l.cy]);
                let lblIdx = this.getClosestPointIdx([cx, cy], lblCoords);
                let lbl = lbls[lblIdx];
                lbls = [lbl]
                highlightLbl(lbl);

                //bar
                let colNumber = Number(col);
                let barNm = row + (colNumber <= PINS_PER_BAR_ROW ? "b" : "t")
                let bar = this.barNmToBar[barNm];
                svg.addClass(bar.e, "highlight");
            } else {
                if (lbls) {
                    lbls.forEach(highlightLbl);
                }
            }
            return lbls;
        }
    }
}