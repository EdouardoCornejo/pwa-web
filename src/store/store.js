import { configureStore, compose, applyMiddleware } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import { rootReducer } from '../reducers/rootReducer';

const composeEnhancers = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export const store = configureStore(
    rootReducer,
    composeEnhancers(
        applyMiddleware(thunk)
    )
);