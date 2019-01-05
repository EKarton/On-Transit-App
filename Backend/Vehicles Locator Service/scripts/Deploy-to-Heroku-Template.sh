PACKAGE_DOT_JSON_FOLDER="./../src"
HEROKU_APP_NAME="<ENTER-APP-NAME>"
TMP_FOLDER="/tmp/on-transit-app"

cd ${PACKAGE_DOT_JSON_FOLDER}
rm -rf ${TMP_FOLDER}
mkdir ${TMP_FOLDER}
cp -r ${PACKAGE_DOT_JSON_FOLDER}/* ${TMP_FOLDER}
cd ${TMP_FOLDER}

git init
heroku login
heroku git:remote -a ${HEROKU_APP_NAME}
git add --all
git commit -m "Pushing to Heroku"
git push heroku master --force