#include <ArduinoMqttClient.h>
#include <WiFiNINA.h>
#include <Adafruit_SleepyDog.h>
#include <EncoderStepCounter.h>
#include <SPI.h>

#include "secrets.h"
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid[] = SECRET_SSID;  // your network SSID (name)
char pass[] = SECRET_PASS;  // your network password (use for WPA, or use as key for WEP)

WiFiSSLClient wifiClient;
MqttClient mqttClient(wifiClient);

const char broker[] = "io.zongzechen.com";
int port = 8883;
const char topic[] = "undo";

const int numOfReadings = 10;
int leverReadings[numOfReadings];
int readIndex = 0;
int lastLeverReading = 0;
int leverThreshold = 5;

EncoderStepCounter encoder1(ENCODER_PIN1, ENCODER_PIN2);
EncoderStepCounter encoder2(ENCODER_PIN3, ENCODER_PIN4);
EncoderStepCounter encoder3(ENCODER_PIN5, ENCODER_PIN6);
EncoderStepCounter encoder4(ENCODER_PIN7, ENCODER_PIN8);

char topics[4][10] = { "scroll1", "scroll2", "scroll3", "rotate" };
int oldPositions[4] = { 0, 0, 0, 0 };

int lastClearButtonState = 0;
int lastCallSwitchState = 0;

long lastSendTime = 0;
int sendInterval = 100;

void setup() {
  Watchdog.enable(8000);
  pinMode(CALL_SWITCH, INPUT);
  pinMode(CLEAR_BUTTON, INPUT);
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
    delay(1000);
  }
  Serial.println("You're connected to the network");
  Serial.println();
  Watchdog.reset();

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
    leverReadings[i] = 0;
  }

  encoder1.begin();
  encoder2.begin();
  encoder3.begin();
  encoder4.begin();
  attachInterrupt(ENCODER_INT1, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT2, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT3, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT4, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT5, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT6, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT7, interrupt, CHANGE);
  attachInterrupt(ENCODER_INT8, interrupt, CHANGE);
  pinMode(CLEAR_BUTTON, INPUT_PULLUP);

  Watchdog.reset();
}

void interrupt() {
  encoder1.tick();
  encoder2.tick();
  encoder3.tick();
  encoder4.tick();
}

void loop() {
  updateLever();
  if (wifiClient.status() != 4 && mqttClient.connected() != 1) return;
  if (millis() - lastSendTime < sendInterval) return;

  mqttClient.poll();

  for (int i = 0; i < 4; i++) {
    int position;
    if (i == 0) {
      position = encoder1.getPosition();
    } else if (i == 1) {
      position = encoder2.getPosition();
    } else if (i == 2) {
      position = encoder3.getPosition();
    } else if (i == 3) {
      position = encoder4.getPosition();
    }
    if (position != oldPositions[i]) {
      int result;
      if (position > oldPositions[i]) {
        result = 1;
      }
      if (position < oldPositions[i]) {
        result = 0;
      }
      oldPositions[i] = position;
      Serial.print("Send encoder: ");
      mqttClient.beginMessage(topic);
      mqttClient.print(topics[i]);
      mqttClient.print(":");
      mqttClient.print(result);
      mqttClient.endMessage();
      Serial.println(result);
    }
  }
  int clearButtonState = digitalRead(CLEAR_BUTTON);
  if (clearButtonState != lastClearButtonState && clearButtonState == 0) {
    Serial.print("Send button: ");
    mqttClient.beginMessage(topic);
    mqttClient.print("clear:");
    mqttClient.print(clearButtonState);
    mqttClient.endMessage();
    Serial.println(clearButtonState);
  }
  lastClearButtonState = clearButtonState;

  int callSwitchState = digitalRead(CALL_SWITCH);
  Serial.print("Send switch: ");
  mqttClient.beginMessage(topic);
  mqttClient.print("call:");
  mqttClient.print(callSwitchState);
  mqttClient.endMessage();
  Serial.println(callSwitchState);

  int leverReading = readLever();
  if (abs(leverReading - lastLeverReading) > leverThreshold) {
    Serial.print("Send potentiometer: ");
    mqttClient.beginMessage(topic);
    mqttClient.print("lever:");
    mqttClient.print(leverReading);
    mqttClient.endMessage();
    Serial.println(leverReading);
    lastLeverReading = leverReading;
  }

  //sendAlive();
  lastSendTime = millis();
  Watchdog.reset();

  // call poll() regularly to allow the library to send MQTT keep alives which
  // avoids being disconnected by the broker
}

int updateLever() {
  int reading = analogRead(LEVER_PIN);
  leverReadings[readIndex] = reading;
  readIndex++;
  if (readIndex >= numOfReadings) { readIndex = 0; }
}

int readLever() {
  int sum = 0;
  for (int i = 0; i < numOfReadings; i++) {
    sum += leverReadings[i];
  }
  int average = sum / numOfReadings;
  //Serial.println(average);
  return average;
}

void sendAlive() {
  Serial.println("Send alive");
  mqttClient.beginMessage(topic);
  mqttClient.print("alive:");
  mqttClient.print(1);
  mqttClient.endMessage();
}
