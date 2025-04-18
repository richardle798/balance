import React, { useEffect, useState } from 'react';

interface AddDomainProps {
  onAddDomain: (domain: string) => void;
  isDomainBlocked: (domain: string) => boolean;
}

const AddDomain: React.FC<AddDomainProps> = ({ onAddDomain, isDomainBlocked }) => {
  const [newDomain, setNewDomain] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentDomain(url.hostname);
      }
    });
  }, []);

  const handleAddDomain = () => {
    const trimmedDomain = newDomain.trim();
    if (trimmedDomain) {
      setNewDomain('');
      onAddDomain(trimmedDomain);
    }
  };

  const handleAddCurrentDomain = () => {
    onAddDomain(currentDomain);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddDomain();
    }
  };

  const currentDomainBlocked = isDomainBlocked(currentDomain);

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
          disabled={currentDomainBlocked}
        >
          Block Current Domain
        </button>
      </div>
    </div>
  );
};

export default AddDomain; 