let assets = JSON.parse(localStorage.getItem('forge_assets')) || [];
let assetToDelete = null;

// NOTIFICAÇÕES
function showNotify(text, type = 'success') {
    const container = document.getElementById('notification-container');
    if(!container) return;
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${color} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate__animated animate__fadeInRight mb-2 font-bold z-50`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight'); 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

// LOGIN COM ENTER
const passInput = document.getElementById('pass');
if(passInput) {
    passInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') login();
    });
}

function login() {
    if (document.getElementById('pass').value === '2012') {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        renderManageList();
        showNotify("Acesso concedido!");
    } else {
        showNotify("Senha incorreta!", "error");
    }
}

// CONVERSÃO DE IMAGEM
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// SALVAR ASSET (CORRIGIDO PARA EVITAR ERRO DE MEMÓRIA)
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
            // MODO EDIÇÃO
            let a = assets.find(x => x.id == id);
            a.title = title; a.desc = desc; a.fileUrl = fileUrl; a.status = status; a.fail = fail;
            
            // Só tenta processar imagem se o usuário selecionou uma nova
            if (imgInput.files && imgInput.files[0]) {
                a.img = await toBase64(imgInput.files[0]);
            }
            showNotify("Asset atualizado!");
        } else {
            // MODO CRIAÇÃO
            if (!imgInput.files || !imgInput.files[0]) return showNotify("Selecione uma imagem de capa!", "error");
            const imgData = await toBase64(imgInput.files[0]);
            assets.push({ id: Date.now(), title, desc, fileUrl, status, fail, img: imgData });
            showNotify("Asset criado!");
        }
        
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        resetForm();
        renderManageList();
        switchTab('manage');
    } catch (e) {
        console.error(e);
        showNotify("Erro: O navegador ficou sem memória! Delete assets antigos ou use imagens menores.", "error");
    }
}

// RENDERIZAR NA INDEX
if (document.getElementById('assetGrid')) {
    const grid = document.getElementById('assetGrid');
    assets.forEach(a => {
        const badge = a.status && a.status !== 'nenhum' ? `<span class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase badge-${a.status} z-10">${a.status}</span>` : '';
        grid.innerHTML += `
            <div class="asset-card relative bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-blue-500 transition-all duration-300">
                ${badge}
                <button onclick="event.stopPropagation(); handleDownload('${a.id}')" class="shortcut-btn absolute top-4 right-4 bg-blue-600 p-3 rounded-xl z-20 opacity-0 translate-y-[-10px] transition-all hover:bg-blue-500 shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <div onclick="location.href='asset.html?id=${a.id}'" class="cursor-pointer">
                    <div class="h-52 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${a.img}')"></div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2 transition-colors">${a.title}</h3>
                        <p class="text-slate-500 text-sm line-clamp-2">${a.desc || 'Clique para ver detalhes.'}</p>
                    </div>
                </div>
            </div>`;
    });
}

// LOGICA PARA ASSET.HTML (PÁGINA INDIVIDUAL)
if (document.getElementById('assetDetailContent')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const a = assets.find(x => x.id == id);

    if (a) {
        document.getElementById('assetDetailContent').innerHTML = `
            <div class="bg-slate-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                <img src="${a.img}" class="w-full h-[450px] object-cover">
                <div class="p-10 text-left">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-4xl font-black">${a.title}</h1>
                        <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase bg-blue-600/20 text-blue-400 border border-blue-500/20">${a.status}</span>
                    </div>
                    <div class="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
                        <h3 class="text-blue-500 font-bold mb-2 uppercase text-xs">Descrição</h3>
                        <p class="text-slate-300 leading-relaxed whitespace-pre-line">${a.desc || 'Nenhuma descrição técnica disponível.'}</p>
                    </div>
                    <button onclick="handleDownload('${a.id}')" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-2xl hover:bg-blue-500 transition shadow-xl shadow-blue-900/30">
                        DOWNLOAD
                    </button>
                </div>
            </div>`;
    }
}

// FUNÇÕES DE ADMIN
function resetForm() {
    document.getElementById('editId').value = "";
    document.getElementById('assetTitle').value = "";
    document.getElementById('assetDesc').value = "";
    document.getElementById('assetFileUrl').value = "";
    document.getElementById('assetImg').value = "";
    document.getElementById('panelTitle').innerText = "Editor Mode";
}

function handleDownload(id) {
    const a = assets.find(x => x.id == id);
    if (a.fail === 'none') {
        showNotify("Iniciando...");
        window.open(a.fileUrl, '_blank');
    } else {
        const e = { '404': "ERRO 404", 'virus': "RISCO: Vírus!", 'limit': "LIMITE EXCEDIDO" };
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
    if(!l) return;
    l.innerHTML = assets.length ? "" : "<p class='text-slate-500 text-center py-10'>Vazio.</p>";
    assets.forEach(a => {
        l.innerHTML += `
            <div class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-white/5">
                <div class="flex items-center gap-4">
                    <img src="${a.img}" class="w-12 h-12 rounded-lg object-cover border border-white/10">
                    <span class="font-bold text-sm">${a.title}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEdit(${a.id})" class="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold uppercase">Editar</button>
                    <button onclick="openDeleteModal(${a.id})" class="bg-red-600/10 text-red-500 px-4 py-2 rounded-xl text-xs font-bold uppercase">Apagar</button>
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
    document.getElementById('panelTitle').innerText = "Editando: " + a.title;
    switchTab('create');
}

// FUNÇÕES DE EXCLUSÃO (Modal)
function openDeleteModal(id) {
    assetToDelete = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}
document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    assets = assets.filter(x => x.id !== assetToDelete);
    localStorage.setItem('forge_assets', JSON.stringify(assets));
    renderManageList();
    closeDeleteModal();
    showNotify("Asset removido!");
});
