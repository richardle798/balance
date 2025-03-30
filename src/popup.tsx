import React from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

const Popup: React.FC = () => {
  return (
    <div className="popup-container">
      <h1>React Chrome Extension</h1>
      <p>This is a popup component built with React and TypeScript!</p>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Popup />); 