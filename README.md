# Regulapp Web App Port

## Introduction
This project aims to port an existing Android application to a Progressive Web App (PWA). By converting the app to a web-based platform, we achieve several advantages over traditional app deployment methods.
It is based on this very helpful tutorial and example provided by [Rui Santos](https://github.com/RuiSantosdotme) on GitHub: [esp32-web-ble](https://github.com/RuiSantosdotme/esp32-web-ble).

## Advantages of using Progressive Web App (PWA)
- **No App Store Management and Deployment:** With a PWA, there's no need to go through the process of app store submissions and approvals. Users can access and install the app directly from the web, simplifying deployment.
- **Compatibility:** PWAs are compatible with a wide range of devices and platforms, including desktops, laptops, tablets, and mobile devices. This ensures a consistent user experience across different devices.
- **Easier to Update:** Updating a PWA is seamless and instantaneous. There's no waiting for users to download and install updates from the app store. Changes to the web app are reflected immediately upon the next visit or refresh.
- **Desktop and Mobile Support:** Since PWAs are essentially web pages, they are accessible from both desktop and mobile browsers. Users can interact with the app regardless of their device type.
- **Offline Access:** Using PWA features like service workers, the app can be installed and accessed even when the user is offline. This enables continued functionality and access to cached data even in the absence of an internet connection.

## JavaScript Bluetooth API
The web app utilizes the JavaScript Bluetooth API to establish communication with the device. This API provides a standardized way for web applications to interact with Bluetooth devices, enabling features like device discovery, connection, data exchange, and service exploration.

## Integrated Features
The following features have been successfully integrated into the web app:
- **Connection to BLE Device and Service:** The app establishes a connection with the Bluetooth Low Energy (BLE) device and accesses the required service for data exchange.
- **Sensor Measurements:** It retrieves sensor measurements from the connected device, including pH, temperature, salt level, and redox potential.
- **Electrolysis Percentage:** The app displays the percentage of electrolysis achieved based on the data received from the device.

## Getting Started
To access this app just go to https://corelecrd.github.io
