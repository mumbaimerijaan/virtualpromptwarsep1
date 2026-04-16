'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3080; // Defaulting to 3080 to not clash

// Security Header hardening
app.disable('x-powered-by');

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Routes setup
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Generic 500 error mask to avoid leaking stack traces
app.use((err, req, res, next) => {
    console.error(`[Server Error Context]:`, err.message || err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Fallback to avoid exposing paths
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening actively on port ${port}`);
    });
}

module.exports = app;
