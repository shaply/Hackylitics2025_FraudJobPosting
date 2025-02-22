const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3000;

// Enable CORS for Chrome extension
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let i = 0;

// Endpoint that always returns fraudulent
app.post('/getResponse', (req, res) => {
    // console.log('Received request:', req.body);
    const logEntry = `${new Date().toISOString()} - Request ${i}: ${JSON.stringify(req.body)}\n`;
    fs.appendFile('requests.log', logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    // Log received job data (optional, for debugging)
    console.log(`Received job data ${i}`);

    i++;
    // Always return fraudulent: 1
    res.json({
        fraudulent: 1
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 