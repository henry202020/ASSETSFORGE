let assets = JSON.parse(localStorage.getItem('forge_assets')) || [];

function showNotify(text, type = 'success') {
    const container = document.getElementById('notification-container');
    if(!container) return;
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${color} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate__animated animate__fadeInRight mb-2 font-bold`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight'); setTimeout(() => toast.remove(), 500); }, 3000);
}

const passInput = document.getElementById('pass');
if(passInput) passInput.addEventListener("keypress", (e) => { if(e.key === "Enter") login(); });

function login() {
    if (document.getElementById('pass').value === '2012') {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        renderManageList();
        showNotify("Acesso master!");
    } else { showNotify("Senha incorreta!", "error"); }
}

async function saveAsset() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('assetTitle').value;
    const status = document.getElementById('assetStatus').value;
    const fail = document.getElementById('assetFail').value;
    const imgInput = document.getElementById('assetImg');
    const fileInput = document.getElementById('assetFile');

    if (!title) return showNotify("Título obrigatório!", "error");

    try {
        if (id) {
            let a = assets.find(x => x.id == id);
            a.title = title; a.status = status; a.fail = fail;
            if (imgInput.files[0]) a.img = await toBase64(imgInput.files[0]);
            if (fileInput.files[0]) { a.file = await toBase64(fileInput.files[0]); a.fileName = fileInput.files[0].name; }
            showNotify("Asset atualizado!");
        } else {
            if (!imgInput.files[0] || !fileInput.files[0]) return showNotify("Selecione os arquivos!", "error");
            assets.push({
                id: Date.now(), title, status, fail,
                img: await toBase64(imgInput.files[0]),
                file: await toBase64(fileInput.files[0]),
                fileName: fileInput.files[0].name
            });
            showNotify("Asset criado!");
        }
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        setTimeout(() => location.reload(), 800);
    } catch (err) { showNotify("Arquivo muito grande!", "error"); }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

if (document.getElementById('assetGrid')) {
    const grid = document.getElementById('assetGrid');
    assets.forEach(asset => {
        const badge = asset.status && asset.status !== 'nenhum' ? `<span class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase badge-${asset.status}">${asset.status}</span>` : '';
        grid.innerHTML += `
            <div class="relative bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500 transition-all">
                ${badge}
                <div class="h-52 bg-cover bg-center" style="background-image: url('${asset.img}')"></div>
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-6">${asset.title}</h3>
                    <button onclick="downloadAsset('${asset.id}')" class="w-full bg-blue-600 py-4 rounded-2xl font-bold active:scale-95 transition">BAIXAR</button>
                </div>
            </div>`;
    });
}

function downloadAsset(id) {
    const a = assets.find(x => x.id == id);
    if (a.fail === 'none') {
        showNotify("Iniciando...");
        const l = document.createElement('a'); l.href = a.file; l.download = a.fileName; l.click();
    } else {
        const e = { '404': "ERRO 404", 'virus': "VÍRUS!", 'limit': "LIMITE" };
        showNotify(e[a.fail], "error");
    }
}

function switchTab(t) {
    document.getElementById('sectionForm').classList.toggle('hidden', t !== 'create');
    document.getElementById('sectionManage').classList.toggle('hidden', t !== 'manage');
    if(t === 'manage') renderManageList();
}

function renderManageList() {
    const l = document.getElementById('existingAssetsList');
    l.innerHTML = "";
    assets.forEach(a => {
        l.innerHTML += `
            <div class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-white/5">
                <div class="flex items-center gap-4">
                    <img src="${a.img}" class="w-12 h-12 rounded object-cover">
                    <span class="font-bold">${a.title}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEdit(${a.id})" class="text-blue-400 p-2">Configurar</button>
                    <button onclick="deleteAsset(${a.id})" class="text-red-500 p-2">X</button>
                </div>
            </div>`;
    });
}

function prepareEdit(id) {
    const a = assets.find(x => x.id == id);
    document.getElementById('editId').value = a.id;
    document.getElementById('assetTitle').value = a.title;
    document.getElementById('assetStatus').value = a.status || 'nenhum';
    document.getElementById('assetFail').value = a.fail || 'none';
    document.getElementById('panelTitle').innerText = "CONFIGURAR ASSET";
    document.getElementById('mainBtn').innerText = "SALVAR ALTERAÇÕES";
    document.getElementById('cancelBtn').classList.remove('hidden');
    switchTab('create');
}

function resetForm() { location.reload(); }

function deleteAsset(id) {
    if(confirm("Excluir?")) {
        assets = assets.filter(x => x.id !== id);
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        renderManageList();
    }
}
