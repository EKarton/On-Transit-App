# On Transit App

### Description
Do you sleep or work during your commute? Do you often miss your stop because of that? Are you frusterated in finding when and where your stop will take place during your commute? Do you want to be notified when your stop is coming?

The On Transit app may be the solution for you. Equipped with a fast trip detection algorithms, it automatically predicts which bus / train you are taking based on your GPS location and time. Moreover, you can create alarms for your bus stop, which notifies you when your stop is approaching! 

The On Transit project is a full stack software development project. The backend is comprised of several microservices, a Mongo DB database, and a data processor app. The frontend is a React web app and an Android app.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### System Architecture
This project is comprised of several components that work together to make the project very scalable while maintaining high performance.
<div width="100%">
    <p align="center">
<img src="Documentation/System%20Architecture%20Image.png" width="100%"/>
    </p>
</div>

- Android / Web App: Calls the API Gateway to obtain nearby transit routes and vehicles based on the device's GPS location and time.
- API Gateway Microservice: Makes HTTP requests to the microservices to get the resources the client needs.
- Trips Locator Microservice: Performs parallel computations to predict the possible transit routes based on a GPS location and time.
- Trip Details Microservice: Given a trip ID, it returns the trip details such as its route name, route number, next stops, etc.
- Vehicles Locator Microservice: Predicts the possible vehicles the user may be on given the user's GPS location and time.
- Data Aggregator Service: Publishes clean data to the database for the microservices to efficiently use by obtaining raw data from the World Wide Web and passing it through a series of data filters / data aggregations.

### Overview of Web App
Users are able to determine which bus they are on, and dispatch alerts when their stop is approaching via a web browser. The notification is dispatched via the computer's notification panel. The UI looks like this:

<div width="100%">
    <p align="center">
<img src="Frontend/Web%20App/docs/notification-dispatched.png" width="80%"/>
    </p>
</div>

More details on the UI can be seen in the [README file](Frontend/Web%20App)

### Overview of Android App
Users can also use the Android app to know which bus they is on, and be notified when their stop is approaching.

<div width="100%">
    <p align="center">
<img src="Frontend/Android%20App/docs/AndroidApp-Route-View.jpg" width="200px"/>
<img src="Frontend/Android%20App/docs/AndroidApp-StopDetails-View.jpg" width="200px"/>
<img src="Frontend/Android%20App/docs/AndroidApp-AlarmDispatched-View.jpg" width="200px"/>
    </p>
</div>

 More details on the UI can be seen in the [README file](Frontend/Android%20App)

### Installation

##### Required Programs and Tools:
- Linux machine
- Mongo DB (optional: Mongo DB Compass)
- Node JS v8.0+
- Android Studio

##### Step 1: Setting up Mongo DB
1. Install Mongo DB on your local machine.
2. Optionally, you can install Mongo DB Compass
3. Start Mongo DB by typing on the terminal `sudo service mongod start`

##### Step 2: Run the Data Aggregator service to get the latest transit data
1. Please follow the installation section of [README file](Backend/Data%20Aggregator%20Service) to see how to get the latest transit data locally.

##### Step 3: Running the Trips Locator Microservice
1. Please follow the installation section of [README file](Backend/Trips%20Locator%20Service) to see how to install and run the Trips Locator microservice locally.

##### Step 4: Running the Trip Details Microservice
1. Please follow the installation section of [README file](Backend/Trip%20Details%20Service) to see how to install and run the Trip Details Microservice locally.

##### Step 5: Running the Vehicles Locator Microservice
1. Please follow the installation section of [README file](Backend/Vehicles%20Locator%20Service) to see how to install and run the Vehicles Locator Microservice locally.

##### Step 6: Running the API Gateway Microservice
1. Please follow the installation section of [README file](Backend/API%20Gateway%20Service) to see how to install and run the API Gateway Microservice locally.
2. Open the port to your local network by running the comnmand `sudo ufw allow 3000`. After running the command for the first time, run it again for the second time to confirm.

##### Step 7: Running the Web App
1. Please follow the installaton section of [README file](Frontend/Web%20App) to see how to install and run the web app locally.

##### Step 8: Installing and running the Android App
1. Get your local network IP address by running the command `hostname -I`. Save this as it is needed to allow the Android app to connect to the API Gateway Microservice.
2. Please follow the installation section of [README file](Frontend/Android%20App) to install and run the Android app on your local phone with the IP address you saved from the previous step.

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.