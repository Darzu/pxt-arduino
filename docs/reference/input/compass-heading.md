# Compass Heading

Find which direction on a compass the micro:bit is facing.

The micro:bit measures the **compass heading** from `0` to `360`
degrees with its **magnetometer** chip. Different numbers mean north,
east, south, and west.

```sig
input.compassHeading();
```

### Returns

* a [number](/reference/types/number) from `0` to `360` degrees, which means the compass heading. If the compass isn't ready, it returns `-1003`.

### Example

This program finds the compass heading and stores it in the
`degrees` variable.

```blocks
let degrees = input.compassHeading()
```

### ~hint 

When you run a program that uses this function in a browser, click and drag
the compass needle on the screen to change the compass heading.

### ~

### Example: compass

This program finds the compass heading and then shows a letter
that means whether the micro:bit is facing north (N), south (S),
east (E), or west (W).

```blocks
basic.forever(() => {
    let degrees = input.compassHeading()
    if (degrees < 45)
        basic.showString("N")
    else if (degrees < 135)
        basic.showString("E")
    else if (degrees < 225)
        basic.showString("S")
    else basic.showString("W")
})
```

### Calibration

Every time you start to use the compass (for example, if you have just
turned the micro:bit on), the micro:bit will start to **calibrate**
(adjust itself).  It will ask you to draw a circle by tilting the
micro:bit.

If you are calibrating or using the compass near metal, it might
confuse the micro:bit.

### See also

[acceleration](/reference/input/acceleration)
