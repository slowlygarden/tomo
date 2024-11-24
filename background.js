chrome.action.onClicked.addListener(async (tab) => {
  // Check if we can inject into this tab
  if (
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("edge://") &&
    !tab.url.startsWith("about:")
  ) {
    injectContentScript(tab.id);
  } else {
    // Create a new tab with github.com and wait for it to load
    const newTab = await chrome.tabs.create({
      url: "https://tealprocess.net/",
    });

    // Wait for the tab to finish loading before injecting
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === "complete") {
        // Remove the listener to avoid multiple injections
        chrome.tabs.onUpdated.removeListener(listener);
        // Inject the content script
        injectContentScript(tabId);
      }
    });
  }
});

// Helper function to inject content script
async function injectContentScript(tabId) {
  // Inject CSS
  await chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ["content.css"],
  });

  // Inject and execute content script
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content.js"],
  });

  // Send toggle message
  chrome.tabs.sendMessage(tabId, { action: "toggle" });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getCurrentWindowTabs":
      getCurrentWindowTabs()
        .then(sendResponse)
        .catch((error) => {
          console.error("Error getting current window tabs:", error);
          sendResponse(null);
        });
      return true;

    case "getAllWindowsTabs":
      getAllWindowsTabs()
        .then(sendResponse)
        .catch((error) => {
          console.error("Error getting all windows tabs:", error);
          sendResponse(null);
        });
      return true;

    case "createWindow":
      createWindow(request.data)
        .then(sendResponse)
        .catch((error) => {
          console.error("Error creating window:", error);
          sendResponse(null);
        });
      return true;

    case "createTab":
      createTab(request.data)
        .then(sendResponse)
        .catch((error) => {
          console.error("Error creating tab:", error);
          sendResponse(null);
        });
      return true;

    case "downloadFile":
      try {
        chrome.downloads.download({
          url: request.url,
          filename: request.filename,
          saveAs: true,
        });
        sendResponse(true);
      } catch (error) {
        console.error("Error downloading file:", error);
        sendResponse(null);
      }
      return true;
  }
});

// Get current window tabs
async function getCurrentWindowTabs() {
  const currentWindow = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return { window: currentWindow, tabs };
}

// Get all windows and their tabs
async function getAllWindowsTabs() {
  const windows = await chrome.windows.getAll();
  const windowsWithTabs = await Promise.all(
    windows.map(async (window) => {
      const tabs = await chrome.tabs.query({ windowId: window.id });
      return { window, tabs };
    })
  );
  return windowsWithTabs;
}

// Create new window
async function createWindow(createData) {
  const newWindow = await chrome.windows.create(createData);
  return newWindow;
}

// Create new tab
async function createTab(createData) {
  const newTab = await chrome.tabs.create(createData);
  return newTab;
}
