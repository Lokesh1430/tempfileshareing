async function fetchFiles() {
  const res = await fetch('/files');
  const files = await res.json();
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  files.forEach(file => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/download/${file}`;
    link.innerText = file;
    li.appendChild(link);
    list.appendChild(li);
  });
}

fetchFiles();
setInterval(fetchFiles, 5000); // refresh every 5 seconds
