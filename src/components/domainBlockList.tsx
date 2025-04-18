import React, { useState, useEffect } from 'react';
import { UnblockInfo } from '../models/interfaces';

interface DomainBlockListProps {
  blockedDomains: string[];
  temporaryUnblocks: UnblockInfo[];
  onRemoveDomain: (domain: string) => void;
  onTemporaryUnblock: (domain: string) => void;
}

const DomainBlockList: React.FC<DomainBlockListProps> = ({
  blockedDomains,
  temporaryUnblocks,
  onRemoveDomain,
  onTemporaryUnblock
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  // Update time remaining every 15 seconds
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Date.now();
      const newTimeRemaining: { [key: string]: string } = {};
      
      temporaryUnblocks.forEach(unblock => {
        if (unblock.expiresAt > now) {
          const remaining = unblock.expiresAt - now;
          const minutes = Math.ceil(remaining / (60 * 1000));
          newTimeRemaining[unblock.domain] = `${minutes}m`;
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    };

    // Update immediately
    updateTimeRemaining();

    // Then update every 15 seconds
    const interval = setInterval(updateTimeRemaining, 15000);
    return () => clearInterval(interval);
  }, [temporaryUnblocks]);

  const isTemporarilyUnblocked = (domain: string): boolean => {
    const now = Date.now();
    return temporaryUnblocks.some(
      unblock => unblock.domain === domain && unblock.expiresAt > now
    );
  };

  // Sort domains alphabetically
  const sortedDomains = [...blockedDomains].sort((a, b) => a.localeCompare(b));

  return (
    <div className="domain-block-list">
      <h2>Blocked Domains</h2>
      <ul className="domain-list">
        {sortedDomains.map((domain) => (
          <li key={domain} className={isTemporarilyUnblocked(domain) ? 'temporarily-unblocked' : ''}>
            <div className="domain-info">
              <span className="domain-name">{domain}</span>
              {isTemporarilyUnblocked(domain) && (
                <span className="unblock-timer">({timeRemaining[domain]})</span>
              )}
            </div>
            <div className="domain-actions">
              {!isTemporarilyUnblocked(domain) && (
                <button 
                  className="unblock-button"
                  onClick={() => onTemporaryUnblock(domain)}
                >
                  Unblock for 30m
                </button>
              )}
              <button 
                className="remove-button"
                onClick={() => onRemoveDomain(domain)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DomainBlockList; 