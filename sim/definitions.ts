/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/microbit/dal.d.ts"/>
/// <reference path="./visuals/neopixel.ts"/>

namespace pxsim {
    export interface PinBlockDefinition {
        x: number,
        y: number,
        labels: string[]
    }
    export interface BoardImageDefinition {
        image?: string,
        outlineImage?: string,
        width: number,
        height: number,
        pinDist: number,
        pinBlocks: PinBlockDefinition[],
    };
    export interface BoardDefinition {
        visual: BoardImageDefinition | string,
        gpioPinBlocks: string[][],
        groundPins: string[],
        threeVoltPins: string[],
        attachPowerOnRight?: boolean,
    }
    export interface FactoryFunctionDefinition {
        fn: string,
        pinArgPosition: number,
    }
    export interface ComponentDefinition {
        breadboardColumnsNeeded: number,
        breadboardStartRow: string,
        gpioPinsNeeded?: number | number[],
        wires: WireDefinition[],
        assemblyStep: number,
        factoryFunctions?: FactoryFunctionDefinition[],
        builtinPartVisual?: string,
        builtinSimSate?: string,
        builtinSimVisual?: string,
    }
    export interface WireDefinition {
        start: LocationDefinition,
        end: LocationDefinition,
        color: string,
        assemblyStep: number
    };
    export type LocationDefinition =
        ["breadboard", string, number] | ["GPIO", number] | "ground" | "threeVolt";

    export interface ComponentInstance {
        breadboardStartColumn: number,
        breadboardStartRow: string,
        assemblyStep: number,
        builtinPartVisual?: string,
        builtinSimSate?: string,
        builtinSimVisual?: string,
    }
    export interface WireInstance {
        start: Loc,
        end: Loc,
        color: string,
        assemblyStep: number
    };

    export type BBRowCol = [/*row*/string, /*column*/string];
    export type BoardPin = string;
    export interface BBLoc {type: "breadboard", rowCol: BBRowCol};
    export interface BoardLoc {type: "dalboard", pin: BoardPin};
    export type Loc = BBLoc | BoardLoc;

