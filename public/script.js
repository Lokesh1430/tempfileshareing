// ---------- File Fetch System ----------
async function fetchFiles() {
  const res = await fetch('/files');
  const files = await res.json();
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  files.forEach((file, i) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/download/${file}`;
    link.innerText = file;
    link.style.color = '#fff';
    link.style.fontWeight = 'bold';
    li.style.animationDelay = `${i * 0.1}s`;
    li.appendChild(link);
    list.appendChild(li);
  });
}
fetchFiles();
setInterval(fetchFiles, 5000);

// ---------- 3D Floating Container ----------
const card = document.getElementById('card3D');

document.addEventListener('mousemove', e => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;

  const rotateX = (-deltaY / centerY) * 15;
  const rotateY = (deltaX / centerX) * 15;

  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
});

document.addEventListener('mouseleave', () => {
  card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
});

// ---------- Starfield ----------
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
const numStars = 100;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createStars() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2,
      speed: 0.2 + Math.random() * 0.5,
      alpha: 0.2 + Math.random() * 0.8
    });
  }
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 123, 255, ${star.alpha})`;
    ctx.fill();

    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }

    star.alpha += (Math.random() - 0.5) * 0.05;
    if (star.alpha < 0.1) star.alpha = 0.1;
    if (star.alpha > 1) star.alpha = 1;
  });
  requestAnimationFrame(animateStars);
}
createStars();
animateStars();

// ---------- Upload Modal ----------
const modal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');

closeModal.addEventListener('click', () => modal.style.display = 'none');

// form submission
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch('/upload', { method: 'POST', body: formData });
    if (res.ok) {
      modal.style.display = 'flex';
      fetchFiles();  // Update file list
      fileInput.value = '';
      setTimeout(() => { modal.style.display = 'none'; }, 3000);
    } else alert('Upload failed!');
  } catch (err) {
    alert('Error uploading file!');
    console.error(err);
  }
});
