from RPi import GPIO
from time import sleep
from evdev import UInput, ecodes as e

# GPIO pin numbers
clk = 17
dt = 18

# Setup GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(clk, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(dt, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

# Create a virtual keyboard
ui = UInput()

counter = 0
clkLastState = GPIO.input(clk)

try:
    while True:
        clkState = GPIO.input(clk)
        dtState = GPIO.input(dt)
        if clkState != clkLastState:
            if dtState != clkState:
                counter += 1
                ui.write(e.EV_KEY, e.KEY_D, 1)  # Press D key
                ui.write(e.EV_KEY, e.KEY_D, 0)  # Release D key
                ui.syn()
                print("Clockwise")
            else:
                counter -= 1
                ui.write(e.EV_KEY, e.KEY_A, 1)  # Press A key
                ui.write(e.EV_KEY, e.KEY_A, 0)  # Release A key
                ui.syn()
                print("Counterclockwise")
        clkLastState = clkState
        sleep(0.01)
except KeyboardInterrupt:
    GPIO.cleanup()
    ui.close()
finally:
    GPIO.cleanup()
    ui.close()
