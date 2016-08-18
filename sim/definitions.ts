/// <reference path="../node_modules/pxt-core/typings/bluebird/bluebird.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../libs/microbit/dal.d.ts"/>
/// <reference path="./components/neopixel.ts"/>

namespace pxsim {
    export interface BoardDefinition {
        visual: {
            image: string,
            outlineImage: string,
            width: number,
            height: number,
            pinDist: number,
            pinBlocks: { x: number, y: number, labels: string[] }[],
        },
        gpioPinBlocks: string[][],
        groundPins: string[],
        threeVoltPins: string[],
    }
    export type ComponentDefinition = {
        breadboardColumnsNeeded: number,
        gpioPinsNeeded?: number | number[], 
        wires: WireDefinition[],
        assemblyStep: number
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
        assemblyStep: number
    } 
    export type WireInstance = {
        start: LocationInstance, 
        end: LocationInstance,
        color: string, 
        assemblyStep: number
    };
    export type LocationInstance = ["breadboard", string] | ["dalboard", string];

    export const ARDUINO_ZERO: BoardDefinition = {
        visual: {
            image: "arduino-zero-photo-sml.png",
            outlineImage: "arduino-outline.svg",
            width: 1000,
            height: 762,
            pinDist: 35.5,
            pinBlocks: [
                {x: 276.8, y: 17.8, labels: ["SCL", "SDA","AREF", "GND0", "~13", "~12", "~11", "~10", "~9", "~8"]},
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
            gpioPinsNeeded: [5,5],
            assemblyStep: 0,
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
            gpioPinsNeeded: [2],
            assemblyStep: 0,
            wires: [
                {start: ["breadboard", "j", 0], end: ["GPIO", 0], color: "yellow", assemblyStep: 1},
                {start: ["breadboard", "a", 2], end: "ground", color: "blue", assemblyStep: 1},
                {start: ["breadboard", "j", 3], end: ["GPIO", 1], color: "orange", assemblyStep: 2},
                {start: ["breadboard", "a", 5], end: "ground", color: "blue", assemblyStep: 2},
            ],
        },
        "neopixel": {
            breadboardColumnsNeeded: 5,
            gpioPinsNeeded: 1,
            assemblyStep: 0,
            wires: [
                {start: ["breadboard", "j", 1], end: "ground", color: "blue", assemblyStep: 1},
                {start: ["breadboard", "j", 2], end: "threeVolt", color: "red", assemblyStep: 2},
                {start: ["breadboard", "j", 3], end: ["GPIO", 0], color: "green", assemblyStep: 2},
            ],
        }
    }  

    //TODO: replace with real info from static analysis
    export const HACK_STATIC_ANALYSIS_RESULTS = ["buttonpair", "ledmatrix" , "neopixel"]

    export const builtinComponentSimVisual: Map<() => visuals.IBoardComponent<any>> = {
        "buttonpair": () => new visuals.ButtonPairSvg(),
        "ledmatrix": () => new visuals.LedMatrixSvg(),
        "edgeconnector": () => new visuals.EdgeConnectorSvg(),
        "serial": () => new visuals.SerialSvg(),
        "radio": () => new visuals.RadioSvg(),
        "thermometer": () => new visuals.ThermometerSvg(),
        "accelerometer": () => new visuals.AccelerometerSvg(),
        "compass": () => new visuals.CompassSvg(),
        "lightsensor": () => new visuals.LightSensorSvg(),
        "neopixel": () => new visuals.NeoPixelSvg(),
    };
    export const builtinComponentSimState: Map<(d: DalBoard) => any> = {
        "buttonpair": (d: DalBoard) => d.buttonPairState,
        "ledmatrix": (d: DalBoard) => d.ledMatrixCmp,
        "edgeconnector": (d: DalBoard) => d.edgeConnectorState,
        "serial": (d: DalBoard) => d.serialCmp,
        "radio": (d: DalBoard) => d.radioCmp,
        "thermometer": (d: DalBoard) => d.thermometerCmp,
        "accelerometer": (d: DalBoard) => d.accelerometerCmp,
        "compass": (d: DalBoard) => d.compassCmp,
        "lightsensor": (d: DalBoard) => d.lightSensorCmp,
        "neopixel": (d: DalBoard) => d.neopixelCmp,
    };
    export const builtinComponentPartVisual: Map<(xy: visuals.Coord) => visuals.SVGAndSize<SVGElement>> = {
        "buttonpair": (xy: visuals.Coord) => visuals.mkBtnSvg(xy),
        "ledmatrix": (xy: visuals.Coord) => visuals.mkLedMatrixSvg(xy, 8, 8),
        "neopixel": (xy: visuals.Coord) => visuals.mkNeoPixelPart(xy),
    };
}