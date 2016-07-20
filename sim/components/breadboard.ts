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
            translateEl(this.bb, [x, y]);
        }
        
        public buildDom(g: SVGElement, defs: SVGDefsElement, width: number, height: number, 
            addLoc: (nm: string, xy: [number, number])=>void) 
        {
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
            const mkBBGrid = (l: number, t: number, rs: number, cs: number, getNm: (i: number, j: number)=>string) => {
                const size = PIN_DIST/2.5;
                const rounding = size/3;
                let props = { class: "sim-bb-pin", rx: rounding, ry: rounding }
                let pinFn: PinFn = (p, i, j, x, y) => {
                    let name = getNm(i, j);
                    this.nameToPin[name] = p;
                    this.nameToLoc[name] = [x, y];
                    addLoc(name, [x,y]);
                    let title = `${name[0]}, ${name[1] + (name[2] || "") + (name[3] || "")}`
                    svg.hydrate(p, {title: title});
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
            this.bb.appendChild(midGrid1);
            let midGrid2 = mkBBGrid(midGridX,midGridY+7*PIN_DIST,5,30, (i, j) => ae[i]+jStr(j));
            this.bb.appendChild(midGrid2);
            let topGrid = mkBar(topBarGridX, topBarGridY, (i, j) => mp[i]+jStr(j+25));
            topGrid.forEach(e => this.bb.appendChild(e));
            let botGrid = mkBar(botBarGridX, botBarGridY, (i, j) => mp[i]+jStr(j));
            botGrid.forEach(e => this.bb.appendChild(e));

            //labels
            const drawTxt = (cx: number, cy: number, size: number, r: number, txt: string, cls: string) => {
                let g = mkTxt(cx, cy, size, r, txt, cls);
                this.bb.appendChild(g);
            }
            const drawLbl = (pinName: string, label: string, xOff: number, yOff: number, r: number, s: number) => {
                let loc = this.nameToLoc[pinName];
                drawTxt(loc[0] + xOff, loc[1] + yOff, s, r, label, "sim-bb-label");
            }

            const lblSize = PIN_DIST * 0.7;
            for (let n = 1; n <= 30; n++)
            	drawLbl("j"+n, ""+n, 0, -PIN_DIST, -90, lblSize);
            for (let n = 1; n <= 30; n++)
                drawLbl("a"+n, ""+n, 0, PIN_DIST, -90, lblSize);
            ae.forEach(a => drawLbl(a+"1", a, -PIN_DIST, 0, -90, lblSize))
            fj.forEach(a => drawLbl(a+"1", a, -PIN_DIST, 0, -90, lblSize))
            ae.forEach(a => drawLbl(a+"30", a, PIN_DIST, 0, -90, lblSize))
            fj.forEach(a => drawLbl(a+"30", a, PIN_DIST, 0, -90, lblSize))

            //+- labels
            const pLblSize = PIN_DIST * 1.7;
            const mLblSize = PIN_DIST * 2;
            const mpLblOff = PIN_DIST * 0.8;
            const mXOff = PIN_DIST*0.07;
            //TL
            drawTxt(0 + mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            drawTxt(0 + mpLblOff, barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //TR
            drawTxt(width - mpLblOff + mXOff, 0 + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            drawTxt(width - mpLblOff, barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //BL
            drawTxt(0 + mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            drawTxt(0 + mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
            //BR
            drawTxt(width - mpLblOff + mXOff, barH + midH + mpLblOff, mLblSize, -90, "-", "sim-bb-label sim-bb-blue");
            drawTxt(width - mpLblOff, barH + midH + barH - mpLblOff, pLblSize, -90, "+", "sim-bb-label sim-bb-red");
        
            //blue & red lines
            const lnLen = barGridW + PIN_DIST*1.5;
            const lnThickness = PIN_DIST/5.0;
            const lnYOff = PIN_DIST*.6;
            const lnXOff = (lnLen - barGridW)/2;
            const mkLn = (x: number, y: number, cls: string) => {
                return svg.child(this.bb, "rect", { class: cls, x: x, y: y - lnThickness/2, width: lnLen, height: lnThickness});
            }
            mkLn(topBarGridX - lnXOff, topBarGridY - lnYOff, "sim-bb-blue");
            mkLn(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, "sim-bb-red");
            mkLn(botBarGridX - lnXOff, botBarGridY - lnYOff, "sim-bb-blue");
            mkLn(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, "sim-bb-red");
        }
    }
}