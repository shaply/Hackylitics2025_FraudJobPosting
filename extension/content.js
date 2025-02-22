function extractJobData() {
    // Get the job view layout element
    const jobViewLayoutGood = document.getElementsByClassName('jobs-details__main-content')[0];
    if (jobViewLayoutGood) {
        return jobViewLayoutGood.innerHTML;
    }

    // on linkedin.com/jobs/view/
    const jobViewLayout = document.getElementsByClassName('job-view-layout')[1];
    if (!jobViewLayout) {
        return null;
    }
    
    const cloned = jobViewLayout.cloneNode(true);
    const jobViewLayoutChildren = cloned.children[0].children[0];
    const jobViewLayoutChildrenChildren = jobViewLayoutChildren.children;

    // Once see child with class that has 'jobs-similar', remove all children after
    for (let i = 0; i < jobViewLayoutChildrenChildren.length; i++) {
        if (jobViewLayoutChildrenChildren[i].className.includes('jobs-similar')) {
            console.log('Found similar jobs section');
            while (jobViewLayoutChildren.children.length > i) {
                jobViewLayoutChildren.removeChild(jobViewLayoutChildren.lastChild);
            }
            break;
        }
    }

    return cloned.children[0].children[0].innerHTML;
}

function checkAndSendJobData() {
    const jobData = extractJobData();

    if (!jobData) {
        chrome.runtime.sendMessage({
            type: 'ERROR',
            message: 'Could not find job posting data'
        });
        return;
    }

    // Send data to API
    console.log('Sending job data:', jobData);
    fetch('http://localhost:3000/getResponse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({"jobData": jobData})
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === "checkJob") {
        checkAndSendJobData();
        sendResponse({status: "checking"});
    }
}); 