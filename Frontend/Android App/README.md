# On Transit App - The Android App

### Description
The Android app is the front facing application that is used to display the possible trips and trip schedules, as well as making alarms.

### Table of Contents
- Installation
- Usage
- Credits
- License

### Installation

##### Pre-requisites:
You need to first have:
- Windows / Mac / Linux workstation
- Android Studio
- Android Phone
- Working instance of all the micro services. If not, refer to this [README.md](https://github.com/EKarton/On-Transit-App/blob/master/README.md) file.

##### Step 1: Connecting the Android App to the API Gateway Microservice.
1. First, get the IP address and the port number of the API Gateway Microservice.
2. Next, in the "Frontend/Android App/app/src/main/java/com/kartonoe/ontransitapp/services
" directory (which is in the main project directory), open up the OnTransitWebService.java file.

    Then, replace the value of the variable "SERVER_HOSTNAME" with the IP address, then a ":", followed by the port number which you have obtained from the previous step.

    For instance, if the IP address is 192.168.100.177 and the port number is 3000, then the value of SERVER_HOSTNAME should be "192.168.100.177:3000"

3. Save the OnTransitWebService.java file.

##### Step 2: Adding the Google Maps API Key to the Android App
1. First, navigate to then"app/src/main/res/values" folder.
2. Make a copy of the "google_maps_api_template.xml" file, rename it to "google_maps_api.xml", and save it in the same directory.
3. Open the file "google_maps_api.xml" and follow the instructions in that file to set up your Google Maps API key.
4. Save the file.

##### Step 3: Running the Android App
1. Launch Android Studio and open the project which is located in the directory "Frontend/Android App" relative to the project directory.
2. Next, build the project.
3. Then, on the Android phone, enable the Developer Options by tapping the Build Number in the phone's settings five times.
4. Next, enable the Developer Options and enable USB debugging.
5. Lastly, install the app by clicking on the Run button. Your physical device should appear. Select your device and it should launch.

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.