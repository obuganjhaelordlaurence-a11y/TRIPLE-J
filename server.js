// Local development entry point
// For Vercel deployment, the app is served from api/index.js
const app = require('./api/index');
const PORT = process.env.PORT || 3000;

const path = require('path');
const express = require('express');

// Serve static frontend files locally
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log(`🏟️  Sports Academy running on http://localhost:${PORT}`));
