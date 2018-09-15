# On Transit App - Vehicles Locator Microservice

### Description
This microservice is used to obtain vehicle information closest to a GPS location

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
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Backend/Vehicles%20Locator%20Service/docs/Architecture.png" width="600px"/>
    </p>
</div>

On startup, it will launch N clusters (with N being the number of CPUs on the current machine). Each cluster will be running an Express app that will handle client requests. More information can be found on https://nodejs.org/api/cluster.html.

### Installation

##### Required Programs and Tools:
- Linux machine
- Node JS v8.0+ with NPM

##### Step 1: Install the packages
1. Open up the terminal and change the directory to the folder "Backend/Vehicles Locator Service" relative to the project directory.
2. Type the command `npm install`

##### Step 2: Set up the config file
1. Make a copy of the file "config_template.js" under the folder "Backend/Vehicles Locator Service/src/res", name it "config.js", and save it in the same directory.
2. Open up "config.js" and edit the port number for the app to use. Note that the port must be free to use. By default, the port number is 3001.

##### Step 3: Run the app
1. In the "Backend/Vehicles Locator Service" folder of the project directory, type in the command `npm start`. It should launch N processes; one process as the master process, and N - 1 child processes (with N being the number of CPUs on your machine).
2. It is done!

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono, the sole creator of this project.

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.