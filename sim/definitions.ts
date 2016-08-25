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
    export interface BoardDefinition {
        visual: {
            image: string,
            outlineImage: string,
            width: number,
            height: number,
            pinDist: number,
            pinBlocks: PinBlockDefinition[],
        },
        gpioPinBlocks: string[][],
        groundPins: string[],
        threeVoltPins: string[],
    }
    export type ComponentDefinition = {
        breadboardColumnsNeeded: number,
        breadboardStartRow: string,
        gpioPinsNeeded?: number | number[],
        wires: WireDefinition[],
        assemblyStep: number,
        builtinPartVisual?: string,
        builtinSimSate?: string,
        builtinSimVisual?: string,
    }
    export type WireDefinition = {
        start: LocationDefinition,
        end: LocationDefinition,
        color: string,
        assemblyStep: number
    };
    export type LocationDefinition =
        ["breadboard", string, number] | ["GPIO", number] | "ground" | "threeVolt";

    export type ComponentInstance = {
        breadboardStartColumn: number,
        breadboardStartRow: string,
        assemblyStep: number,
        builtinPartVisual?: string,
        builtinSimSate?: string,
        builtinSimVisual?: string,
    }
    export type WireInstance = {
        start: LocationInstance,
        end: LocationInstance,
        color: string,
        assemblyStep: number
    };
    export type BreadboardLocation = [string, string];
    export type DALBoardLocation = string;
    export type LocationInstance = ["breadboard", BreadboardLocation] | ["dalboard", DALBoardLocation];

    export const ARDUINO_ZERO: BoardDefinition = {
        visual: {
            image: "/static/arduino/arduino-zero-photo-sml.png",
            outlineImage: "/static/arduino/arduino-zero-outline.svg",
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
            ["~13", "~12", "~11", "~10", "~9", "~8"],
            ["7", "~6", "~5", "~4", "~3", "2", "TX->1", "RX<-0"],
            ["A0", "A1", "A2", "A3", "A4", "A5"],
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