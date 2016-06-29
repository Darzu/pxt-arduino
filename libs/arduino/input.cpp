#include "ksbit.h"

enum class Button {
    A = MICROBIT_ID_BUTTON_A,
    B = MICROBIT_ID_BUTTON_B,
    //% block="A+B"
    AB = MICROBIT_ID_BUTTON_AB,
};

//% color=300 weight=99
namespace input {
    /**
     * Do something when a button (``A``, ``B`` or both ``A+B``) is pressed
     * @param button TODO
     * @param body TODO
     */
    //% help=input/on-button-pressed weight=85 blockGap=8
    //% blockId=device_button_event block="on button|%NAME|pressed" icon="\uf192"
    void onButtonPressed(Button button, Action body) {
        registerWithDal((int)button, MICROBIT_BUTTON_EVT_CLICK, body);
    }

    /**
     * Get the button state (pressed or not) for ``A`` and ``B``.
     */
    //% help=input/button-is-pressed weight=57
    //% block="button|%NAME|is pressed"
    //% blockId=device_get_button2
    //% icon="\uf192" blockGap=8
    bool buttonIsPressed(Button button) {
      if (button == Button::A)
        return uBit.buttonA.isPressed();
      else if (button == Button::B)
        return uBit.buttonB.isPressed();
      else if (button == Button::AB)
        return uBit.buttonAB.isPressed();
      return false;
    }
}
