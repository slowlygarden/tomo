// Check if the script was already injected
if (!window.tabSaverInitialized) {
  window.tabSaverInitialized = true;

  let isUIOpen = false;
  let container = null;

  // Create and inject the UI
  function createUI() {
    container = document.createElement("div");
    container.className = "tab-saver-overlay";
    container.innerHTML = `<svg width="100" height="93" viewBox="0 0 100 93" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="tomo">
<g id="bg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M50 0C35.0883 0 23 12.0883 23 27C23 29.9772 23.4819 32.8418 24.3719 35.5202C24.8044 36.8219 23.9683 38.2636 22.6238 38.5353C10.2878 41.0277 1 51.9292 1 65C1 79.9117 13.0883 92 28 92C36.0676 92 43.3087 88.4617 48.2562 82.8523C49.165 81.8219 50.835 81.8219 51.7438 82.8523C56.6913 88.4617 63.9324 92 72 92C86.9117 92 99 79.9117 99 65C99 51.9292 89.7122 41.0277 77.3762 38.5353C76.0317 38.2636 75.1956 36.8219 75.6281 35.5202C76.5181 32.8418 77 29.9772 77 27C77 12.0883 64.9117 0 50 0ZM45.2381 52.6366L48.1557 57.6901C48.8323 58.8619 50.5237 58.8619 51.2003 57.6901L54.1179 52.6366C54.7944 51.4648 53.9487 50 52.5956 50H46.7604C45.4073 50 44.5616 51.4648 45.2381 52.6366Z"/>
</g>
<g id="all" class="clickable">
<path class="hover" d="M17.3205 48.1915C22.4937 45.2048 28.4465 44.7918 33.6963 46.5553C38.1541 48.0527 37.5248 53.1863 40.0609 57.579C42.597 61.9717 47.8575 64.8595 46.9254 69.4688C45.8278 74.897 42.4937 79.8458 37.3205 82.8325C27.7547 88.3554 15.5228 85.0779 10 75.512C4.47715 65.9462 7.75465 53.7144 17.3205 48.1915Z"/>
<g class="icon">
<rect x="30.6301" y="58.5198" width="5.64836" height="6.17202" rx="2" transform="rotate(66.6638 30.6301 58.5198)"/>
<rect x="31.2744" y="65.8228" width="5.72045" height="9.45457" rx="2" transform="rotate(66.6638 31.2744 65.8228)"/>
<rect x="23.1195" y="60.3237" width="6.96719" height="7.32338" rx="2" transform="rotate(66.6638 23.1195 60.3237)"/>
</g>
</g>
<g id="upload" class="clickable">
<path class="hover" d="M70 28C70 33.9735 67.3812 39.3353 63.2291 43C59.7035 46.1118 55.5722 43 50.5 43C45.4278 43 40.2965 46.1118 36.7709 43C32.6188 39.3353 30 33.9735 30 28C30 16.9543 38.9543 8 50 8C61.0457 8 70 16.9543 70 28Z"/>
<g class="icon">
<path d="M48.4764 20.5638C49.1021 19.8121 50.2563 19.8121 50.8819 20.5638L54.9933 25.5036C55.8417 26.523 55.1168 28.0695 53.7905 28.0695H45.5678C44.2416 28.0695 43.5166 26.523 44.3651 25.5036L48.4764 20.5638Z"/>
<circle cx="49.6791" cy="32.4292" r="2.57084"/>
</g>
</g>
<g id="this" class="clickable">
<path class="hover" d="M62.1882 82.8324C57.015 79.8457 53.6809 74.8969 52.5832 69.4687C51.6511 64.8595 56.4117 62.8376 58.9478 58.4449C61.4839 54.0522 61.3546 48.0526 65.8123 46.5552C71.0621 44.7917 77.015 45.2047 82.1882 48.1914C91.754 53.7143 95.0315 65.9461 89.5087 75.5119C83.9858 85.0778 71.754 88.3553 62.1882 82.8324Z"/>
<rect class="icon" x="77.1194" y="74.824" width="15.2988" height="9.45174" rx="3" transform="rotate(-144.667 77.1194 74.824)"/>
</g>
</g>
</svg>
<input type="file" id="fileInput" accept=".txt" style="display: none;">
`;
    document.body.appendChild(container);
    setupEventListeners();
  }

  // Helper function to encode window position
  function encodeWindowPosition(window) {
    return `#WIN=${window.left},${window.top},${window.width},${window.height},${window.state}#`;
  }

  // Helper function to decode window position
  function decodeWindowPosition(line) {
    if (line.startsWith("#WIN=") && line.endsWith("#")) {
      const data = line.slice(5, -1).split(",");
      return {
        left: parseInt(data[0]),
        top: parseInt(data[1]),
        width: parseInt(data[2]),
        height: parseInt(data[3]),
        state: data[4],
      };
    }
    return null;
  }

  // Save tabs from current window
  async function saveCurrentWindowTabs() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getCurrentWindowTabs",
      });

      if (!response) {
        console.error("No response from background script");
        return;
      }

      const windowContent = [
        encodeWindowPosition(response.window),
        ...response.tabs.map((tab) => tab.url),
      ].join("\n");

      await downloadTabs(windowContent, "current_window");
      toggleUI(); // Close UI after save
    } catch (error) {
      console.error("Error saving current window tabs:", error);
    }
  }

  // Save tabs from all windows
  async function saveAllWindowsTabs() {
    try {
      const windows = await chrome.runtime.sendMessage({
        action: "getAllWindowsTabs",
      });

      if (!windows) {
        console.error("No response from background script");
        return;
      }

      const windowsContent = windows.map(({ window, tabs }) => {
        return [
          encodeWindowPosition(window),
          ...tabs.map((tab) => tab.url),
        ].join("\n");
      });

      await downloadTabs(windowsContent.join("\n\n"), "all_windows");
      toggleUI(); // Close UI after save
    } catch (error) {
      console.error("Error saving all windows tabs:", error);
    }
  }

  // Load tabs from file
  function loadTabs() {
    const fileInput = container.querySelector("#fileInput");
    if (!fileInput.files.length) {
      alert("Please select a file first!");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const windowGroups = e.target.result.split("\n\n");

      for (const windowGroup of windowGroups) {
        const lines = windowGroup.split("\n").filter((line) => line.trim());

        if (lines.length > 0) {
          const position = decodeWindowPosition(lines[0]);
          const urls = lines.filter((line) => !line.startsWith("#WIN="));

          if (urls.length > 0) {
            const createData = {
              url: urls[0],
              focused: true,
              ...(position || {}),
            };

            if (position?.state === "normal") {
              delete createData.state;
            }

            // Create window with first URL
            const newWindow = await chrome.runtime.sendMessage({
              action: "createWindow",
              data: createData,
            });

            // Create remaining tabs in the window
            for (let i = 1; i < urls.length; i++) {
              if (urls[i]) {
                await chrome.runtime.sendMessage({
                  action: "createTab",
                  data: {
                    windowId: newWindow.id,
                    url: urls[i],
                  },
                });
              }
            }
          }
        }
      }
      toggleUI(); // Close UI after loading tabs
    };

    reader.readAsText(file);
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Debug logs
    console.log("Setting up event listeners");

    const allButton = container.querySelector("#all");
    const thisButton = container.querySelector("#this");
    const uploadButton = container.querySelector("#upload");
    const fileInput = container.querySelector("#fileInput");

    console.log("Elements found:", {
      all: allButton,
      this: thisButton,
      upload: uploadButton,
      fileInput,
    });

    // SVG element handlers
    allButton.addEventListener("click", (e) => {
      console.log("All windows clicked");
      e.stopPropagation();
      saveAllWindowsTabs();
    });

    thisButton.addEventListener("click", (e) => {
      console.log("This window clicked");
      e.stopPropagation();
      saveCurrentWindowTabs();
    });

    uploadButton.addEventListener("click", (e) => {
      console.log("Upload clicked");
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      console.log("File selected");
      loadTabs();
    });

    // Optional: close when clicking outside
    container.addEventListener("click", (e) => {
      if (e.target === container) {
        toggleUI();
      }
    });
  }

  // Toggle UI visibility
  function toggleUI() {
    if (!container && !isUIOpen) {
      createUI();
    }

    if (container) {
      isUIOpen = !isUIOpen;
      container.style.display = isUIOpen ? "flex" : "none";
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
      toggleUI();
    }
  });

  // Helper function to download tabs
  async function downloadTabs(content, prefix) {
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const timestamp = `${year}-${month}-${day}`;

      const filename = `TabSaver/${year}/${month}/${prefix}_${timestamp}.txt`;

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: "downloadFile",
            url: url,
            filename: filename,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }

            // Listen for download completion
            chrome.downloads.onChanged.addListener(function listener(delta) {
              if (
                delta.id === downloadId &&
                delta.state?.current === "complete"
              ) {
                chrome.downloads.onChanged.removeListener(listener);
                resolve();
              }
            });
          }
        );
      });

      // Clean up the blob URL after download completes
      URL.revokeObjectURL(url);

      // Close UI only
      toggleUI();
    } catch (error) {
      console.error("Error downloading tabs:", error);
    }
  }
}
