#include <ArduinoMqttClient.h>
#include <WiFiNINA.h>
#include <Adafruit_SleepyDog.h>
#include <EncoderStepCounter.h>
#include <SPI.h>

#include "arduino_secrets.h"
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid[] = SECRET_SSID;  // your network SSID (name)
char pass[] = SECRET_PASS;  // your network password (use for WPA, or use as key for WEP)

WiFiSSLClient wifiClient;
MqttClient mqttClient(wifiClient);

const char broker[] = "io.zongzechen.com";
int port = 8883;
const char topic[] = "undo-";

const int numOfReadings = 10;
int pm1Readings[numOfReadings];
int readIndex = 0;

EncoderStepCounter encoder(ENCODER_PIN1, ENCODER_PIN2);
int oldPosition = 0;

int lastButtonState = 0;

long lastSendTime = 0;
int sendInterval = 100;

void setup() {
  pinMode(BUTTON_PIN, INPUT);
  Watchdog.enable(8000);
  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  // while (!Serial) {
  //   ; // wait for serial port to connect. Needed for native USB port only
  // }

  // attempt to connect to WiFi network:
  Serial.print("Attempting to connect to WPA SSID: ");
  Serial.println(ssid);
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    // failed, retry
    Serial.print(".");
    delay(5000);
  }

  Serial.println("You're connected to the network");
  Serial.println();

  // You can provide a unique client ID, if not set the library uses Arduino-millis()
  // Each client must have a unique client ID
  // mqttClient.setId("clientId");

  // You can provide a username and password for authentication
  // mqttClient.setUsernamePassword("username", "password");

  Serial.print("Attempting to connect to the MQTT broker: ");
  Serial.println(broker);

  mqttClient.setUsernamePassword(MQTT_USER, MQTT_PASS);

  if (!mqttClient.connect(broker, port)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());

    while (1)
      ;
  }

  Serial.println("You're connected to the MQTT broker!");
  Serial.println();

  for (int i = 0; i < numOfReadings; i++) {
    pm1Readings[i] = 0;
  }

  encoder.begin();
  attachInterrupt(ENCODER_INT1, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT2, interrupt, CHANGE);

  Watchdog.reset();
}

void interrupt() {
  encoder.tick();
}

void loop() {
  if (wifiClient.status() != 4 && mqttClient.connected() != 1) return;
  if (millis() - lastSendTime < sendInterval) return;

  mqttClient.poll();

  int position = encoder.getPosition();

  if (position != oldPosition) {
    int result = 0;
    if (position > oldPosition) {
      result = 1;
    }
    if (position < oldPosition) {
      result = 0;
    }
    oldPosition = position;
    Serial.print("Send encoder: ");
    mqttClient.beginMessage(topic);
    mqttClient.print("encoder:");
    mqttClient.print(result);
    mqttClient.endMessage();
    Serial.println(result);
  }

  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState != lastButtonState && buttonState == HIGH) {
    Serial.print("Send button: ");
    mqttClient.beginMessage(topic);
    mqttClient.print("button:");
    mqttClient.print(buttonState);
    mqttClient.endMessage();
    Serial.println(buttonState);
  }
  lastButtonState = buttonState;

  int pmReading = analogRead(A7);
  Serial.print("Send potentiometer: ");
  mqttClient.beginMessage(topic);
  mqttClient.print("potentiometer:");
  mqttClient.print(pmReading);
  mqttClient.endMessage();
  Serial.println(pmReading);

  lastSendTime = millis();
  Watchdog.reset();

  // call poll() regularly to allow the library to send MQTT keep alives which
  // avoids being disconnected by the broker
}

int readPotentiometer1() {
  int reading = analogRead(A7);
  pm1Readings[readIndex] = reading;
  readIndex++;
  if (readIndex >= numOfReadings) { readIndex = 0; }
  int sum = 0;
  for (int i = 0; i < numOfReadings; i++) {
    sum += pm1Readings[i];
  }
  int average = sum / numOfReadings;
  Serial.println(average);
  return average;
}
