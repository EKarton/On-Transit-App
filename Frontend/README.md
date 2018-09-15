##### Step 4: Running the Android App
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