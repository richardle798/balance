import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';
import DomainBlockList from './components/domainBlockList';
import AddDomain from './components/addDomain';
import { UnblockInfo } from './models/interfaces';

const Popup: React.FC = () => {
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [temporaryUnblocks, setTemporaryUnblocks] = useState<UnblockInfo[]>([]);

  // Load blocked domains and temporary unblocks when popup opens
  useEffect(() => {
    // Load blocked domains
    chrome.storage.sync.get(['blockedDomains'], (result) => {
      if (result.blockedDomains) {
        setBlockedDomains(result.blockedDomains);
      }
    });

    // Load temporary unblocks
    chrome.storage.local.get(['temporaryUnblocks'], (result) => {
      if (result.temporaryUnblocks) {
        setTemporaryUnblocks(result.temporaryUnblocks);
      }
    });

    // Listen for changes from other parts of the extension
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.blockedDomains) {
        setBlockedDomains(changes.blockedDomains.newValue || []);
      }
      if (changes.temporaryUnblocks) {
        setTemporaryUnblocks(changes.temporaryUnblocks.newValue || []);
      }
    });

    // Check for expired unblocks every minute
    const interval = setInterval(() => {
      const now = Date.now();
      const activeUnblocks = temporaryUnblocks.filter(
        unblock => unblock.expiresAt > now
      );

      if (activeUnblocks.length !== temporaryUnblocks.length) {
        setTemporaryUnblocks(activeUnblocks);
        chrome.storage.local.set({ temporaryUnblocks: activeUnblocks });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [temporaryUnblocks]);

  const normalizeDomain = (domain: string): string => {
    // Remove any protocol (http://, https://)
    let normalized = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove any path or query parameters
    normalized = normalized.split('/')[0];
    // Remove any port numbers
    normalized = normalized.split(':')[0];
    // Convert to lowercase
    normalized = normalized.toLowerCase();

    return normalized;
  };

  const isDomainBlocked = (domain: string): boolean => {
    const normalizedDomain = normalizeDomain(domain);
    return blockedDomains.includes(normalizedDomain);
  };

  const handleAddDomain = (domain: string) => {
    if (!isDomainBlocked(domain)) {
      const normalizedDomain = normalizeDomain(domain);
      const updatedDomains = [...blockedDomains, normalizedDomain];
      setBlockedDomains(updatedDomains);
      chrome.storage.sync.set({ blockedDomains: updatedDomains });
    }
  };

  const handleRemoveDomain = (domain: string) => {
    const normalizedDomain = normalizeDomain(domain);
    const updatedDomains = blockedDomains.filter(d => d !== normalizedDomain);

    setBlockedDomains(updatedDomains);
    chrome.storage.sync.set({ blockedDomains: updatedDomains });

    // Also remove from temporary unblocks if present
    const updatedUnblocks = temporaryUnblocks.filter(u => u.domain !== normalizedDomain);
    setTemporaryUnblocks(updatedUnblocks);
    chrome.storage.local.set({ temporaryUnblocks: updatedUnblocks });
  };

  const handleTemporaryUnblock = (domain: string) => {
    const now = Date.now();
    const expiresAt = now + (30 * 60 * 1000); // 30 minutes from now
    const newUnblock = { domain, expiresAt };

    const updatedUnblocks = [...temporaryUnblocks, newUnblock];
    setTemporaryUnblocks(updatedUnblocks);
    chrome.storage.local.set({ temporaryUnblocks: updatedUnblocks });
  };

  return (
    <div className="popup-container">
      <h1>Balance</h1>
      <AddDomain
        onAddDomain={handleAddDomain}
        isDomainBlocked={isDomainBlocked}
      />
      <DomainBlockList
        blockedDomains={blockedDomains}
        temporaryUnblocks={temporaryUnblocks}
        onRemoveDomain={handleRemoveDomain}
        onTemporaryUnblock={handleTemporaryUnblock}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Popup />); 