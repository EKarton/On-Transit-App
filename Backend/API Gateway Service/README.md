# On Transit App - API Gateway Service

### Description
This microservice is used to control the REST API requests to multiple microservices from one common endpoint. It is used for increased security and efficiency.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
This microservice is comprised of several clusters that work together to make it very scalable.
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/System%20Architecture%20Image.png" width="600px"/>
    </p>
</div>

On startup, it will launch N clusters (with N being the number of CPUs on the current machine). Each cluster will be running an Express app that will handle client requests. More information can be found on https://nodejs.org/api/cluster.html.

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
1. Please follow the Data Aggregator Service's README.md in the folder "Backend/Data Aggregator Service" to see how to get the latest transit data locally.

##### Step 3: Running the Trips Locator Microservice
1. Please follow the README.md file in the folder "Backend/Trips Locator Service" to see how to install and run the Trips Locator microservice locally.

##### Step 4: Running the Trip Details Microservice
1. Please follow the README.md file in the folder "Backend/Trip Details Service" to see how to install and run the Trip Details Microservice locally.

##### Step 5: Running the Vehicles Locator Microservice
1. Please follow the README.md file in the folder "Backend/Vehicles Locator Service" to see how to install and run the Vehicles Locator Microservice locally.

##### Step 6: Running the API Gateway Microservice
1. Please follow the README.md file in the folder "Backend/API Gateway Service" to see how to install and run the API Gateway Microservice locally.
2. Open the port to your local network by running the comnmand `sudo ufw allow 3000`. After running the command for the first time, run it again for the second time to confirm.

##### Step 7: Installing and running the Android App
1. Get your local network IP address by running the command `hostname -I`. Save this as it is needed to allow the Android app to connect to the API Gateway Microservice.
2. Please refer to the README.md file in the folder "Frontend/android-app" to see how to install and run the Android app on your local phone with the IP address you saved from the previous step.

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.