import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UnblockInfo } from './models/interfaces';
import './block.css';

const BlockPage: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [requestedUrl, setRequestedUrl] = useState<string>('');
  const [temporaryUnblocks, setTemporaryUnblocks] = useState<UnblockInfo[]>([]);
  const [countdown, setCountdown] = useState<number>(10);
  const [isButtonEnabled, setIsButtonEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Get current domain from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain') || '';
    setCurrentDomain(domain);

    const requestedUrl = urlParams.get('requestedUrl') || '';
    setRequestedUrl(requestedUrl);

    // Load temporary unblocks
    chrome.storage.local.get(['temporaryUnblocks'], (result) => {
      if (result.temporaryUnblocks) {
        setTemporaryUnblocks(result.temporaryUnblocks);
      }
    });

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          setIsButtonEnabled(true);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  const handleTemporaryUnblock = () => {
    const now = Date.now();
    const expiresAt = now + (30 * 60 * 1000); // 30 minutes from now
    const newUnblock = { domain: currentDomain, expiresAt };

    const updatedUnblocks = [...temporaryUnblocks, newUnblock];
    setTemporaryUnblocks(updatedUnblocks);
    chrome.storage.local.set({ temporaryUnblocks: updatedUnblocks });

    // Wait before redirecting
    setTimeout(() => {
      window.location.href = requestedUrl;
    }, 50);
  };

  return (
    <div className="block-container">
      <h1 className="block-title">Site Blocked</h1>
      <p className="block-message">
        <span className="blocked-domain">{currentDomain}</span> has been blocked to help you stay focused.
      </p>
      <button
        onClick={handleTemporaryUnblock}
        className="unblock-button"
        disabled={!isButtonEnabled}
      >
        {countdown > 0 ? `Please wait ${countdown} seconds...` : 'Unblock for 30 minutes'}
      </button>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<BlockPage />);
