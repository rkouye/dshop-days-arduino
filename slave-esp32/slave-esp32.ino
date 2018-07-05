#include <PubSubClient.h>
#include <WiFi.h>

#include "credential.h"
#include "led.h"
#include "wheel.h"

WiFiClient espClient;
PubSubClient client(espClient);

int lastCmd = 0;

void receivedCallback(char* topic, byte* payload, unsigned int length) {
  lastCmd = millis();
  greenLed_on();
  
  // For debug
  Serial.print("Message received: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Handle command type
  // B0 : Blue Led on, B1 : Blue Led off
  // M{L}{R} : Pass L and R as byte to the servos 
  switch((char)payload[0]){
    // BLUE LED
    case 'B' :
    switch((char)payload[1]) {
      case '0' :
      blueLed_off();
      break;
      case '1' :
      blueLed_on();
      break; 
    }
    break;
    // Servos
    case 'M' :
      servos(payload[1], payload[2]);
    break;
  }

}

void mqttconnect() {
  /* Loop until reconnected */
  greenLed_off();
  while (!client.connected()) {
    Serial.print("MQTT connecting ...");
    /* client ID */
    String clientId = "ESP32_Team3_Client";
    /* connect now */
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      /* subscribe topic with default QoS 0*/
      client.subscribe(TOPIC_SLAVE);
      greenLed_on();
    } else {
      Serial.print("failed, status code =");
      Serial.print(client.state());
      Serial.println("try again in 2 seconds");
      delay(2000);
    }
  }
}

void setup()
{
  // Init Leds
  initLeds();

  // Init Servos
  initServos();
  
  // Init Serial
  Serial.begin(115200);

  // BLUE LED ON FOR WIFI SETUP
  blueLed_on();
  
  delay(1000);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  delay(1000);
  String mac = WiFi.macAddress();
  Serial.println(mac);

 
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi..");
    // BLUE LED TOGGLE WHILE LOOKING FOR WIFI
    blueLed_toggle();
  }
 
  Serial.println("Connected to the WiFi network");
  // BLUE LED OFF WHEN GOOD
  blueLed_off();

  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(receivedCallback);
}

void loop()
{
  // USE Green LEd
  if (!client.connected()) {
    // EMERGENCY STOP
    servosStop();
    blueLed_off();
    
    // RECONNECT
    mqttconnect();
  }
  // FREE TO USE BLUE LED
  client.loop();

  // No Command since too long (0.2 seconds)
  if (millis() - lastCmd > 200){
    // EMERGENCY STOP
    servosStop();
    greenLed_toggle();
    delay(200);
  }
}
