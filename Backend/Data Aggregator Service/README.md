# On Transit App - Data Aggregation Service

### Description
This application is used to download, parse, and aggregate large GTFS data into a database for other microservices. It utilizes several processes and steps to process data faster.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
Below is a high level architecture of the Data Aggregation Service
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Backend/Data%Aggregator%20Service/docs/High%20Level%20Architecture.png" width="600px"/>
    </p>
</div>

Below is a more detailed architecture of how data gets processed from the source to the data used in production.
Data moves from the source to production in order from left to right in the diagram below.
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Backend/Data%Aggregator%20Service/docs/Detailed%20Architecture.png" width="600px"/>
    </p>
</div>

### Installation

##### Required Programs and Tools:
- Linux machine
- Node JS v8.0+ with NPM
- Local MongoDB

##### Step 1: Install the packages
1. Open up the terminal and change the directory to the folder "Backend/Data Aggregator Service" relative to the project directory.
2. Type the command `npm install`

##### Step 2: Set up the config file
1. Make a copy of the file "config_template.js" under the folder "Backend/Data Aggregator Service/src/res", name it "config.js", and save it in the same directory.
2. Open up "config.js" and change the GTFS_STATIC_RESOURCE property to the URL of where the GTFS Static Files are provided from the vendor.

##### Step 3: Run the app
1. In the "Backend/Data Aggregator Service" folder create a new directory called "tmp". 
2. Under that new directory "tmp", create a new directory called "raw-transit-files".
3. In the "Backend/Data Aggregator Service" folder of the project directory, type in the command `npm start`. It will take a while to complete!
4. It is done!

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.