/* ==========================================================================
   Wello Tattoo - Lógica do Painel Administrativo
   ========================================================================== */

const REPO_FIXO = "https://github.com/ViniciusNarezzi/Site-do-Wello";

let galeriaTrabalhos = [];
let sortableInstance = null;
let itemIndexCarrosselAtual = null;

// Inicialização de Dados
async function carregarDadosIniciais() {
  try {
    const res = await fetch('../data/galeria.json');
    const data = await res.json();
    galeriaTrabalhos = data.trabalhos || [];
  } catch (err) {
    console.log("Iniciando galeria vazia...");
  }
  renderizarGaleriaRealTime();
  iniciarDragAndDrop();
}

// Renderizar Galeria
function renderizarGaleriaRealTime() {
  const container = document.getElementById("gridPreview");
  const countLabel = document.getElementById("fotoCount");
  container.innerHTML = "";

  const destaquesAtivos = galeriaTrabalhos.filter(t => t.destaque).length;
  countLabel.textContent = `${galeriaTrabalhos.length} foto(s) | ${destaquesAtivos}/4 no destaque da Home`;

  if (galeriaTrabalhos.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Nenhuma foto cadastrada.</p>`;
    return;
  }

  galeriaTrabalhos.forEach((trabalho, index) => {
    const item = document.createElement("div");
    item.style.position = "relative";
    item.dataset.index = index;

    const isDestaque = trabalho.destaque === true;
    const qtdCarrossel = trabalho.carrossel ? trabalho.carrossel.length : 0;

    item.innerHTML = `
      <img src="${trabalho.imagem}" alt="${trabalho.alt || 'Tatuagem Wello'}">
      <div class="card-actions">
        <button class="btn-destaque ${isDestaque ? 'ativo' : ''}" onclick="toggleDestaque(${index})">
          ${isDestaque ? '★ NA HOME (DESTAQUE)' : '☆ MOSTRAR NA HOME'}
        </button>
        <div class="action-row">
          <button class="btn-edit-carrossel" onclick="abrirModalCarrossel(${index})">CARROSSEL (${qtdCarrossel})</button>
          <button class="btn-del" onclick="removerFoto(${index})">EXCLUIR</button>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

// Alterar Destaque
function toggleDestaque(index) {
  const atualmenteDestaque = galeriaTrabalhos[index].destaque;
  const totalDestaques = galeriaTrabalhos.filter(t => t.destaque).length;

  if (!atualmenteDestaque && totalDestaques >= 4) {
    alert("Você já selecionou 4 fotos em destaque para a Home! Desmarque uma das 4 atuais para ativar esta.");
    return;
  }

  galeriaTrabalhos[index].destaque = !atualmenteDestaque;
  renderizarGaleriaRealTime();
}

// Drag & Drop
function iniciarDragAndDrop() {
  const container = document.getElementById("gridPreview");
  if (!container) return;

  if (sortableInstance) sortableInstance.destroy();

  sortableInstance = new Sortable(container, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    delay: 100,
    delayOnTouchOnly: true,
    onEnd: function (evt) {
      const itemMovido = galeriaTrabalhos.splice(evt.oldIndex, 1)[0];
      galeriaTrabalhos.splice(evt.newIndex, 0, itemMovido);
      renderizarGaleriaRealTime();
    }
  });
}

// Remover Publicação
function removerFoto(index) {
  if (confirm("Deseja remover esta publicação inteira da galeria?")) {
    galeriaTrabalhos.splice(index, 1);
    renderizarGaleriaRealTime();
  }
}

// Modal do Carrossel
function abrirModalCarrossel(index) {
  itemIndexCarrosselAtual = index;
  if (!galeriaTrabalhos[index].carrossel) galeriaTrabalhos[index].carrossel = [];
  renderizarSubfotosModal();
  document.getElementById("modalCarrossel").classList.add("active");
}

function fecharModalCarrossel() {
  document.getElementById("modalCarrossel").classList.remove("active");
  itemIndexCarrosselAtual = null;
  renderizarGaleriaRealTime();
}

function renderizarSubfotosModal() {
  if (itemIndexCarrosselAtual === null) return;
  const container = document.getElementById("listaSubfotos");
  container.innerHTML = "";

  const carrossel = galeriaTrabalhos[itemIndexCarrosselAtual].carrossel;

  if (carrossel.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; grid-column: 1/-1; text-align: center;">Nenhuma foto extra cadastrada neste carrossel.</p>`;
    return;
  }

  carrossel.forEach((subImgUrl, subIndex) => {
    const subCard = document.createElement("div");
    subCard.className = "subfoto-card";
    subCard.innerHTML = `
      <img src="${subImgUrl}">
      <button class="btn-del" style="width: 100%;" onclick="removerSubfoto(${subIndex})">REMOVER</button>
    `;
    container.appendChild(subCard);
  });
}

function removerSubfoto(subIndex) {
  if (itemIndexCarrosselAtual === null) return;
  galeriaTrabalhos[itemIndexCarrosselAtual].carrossel.splice(subIndex, 1);
  renderizarSubfotosModal();
  renderizarGaleriaRealTime();
}

function salvarConfiguracoes() {
  const repo = document.getElementById("cfgRepo").value.trim();
  const token = document.getElementById("cfgToken").value.trim();

  if (!repo || !token) {
    alert("Preencha ambos os campos para salvar.");
    return;
  }

  localStorage.setItem("wt_gh_repo", repo);
  localStorage.setItem("wt_gh_token", token);
  alert("Configurações salvas com sucesso no navegador!");
  fecharConfigModal();
}

// Substitua o início da função salvarDiretoNoGithub no admin.js por este bloco:
async function salvarDiretoNoGithub() {
  const token = localStorage.getItem("wt_gh_token");
  const repo = REPO_FIXO; // Usa o repositório fixo definido no topo
  const btn = document.getElementById("btnSalvarSite");

  btn.innerText = "⏳ SALVANDO NO SITE...";
  btn.disabled = true;

  const url = `https://api.github.com/repos/${repo}/contents/data/galeria.json`;

  try {
    let sha = "";
    const resGet = await fetch(url, {
      headers: { Authorization: `token ${token}` }
    });

    if (resGet.ok) {
      const dataGet = await resGet.json();
      sha = dataGet.sha;
    }

    const novoConteudoJson = JSON.stringify({ trabalhos: galeriaTrabalhos }, null, 2);
    const conteudoBase64 = btoa(unescape(encodeURIComponent(novoConteudoJson)));

    const payload = {
      message: "Atualização da galeria via Painel Admin Wello Tattoo",
      content: conteudoBase64,
      branch: "main"
    };
    if (sha) payload.sha = sha;

    const resPut = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (resPut.ok) {
      alert("✨ Galeria salva com sucesso! Em instantes as alterações estarão visíveis na página inicial.");
    } else {
      const errData = await resPut.json();
      alert("Erro ao salvar: " + (errData.message || "Verifique as configurações do GitHub."));
    }
  } catch (err) {
    alert("Erro de conexão ao salvar no GitHub: " + err.message);
  } finally {
    btn.innerText = "✨ SALVAR ALTERAÇÕES NO SITE";
    btn.disabled = false;
  }
}

// Cloudinary Widgets
const myWidget = cloudinary.createUploadWidget({
  cloudName: 't5fv9sbq',
  uploadPreset: 'u8tea0h6',
  sources: ['local', 'url', 'camera'],
  multiple: false
}, (error, result) => {
  if (!error && result && result.event === "success") {
    const totalDestaques = galeriaTrabalhos.filter(t => t.destaque).length;
    const novaFoto = {
      imagem: result.info.secure_url,
      alt: "Tatuagem por Wello",
      destaque: totalDestaques < 4,
      carrossel: []
    };
    galeriaTrabalhos.unshift(novaFoto);
    renderizarGaleriaRealTime();
  }
});

const widgetCarrossel = cloudinary.createUploadWidget({
  cloudName: 't5fv9sbq',
  uploadPreset: 'u8tea0h6',
  sources: ['local', 'url', 'camera'],
  multiple: true
}, (error, result) => {
  if (!error && result && result.event === "success") {
    if (itemIndexCarrosselAtual !== null) {
      if (!galeriaTrabalhos[itemIndexCarrosselAtual].carrossel) galeriaTrabalhos[itemIndexCarrosselAtual].carrossel = [];
      galeriaTrabalhos[itemIndexCarrosselAtual].carrossel.push(result.info.secure_url);
      renderizarSubfotosModal();
      renderizarGaleriaRealTime();
    }
  }
});


// Torna a função globalmente acessível para os botões do HTML
window.fecharModalCarrossel = function() {
  const modal = document.getElementById("modalCarrossel");
  if (modal) {
    modal.classList.remove("active");
  }
  itemIndexCarrosselAtual = null;
  if (typeof renderizarGaleriaRealTime === "function") {
    renderizarGaleriaRealTime();
  }
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosIniciais();

  document.getElementById("btnUpload").addEventListener("click", () => myWidget.open());
  document.getElementById("btnUploadCarrossel").addEventListener("click", () => widgetCarrossel.open());
  document.getElementById("btnSalvarSite").addEventListener("click", salvarDiretoNoGithub);
  document.getElementById("btnAbrirConfig").addEventListener("click", abrirConfigModal);
  document.getElementById("btnFecharConfig").addEventListener("click", fecharConfigModal);
  document.getElementById("btnSalvarConfig").addEventListener("click", salvarConfiguracoes);
  document.getElementById("btnFecharCarrossel").addEventListener("click", fecharModalCarrossel);
  document.getElementById("btnConcluirCarrossel").addEventListener("click", fecharModalCarrossel);
});
