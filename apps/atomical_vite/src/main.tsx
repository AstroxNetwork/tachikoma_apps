import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { ConfigProvider } from 'react-vant';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
