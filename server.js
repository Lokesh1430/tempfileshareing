const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Use Render/Cloud port OR default 3000 for local
const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static('public'));

// Ensure 'uploads' directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

// Get list of uploaded files
app.get('/files', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

// File download endpoint
app.get('/download/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).send('File not found');
});

// Auto-delete files older than 24 hours
setInterval(() => {
  fs.readdir('uploads', (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join('uploads', file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    });
  });
}, 60 * 60 * 1000); // every hour

// Start server (0.0.0.0 required for external access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Local:  http://localhost:${PORT}`);
  console.log(`🌐 Public: Accessible via Render or Railway`);
});
