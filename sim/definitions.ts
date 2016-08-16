/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/microbit/dal.d.ts"/>

namespace pxsim.visuals {
    const AZ_DISPLAY_COL = 8;
    export const ARDUINO_ZERO: BoardDescription = {
        photo: "arduino-zero-photo-sml.png",
        outlineImg:  "arduino-outline.svg",
        width: 1000,
        height: 762,
        pinDist: 35.5,
        pins: [
            {x: 276.8, y: 17.8, labels: ["SCL", "SDA","AREF", "GND0", "~13", "~12", "~11", "~10", "~9", "~8"]},
            {x: 655.5, y: 17.8, labels: ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"]},
            {x: 411.7, y: 704.6, labels: ["ATN", "IOREF", "RESET", "3.3V", "5V", "GND1", "GND2", "VIN"]},
            {x: 732.9, y: 704.6, labels: ["A0", "A1", "A2", "A3", "A4", "A5"]},
        ],
        basicWires: [
            {start: ["bb", "-1"], end: ["board", "GND0"], color: "blue", instructionStep: 1},
            {start: ["bb", "+26"], end: ["board", "5V"], color: "red", instructionStep: 1},
            {start: ["bb", "-27"], end: ["board", "GND1"], color: "blue", instructionStep: 1},
        ],
        components: [
            {type: "display", locations:[`h${AZ_DISPLAY_COL}`], instructionStep: 2, wires: [
                {start: ["bb", `j${AZ_DISPLAY_COL+0}`], end: ["board", "~5"], color: "purple", instructionStep: 3},
                {start: ["bb", `j${AZ_DISPLAY_COL+1}`], end: ["board", "~4"], color: "purple", instructionStep: 3},
                {start: ["bb", `j${AZ_DISPLAY_COL+2}`], end: ["board", "~3"], color: "purple", instructionStep: 3},
                {start: ["bb", `j${AZ_DISPLAY_COL+3}`], end: ["board", "2"], color: "purple", instructionStep: 3},
                {start: ["bb", `a${AZ_DISPLAY_COL+7}`], end: ["board", "TX->1"], color: "purple", instructionStep: 3},
                {start: ["bb", `a${AZ_DISPLAY_COL+0}`], end: ["board", "A0"], color: "green", instructionStep: 4},
                {start: ["bb", `a${AZ_DISPLAY_COL+1}`], end: ["board", "A1"], color: "green", instructionStep: 4},
                {start: ["bb", `a${AZ_DISPLAY_COL+2}`], end: ["board", "A2"], color: "green", instructionStep: 4},
                {start: ["bb", `a${AZ_DISPLAY_COL+3}`], end: ["board", "A3"], color: "green", instructionStep: 4},
                {start: ["bb", `j${AZ_DISPLAY_COL+4}`], end: ["board", "A4"], color: "green", instructionStep: 4},
            ]},
            {type: "buttonpair", locations:["f1", "f28"], instructionStep: 5, wires: [
                {start: ["bb", "j1"], end: ["board", "7"], color: "yellow", instructionStep: 6},
                {start: ["bb", "a3"], end: ["bb", "-2"], color: "blue", instructionStep: 6},
                {start: ["bb", "j28"], end: ["board", "~6"], color: "orange", instructionStep: 7},
                {start: ["bb", "a30"], end: ["bb", "-25"], color: "blue", instructionStep: 7},
            ]},
            // //strip1
            // {type: "neopixel", locations:["h13"], instructionStep: 8, wires: [
            //     {start: ["bb", "j14"], end: ["bb", "-37"], color: "blue", instructionStep: 9},
            //     {start: ["bb", "j15"], end: ["bb", "+38"], color: "red", instructionStep: 11},
            //     {start: ["bb", "j16"], end: ["board", "~12"], color: "green", instructionStep: 10},
            // ]},
            //strip2
            {type: "neopixel", locations:["h19"], instructionStep: 8, wires: [
                {start: ["bb", "j20"], end: ["bb", "-41"], color: "blue", instructionStep: 8},
                {start: ["bb", "j21"], end: ["bb", "+42"], color: "red", instructionStep: 9},
                {start: ["bb", "j22"], end: ["board", "~11"], color: "green", instructionStep: 9},
            ]},
            // //strip3
            // {type: "neopixel", locations:["h23"], instructionStep: 8, wires: [
            //     {start: ["bb", "j24"], end: ["bb", "-45"], color: "blue", instructionStep: 9},
            //     {start: ["bb", "j25"], end: ["bb", "+46"], color: "red", instructionStep: 11},
            //     {start: ["bb", "j26"], end: ["board", "~10"], color: "green", instructionStep: 10},
            // ]},
        ]
    }
    export const LED_MATRIX_WIRING = {
        componentType: "display",
        columnsNeeded: 8,
        gpioPinsNeeded: 10,
        wires: [
            [["bb", "j", 0], ["gpio", 0]],
            [["bb", "a", 5], ["ground"]],
            [["bb", "j", 5], ["5V"]], 
            [["bb", "a", 3], ["3.3V"]],
            {start: {location: "bb", row: "j", relativeColumnIdx: 0}, end: ["board", "~5"], color: "purple", instructionStep: 3},
            {start: ["bb", `j${AZ_DISPLAY_COL+1}`], end: ["board", "~4"], color: "purple", instructionStep: 3},
            {start: ["bb", `j${AZ_DISPLAY_COL+2}`], end: ["board", "~3"], color: "purple", instructionStep: 3},
            {start: ["bb", `j${AZ_DISPLAY_COL+3}`], end: ["board", "2"], color: "purple", instructionStep: 3},
            {start: ["bb", `a${AZ_DISPLAY_COL+7}`], end: ["board", "TX->1"], color: "purple", instructionStep: 3},
            {start: ["bb", `a${AZ_DISPLAY_COL+0}`], end: ["board", "A0"], color: "green", instructionStep: 4},
            {start: ["bb", `a${AZ_DISPLAY_COL+1}`], end: ["board", "A1"], color: "green", instructionStep: 4},
            {start: ["bb", `a${AZ_DISPLAY_COL+2}`], end: ["board", "A2"], color: "green", instructionStep: 4},
            {start: ["bb", `a${AZ_DISPLAY_COL+3}`], end: ["board", "A3"], color: "green", instructionStep: 4},
            {start: ["bb", `j${AZ_DISPLAY_COL+4}`], end: ["board", "A4"], color: "green", instructionStep: 4},
        ]
    }
    //TODO: determine this from static analysis
    export const NEOPIXEL_LAYOUT: {[pin: number]: NeoPixelMode} = (() => {
        let map: {[pin: number]: NeoPixelMode} = {};
        map[7/*DigitalPin.P0*/] = NeoPixelMode.RGB;
        //map[8/*DigitalPin.P1*/] = NeoPixelMode.RGBW;
        //map[9/*DigitalPin.P2*/] = NeoPixelMode.RGB;
        return map
    })();
}