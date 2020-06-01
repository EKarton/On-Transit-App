# On Transit App - The Web App

## Description
The web app is a front-facing application that is used to display routes, predict user locations, and dispatch notifications.

## Table of Contents
- Installation
- Usage
- Credits
- License

## Overview of UI:
When users land on the web page, the app detects which bus the user is on. If there is more than one possible bus the user is on, it will ask the user which bus they are on from the list of possible busses obtained.

<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/images/route-picker.png"/>
    </p>
</div>

Once a route is selected, the route's path and its stops are shown on the webpage. It will also predict and display the vehicle's location. Furthermore, users can create a notification for a particular stop by clicking on one of the stops.

<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/images/webapp-made-notification.png"/>
    </p>
</div>

When the user is 5 minutes before reaching their stop, they will be notified:

<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Documentation/images/webapp-dispatch-notification.png"/>
    </p>
</div>

## Installation

#### Pre-requisites:
You will need:
- A unix-based machine
- Node v8.0 +
- Npm v6.5 +

#### Step 1:
- Install all dependencies by typing the command ```npm install``` in the folder ```Frontend/Web App``` located at the project directory.

## Available Scripts:

- In the project directory, you can run:

- #### `npm start`

    Runs the app in the development mode.<br>
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

    The page will reload if you make edits.<br>
    You will also see any lint errors in the console.

- #### `npm test`

    Launches the test runner in the interactive watch mode.<br>
    See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

- #### `npm run build`

    Builds the app for production to the `build` folder.<br>
    It correctly bundles React in production mode and optimizes the build for the best performance.

    The build is minified and the filenames include the hashes.<br>
    Your app is ready to be deployed!

    See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

- #### `npm run eject`

    **Note: this is a one-way operation. Once you `eject`, you can’t go back!**

    If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

    Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

    You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.


### Deploying on Heroku
1. Authenticate with Heroku:
    ```bash
    heroku auth:login
    heroku container:login
    ```

2. Make a file called ```.env.production``` and store your keys into this file

3. Run the following:
    ```bash
    docker build -t on_transit_app .
    docker tag on_transit_app registry.heroku.com/on-transit-app/web
    docker push registry.heroku.com/on-transit-app/web
    heroku container:release web --app on-transit-app
    ```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

## Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

## Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

## Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

## Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

You can also deploy it on Heroku:
- Step 0: Get Heroku CLI on your machine as well as creating a Heroku app on your Heroku account.
- Step 1: Make a copy of the file ```Deploy-to-Heroku-Template.sh``` in the folder ```scripts``` with the new file name ```Deploy-to-Heroku.sh```.
- Step 2: Inside the ```Deploy-to-Heroku.sh``` file, set the variable ```HEROKU_APP_NAME``` to the app name you have made on Heroku.
- Step 3: In the terminal, run the command ```sh scripts/Deploy-to-Heroku.sh``` in the Web App folder. Follow the onboarded instructions.

## `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
