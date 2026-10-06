const editor = document.getElementById("editor");
const title = document.getElementById("title");
const preview = document.getElementById("preview");
const status = document.getElementById("saveStatus");
const fileName = document.getElementById("fileName");
const list = document.getElementById("articleList");
let currentFile = "";
let saveTimer = null;

const previewCss = `<style>
body{margin:0;padding:30px;font-family:Arial,Helvetica,sans-serif;color:#202124;line-height:1.55}
.kb-article{max-width:900px;margin:0 auto}
h1{font-size:28px;margin:0 0 18px}
h2{font-size:21px;margin-top:28px;padding-bottom:6px;border-bottom:1px solid #dfe3e8}
h3{font-size:18px;margin-top:22px}
code,pre{font-family:Consolas,"Courier New",monospace;background:#f6f8fa}
code{padding:2px 5px;border-radius:4px}
pre{padding:12px;overflow:auto;border:1px solid #e2e6ea;border-radius:6px}
table{border-collapse:collapse;width:100%;margin:16px 0}
th,td{border:1px solid #d0d7de;padding:8px 10px;text-align:left}
th{background:#f6f8fa}
.note,.warning{padding:12px 14px;margin:16px 0;border-radius:5px;border-left:4px solid #6b7280;background:#f7f7f8}
</style>`;

function updatePreview(){
  preview.srcdoc = `<!doctype html><html><head>${previewCss}</head><body>${editor.value}</body></html>`;
}

function scheduleSave(){
  updatePreview();
  clearTimeout(saveTimer);
  status.textContent = "Saving...";
  saveTimer = setTimeout(saveNow, 500);
}

async function saveNow(){
  if(!currentFile) return;
  const res = await fetch("/api/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({file:currentFile,title:title.value,html:editor.value})
  });
  const data = await res.json();
  if(data.ok){
    currentFile = data.file;
    fileName.textContent = currentFile;
    status.textContent = "Saved locally";
    loadList();
  } else {
    status.textContent = "Save failed";
  }
}

async function loadList(){
  const data = await (await fetch("/api/articles")).json();
  list.innerHTML = "";
  data.articles.forEach(a => {
    const div = document.createElement("div");
    div.className = "article-item";
    div.textContent = a.name;
    div.onclick = () => openArticle(a.file);
    list.appendChild(div);
  });
}

async function openArticle(file){
  const data = await (await fetch("/api/article/" + encodeURIComponent(file))).json();
  currentFile = data.file;
  editor.value = data.content || "";
  fileName.textContent = currentFile;
  const m = editor.value.match(/<h1[^>]*>(.*?)<\/h1>/i);
  title.value = m ? m[1].replace(/<[^>]+>/g,"") : currentFile.replace(/\.html$/i,"");
  updatePreview();
  status.textContent = "Loaded";
}

document.getElementById("newBtn").onclick = async () => {
  const desired = prompt("Article title:", "Untitled Article");
  if(!desired) return;
  const data = await (await fetch("/api/new", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:desired})
  })).json();
  currentFile = data.file;
  title.value = desired;
  editor.value = data.content;
  fileName.textContent = currentFile;
  updatePreview();
  status.textContent = "Saved locally";
  loadList();
};

editor.addEventListener("input", scheduleSave);

title.addEventListener("input", () => {
  const h1 = editor.value.match(/<h1[^>]*>.*?<\/h1>/i);
  if(h1){
    editor.value = editor.value.replace(h1[0], `<h1>${title.value}</h1>`);
  }
  scheduleSave();
});

(async function init(){
  await loadList();
  const data = await (await fetch("/api/articles")).json();
  if(data.articles.length){
    openArticle(data.articles[0].file);
  } else {
    document.getElementById("newBtn").click();
  }
})();
