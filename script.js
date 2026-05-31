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

// LOGIN
function login() {
    if (document.getElementById('pass').value === '2012') {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        renderManageList();
        showNotify("Acesso master!");
    } else { showNotify("Senha incorreta!", "error"); }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// SALVAR (Sem Recarregar Tela de Senha)
async function saveAsset() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('assetTitle').value;
    const desc = document.getElementById('assetDesc').value;
    const fileUrl = document.getElementById('assetFileUrl').value;
    const status = document.getElementById('assetStatus').value;
    const fail = document.getElementById('assetFail').value;
    const imgInput = document.getElementById('assetImg');

    if (!title || !fileUrl) return showNotify("Título e Link são obrigatórios!", "error");

    try {
        if (id) {
            let a = assets.find(x => x.id == id);
            a.title = title; a.desc = desc; a.fileUrl = fileUrl; a.status = status; a.fail = fail;
            if (imgInput.files[0]) a.img = await toBase64(imgInput.files[0]);
            showNotify("Asset atualizado!");
        } else {
            if (!imgInput.files[0]) return showNotify("Selecione uma imagem!", "error");
            assets.push({
                id: Date.now(), title, desc, fileUrl, status, fail,
                img: await toBase64(imgInput.files[0])
            });
            showNotify("Asset criado!");
        }
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        
        // Limpa formulário em vez de dar reload total
        document.getElementById('editId').value = "";
        document.getElementById('assetTitle').value = "";
        document.getElementById('assetDesc').value = "";
        document.getElementById('assetFileUrl').value = "";
        imgInput.value = "";
        renderManageList();
        switchTab('manage');
    } catch (e) { showNotify("Erro ao salvar!", "error"); }
}

// RENDERIZAR NA INDEX
if (document.getElementById('assetGrid')) {
    const grid = document.getElementById('assetGrid');
    assets.forEach(a => {
        const badge = a.status && a.status !== 'nenhum' ? `<span class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase badge-${a.status}">${a.status}</span>` : '';
        grid.innerHTML += `
            <div onclick="location.href='asset.html?id=${a.id}'" class="relative bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500 transition-all cursor-pointer">
                ${badge}
                <div class="h-52 bg-cover bg-center" style="background-image: url('${a.img}')"></div>
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${a.title}</h3>
                    <p class="text-slate-500 text-sm line-clamp-2">${a.desc || 'Sem descrição.'}</p>
                </div>
            </div>`;
    });
}

// PÁGINA DE DETALHES (ASSET.HTML)
if (document.getElementById('assetDetailContent')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const a = assets.find(x => x.id == id);

    if (a) {
        document.getElementById('assetDetailContent').innerHTML = `
            <div class="bg-slate-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                <img src="${a.img}" class="w-full h-[400px] object-cover">
                <div class="p-10">
                    <div class="flex justify-between items-start mb-6">
                        <h1 class="text-4xl font-black">${a.title}</h1>
                        <span class="px-4 py-2 rounded-full text-xs font-black uppercase bg-blue-600/20 text-blue-400">${a.status}</span>
                    </div>
                    <p class="text-slate-400 text-lg leading-relaxed mb-10 whitespace-pre-line">${a.desc || 'Este asset não possui descrição detalhada.'}</p>
                    <button onclick="handleDownload('${a.id}')" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-2xl hover:bg-blue-500 transition shadow-xl shadow-blue-900/30">BAIXAR AGORA</button>
                </div>
            </div>
        `;
    }
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

// ADMIN FUNCTIONS
function switchTab(t) {
    document.getElementById('sectionForm').classList.toggle('hidden', t !== 'create');
    document.getElementById('sectionManage').classList.toggle('hidden', t !== 'manage');
    if(t === 'manage') renderManageList();
}

function renderManageList() {
    const l = document.getElementById('existingAssetsList');
    if(!l) return;
    l.innerHTML = assets.length ? "" : "<p class='text-slate-500'>Nada aqui.</p>";
    assets.forEach(a => {
        l.innerHTML += `
            <div class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-white/5">
                <div class="flex items-center gap-4">
                    <img src="${a.img}" class="w-12 h-12 rounded object-cover">
                    <span class="font-bold">${a.title}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEdit(${a.id})" class="text-blue-400 p-2 text-sm">Editar</button>
                    <button onclick="deleteAsset(${a.id})" class="text-red-500 p-2 text-sm font-bold">X</button>
                </div>
            </div>`;
    });
}

function prepareEdit(id) {
    const a = assets.find(x => x.id == id);
    document.getElementById('editId').value = a.id;
    document.getElementById('assetTitle').value = a.title;
    document.getElementById('assetDesc').value = a.desc || "";
    document.getElementById('assetFileUrl').value = a.fileUrl;
    document.getElementById('assetStatus').value = a.status || 'nenhum';
    document.getElementById('assetFail').value = a.fail || 'none';
    document.getElementById('panelTitle').innerText = "EDITAR ASSET";
    switchTab('create');
}

function deleteAsset(id) {
    if(confirm("Apagar?")) {
        assets = assets.filter(x => x.id !== id);
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        renderManageList();
    }
}
