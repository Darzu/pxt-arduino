namespace pxsim.visuals {
    const BB_BLUE = "#1AA5D7";
    const BB_RED = "#DD4BA0";
    const BREADBOARD_CSS = (pinDist: number) => `
        /* bread board */
        .sim-bb-background {
            fill:#E0E0E0;
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
            stroke-width: ${pinDist / 4}px;
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
        .sim-bb-bar {
            stroke-width: 0;
        }
        .sim-bb-blue {
            fill:${BB_BLUE};
            stroke:${BB_BLUE}
        }
        .sim-bb-red {
            fill:${BB_RED};
            stroke:${BB_RED};
        }
        .sim-bb-pin-group:hover .sim-bb-pin-hover,
        .sim-bb-pin-group:hover .sim-bb-group-wire,
        .sim-bb-pin-group:hover .sim-bb-label-hover {
            visibility: visible;
        }
        /* outline mode */
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
        /* grayed out */
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
        /* highlighted */
        .sim-bb-label.highlight {
            visibility: hidden;
        }
        .sim-bb-label-hover.highlight {
            visibility: visible;
        }
        .sim-bb-blue.highlight {
            fill:${BB_BLUE};
        }
        .sim-bb-red.highlight {
            fill:${BB_RED};
        }
        `
    const PIN_HOVER_SCALAR = 1.3;
    const LABEL_HOVER_SCALAR = 1.3;
    const BB_MID_RATIO = 0.66666666;
    const PINS_PER_BAR_ROW = 5 * 5;
    const PIN_WIDTH = PIN_DIST / 2.5;
    const PIN_ROUNDING = PIN_DIST / 7.5;
    const BB_BACKGROUND_ROUNDING = PIN_DIST * 0.3;
    const BB_CHANNEL_HEIGHT = PIN_DIST;
    const BB_SML_CHANNEL_HEIGHT = PIN_DIST * 0.05;
    const BB_MID_COLS = 30;
    const BB_MID_ROWS = 10;
    const BB_BAR_COLS = 25;
    const BB_BAR_ROWS = 2;
    const BB_POWER_COLS = BB_BAR_COLS * 2;
    const BB_MID_ROW_GAPS = [4, 4];
    const BB_BOT_BAR_COL_GAPS = [4, 9, 14, 19];
    const BB_TOP_BAR_COL_GAPS = BB_BOT_BAR_COL_GAPS.map(g => g + BB_BAR_COLS);
    const BB_LBL_ROT = -90;
    const BB_PLUS_LBL_SIZE = PIN_DIST * 1.7;
    const BB_MINUS_LBL_SIZE = PIN_DIST * 2;
    const BB_POWER_LBL_OFFSET = PIN_DIST * 0.8;
    const BB_MINUS_LBL_OFFSET = PIN_DIST * 0.07;
    const BB_COMPUTE_WIDTH = (pinDist: number) =>
        pinDist * (BB_MID_COLS + 3);
    const BB_COMPUTE_HEIGHT = (pinDist: number) =>
        pinDist * (BB_MID_ROWS + BB_MID_ROW_GAPS.length + BB_BAR_ROWS * 2 + 5.5);

    export interface GridPin {
        el: SVGElement,
        hoverEl: SVGElement,
        cx: number,
        cy: number,
        row: string,
        col: string,
        group?: string
    };
    export interface GridOptions {
        xOffset?: number,
        yOffset?: number,
        rowCount: number,
        colCount: number,
        rowStartIdx?: number,
        colStartIdx?: number,
        pinDist: number,
        mkPin: () => SVGElAndSize,
        mkHoverPin: () => SVGElAndSize,
        getRowName: (rowIdx: number) => string,
        getColName: (colIdx: number) => string,
        getGroupName?: (rowIdx: number, colIdx: number) => string,
        gapAfterRowIndices?: number[],
        gapAfterColIndices?: number[],
    };
    export interface GridResult {
        g: SVGGElement,
        allPins: GridPin[],
    }
    export function mkGrid(opts: GridOptions): GridResult {
        let xOff = opts.xOffset || 0;
        let yOff = opts.yOffset || 0;
        let allPins: GridPin[] = [];
        let grid = <SVGGElement>svg.elt("g");
        let rowGaps = 0;
        let colGaps = 0;
        let colIdxOffset = opts.colStartIdx || 0;
        let rowIdxOffset = opts.rowStartIdx || 0;
        for (let rowIdx = 0; rowIdx < opts.rowCount; rowIdx++) {
            let cy = yOff + rowIdx * opts.pinDist + rowGaps * opts.pinDist;
            let userRowIdx = rowIdx + rowIdxOffset;
            for (let colIdx = 0; colIdx < opts.colCount; colIdx++) {
                let cx = xOff + colIdx * opts.pinDist + colGaps * opts.pinDist;
                let userColIdx = colIdx + colIdxOffset;
                const addEl = (pin: SVGElAndSize) => {
                    let pinX = cx - pin.w * 0.5;
                    let pinY = cy - pin.h * 0.5;
                    svg.hydrate(pin.e, {x: pinX, y: pinY});
                    grid.appendChild(pin.e);
                    return pin.e;
                }
                let el = addEl(opts.mkPin());
                let hoverEl = addEl(opts.mkHoverPin());
                let row = opts.getRowName(userRowIdx);
                let col = opts.getColName(userColIdx);
                let group = opts.getGroupName ? opts.getGroupName(userRowIdx, userColIdx) : null;
                let gridPin: GridPin = {el: el, hoverEl: hoverEl, cx: cx, cy: cy, row: row, col: col, group: group};
                allPins.push(gridPin);
                //column gaps
                let colGapIdx = opts.gapAfterColIndices ? opts.gapAfterColIndices.indexOf(userColIdx) :  - 1;
                if (0 <= colGapIdx) {
                    opts.gapAfterColIndices = opts.gapAfterColIndices.splice(colGapIdx, 1);
                    colGaps += 1;
                }
            }
            //row gaps
            let rowGapIdx = opts.gapAfterRowIndices ? opts.gapAfterRowIndices.indexOf(userRowIdx) :  - 1;
            if (0 <= rowGapIdx) {
                opts.gapAfterRowIndices = opts.gapAfterRowIndices.splice(rowGapIdx, 1);
                rowGaps += 1;
            }
        }
        return {g: grid, allPins: allPins};
    }

    function mkBBPin(): SVGElAndSize {
        let el = svg.elt("rect");
        svg.hydrate(el, {
            class: "sim-bb-pin",
            rx: PIN_ROUNDING,
            ry: PIN_ROUNDING,
            width: PIN_WIDTH,
            height: PIN_WIDTH
        });
        return {e: el, w: PIN_WIDTH, h: PIN_WIDTH, l: 0, t: 0};
    }
    function mkBBHoverPin(): SVGElAndSize {
        let el = svg.elt("rect");
        svg.hydrate(el, {
            class: "sim-bb-pin-hover",
            rx: PIN_ROUNDING,
            ry: PIN_ROUNDING,
            width: PIN_WIDTH * PIN_HOVER_SCALAR,
            height: PIN_WIDTH * PIN_HOVER_SCALAR
        });
        return {e: el, w: PIN_WIDTH, h: PIN_WIDTH, l: 0, t: 0};
    }

    export interface GridLabel {
        el: SVGTextElement,
        hoverEl: SVGTextElement,
        txt: string,
        group?: string,
    };

    function mkBBLabel(cx: number, cy: number, size: number, rotation: number, txt: string, group: string, extraClasses?: string[]): GridLabel {
        //lbl
        let el = mkTxt(cx, cy, size, rotation, txt);
        svg.addClass(el, "sim-bb-label");
        if (extraClasses)
            extraClasses.forEach(c => svg.addClass(el, c));

        //hover lbl
        let hoverEl = mkTxt(cx, cy, size * LABEL_HOVER_SCALAR, rotation, txt);
        svg.addClass(hoverEl, "sim-bb-label-hover");
        if (extraClasses)
            extraClasses.forEach(c => svg.addClass(hoverEl, c));

        let lbl = {el: el, hoverEl: hoverEl, txt: txt, group: group};
        return lbl;
    }

    interface BBBar {
        el: SVGRectElement,
        group?: string
    };

    export interface BreadboardOptions {
        pinDistance: number
    };

    export class Breadboard {
        public bb: SVGGElement;
        private styleEl: SVGStyleElement;
        private opts: BreadboardOptions;
        private width: number;
        private height: number;
        public defs: SVGElement[] = [];
        public style: string;

        //truth
        private allPins: GridPin[] = [];
        private allLabels: GridLabel[] = [];
        private allPowerBars: BBBar[] = [];
        //quick lookup caches
        private rowColToPin: Map<Map<GridPin>> = {};
        private rowColToLbls: Map<Map<GridLabel[]>> = {};

        constructor(opts: BreadboardOptions) {
            this.opts = opts;
            this.width = BB_COMPUTE_WIDTH(this.opts.pinDistance);
            this.height = BB_COMPUTE_HEIGHT(this.opts.pinDistance);
            this.style = BREADBOARD_CSS(this.opts.pinDistance);
            this.buildDom();
        }

        public updateLocation(x: number, y: number) {
            translateEl(this.bb, [x, y]);
        }

        public getPin(row: string, col: string): GridPin {
            let colToPin = this.rowColToPin[row];
            if (!colToPin)
                return null;
            let pin = colToPin[col];
            if (!pin)
                return null;
            return pin;
        }
        public getCoord(row: string, col: string): Coord {
            let pin = this.getPin(row, col);
            if (!pin)
                return null;
            return [pin.cx, pin.cy];
        }

        private buildDom() {
            const [width, height] = [this.width, this.height];
            const midH = height * BB_MID_RATIO;
            const barRatio = (1.0 - BB_MID_RATIO) * 0.5;
            const barH = height * barRatio;
            const midCols = BREADBOARD_COLUMN_COUNT;
            const midGridW = (midCols - 1) * PIN_DIST;
            const midRows = BREADBOARD_ROW_COUNT;
            const midGridH = (midRows - 1) * PIN_DIST;
            const midGridX = (width - midGridW) * 0.5;
            const midGridY = barH + (midH - midGridH) * 0.5;
            const barRows = 2;
            const barGridH = (barRows - 1) * PIN_DIST;
            const barColsAndSpacers = PINS_PER_BAR_ROW + 4;
            const barGridW = (barColsAndSpacers - 1) * PIN_DIST;
            const topBarGridX = (width - barGridW) * 0.5;
            const topBarGridY = (barH - barGridH) * 0.5;
            const botBarGridX = topBarGridX;
            const botBarGridY = topBarGridY + barH + midH;

            //wrapper
            this.bb = <SVGGElement>svg.elt("g");
            svg.addClass(this.bb, "sim-bb");

            //background
            svg.child(this.bb, "rect", { class: "sim-bb-background", width: width, height: height, rx: BB_BACKGROUND_ROUNDING, ry: BB_BACKGROUND_ROUNDING});

            //mid channel
            let channelGid = "sim-bb-channel-grad";
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
                let channel = svg.child(this.bb, "rect", { class: `sim-bb-channel ${cls || ""}`, y: cy - h / 2, width: width, height: h});
                channel.setAttribute("fill", `url(#${channelGid})`);
                return channel;
            }

            mkChannel(barH + midH / 2, BB_CHANNEL_HEIGHT, "sim-bb-mid-channel");
            mkChannel(barH, BB_SML_CHANNEL_HEIGHT);
            mkChannel(barH + midH, BB_SML_CHANNEL_HEIGHT);

            //-----pins
            const getMidTopOrBot = (rowIdx: number) => rowIdx < BB_MID_ROWS / 2.0 ? "b" : "t";
            const getBarTopOrBot = (colIdx: number) => colIdx < BB_POWER_COLS / 2.0 ? "b" : "t";
            const alphabet = "abcdefghij".split("").reverse();
            const getColName = (colIdx: number) => `${colIdx + 1}`;
            const getMidRowName = (rowIdx: number) => alphabet[rowIdx];
            const getMidGroupName = (rowIdx: number, colIdx: number) => {
                let botOrTop = getMidTopOrBot(rowIdx);
                let colNm = getColName(colIdx);
                return `${botOrTop}${colNm}`;
            };
            const getBarRowName = (rowIdx: number) => rowIdx === 0 ? "-" : "+";
            const getBarGroupName = (rowIdx: number, colIdx: number) => {
                let botOrTop = getBarTopOrBot(colIdx);
                let rowName = getBarRowName(rowIdx);
                return `${rowName}${botOrTop}`;
            };

            //mid grid
            let midGridRes = mkGrid({
                xOffset: midGridX,
                yOffset: midGridY,
                rowCount: BB_MID_ROWS,
                colCount: BB_MID_COLS,
                pinDist: this.opts.pinDistance,
                mkPin: mkBBPin,
                mkHoverPin: mkBBHoverPin,
                getRowName: getMidRowName,
                getColName: getColName,
                getGroupName: getMidGroupName,
                gapAfterRowIndices: BB_MID_ROW_GAPS,
            });
            let midGridG = midGridRes.g;
            this.allPins = this.allPins.concat(midGridRes.allPins);

            //bot bar
            let botBarGridRes = mkGrid({
                xOffset: botBarGridX,
                yOffset: botBarGridY,
                rowCount: BB_BAR_ROWS,
                colCount: BB_BAR_COLS,
                pinDist: this.opts.pinDistance,
                mkPin: mkBBPin,
                mkHoverPin: mkBBHoverPin,
                getRowName: getBarRowName,
                getColName: getColName,
                getGroupName: getBarGroupName,
                gapAfterColIndices: BB_BOT_BAR_COL_GAPS,
            });
            let botBarGridG = botBarGridRes.g;
            this.allPins = this.allPins.concat(botBarGridRes.allPins);

            //top bar
            let topBarGridRes = mkGrid({
                xOffset: topBarGridX,
                yOffset: topBarGridY,
                rowCount: BB_BAR_ROWS,
                colCount: BB_BAR_COLS,
                colStartIdx: BB_BAR_COLS,
                pinDist: this.opts.pinDistance,
                mkPin: mkBBPin,
                mkHoverPin: mkBBHoverPin,
                getRowName: getBarRowName,
                getColName: getColName,
                getGroupName: getBarGroupName,
                gapAfterColIndices: BB_TOP_BAR_COL_GAPS,
            });
            let topBarGridG = topBarGridRes.g;
            this.allPins = this.allPins.concat(topBarGridRes.allPins);

            //tooltip
            this.allPins.forEach(pin => {
                let {el, row, col, hoverEl} = pin
                let title = bbLocToCoordStr([row, col]);
                svg.hydrate(el, {title: title});
                svg.hydrate(hoverEl, {title: title});
            })

            //catalog pins
            this.allPins.forEach(pin => {
                let colToPin = this.rowColToPin[pin.row];
                if (!colToPin)
                    colToPin = this.rowColToPin[pin.row] = {};
                colToPin[pin.col] = pin;
            })

            //-----labels
            const mkBBLabelAtPin = (row: string, col: string, xOffset: number, yOffset: number, txt: string, group?: string): GridLabel => {
                let size = PIN_LBL_SIZE;
                let rotation = BB_LBL_ROT;
                let loc = this.getCoord(row, col);
                let [cx, cy] = loc;
                let t = mkBBLabel(cx + xOffset, cy + yOffset, size, rotation, txt, group);
                return t;
            }

            //columns
            for (let colIdx = 0; colIdx < BB_MID_COLS; colIdx++) {
                let colNm = getColName(colIdx);
                //top
                let rowTIdx = 0;
                let rowTNm = getMidRowName(rowTIdx);
                let groupT = getMidGroupName(rowTIdx, colIdx);
                let lblT = mkBBLabelAtPin(rowTNm, colNm, 0, -PIN_DIST, colNm, groupT);
                this.allLabels.push(lblT);
                //bottom
                let rowBIdx = BB_MID_ROWS - 1;
                let rowBNm = getMidRowName(rowBIdx);
                let groupB = getMidGroupName(rowBIdx, colIdx);
                let lblB = mkBBLabelAtPin(rowBNm, colNm, 0, +PIN_DIST, colNm, groupB);
                this.allLabels.push(lblB);
            }
            //rows
            for (let rowIdx = 0; rowIdx < BB_MID_ROWS; rowIdx++) {
                let rowNm = getMidRowName(rowIdx);
                //top
                let colTIdx = 0;
                let colTNm = getColName(colTIdx);
                let lblT = mkBBLabelAtPin(rowNm, colTNm, -PIN_DIST, 0, rowNm);
                this.allLabels.push(lblT);
                //top
                let colBIdx = BB_MID_COLS - 1;
                let colBNm = getColName(colTIdx);
                let lblB = mkBBLabelAtPin(rowNm, colBNm, +PIN_DIST, 0, rowNm);
                this.allLabels.push(lblB);
            }

            //+- labels
            let botPowerLabels = [
                //BL
                mkBBLabel(0 + BB_POWER_LBL_OFFSET + BB_MINUS_LBL_OFFSET, barH + midH + BB_POWER_LBL_OFFSET, BB_MINUS_LBL_SIZE, BB_LBL_ROT, `-`, getBarGroupName(0, 0), [`sim-bb-blue`]),
                mkBBLabel(0 + BB_POWER_LBL_OFFSET, barH + midH + barH - BB_POWER_LBL_OFFSET, BB_PLUS_LBL_SIZE, BB_LBL_ROT, `+`, getBarGroupName(1, 0), [`sim-bb-red`]),
                //BR
                mkBBLabel(width - BB_POWER_LBL_OFFSET + BB_MINUS_LBL_OFFSET, barH + midH + BB_POWER_LBL_OFFSET, BB_MINUS_LBL_SIZE, BB_LBL_ROT, `-`, getBarGroupName(0, BB_BAR_COLS - 1), [`sim-bb-blue`]),
                mkBBLabel(width - BB_POWER_LBL_OFFSET, barH + midH + barH - BB_POWER_LBL_OFFSET, BB_PLUS_LBL_SIZE, BB_LBL_ROT, `+`, getBarGroupName(1, BB_BAR_COLS - 1), [`sim-bb-red`]),
            ];
            this.allLabels = this.allLabels.concat(botPowerLabels);
            let topPowerLabels = [
                //TL
                mkBBLabel(0 + BB_POWER_LBL_OFFSET + BB_MINUS_LBL_OFFSET, 0 + BB_POWER_LBL_OFFSET, BB_MINUS_LBL_SIZE, BB_LBL_ROT, `-`, getBarGroupName(0, BB_BAR_COLS), [`sim-bb-blue`]),
                mkBBLabel(0 + BB_POWER_LBL_OFFSET, barH - BB_POWER_LBL_OFFSET, BB_PLUS_LBL_SIZE, BB_LBL_ROT, `+`, getBarGroupName(1, BB_BAR_COLS), [`sim-bb-red`]),
                //TR
                mkBBLabel(width - BB_POWER_LBL_OFFSET + BB_MINUS_LBL_OFFSET, 0 + BB_POWER_LBL_OFFSET, BB_MINUS_LBL_SIZE, BB_LBL_ROT, `-`, getBarGroupName(0, BB_POWER_COLS - 1), [`sim-bb-blue`]),
                mkBBLabel(width - BB_POWER_LBL_OFFSET, barH - BB_POWER_LBL_OFFSET, BB_PLUS_LBL_SIZE, BB_LBL_ROT, `+`, getBarGroupName(1, BB_POWER_COLS - 1), [`sim-bb-red`]),
            ];
            this.allLabels = this.allLabels.concat(topPowerLabels);

            //catalog lbls
            let lblNmToLbls: Map<GridLabel[]> = {};
            this.allLabels.forEach(lbl => {
                let {el, txt} = lbl;
                let lbls = lblNmToLbls[txt] = lblNmToLbls[txt] || []
                lbls.push(lbl);
            });
            const isPowerPin = (pin: GridPin) => pin.row === "-" || pin.row === "+";
            this.allPins.forEach(pin => {
                let {row, col, group} = pin;
                let colToLbls = this.rowColToLbls[row] || (this.rowColToLbls[row] = {});
                let lbls = colToLbls[col] || (colToLbls[col] = []);
                if (isPowerPin(pin)) {
                    //power pins
                    let isBot = Number(col) <= BB_BAR_COLS;
                    if (isBot)
                        botPowerLabels.filter(l => l.group == pin.group).forEach(l => lbls.push(l));
                    else
                        topPowerLabels.filter(l => l.group == pin.group).forEach(l => lbls.push(l));
                } else {
                    //mid pins
                    let rowLbls = lblNmToLbls[row];
                    rowLbls.forEach(l => lbls.push(l));
                    let colLbls = lblNmToLbls[col];
                    colLbls.forEach(l => lbls.push(l));
                }
            })

            //-----blue & red lines
            const lnLen = barGridW + PIN_DIST * 1.5;
            const lnThickness = PIN_DIST / 5.0;
            const lnYOff = PIN_DIST * 0.6;
            const lnXOff = (lnLen - barGridW) / 2.0;
            const mkPowerLine = (x: number, y: number, group: string, cls: string): BBBar => {
                let ln = <SVGRectElement>svg.elt("rect");
                svg.hydrate(ln, {
                    class: `sim-bb-bar ${cls}`,
                    x: x,
                    y: y - lnThickness / 2.0,
                    width: lnLen,
                    height: lnThickness});
                let bar: BBBar = {el: ln, group: group};
                return bar;
            }
            let barLines = [
                //top
                mkPowerLine(botBarGridX - lnXOff, botBarGridY - lnYOff, getBarGroupName(0, BB_POWER_COLS - 1), "sim-bb-blue"),
                mkPowerLine(botBarGridX - lnXOff, botBarGridY + PIN_DIST + lnYOff, getBarGroupName(1, BB_POWER_COLS - 1), "sim-bb-red"),
                //bot
                mkPowerLine(topBarGridX - lnXOff, topBarGridY - lnYOff, getBarGroupName(0, 0), "sim-bb-blue"),
                mkPowerLine(topBarGridX - lnXOff, topBarGridY + PIN_DIST + lnYOff, getBarGroupName(1, 0), "sim-bb-red"),
            ];
            this.allPowerBars = this.allPowerBars.concat(barLines);
            //attach power bars
            this.allPowerBars.forEach(b => this.bb.appendChild(b.el));

            //-----electrically connected groups
            //make groups
            let allGrpNms = this.allPins.map(p => p.group).filter((g, i, a) => a.indexOf(g) == i);
            let groups: SVGGElement[] = allGrpNms.map(grpNm => {
                let g = <SVGGElement>svg.elt("g");
                return g;
            });
            groups.forEach(g => svg.addClass(g, "sim-bb-pin-group"));
            groups.forEach((g, i) => svg.addClass(g, `group-${allGrpNms[i]}`));
            let grpNmToGroup: Map<SVGGElement> = {};
            allGrpNms.forEach((g, i) => grpNmToGroup[g] = groups[i]);
            //group pins and add connecting wire
            let grpNmToPins: Map<GridPin[]> = {};
            this.allPins.forEach((p, i) => {
                let g = p.group;
                let pins = grpNmToPins[g] || (grpNmToPins[g] = []);
                pins.push(p);
            });
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
            let miscLblGroup = <SVGGElement>svg.elt("g");
            svg.hydrate(miscLblGroup, {class: "sim-bb-group-misc"});
            groups.push(miscLblGroup);
            this.allLabels.forEach(l => {
                if (l.group) {
                    let g = grpNmToGroup[l.group];
                    g.appendChild(l.el);
                    g.appendChild(l.hoverEl);
                } else {
                    miscLblGroup.appendChild(l.el);
                    miscLblGroup.appendChild(l.hoverEl);
                }
            })

            //attach to bb
            groups.forEach(g => this.bb.appendChild(g)); //attach to breadboard
        }

        public getSVGAndSize(): SVGElAndSize {
            return {e: this.bb, t: 0, l: 0, w: this.width, h: this.height};
        }

        public highlightLoc(row: string, col: string) {
            let pin = this.rowColToPin[row][col];
            let {cx, cy} = pin;
            let lbls = this.rowColToLbls[row][col];
            const highlightLbl = (lbl: GridLabel) => {
                svg.addClass(lbl.el, "highlight");
                svg.addClass(lbl.hoverEl, "highlight");
            };
            lbls.forEach(highlightLbl);
        }
    }
}