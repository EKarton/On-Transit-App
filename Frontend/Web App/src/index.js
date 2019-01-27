import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app/App';
import store from "./stores/index";
import { addArticle } from "./actions/index";

ReactDOM.render(
    <App/>, 
    document.getElementById('root')
);

window.store = store;
window.addArticle = addArticle;