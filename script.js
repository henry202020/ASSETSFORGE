let assets = JSON.parse(localStorage.getItem('forge_assets')) || [];

function showNotify(text, type = 'success') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${color} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate__animated animate__fadeInRight mb-2 font-bold z-50`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight'); setTimeout(() => toast.remove(), 500); }, 3000);
}

function login() {
    if (document.getElementById('pass').value === '2012') {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        renderManageList();
        showNotify("Bem-vindo, mestre!");
    } else { showNotify("Senha incorreta!", "error"); }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function saveAsset() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('assetTitle').value;
    const fileUrl = document.getElementById('assetFileUrl').value;
    const status = document.getElementById('assetStatus').value;
    const fail = document.getElementById('assetFail').value;
    const imgInput = document.getElementById('assetImg');

    if (!title || !fileUrl) return showNotify("Título e Link são obrigatórios!", "error");

    try {
        if (id) {
            let a = assets.find(x => x.id == id);
            a.title = title; a.fileUrl = fileUrl; a.status = status; a.fail = fail;
            if (imgInput.files[0]) a.img = await toBase64(imgInput.files[0]);
            showNotify("Asset atualizado!");
        } else {
            if (!imgInput.files[0]) return showNotify("Selecione uma imagem de capa!", "error");
            assets.push({
                id: Date.now(), title, fileUrl, status, fail,
                img: await toBase64(imgInput.files[0])
            });
            showNotify("Asset criado com sucesso!");
        }
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        setTimeout(() => location.reload(), 1000);
    } catch (e) { showNotify("Erro ao salvar! Imagem muito grande.", "error"); }
}

if (document.getElementById('assetGrid')) {
    const grid = document.getElementById('assetGrid');
    assets.forEach(a => {
        const badge = a.status && a.status !== 'nenhum' ? `<span class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase badge-${a.status}">${a.status}</span>` : '';
        grid.innerHTML += `
            <div class="relative bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500 transition-all btn-glow animate__animated animate__fadeIn">
                ${badge}
                <div class="h-52 bg-cover bg-center" style="background-image: url('${a.img}')"></div>
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-6">${a.title}</h3>
                    <button onclick="handleDownload('${a.id}')" class="w-full bg-blue-600 py-4 rounded-2xl font-bold active:scale-95 transition">BAIXAR ASSET</button>
                </div>
            </div>`;
    });
}

function handleDownload(id) {
    const a = assets.find(x => x.id == id);
    if (a.fail === 'none') {
        showNotify("Download iniciado!");
        window.open(a.fileUrl, '_blank');
    } else {
        const e = { '404': "ERRO 404: Link Quebrado", 'virus': "PERIGO: Vírus detectado", 'limit': "LIMITE: Tente em 24h" };
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
    l.innerHTML = assets.length ? "" : "<p class='text-slate-500'>Nada por aqui.</p>";
    assets.forEach(a => {
        l.innerHTML += `
            <div class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-white/5">
                <div class="flex items-center gap-4 text-left">
                    <img src="${a.img}" class="w-12 h-12 rounded object-cover border border-white/10">
                    <div><p class="font-bold text-sm">${a.title}</p><p class="text-[10px] text-blue-400 uppercase">${a.status}</p></div>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEdit(${a.id})" class="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg">Config</button>
                    <button onclick="deleteAsset(${a.id})" class="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-lg font-bold uppercase">X</button>
                </div>
            </div>`;
    });
}

function prepareEdit(id) {
    const a = assets.find(x => x.id == id);
    document.getElementById('editId').value = a.id;
    document.getElementById('assetTitle').value = a.title;
    document.getElementById('assetFileUrl').value = a.fileUrl;
    document.getElementById('assetStatus').value = a.status || 'nenhum';
    document.getElementById('assetFail').value = a.fail || 'none';
    document.getElementById('panelTitle').innerText = "EDITAR ASSET";
    switchTab('create');
}

function deleteAsset(id) {
    if(confirm("Deseja apagar?")) {
        assets = assets.filter(x => x.id !== id);
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        renderManageList();
        showNotify("Removido.");
    }
}
