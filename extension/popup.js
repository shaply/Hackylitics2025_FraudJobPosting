// Function to check if we're on a LinkedIn job page
function isLinkedInJobPage(url) {
    return url.match(/linkedin\.com\/jobs\/(view|collections)/) !== null;
}

// Function to initialize the check
function checkJobPosting() {
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Analyzing job posting...';
    statusElement.className = 'result loading';

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];

        // Check if we're on a LinkedIn job page
        if (!isLinkedInJobPage(currentTab.url)) {
            statusElement.textContent = 'Please navigate to a LinkedIn job posting';
            statusElement.classList.remove('loading');
            statusElement.classList.add('fraudulent');
            return;
        }

        console.log('Checking job posting');
        // Send message to content script
        chrome.tabs.sendMessage(currentTab.id, {action: "checkJob"}, function(response) {
            if (chrome.runtime.lastError) {
                console.log('Error:', chrome.runtime.lastError);
                statusElement.textContent = 'Error: Could not analyze job posting';
                statusElement.classList.remove('loading');
                statusElement.classList.add('fraudulent');
            }
        });
    });
}

// When popup opens, set up the button
document.getElementById('checkButton').addEventListener('click', checkJobPosting);

// Listen for results from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const statusElement = document.getElementById('status');
    
    if (message.type === 'FRAUD_CHECK_RESULT') {
        statusElement.classList.remove('loading');
        if (message.fraudulent === 1) {
            statusElement.innerHTML = 'Warning: This job posting may be <b>fraudulent</b>!';
            statusElement.classList.add('fraudulent');
        } else {
            statusElement.innerHTML = 'This job posting appears to be <b>legitimate</b>.';
            statusElement.classList.add('legitimate');
        }
    } else if (message.type === 'ERROR') {
        statusElement.classList.remove('loading');
        statusElement.textContent = message.message;
        statusElement.classList.add('fraudulent');
    }
});