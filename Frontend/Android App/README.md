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
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Backend/Trip%20Details%20Service/docs/Architecture.png" width="600px"/>
    </p>
</div>

When it detects that the user can be on more than one possible bus / train, it will present with them an option to choose which bus / train the user is on:

Once the user selects a trip, it will fetch the trip details including their stop details:

Users can swipe up and select which stop to create the alarm:

When the alarm is dispatched, it will present them a screen giving them the option to dismiss the alarm or snooze the alarm:

### Installation

##### Required Programs and Tools:
- Linux machine
- Node JS v8.0+ with NPM

##### Step 1: Install the packages
1. Open up the terminal and change the directory to the folder "Backend/Trip Details Service" relative to the project directory.
2. Type the command `npm install`

##### Step 2: Set up the config file
1. Make a copy of the file "config_template.js" under the folder "Backend/Trip Details Service/src/res", name it "config.js", and save it in the same directory.
2. Open up "config.js" and edit the port number for the app to use. Note that the port must be free to use. By default, the port number is 3003.

##### Step 3: Run the app
1. In the "Backend/Trip Details Service" folder of the project directory, type in the command `npm start`. It should launch N processes; one process as the master process, and N - 1 child processes (with N being the number of CPUs on your machine).
2. It is done!

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.