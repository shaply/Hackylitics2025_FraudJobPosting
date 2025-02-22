function extractJobData() {
    const jobData = {
        title: '',
        location: '',
        department: '',
        salary_range: '',
        company_profile: '',
        description: '',
        requirements: '',
        benefits: '',
        telecommuting: 0
    };

    // Get job title
    const titleElement = document.querySelector('h1.job-title');
    if (!titleElement) {
        // If we can't find the title, the job posting probably hasn't loaded yet
        return null;
    }
    
    jobData.title = titleElement.textContent.trim();

    // Get location
    const locationElement = document.querySelector('.job-location');
    if (locationElement) {
        jobData.location = locationElement.textContent.trim();
    }

    // Get description
    const descriptionElement = document.querySelector('.job-description');
    if (descriptionElement) {
        jobData.description = descriptionElement.textContent.trim();
    }

    // Get company profile
    const companyElement = document.querySelector('.company-description');
    if (companyElement) {
        jobData.company_profile = companyElement.textContent.trim();
    }

    // Check for remote/telecommuting keywords
    const pageText = document.body.textContent.toLowerCase();
    if (pageText.includes('remote') || pageText.includes('work from home') || pageText.includes('telecommute')) {
        jobData.telecommuting = 1;
    }

    return jobData;
}

function checkAndSendJobData(isRetry = false) {
    const jobData = extractJobData();
    
    if (!jobData && isRetry) {
        // If we still can't get the data after retrying, send an error
        chrome.runtime.sendMessage({
            type: 'ERROR',
            message: 'Could not find job posting data'
        });
        return;
    }
    
    if (!jobData) {
        // If we can't get the data, retry after a delay
        setTimeout(() => checkAndSendJobData(true), 1000);
        return;
    }

    // Send data to API
    fetch('http://localhost:3000/getResponse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
    })
    .then(response => response.json())
    .then(data => {
        chrome.runtime.sendMessage({
            type: 'FRAUD_CHECK_RESULT',
            fraudulent: data.fraudulent
        });
    })
    .catch(error => {
        console.error('Error:', error);
        chrome.runtime.sendMessage({
            type: 'ERROR',
            message: 'Failed to check job posting'
        });
    });
}

// Add debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Listen for the custom event from popup
document.addEventListener('CHECK_JOB_POSTING', () => {
    checkAndSendJobData();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkJob") {
        checkAndSendJobData();
        sendResponse({status: "checking"});
    }
});

// Debounce the checkAndSendJobData function
const debouncedCheck = debounce(checkAndSendJobData, 1000);

// Set up a mutation observer to watch for changes in the job posting content
const observer = new MutationObserver((mutations) => {
    // Only trigger if mutations affect the job content
    const jobContentChanged = mutations.some(mutation => {
        return mutation.target.closest('.job-view-layout') || 
               mutation.target.closest('.jobs-search__job-details');
    });

    if (jobContentChanged) {
        debouncedCheck();
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

// Also run the initial check
checkAndSendJobData(); 