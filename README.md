# mqtt-unifi-access-bridge

This is a simple docker container that I use to bridge UniFi access with my MQTT bridge.

I have a collection of bridges, and the general format of these begins with these environment variables:

```
      TOPIC_PREFIX: /your_topic_prefix  (eg: /some_topic_prefix/somthing)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
      (OPTIONAL) MQTT_STATUS_TOPIC_PREFIX: '/status_prefix/'
```

This will publish and (optionally) subscribe to events for this bridge with the TOPIC_PREFIX of you choosing.

Generally I use 0 as 'off', and 1 as 'on' for these.

Here's an example docker compose:

```
version: '3.3'
services:
  mqtt-unifi-access-bridge:
    image: ghcr.io/terafin/mqtt-unifi-access-bridge:latest
    environment:
      LOGGING_NAME: mqtt-unifi-access-bridge
      ACCESS_URL: URL_FOR_UNIFI_ACCESS_LOGIN (eg: https://10.0.1.2)
      USERNAME: YOUR_USERNAME_FOR_ABOVE_URL
      PASSWORD: YOUR_PASSWORD_FOR_ABOVE_URL
      POLL_FREQUENCY: 1
      TOPIC_PREFIX: /your_topic_prefix  (eg: /unifi_access)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
      (OPTIONAL) MQTT_STATUS_TOPIC_PREFIX: '/status_prefix/' (note, it will use logging-name appended to this)
```

Here's an example publish for some of my cameras:

```
/unifi_access/main_door/unlocked:bob
```
