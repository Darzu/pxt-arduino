// Auto-generated. Do not edit.



    //% color=300 weight=99
declare namespace input {

    /**
     * Do something when a button (``A``, ``B`` or both ``A+B``) is pressed
     * @param button TODO
     * @param body TODO
     */
    //% help=input/on-button-pressed weight=85 blockGap=8
    //% blockId=device_button_event block="on button|%NAME|pressed" icon="\uf192" shim=input::onButtonPressed
    function onButtonPressed(button: Button, body: () => void): void;

    /**
     * Get the button state (pressed or not) for ``A`` and ``B``.
     */
    //% help=input/button-is-pressed weight=57
    //% block="button|%NAME|is pressed"
    //% blockId=device_get_button2
    //% icon="\uf192" blockGap=8 shim=input::buttonIsPressed
    function buttonIsPressed(button: Button): boolean;
}

// Auto-generated. Do not edit. Really.
