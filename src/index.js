import React from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarApp } from './CalendarApp';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './styles.css';

const container = document.getElementById('root');

const root = createRoot(container);
root.render(
  <CalendarApp />,
);

serviceWorkerRegistration.register();