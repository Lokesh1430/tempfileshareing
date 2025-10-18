// ---------- Starfield ----------
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars=[], numStars=100;
function resizeCanvas(){canvas.width=window.innerWidth; canvas.height=window.innerHeight;}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
function createStars(){stars=[]; for(let i=0;i<numStars;i++){stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, radius:Math.random()*2, speed:0.2+Math.random()*0.5, alpha:0.2+Math.random()*0.8});}}
function animateStars(){ctx.clearRect(0,0,canvas.width,canvas.height); stars.forEach(star=>{ctx.beginPath();ctx.arc(star.x, star.y, star.radius,0,2*Math.PI); ctx.fillStyle=`rgba(180,123,255,${star.alpha})`; ctx.fill(); star.y+=star.speed; if(star.y>canvas.height) star.y=0;}); requestAnimationFrame(animateStars);}
createStars(); animateStars();

// ---------- File Fetch + Expiry ----------
const list = document.getElementById('fileList');

async function fetchFiles(){
  const res = await fetch('/files');
  const files = await res.json();
  list.innerHTML='';

  files.forEach(file=>{
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = file.isUrl ? file.url : `/download/${file.name}`;
    link.target='_blank';
    link.innerText = file.isUrl ? file.name : file.originalName || file.name;
    li.appendChild(link);

    const expiry = document.createElement('span');
    expiry.className='file-expiry';
    li.appendChild(expiry);
    list.appendChild(li);

    function updateExpiry(){
      const now = Date.now();
      const remaining = Math.max(0, 30*60 - Math.floor((now - file.timestamp)/1000));
      const min = Math.floor(remaining/60);
      const sec = remaining%60;
      expiry.innerText = `expires in ${min}:${sec.toString().padStart(2,'0')} min`;
    }

    updateExpiry(); // initial
    const interval = setInterval(()=>{
      updateExpiry();
      if(Date.now() - file.timestamp >= 30*60*1000) clearInterval(interval);
    },1000);
  });
}

fetchFiles();
setInterval(fetchFiles, 10000);

// ---------- 3D Card Tilt + Glow ----------
const card = document.getElementById('card3D');
const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrlBtn');

document.addEventListener('mousemove', e=>{
  const cx=window.innerWidth/2, cy=window.innerHeight/2;
  const dx=e.clientX-cx, dy=e.clientY-cy;
  const rotateX=(-dy/cy)*10;
  const rotateY=(dx/cx)*10;
  card.style.transform=`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  urlInput.style.transform=`rotateX(${rotateX/3}deg) rotateY(${rotateY/3}deg)`;
  addUrlBtn.style.transform=`rotateX(${rotateX/3}deg) rotateY(${rotateY/3}deg)`;
});

document.addEventListener('mouseleave', ()=>{
  card.style.transform='rotateX(0) rotateY(0) scale(1)';
  urlInput.style.transform='rotateX(0) rotateY(0)';
  addUrlBtn.style.transform='rotateX(0) rotateY(0)';
});

// ---------- Upload with Cancel ----------
const modal=document.getElementById('uploadModal');
const closeModal=document.getElementById('closeModal');
const form=document.getElementById('uploadForm');
const fileInput=document.getElementById('fileInput');
const progressContainer=document.getElementById('progressContainer');
const progressBar=document.getElementById('progressBar');
const uploadStatus=document.getElementById('uploadStatus');
const cancelBtn=document.getElementById('cancelUpload');
let currentXHR=null;

closeModal.addEventListener('click', ()=>modal.style.display='none');

form.addEventListener('submit', e=>{
  e.preventDefault();
  if(!fileInput.files.length) return;

  const files = fileInput.files;
  const promises = Array.from(files).map(file=>{
    return new Promise((resolve, reject)=>{
      const formData = new FormData();
      formData.append('file', file);
      const xhr = new XMLHttpRequest();
      currentXHR=xhr;
      xhr.open('POST','/upload');

      progressContainer.style.display='block';
      progressBar.style.width='0%';
      uploadStatus.textContent=`Uploading: ${file.name} (0%)`;
      cancelBtn.disabled=false;

      const startTime = Date.now();
      xhr.upload.onprogress = e=>{
        if(e.lengthComputable){
          const percent=(e.loaded/e.total)*100;
          const elapsed=(Date.now()-startTime)/1000;
          const speed=e.loaded/elapsed;
          const remaining=(e.total-e.loaded)/speed;
          progressBar.style.width=`${percent}%`;
          uploadStatus.textContent=`Uploading ${file.name} (${percent.toFixed(1)}%) — Remaining ${remaining.toFixed(1)}s`;
        }
      };

      xhr.onload = ()=>{
        if(xhr.status===200) resolve();
        else reject('Upload failed');
      };
      xhr.onerror = ()=>reject('Upload error');
      xhr.send(formData);
    });
  });

  Promise.all(promises)
    .then(async ()=>{
      modal.style.display='flex';
      progressContainer.style.display='none';
      uploadStatus.textContent='';
      cancelBtn.disabled=true;
      currentXHR=null;
      await fetchFiles();
      fileInput.value='';
      setTimeout(()=>modal.style.display='none',3000);
    }).catch(err=>alert(err));
});

cancelBtn.addEventListener('click', ()=>{
  if(currentXHR){
    currentXHR.abort();
    uploadStatus.textContent='Upload canceled';
    progressContainer.style.display='none';
    cancelBtn.disabled=true;
    currentXHR=null;
  }
});

// ---------- Add URL Functionality ----------
addUrlBtn.addEventListener('click', ()=>{
  const url = urlInput.value.trim();
  if(url){
    fetch('/add-url', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({url})
    })
    .then(res=>res.json())
    .then(data=>{
      urlInput.value='';
      fetchFiles();
    }).catch(err=>alert('Failed to add URL!'));
  }
});