    export const MICROBIT_DEF: BoardDefinition = {
        visual: "microbit",
        gpioPinBlocks: [
            ["P0"], ["P1"], ["P2"],
            ["P3"],
            ["P4", "P5", "P6", "P7"],
            ["P8", "P9", "P10", "P11", "P12"],
            ["P13", "P14", "P15", "P16"],
            ["P19", "P20"],
        ],
        groundPins: ["GND"],
        threeVoltPins: ["+3v3"],
        attachPowerOnRight: true,
    }
    export const RASPBERRYPI_MODELB: BoardDefinition = {
        visual: {
            image: "/static/hardware/raspberrypi-model-b.svg",
            outlineImage: "/static/hardware/raspberrypi-model-b-outline.svg",
            width: 331,
            height: 230,
            pinDist: 9,
            pinBlocks: [
                { x: 5, y: 31, labels: ["3V3", "SDA", "SCL", "#4", "--", "#17", "#21", "#22", "--", "MOSI", "MISO", "SCLK", "--"]},
                { x: 5, y: 39, labels: ["5V", "--", "GND", "TXD", "RXD", "#18", "--", "#23", "#24", "--", "#25", "CS0", "CS1"]}
            ],
        },
        gpioPinBlocks: [
            ["SDA", "SCL", "#4"],
            ["#17", "#21", "#22"],
            ["MOSI", "MISO", "SCLK"],
            ["TXD", "RXD", "#18"],
            ["#23", "#24"],
            ["#25", "CS0", "CS1"],
        ],
        groundPins: ["GND"],
        threeVoltPins: ["3V3"],
    }
    export const SPARKFUN_PHOTON: BoardDefinition = {
        visual: {
            image: "/static/hardware/sparkfun-photon.svg",
            outlineImage: "/static/hardware/sparkfun-photon-outline.svg",
            width: 264.4,
            height: 202.4,
            pinDist: 9.5,
            pinBlocks: [
                {x: 72, y: 6, labels: ["~SCL/D1", "~SDA/D0", " ", "GND0", "SCK/A3", "~MISO/A4", "~MOSI/A5", "SS/A2", "~WKP", "DAC"]},
                {x: 174, y: 6, labels: ["D7", "D6", "D5", "D4", "~D3", "~D2", "~TX", "~RX"]},
                {x: 107, y: 188, labels: [" ", " ", "RESET", "3.3V", "V-USB", "GND1", "GND2", "VIN"]},
                {x: 193, y: 188, labels: ["A0", "A1", "A2", "A3", "A4", "A5"]},
            ],
        },
        gpioPinBlocks: [
            ["~SCL/D1", "~SDA/D0", "SCK/A3", "~MISO/A4", "~MOSI/A5", "SS/A2"],
            ["D7", "D6", "D5", "D4", "~D3", "~D2", "~TX", "~RX"],
            ["A0", "A1", "A2", "A3", "A4", "A5"],
        ],
        groundPins: ["GND0", "GND1", "GND2"],
        threeVoltPins: ["3.3V"],
    }
    export const ARDUINO_ZERO: BoardDefinition = {
        visual: {
            image: "/static/hardware/arduino-zero.png",
            outlineImage: "/static/hardware/arduino-zero-outline.svg",
            width: 1000,
            height: 762,
            pinDist: 35.5,
            pinBlocks: [
                {x: 276.8, y: 17.8, labels: ["SCL", "SDA", "AREF", "GND0", "~13", "~12", "~11", "~10", "~9", "~8"]},
                {x: 655.5, y: 17.8, labels: ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"]},
                {x: 411.7, y: 704.6, labels: ["ATN", "IOREF", "RESET", "3.3V", "5V", "GND1", "GND2", "VIN"]},
                {x: 732.9, y: 704.6, labels: ["A0", "A1", "A2", "A3", "A4", "A5"]},
            ],
        },
        gpioPinBlocks: [
            ["A0", "A1", "A2", "A3", "A4", "A5"],
            ["~13", "~12", "~11", "~10", "~9", "~8"],
            ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"],
        ],
        groundPins: ["GND0", "GND1", "GND2"],
        threeVoltPins: ["3.3V"],
    }
    export const COMPONENT_DEFINITIONS: Map<ComponentDefinition> = {
        "ledmatrix": {
            breadboardColumnsNeeded: 8,
            breadboardStartRow: "h",
            gpioPinsNeeded: [5, 5],
            assemblyStep: 0,
            builtinPartVisual: "ledmatrix",
            builtinSimSate: "ledmatrix",
            builtinSimVisual: "ledmatrix",
            wires: [
                {start: ["breadboard", `j`, 0], end: ["GPIO", 5], color: "purple", assemblyStep: 1},
                {start: ["breadboard", `j`, 1], end: ["GPIO", 6], color: "purple", assemblyStep: 1},
                {start: ["breadboard", `j`, 2], end: ["GPIO", 7], color: "purple", assemblyStep: 1},
                {start: ["breadboard", `j`, 3], end: ["GPIO", 8], color: "purple", assemblyStep: 1},
                {start: ["breadboard", `a`, 7], end: ["GPIO", 9], color: "purple", assemblyStep: 1},
                {start: ["breadboard", `a`, 0], end: ["GPIO", 0], color: "green", assemblyStep: 2},
                {start: ["breadboard", `a`, 1], end: ["GPIO", 1], color: "green", assemblyStep: 2},
                {start: ["breadboard", `a`, 2], end: ["GPIO", 2], color: "green", assemblyStep: 2},
                {start: ["breadboard", `a`, 3], end: ["GPIO", 3], color: "green", assemblyStep: 2},
                {start: ["breadboard", `j`, 4], end: ["GPIO", 4], color: "green", assemblyStep: 2},
            ]
        },
        "buttonpair": {
            breadboardColumnsNeeded: 6,
            breadboardStartRow: "f",
            gpioPinsNeeded: [2],
            assemblyStep: 0,
            builtinPartVisual: "buttonpair",
            builtinSimSate: "buttonpair",
            builtinSimVisual: "buttonpair",
            wires: [
                {start: ["breadboard", "j", 0], end: ["GPIO", 0], color: "yellow", assemblyStep: 1},
                {start: ["breadboard", "a", 2], end: "ground", color: "blue", assemblyStep: 1},
                {start: ["breadboard", "j", 3], end: ["GPIO", 1], color: "orange", assemblyStep: 2},
                {start: ["breadboard", "a", 5], end: "ground", color: "blue", assemblyStep: 2},
            ],
        },
        "neopixel": {
            breadboardColumnsNeeded: 5,
            breadboardStartRow: "h",
            gpioPinsNeeded: 1,
            factoryFunctions: [
                { fn: "neopixel.create", pinArgPosition: 0 }
            ],
            assemblyStep: 0,
            builtinPartVisual: "neopixel",
            builtinSimSate: "neopixel",
            builtinSimVisual: "neopixel",
            wires: [
                {start: ["breadboard", "j", 1], end: "ground", color: "blue", assemblyStep: 1},
                {start: ["breadboard", "j", 2], end: "threeVolt", color: "red", assemblyStep: 2},
                {start: ["breadboard", "j", 3], end: ["GPIO", 0], color: "green", assemblyStep: 2},
            ],
        }
    }

    export const builtinComponentSimVisual: Map<() => visuals.IBoardComponent<any>> = {
        "buttonpair": () => new visuals.ButtonPairView(),
        "ledmatrix": () => new visuals.LedMatrixView(),
        "edgeconnector": () => new visuals.EdgeConnectorView(),
        "serial": () => new visuals.SerialView(),
        "radio": () => new visuals.RadioView(),
        "thermometer": () => new visuals.ThermometerView(),
        "accelerometer": () => new visuals.AccelerometerView(),
        "compass": () => new visuals.CompassView(),
        "lightsensor": () => new visuals.LightSensorView(),
        "neopixel": () => new visuals.NeoPixelView(),
    };
    export const builtinComponentSimState: Map<(d: DalBoard) => any> = {
        "buttonpair": (d: DalBoard) => d.buttonPairState,
        "ledmatrix": (d: DalBoard) => d.ledMatrixState,
        "edgeconnector": (d: DalBoard) => d.edgeConnectorState,
        "serial": (d: DalBoard) => d.serialState,
        "radio": (d: DalBoard) => d.radioState,
        "thermometer": (d: DalBoard) => d.thermometerState,
        "accelerometer": (d: DalBoard) => d.accelerometerState,
        "compass": (d: DalBoard) => d.compassState,
        "lightsensor": (d: DalBoard) => d.lightSensorState,
        "neopixel": (d: DalBoard) => d.neopixelState,
    };
    export const builtinComponentPartVisual: Map<(xy: visuals.Coord) => visuals.SVGElAndSize> = {
        "buttonpair": (xy: visuals.Coord) => visuals.mkBtnSvg(xy),
        "ledmatrix": (xy: visuals.Coord) => visuals.mkLedMatrixSvg(xy, 8, 8),
        "neopixel": (xy: visuals.Coord) => visuals.mkNeoPixelPart(xy),
    };
}