#include <Arduino.h>
#include <ESP32Servo.h>
#include "wheel.h"

Servo servoL;
Servo servoR;

void initServos() {
  servoL.attach(SERVO_L_PIN);
  servoR.attach(SERVO_R_PIN);
}

void servosStop(){
    servoL.write(85);
    // Fix miss calibrated servo
    servoR.write(90);
}

void servos(byte left, byte right){
    servoL.write(left);
    servoR.write(right);
}