# On Transit App

### Description
Always having trouble finding when your next stop will be? Do you want to be notified  when your stop is nearby? Are you tired of typing which bus / train you are on to get the information you need?

The On Transit app may be a solution for you. Equipped with fast path detection algorithms, it automatically determines which train / bus you are taking based on your GPS location and time. Moreover, it automatically determines when your next stop (or future stops) will be and can notify you if your stop is nearby! 

The On Transit project is a full stack software development project. It is comprised of several microservices, a Mongo DB database, a data aggregator, and an Android application.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
This project is comprised of several components that work together to make the project very scalable and perform well.
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/System%20Architecture%20Image.png" width="600px"/>
    </p>
</div>

- Android App: Calls the API Gateway to obtain nearby transit routes and vehicles based on the phone's GPS location and time.
- API Gateway Microservice: It makes HTTP requests to the microservices to get the resources the client needs.
- Trips Locator Microservice: It performs parallel computations to predict the possible transit routes based on a GPS location and time.
- Trip Details Microservice: Given a trip ID, it will return the trip details such as its route name, route number, next stops, etc.
- Vehicles Locator Microservice: It predicts the possible vehicles the user may be on given the user's GPS location and time.
- Data Aggregator Service: It publishes clean data to the database for the microservices to efficiently use by obtaining raw data from the World Wide Web and passing it through a series of data filters / data aggregations.

Users will be using the Android app to get their possible transit routes and transit stops. In the app's homepage, they do not need to type in their transit route - it will already present to them the transit route they are on.

<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/App%20Home%20Page.jpg" width="300px"/>
    </p>
</div>

Swiping up will list the next stops.

<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/App%20Scroll%20Up.jpg" width="300px"/>
    </p>
</div>

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
1. Please follow the Data Aggregator Service's README.md in the folder "Backend/Data Aggregator Service" to see how to get the latest transit data.

##### Step 3: Running the Trips Locator Microservice
1. Please follow the README.md file in the folder "Backend/Trips Locator Service" to see how to install and run the Trips Locator microservice.

##### Step 4: Running the Trip Details Microservice
1. Please follow the README.md file in the folder "Backend/Trip Details Service" to see how to install and run the Trip Details Microservice.

##### Step 5: Running the Vehicles Locator Microservice
1. Please follow the README.md file in the folder "Backend/Vehicles Locator Service" to see how to install and run the Vehicles Locator Microservice.

##### Step 6: Running the API Gateway Microservice
1. Please follow the README.md file in the folder "Backend/API Gateway Service" to see how to install and run the API Gateway Microservice.
2. Open the port to your local network by running the comnmand `sudo ufw allow 3000`. After running the command for the first time, run it again for the second time to confirm.

##### Step 7: Installing and running the Android App
1. Get your local network IP address by running the command `hostname -I`. Remember it as we will need it for running the Android app.
2. Please refer to the README.md file in the folder "Frontend/android-app" to see how to install and run the Android app on your local phone with the IP address you remembered from the previous step.

### Usage
Please note that this project is used for educational purposes and it is not to be used commercially. We are not liable for any damages / changes done by this project

### Credits
Emilio Kartono, who made the entire project

### Licence
This project is protected under the MIT Licence. Please refer to LICENCE.txt for further details.