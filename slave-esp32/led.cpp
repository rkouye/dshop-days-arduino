#include <Arduino.h>
#include "led.h"

void initLeds(){
    pinMode(BLUE_LED_PIN, OUTPUT);
    pinMode(GREEN_LED_PIN, OUTPUT);
    digitalWrite(BLUE_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, LOW);
}

void blueLed_on(){
    digitalWrite(BLUE_LED_PIN, HIGH);
}

void blueLed_off(){
    digitalWrite(BLUE_LED_PIN, LOW);
}

void blueLed_toggle(){
    digitalWrite(BLUE_LED_PIN, !digitalRead(BLUE_LED_PIN));
}
void greenLed_on(){
    digitalWrite(GREEN_LED_PIN, HIGH);
}

void greenLed_toggle(){
    digitalWrite(GREEN_LED_PIN, !digitalRead(GREEN_LED_PIN));
}
void greenLed_off(){
    digitalWrite(GREEN_LED_PIN, LOW);
}