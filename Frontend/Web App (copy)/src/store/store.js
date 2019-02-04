import { createStore, applyMiddleware } from "redux";
import createSagaMiddleware from 'redux-saga'
import { all } from "redux-saga/effects";
import routeChooserSagas from "../sagas/nearby-trips-sagas";
import locationSagas from "../sagas/geolocation-sagas";
import selectTripSagas from "../sagas/select-trip-sagas";
import rootReducer from "../reducers/root-reducer";

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

function* rootSagas(){
    yield all([routeChooserSagas(), locationSagas(), selectTripSagas()]);
};

sagaMiddleware.run(rootSagas);