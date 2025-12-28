const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('urls.json')) fs.writeFileSync('urls.json', '[]');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  res.sendStatus(200);
});

app.post('/add-url', (req, res)=>{
  const { url } = req.body;
  if(!url) return res.status(400).json({error:'No URL provided'});

  const urls = JSON.parse(fs.readFileSync('urls.json'));
  urls.push({ name: url.split('/').pop(), url, timestamp: Date.now(), isUrl:true });
  fs.writeFileSync('urls.json', JSON.stringify(urls));
  res.json({success:true});
});

app.get('/files', (req,res)=>{
  const files = fs.readdirSync('uploads').map(f=> {
    const stats = fs.statSync(path.join('uploads', f));
    return { name: f, originalName: f.split('-').slice(1).join('-'), timestamp: stats.mtimeMs };
  });
  const urls = JSON.parse(fs.readFileSync('urls.json'));
  const all = [...urls, ...files].sort((a,b)=>b.timestamp-a.timestamp);
  res.json(all);
});

app.get('/download/:filename', (req,res)=>{
  const filePath = path.join('uploads', req.params.filename);
  fs.existsSync(filePath) ? res.download(filePath) : res.status(404).send('File not found');
});

// Auto-delete files and URLs older than 30 min
setInterval(()=>{
  const now = Date.now();
  // delete files
  fs.readdirSync('uploads').forEach(f=>{
    const filePath = path.join('uploads', f);
    const stats = fs.statSync(filePath);
    if(now - stats.mtimeMs > 24*60*60*1000) fs.unlinkSync(filePath);
  });
  // delete URLs
  const urls = JSON.parse(fs.readFileSync('urls.json'));
  const filtered = urls.filter(u => now - u.timestamp <= 30*60*1000);
  fs.writeFileSync('urls.json', JSON.stringify(filtered));
}, 60*60*1000);


app.listen(PORT, '0.0.0.0', ()=>console.log(`✅ Server running at http://localhost:${PORT}`));
