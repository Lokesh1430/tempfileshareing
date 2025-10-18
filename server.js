const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Store uploaded file info with timestamp
const filesMetaPath = path.join(__dirname, 'files.json');
if (!fs.existsSync(filesMetaPath)) fs.writeFileSync(filesMetaPath, JSON.stringify([]));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const filesMeta = JSON.parse(fs.readFileSync(filesMetaPath));
  filesMeta.unshift({ name: req.file.filename, timestamp: Date.now() });
  fs.writeFileSync(filesMetaPath, JSON.stringify(filesMeta));
  res.sendStatus(200);
});

// Return files with timestamp
app.get('/files', (req, res) => {
  let filesMeta = [];
  try {
    filesMeta = JSON.parse(fs.readFileSync(filesMetaPath));
    // Filter out deleted files
    filesMeta = filesMeta.filter(f => fs.existsSync(path.join('uploads', f.name)));
  } catch (err) { filesMeta = []; }
  res.json(filesMeta);
});

// Download file
app.get('/download/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  fs.existsSync(filePath) ? res.download(filePath) : res.status(404).send('File not found');
});

// Auto-delete files older than 30 mins
setInterval(() => {
  const now = Date.now();
  let filesMeta = JSON.parse(fs.readFileSync(filesMetaPath));
  filesMeta.forEach(f => {
    const filePath = path.join('uploads', f.name);
    if (now - f.timestamp > 30 * 60 * 1000 && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
  // Remove deleted files from metadata
  filesMeta = filesMeta.filter(f => fs.existsSync(path.join('uploads', f.name)));
  fs.writeFileSync(filesMetaPath, JSON.stringify(filesMeta));
}, 60 * 1000);

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
