function extractJobData() {
  // Get the job view layout element
  const jobViewLayoutGood = document.getElementsByClassName(
    "jobs-details__main-content"
  )[0];
  if (jobViewLayoutGood) {
    const title = document.querySelector('.t-24.t-bold.inline').innerText.trim();
    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name').innerText.trim();
    const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container').querySelector('.tvm__text.tvm__text--low-emphasis').innerText.trim();
    const additionalInfo = Array.from(document.querySelector('.job-details-preferences-and-skills').querySelectorAll('.ui-label.text-body-small')).map(ele => ele.innerText.trim());
    const description = document.querySelector('.jobs-box__html-content .mt4').innerText.trim();
    const companyDescription = document.querySelector('.jobs-company__box').innerText.trim();

    return {
        title,
        company,
        location,
        additionalInfo,
        description,
        companyDescription,
    };
  }

  // on linkedin.com/jobs/view/
  const jobViewLayout = document.getElementsByClassName("job-view-layout")[1];
  if (jobViewLayout) {
    const title = document.querySelector('.t-24.t-bold.inline').innerText.trim();
    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name').innerText.trim();
    const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container').querySelector('.tvm__text.tvm__text--low-emphasis').innerText.trim();
    const additionalInfo = Array.from(document.querySelector('.job-details-preferences-and-skills').querySelectorAll('.ui-label.text-body-small')).map(ele => ele.innerText.trim());
    const description = document.querySelector('.jobs-box__html-content .mt4').innerText.trim();
    const companyDescription = document.querySelector('.jobs-company__box').innerText.trim();

    return {
        title,
        company,
        location,
        additionalInfo,
        description,
        companyDescription,
    };
  }

  return null;
}

function checkAndSendJobData() {
  const jobData = extractJobData();

  if (!jobData) {
    chrome.runtime.sendMessage({
      type: "ERROR",
      message: "Could not find job posting data",
    });
    return;
  }

  // Send data to API
  console.log("Sending job data:", jobData);
  fetch("http://localhost:8000/getResponse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobData: jobData }),
  })
    .then((response) => response.json())
    .then((data) => {
      chrome.runtime.sendMessage({
        type: "FRAUD_CHECK_RESULT",
        fraudulent: data.fraudulent,
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      chrome.runtime.sendMessage({
        type: "ERROR",
        message: "Failed to check job posting",
      });
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "checkJob") {
    checkAndSendJobData();
    sendResponse({ status: "checking" });
  }
});
