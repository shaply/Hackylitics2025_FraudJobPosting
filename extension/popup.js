// Function to check if we're on a LinkedIn job page
function isLinkedInJobPage(url) {
    return url.match(/linkedin\.com\/jobs\/(view|collections)/) !== null;
}

// Function to initialize the check
function initializeCheck() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const statusElement = document.getElementById('status');

        // Check if we're on a LinkedIn job page
        if (!isLinkedInJobPage(currentTab.url)) {
            statusElement.textContent = 'Please navigate to a LinkedIn job posting';
            statusElement.classList.remove('loading');
            statusElement.classList.add('fraudulent');
            return;
        }

        // Inject the content script if it hasn't been injected
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: () => {
                // This will trigger the content script to run if it hasn't already
                if (window.hasRun) return;
                window.hasRun = true;
                // Dispatch a custom event that the content script will listen for
                document.dispatchEvent(new CustomEvent('CHECK_JOB_POSTING'));
            }
        });
    });
}

// When popup opens, initialize the check
document.addEventListener('DOMContentLoaded', initializeCheck);

// Listen for results from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const statusElement = document.getElementById('status');
    
    if (message.type === 'FRAUD_CHECK_RESULT') {
        statusElement.classList.remove('loading');
        if (message.fraudulent === 1) {
            statusElement.textContent = '⚠️ Warning: This job posting may be fraudulent!';
            statusElement.classList.add('fraudulent');
        } else {
            statusElement.textContent = '✅ This job posting appears to be legitimate.';
            statusElement.classList.add('legitimate');
        }
    } else if (message.type === 'ERROR') {
        statusElement.classList.remove('loading');
        statusElement.textContent = '❌ ' + message.message;
        statusElement.classList.add('fraudulent');
    }
});