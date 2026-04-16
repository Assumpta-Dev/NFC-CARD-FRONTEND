// ===========================================================
// APPLICATION ENTRY POINT
// ===========================================================
// This file is the single entry point that Vite uses.
// It mounts the React app into the <div id="root"> element
// defined in index.html.
//
// React 18's createRoot API enables concurrent features like
// Suspense and automatic batching — a meaningful upgrade from
// ReactDOM.render() used in React 17 and earlier.
//
// StrictMode is enabled in development:
//   - Intentionally double-invokes render functions and effects
//     to surface components that have side effects in render
//   - Warns about deprecated lifecycle methods and APIs
//   - Has zero impact on the production build
// ===========================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles — includes Tailwind base/components/utilities
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
