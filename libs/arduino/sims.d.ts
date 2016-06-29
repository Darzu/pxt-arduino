// Auto-generated from simulator. Do not edit.
declare namespace basic {
    /**
     * Moves the sprite forward
     * @param steps number of steps to move, eg: 1
     */
    //% weight=90
    //% blockId=sampleForward block="forward %steps"
    //% shim=basic::forwardAsync promise
    function forward(steps: number): void;

    /**
     * Turns the sprite left
     */
    //% weight=85
    //% blockId=sampleTurnLeft block="turn left by %angle degrees"
    //% shim=basic::turnLeftAsync promise
    function turnLeft(angle: number): void;

    /**
     * Turns the sprite right
     */
    //% weight=85
    //% blockId=sampleTurnRight block="turn right by %angle degrees"
    //% shim=basic::turnRightAsync promise
    function turnRight(angle: number): void;

    /**
     * Repeats the code forever in the background. On each iteration, allows other code to run.
     * @param body TODO
     */
    //% help=functions/forever weight=55 blockGap=8
    //% blockId=device_forever block="forever" icon="\uf01e"
    //% shim=basic::forever
    function forever(body: () => void): void;

    /**
     * Pause for the specified time in milliseconds
     * @param ms how long to pause for, eg: 100, 200, 500, 1000, 2000
     */
    //% help=functions/pause weight=54
    //% block="pause (ms) %pause" blockId=device_pause icon="\uf110"
    //% shim=basic::pauseAsync promise
    function pause(ms: number): void;

}
declare namespace console {
    /**
     * Print out message
     */
    //%
    //% shim=console::log
    function log(msg: string): void;

}
    /**
     * A ghost on the screen.
     */
    //%
    declare class Sprite {
        /**
         * The X-coordiante
         */
        //%
        //% shim=.x
        public x: number;

        /**
         * The Y-coordiante
         */
        //%
        //% shim=.y
        public y: number;

        /** 
         * Make new sprite
         */
        //%
        //% shim="new Sprite"
        constructor();

        /**
         * Move the thing forward
         */
        //%
        //% shim=.forwardAsync promise
        public forward(steps: number): void;

    }

// Auto-generated. Do not edit. Really.
