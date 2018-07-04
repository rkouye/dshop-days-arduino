#include <PubSubClient.h>
#include <WiFi.h>

const char* ssid = "";
const char* password = "";
const char* mqtt_server = "";
WiFiClient espClient;
PubSubClient client(espClient);

#define LED_TOPIC     "" 

void receivedCallback(char* topic, byte* payload, unsigned int length) {
  
  Serial.print("Message received: ");
  Serial.println(topic);

  Serial.print("payload: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  
  Serial.println();
  /* we got '1' -> on */
  if ((char)payload[0] == '1') {
    digitalWrite(LED_BUILTIN, HIGH); 
  } else {
    /* we got '0' -> on */
    digitalWrite(LED_BUILTIN, LOW);
  }

}

void mqttconnect() {
  /* Loop until reconnected */
  while (!client.connected()) {
    Serial.print("MQTT connecting ...");
    /* client ID */
    String clientId = "ESP32_Team3_Client";
    /* connect now */
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      /* subscribe topic with default QoS 0*/
      client.subscribe(LED_TOPIC);
    } else {
      Serial.print("failed, status code =");
      Serial.print(client.state());
      Serial.println("try again in 5 seconds");
      /* Wait 5 seconds before retrying */
      delay(5000);
    }
  }
}

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  
  Serial.begin(115200);
  delay(1000);
  WiFi.begin(ssid, password);
  delay(1000);
  String mac = WiFi.macAddress();
  Serial.println(mac);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println("Connected to the WiFi network");

  client.setServer(mqtt_server, 1883);
  client.setCallback(receivedCallback);
}

void loop()
{
  if (!client.connected()) {
    mqttconnect();
  }
  client.loop();
}