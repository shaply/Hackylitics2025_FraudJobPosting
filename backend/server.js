const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for Chrome extension
app.use(cors());
app.use(express.json());

let i = 0;

// Endpoint that always returns fraudulent
app.post('/getResponse', (req, res) => {
    // Log received job data (optional, for debugging)
    console.log(`Received job data ${i}:`, req.body);
    i++;
    // Always return fraudulent: 1
    res.json({
        fraudulent: 1
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 