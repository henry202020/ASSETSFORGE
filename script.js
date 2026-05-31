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
        showNotify("Acesso master autorizado!");
    } else {
        showNotify("Senha incorreta!", "error");
    }
}

// RENDERIZAR HOME (COM SHORTCUT DE DOWNLOAD)
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
                        <h3 class="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">${a.title}</h3>
                        <p class="text-slate-500 text-sm line-clamp-2">${a.desc || 'Clique para ver detalhes.'}</p>
                    </div>
                </div>
            </div>`;
    });
}

// FUNÇÕES DO MODAL DE EXCLUSÃO
function openDeleteModal(id) {
    assetToDelete = id;
    document.getElementById('deleteModal').classList.remove('hidden');
    document.getElementById('deleteModal').classList.add('flex');
}

function closeDeleteModal() {
    assetToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
    document.getElementById('deleteModal').classList.remove('flex');
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    if(assetToDelete) {
        assets = assets.filter(x => x.id !== assetToDelete);
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        renderManageList();
        closeDeleteModal();
        showNotify("Asset removido com sucesso!", "success");
    }
});

// RENDERIZAR LISTA NO ADMIN
function renderManageList() {
    const l = document.getElementById('existingAssetsList');
    if(!l) return;
    l.innerHTML = assets.length ? "" : "<p class='text-slate-500 text-center py-10'>Nenhum asset cadastrado.</p>";
    assets.forEach(a => {
        l.innerHTML += `
            <div class="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-white/5 animate__animated animate__fadeInUp">
                <div class="flex items-center gap-4">
                    <img src="${a.img}" class="w-12 h-12 rounded-lg object-cover border border-white/10">
                    <div>
                        <p class="font-bold text-sm">${a.title}</p>
                        <p class="text-[10px] text-blue-400 uppercase font-black">${a.status}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEdit(${a.id})" class="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition text-xs font-bold uppercase">Configurar</button>
                    <button onclick="openDeleteModal(${a.id})" class="bg-red-600/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition text-xs font-bold uppercase">Excluir</button>
                </div>
            </div>`;
    });
}

// ... (Mantenha as funções handleDownload, toBase64, saveAsset, switchTab e prepareEdit iguais ao anterior) ...
async function saveAsset() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('assetTitle').value;
    const desc = document.getElementById('assetDesc').value;
    const fileUrl = document.getElementById('assetFileUrl').value;
    const status = document.getElementById('assetStatus').value;
    const fail = document.getElementById('assetFail').value;
    const imgInput = document.getElementById('assetImg');

    if (!title || !fileUrl) return showNotify("Preencha o título e o link!", "error");

    try {
        if (id) {
            let a = assets.find(x => x.id == id);
            Object.assign(a, { title, desc, fileUrl, status, fail });
            if (imgInput.files[0]) a.img = await toBase64(imgInput.files[0]);
            showNotify("Alterações salvas!");
        } else {
            if (!imgInput.files[0]) return showNotify("A imagem de capa é obrigatória!", "error");
            assets.push({ id: Date.now(), title, desc, fileUrl, status, fail, img: await toBase64(imgInput.files[0]) });
            showNotify("Asset criado!");
        }
        localStorage.setItem('forge_assets', JSON.stringify(assets));
        
        // Reset sem deslogar
        document.getElementById('editId').value = "";
        document.getElementById('assetTitle').value = "";
        document.getElementById('assetDesc').value = "";
        document.getElementById('assetFileUrl').value = "";
        imgInput.value = "";
        renderManageList();
        switchTab('manage');
    } catch (e) { showNotify("Erro ao processar imagem!", "error"); }
}

function handleDownload(id) {
    const a = assets.find(x => x.id == id);
    if(!a) return;
    if (a.fail === 'none') {
        showNotify("Preparando seu arquivo...");
        window.open(a.fileUrl, '_blank');
    } else {
        const e = { '404': "ERRO 404: Servidor Offline", 'virus': "RISCO: Malware Detectado", 'limit': "LIMITE: Tente em 24h" };
        showNotify(e[a.fail], "error");
    }
}

function switchTab(t) {
    document.getElementById('sectionForm').classList.toggle('hidden', t !== 'create');
    document.getElementById('sectionManage').classList.toggle('hidden', t !== 'manage');
    document.getElementById('tabCreate').className = t === 'create' ? 'px-6 py-3 rounded-xl font-bold bg-blue-600 transition' : 'px-6 py-3 rounded-xl font-bold bg-slate-800 transition';
    document.getElementById('tabManage').className = t === 'manage' ? 'px-6 py-3 rounded-xl font-bold bg-blue-600 transition' : 'px-6 py-3 rounded-xl font-bold bg-slate-800 transition';
    if(t === 'manage') renderManageList();
}

function prepareEdit(id) {
    const a = assets.find(x => x.id == id);
    document.getElementById('editId').value = a.id;
    document.getElementById('assetTitle').value = a.title;
    document.getElementById('assetDesc').value = a.desc || "";
    document.getElementById('assetFileUrl').value = a.fileUrl;
    document.getElementById('assetStatus').value = a.status || 'nenhum';
    document.getElementById('assetFail').value = a.fail || 'none';
    document.getElementById('panelTitle').innerText = "EDITANDO: " + a.title.toUpperCase();
    switchTab('create');
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
                        <h3 class="text-blue-500 font-bold mb-2 uppercase text-xs">Descrição Técnica</h3>
                        <p class="text-slate-300 leading-relaxed whitespace-pre-line">${a.desc || 'Nenhuma descrição detalhada informada para este recurso.'}</p>
                    </div>
                    <button onclick="handleDownload('${a.id}')" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-2xl hover:bg-blue-500 transition shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        DOWNLOAD AGORA
                    </button>
                </div>
            </div>`;
    }
}
