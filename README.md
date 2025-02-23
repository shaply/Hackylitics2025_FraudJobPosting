# LinkedIn Job Fraud Detector

A Chrome extension that helps detect potentially fraudulent job postings on LinkedIn using machine learning. The extension analyzes job posting content in real-time and provides immediate feedback about the legitimacy of the posting.

## Background

Over 14 million people have been scammed by fake job posts within the last year alone, and with the rise of LLMs, the number of fake job posts has increased by 118%. Luckily, there were two extensive data sets on fraudulent job posts, and using these two data sets, we trained an LLM to notice the patterns of fraudulent job posts to help prevent people from applying to them before they release too much about their identity.

## Features

- Real-time analysis of LinkedIn job postings
- User-friendly popup interface with clear status indicators
- Automatic detection when viewing job postings
- Manual check option via button click
- Visual indicators for legitimate and potentially fraudulent job posts

## Tech Stack

### Frontend (Chrome Extension)
- HTML/CSS
- JavaScript
- Chrome Extension Manifest V3

### Backend
- Python 3.12
- FastAPI
- Uvicorn
- BeautifulSoup4 for HTML parsing
- OpenAI API (using Ollama local deployment)

### Machine Learning
- TensorFlow
- Keras
- Scikit-learn
- Pandas
- NumPy

## Installation

### Prerequisites
- Python 3.12 or higher
- Node.js and npm (optional, for development)
- Chrome browser
- Ollama (for local AI model deployment)

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run the FastAPI application:
```bash
uvicorn app:app --reload
```


The server will run on `http://localhost:8000`

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` directory
4. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to any LinkedIn job posting page
2. Click the extension icon in your Chrome toolbar
3. The extension will automatically analyze the job posting
4. Click the "Check Job Posting" button to re-analyze at any time
5. View the results in the popup:
   - Green background: Legitimate job posting
   - Red background: Potentially fraudulent job posting

## Development

### Extension Development

The extension uses Chrome's Manifest V3 and consists of:
- `manifest.json`: Extension configuration
- `popup.html/js`: User interface and interaction
- `content.js`: LinkedIn page interaction and data extraction

### Backend Development

The FastAPI backend provides:
- Job posting analysis endpoint
- Integration with ML model
- Data preprocessing and cleaning

### Machine Learning Model

The model is trained on a dataset of legitimate and fraudulent job postings using:
- Bidirectional LSTM architecture
- Word embeddings
- Binary classification (legitimate/fraudulent)

Model performance metrics:
- Accuracy: 99.00%
- Precision: 99.05%

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LinkedIn for providing the platform
- TensorFlow and Keras communities
- FastAPI framework
- Chrome Extensions documentation

## Coders

David Gu

Tommy Nguyen

Shang En Sim
