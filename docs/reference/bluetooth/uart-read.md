# UART Read 

### ~hint
![](/static/bluetooth/Bluetooth_SIG.png)

For another device like a smartphone to use any of the Bluetooth "services" which the micro:bit has, it must first be [paired with the micro:bit](/reference/bluetooth/bluetooth-pairing). Once paired, the other device may connect to the micro:bit and exchange data relating to many of the micro:bit's features.

### ~

The [Bluetooth UART service](start-uart-service.md) allows another device such as a smartphone to exchange any data it wants to with the micro:bit, in small chunks. 

With the Bluetooth UART service running, this block allows a micro:bit to read data which has been received from a Bluetooth connected device, terminating reading and returning the value obtained as soon as a specified delimiter character is encountered. This means that connected devices can send data to the micro:bit and indicate that the complete message has been sent by appending the message with the delimiter character.

```sig
bluetooth.uartRead("");
```

### Example: Starting the Bluetooth UART service and then reading data received from another device which is terminated by ":" character and then displaying it

```blocks
let uart_data = "";
let connected = 0;
basic.showString("UART");
bluetooth.onBluetoothConnected(() => {
    basic.showString("C");
    connected = 1;
    while (connected == 1) {
        uart_data = bluetooth.uartRead(":");
        basic.showString(uart_data);
    }
});
bluetooth.onBluetoothDisconnected(() => {
    basic.showString("D");
});

```

### Video - UART service guessing game

https://www.youtube.com/watch?v=PgGeWddMAZ0

### Advanced
 
For more advanced information on the micro:bit Bluetooth UART service including information on using a smartphone, see the [Lancaster University micro:bit runtime technical documentation](http://lancaster-university.github.io/microbit-docs/ble/uart-service/)

### See also

[About Bluetooth](/reference/bluetooth/about-bluetooth), [micro:bit Bluetooth profile overview ](http://lancaster-university.github.io/microbit-docs/ble/profile/), [micro:bit Bluetooth profile reference](http://lancaster-university.github.io/microbit-docs/resources/bluetooth/microbit-profile-V1.9-Level-2.pdf),  [Bluetooth on micro:bit resources](http://bluetooth-mdw.blogspot.co.uk/p/bbc-microbit.html), [Bluetooth SIG](https://www.bluetooth.com)

```package
microbit-bluetooth
```
