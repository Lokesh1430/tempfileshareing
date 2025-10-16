const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => res.sendStatus(200));

app.get('/files', (req, res) => {
  fs.readdir('uploads', (err, files) => err ? res.json([]) : res.json(files));
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  fs.existsSync(filePath) ? res.download(filePath) : res.status(404).send('File not found');
});

// Auto-delete files after 10 minutes
setInterval(() => {
  fs.readdir('uploads', (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join('uploads', file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 10 * 60 * 1000) fs.unlinkSync(filePath);
    });
  });
}, 60 * 1000);

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
