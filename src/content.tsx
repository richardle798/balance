import React from 'react';
import { createRoot } from 'react-dom/client';

const Content: React.FC = () => {
  return (
    <div id="chrome-extension-content-root">
      <p>Content script loaded!</p>
    </div>
  );
};

// Create a container for our React app
const container = document.createElement('div');
container.id = 'chrome-extension-content-root';
document.body.appendChild(container);

// Render our React app
const root = createRoot(container);
root.render(<Content />);