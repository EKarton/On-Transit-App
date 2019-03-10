# On Transit App - Android App

### Description
The Android app is used to help users understand which bus / train the user is on, and dispatch alerts when their stop is nearby. The goal of this app is to prevent users from missing their bus / train stop.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
When the user launches the app, it will fetch the nearby trips from their location and time:
<div width="50%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Frontend/Android%20App/docs/AndroidApp-GettingTrips-View.jpg" width="600px"/>
    </p>
</div>

When it detects that the user can be on more than one possible bus / train, it will present with them an option to choose which bus / train the user is on:

Once the user selects a trip, it will fetch the trip details including their stop details:

Users can swipe up and select which stop to create the alarm:

When the alarm is dispatched, it will present them a screen giving them the option to dismiss the alarm or snooze the alarm:

### Installation

##### Required Programs and Tools:
- Linux machine
- Android Studio

##### Step 1: Open up Android Studio
1. Open up the terminal and change the directory to the folder "Backend/Trip Details Service" relative to the project directory.
2. Type the command `npm install`

##### Step 2: Set up Google Maps API Key
1. Inside the directory `app/src/debug/res/values`, open the file `google_maps_api_template.xml` and follow the steps there. Don't skip this step!

##### Step 3: Run the app
1. In Android Studio, click on the `run` button. Select either an emulator or your Android device. It should then display the app.

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.