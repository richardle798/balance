import { UnblockInfo } from "./models/interfaces";

// Constants for DNR rules
const RULE_PRIORITY = 1;
const CLEANUP_INTERVAL = 15000; // Check every 15 seconds

let isUpdatingRules = false;

// Function to create a DNR rule for a domain
const createBlockRule = (domain: string, ruleId: number): chrome.declarativeNetRequest.Rule => ({
  id: ruleId,
  priority: RULE_PRIORITY,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
    redirect: {
      regexSubstitution: `${chrome.runtime.getURL('blocked.html')}?domain=${domain}&requestedUrl=\\0`
    }
  },
  condition: {
    requestDomains: [domain],
    regexFilter: '^.+$',
    resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
  }
});

// Function to check if a domain is temporarily unblocked
const isTemporarilyUnblocked = (domain: string, temporaryUnblocks: UnblockInfo[]): boolean => {
  const now = Date.now();
  return temporaryUnblocks.some(
    unblock => unblock.domain === domain && unblock.expiresAt > now
  );
};

// Function to clean up expired temporary unblocks
const cleanupExpiredUnblocks = async () => {
  try {
    console.log('Cleaning up expired unblocks');
    const result = await chrome.storage.local.get(['temporaryUnblocks']);
    const temporaryUnblocks: UnblockInfo[] = result.temporaryUnblocks || [];

    const now = Date.now();
    const activeUnblocks = temporaryUnblocks.filter(
      unblock => unblock.expiresAt > now
    );

    if (activeUnblocks.length !== temporaryUnblocks.length) {
      console.log('Updating active unblocks: ', activeUnblocks);
      await chrome.storage.local.set({ temporaryUnblocks: activeUnblocks });
    }
  } catch (error) {
    console.error('Error cleaning up expired unblocks:', error);
  }
};

// Function to notify tabs about blocked domains
const notifyTabs = async (domains: string[]) => {
  for (const domain of domains) {
    try {
      // Find all tabs with the blocked domain
      const urlFilter = `*://www.${domain}/*`;
      const query: chrome.tabs.QueryInfo = { url: urlFilter };
      const tabs = await chrome.tabs.query(query);
      console.log(`Found ${tabs.length} tabs for URL filter ${urlFilter}`);

      // Send message to each tab
      for (const tab of tabs) {
        if (tab.id) {
          try {
            chrome.tabs.sendMessage(tab.id, {
              type: 'BLOCK_DOMAIN',
              domain: domain
            });
          }
          catch (error) {
            console.error(`Error sending message to tab ${tab.id}:`, error);
          }
        }
        else {
          console.error(`Tab was missing ID: ${tab}`);
        }
      }
    } catch (error) {
      console.error(`Error notifying tabs for domain ${domain}:`, error);
    }
  }
};

// Function to update DNR rules based on blocked domains and temporary unblocks
const updateDNRRules = async () => {
  // If already updating, skip this call
  if (isUpdatingRules) {
    console.log('DNR rules update already in progress, skipping');
    return;
  }

  try {
    isUpdatingRules = true;

    const temporaryUnblocks: UnblockInfo[] = (await chrome.storage.local.get(['temporaryUnblocks'])).temporaryUnblocks || [];
    const blockedDomains: string[] = (await chrome.storage.sync.get(['blockedDomains'])).blockedDomains || [];

    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Filter out temporarily unblocked domains
    const domainsToBlock = blockedDomains.filter(
      domain => !isTemporarilyUnblocked(domain, temporaryUnblocks)
    );

    // Check if rules need updating by comparing domains
    const existingDomains = existingRules.map(rule => {
      const existingDomains = rule.condition.requestDomains;
      return existingDomains?.[0] ?? '';
    });

    const needsUpdate = domainsToBlock.length !== existingDomains.length ||
      !domainsToBlock.every(domain => existingDomains.includes(domain));

    if (needsUpdate) {
      console.log('Adding DNR rules for: ', domainsToBlock);

      // Create new rules for each blocked domain
      const newRules = domainsToBlock.map((domain, index) =>
        createBlockRule(domain, index + 1)
      );

      console.log('New rules to add:', newRules);
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules,
        removeRuleIds: existingRuleIds
      });

      // Notify tabs about the blocked domains
      await notifyTabs(domainsToBlock);
    }
    else {
      console.log('No changes detected, skipping DNR rule update: ', domainsToBlock);
    }
  } catch (error) {
    console.error('Error updating DNR rules:', error);
  } finally {
    isUpdatingRules = false;
  }
};

const initialize = () => {
  console.log('Initializing balance service worker');
  updateDNRRules();

  // Start periodic cleanup of expired unblocks
  setInterval(cleanupExpiredUnblocks, CLEANUP_INTERVAL);
};

// Listen for changes to blocked domains and temporary unblocks
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedDomains || changes.temporaryUnblocks) {
    console.log('Changes detected, updating DNR rules');
    updateDNRRules();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Balance extension installed');
  initialize();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Balance extension started');
  initialize();
});

