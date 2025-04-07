import React, { useState } from 'react';

interface AddDomainProps {
  onAddDomain: (domain: string) => void;
}

const AddDomain: React.FC<AddDomainProps> = ({ onAddDomain }) => {
  const [newDomain, setNewDomain] = useState('');

  const handleAddDomain = () => {
    const trimmedDomain = newDomain.trim();
    if (trimmedDomain) {
      setNewDomain('');
      onAddDomain(trimmedDomain);
    }
  };

  const handleAddCurrentDomain = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        onAddDomain(url.hostname);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddDomain();
    }
  };

  return (
    <div className="add-domain-section">
      <div className="domain-input">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter domain to block (e.g., facebook.com)"
        />
        <button onClick={handleAddDomain}>Add</button>
      </div>
      <div className="current-domain-section">
        <button 
          className="current-domain-button"
          onClick={handleAddCurrentDomain}
        >
          Block Current Domain
        </button>
      </div>
    </div>
  );
};

export default AddDomain; 