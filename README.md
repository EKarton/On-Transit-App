# On Transit App

### Description
Always having trouble finding when your next stop will be? Do you want to be notified immediately when your stop is nearby? Are you tired of typing which bus / train you are on to get the information you need?

The On Transit app may be a solution for you. Equipped with fast path detection algorithms, it automatically determines which train / bus you are taking based on your GPS location and time. Furthermore, it automatically determines when your next stop (or future stops) will be and can notify you if your stop is nearby with an alarm. 

The On Transit project is a full stack software development project. It is comprised of a Data Collector, a Mongo DB database, a REST Web API, and an Android application.

### Table of Contents
- Installation
- Usage
- Credits
- License

### Installation

##### Required Programs and Tools:
- Linux machine
- Mongo DB (optional: Mongo DB Compass)
- Node JS v8.0+
- Android Studio

##### Setting up Mongo DB
1. Install Mongo DB on your local machine.
2. Optionally, you can install Mongo DB Compass
3. Start Mongo DB by typing on the terminal `sudo service mongod start`

##### Run the Data Collector and get the latest transit data
1. First, in the terminal, navigate to "/backend/Data Collector" under the project directory
2. Then, type in `npm install` in the terminal. It will install all the dependent NPM packages.
3. Run the app by typing in the terminal `npm start`

##### Running the Web API locally
1. In the terminal (under the project directory), navigate to "/backend/Web API"
2. Then, type in `npm install` in the terminal. It will install all the dependent NPM packages.
3. Under "/backend/Web API/src/res" make a copy of "config_template.js" under the same
directory, rename it to "config.js", and change the following to these values:
	- <URI_TO_MONGODB_DATABASE>		The url to your local Mongo DB database
	- <NAME_TO_MONGODB_DATABASE>	The name of the database containing the data
	- <URI_TO_GTFS_REALTIME_VEHICLES_RESOURCE>: The url to where the GTFS realtime vehicles resource is at.
4. Run the app by typing in the terminal `npm start`. It will launch the Web API under port 3000.
5. Open the port to your local network by running in the command `sudo ufw allow 3000`. After running it the first time, run it again the second time.
6. Get your local network IP address by running the command `hostname -I`. Save this somewhere as we will need it for running the Android app.

##### Running the Android App
1. First, open up the Android app project in Android Studio which is under the projct directory "/frontend/android-app"
2. Next, navigate to then"app/src/main/res/values" folder, make a copy of the "google_maps_api_template.xml" file, and rename it to "google_maps_api.xml" in the same directory.
3. Follow the instructions on the "google_maps_api.xml" file to set up your Google Maps API key.
4. Next, in the "frontend/android-app/app/src/main/java/com/kartonoe/ontransitapp/services
" directory, open up the OnTransitWebService.java file and replace the value of the variable "SERVER_HOSTNAME" with the IP address you obtained in the previous steps.
5. Save the file.
6. Then, build the project.
7. Then, on the Android phone, enable the Developer Options by tapping the Build Number in the phone's settings five times.
8. Next, enable the Developer Options and enable USB debugging.
9. Lastly, install the app by clicking on the Run button. Select your device and it should launch.

### Usage
Please note that this project is used for educational purposes and it is not to be used commercially. We are not liable for any damages / changes done by this project

### Credits
Emilio Kartono, who made the entire project

### Licence
This project is protected under the MIT Licence. Please refer to LICENCE.txt for further details.