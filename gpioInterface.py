import time
from evdev import UInput, ecodes as e
from RPi import GPIO

# GPIO pin numbers
clk = 17
dt = 18

# Setup GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(clk, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(dt, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

# Create a virtual keyboard with specific capabilities
capabilities = {
    e.EV_KEY: [e.KEY_A, e.KEY_D]
}
ui = UInput(capabilities, name='virtual_encoder')

counter = 0
clkLastState = GPIO.input(clk)

try:
    while True:
        clkState = GPIO.input(clk)
        dtState = GPIO.input(dt)
        if clkState != clkLastState:
            if dtState != clkState:
                counter += 1
                print("Clockwise")
                ui.write(e.EV_KEY, e.KEY_E, 1)  # Press E key
                ui.write(e.EV_KEY, e.KEY_E, 0)  # Release E key
                ui.syn()
            else:
                counter -= 1
                print("Counterclockwise")
                ui.write(e.EV_KEY, e.KEY_Q, 1)  # Press Q key
                ui.write(e.EV_KEY, e.KEY_Q, 0)  # Release Q key
                ui.syn()
            time.sleep(0.01)
        clkLastState = clkState
except KeyboardInterrupt:
    GPIO.cleanup()
    ui.close()
finally:
    GPIO.cleanup()
    ui.close()
