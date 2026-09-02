/* ==========================================================================
   Wello Tattoo - Lógica do Painel Administrativo (revisado)
   ========================================================================== */

const REPO_PADRAO = "ViniciusNarezzi/Site-do-Wello";
const CLOUD_NAME = "t5fv9sbq";
const UPLOAD_PRESET = "u8tea0h6";

let galeriaTrabalhos = [];
let sortableInstance = null;
let itemIndexCarrosselAtual = null;
let myWidget = null;
let widgetCarrossel = null;

/* --------------------------------------------------------------------
   Config (repositório + token) — agora lidos de verdade do formulário
   -------------------------------------------------------------------- */
function getRepo() {
  return localStorage.getItem("wt_gh_repo") || REPO_PADRAO;
}
function getToken() {
  return localStorage.getItem("wt_gh_token") || "";
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

/* --------------------------------------------------------------------
   Carregar dados existentes (GitHub primeiro, arquivo local como backup)
   -------------------------------------------------------------------- */
async function carregarDadosIniciais() {
  const repo = getRepo();
  const token = getToken();

  // Se já tem token salvo, usa a API autenticada do GitHub — funciona
  // mesmo com repositório privado (o link "raw" público não funciona
  // nesse caso, então nem tentamos ele quando há token).
  if (token) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/data/galeria.json`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (!res.ok) throw new Error(`API do GitHub retornou status ${res.status}`);
      const dataApi = await res.json();
      const conteudo = decodeURIComponent(escape(atob(dataApi.content)));
      const data = JSON.parse(conteudo);
      galeriaTrabalhos = data.trabalhos || [];
      renderizarGaleriaRealTime();
      iniciarDragAndDrop();
      return;
    } catch (err) {
      console.warn("Não consegui buscar via API autenticada do GitHub, tentando arquivo local:", err);
    }
  }

  // Sem token ainda (primeiro uso) ou API falhou: tenta o arquivo local
  // (funciona quando o painel está servido junto do resto do site).
  try {
    const resLocal = await fetch('../data/galeria.json');
    const dataLocal = await resLocal.json();
    galeriaTrabalhos = dataLocal.trabalhos || [];
  } catch (err2) {
    console.error("Também não consegui carregar o arquivo local:", err2);
    galeriaTrabalhos = [];
  }
  renderizarGaleriaRealTime();
  iniciarDragAndDrop();
}

/* --------------------------------------------------------------------
   Renderizar Galeria
   -------------------------------------------------------------------- */
function renderizarGaleriaRealTime() {
  const container = document.getElementById("gridPreview");
  const countLabel = document.getElementById("fotoCount");
  if (!container || !countLabel) return;

  container.innerHTML = "";

  const destaquesAtivos = galeriaTrabalhos.filter(t => t.destaque).length;
  countLabel.textContent = `${galeriaTrabalhos.length} foto(s) | ${destaquesAtivos}/4 no destaque da Home`;

  if (galeriaTrabalhos.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Nenhuma foto cadastrada ainda. Clique em "+ Adicionar Nova Foto Principal" acima.</p>`;
    return;
  }

  galeriaTrabalhos.forEach((trabalho, index) => {
    const item = document.createElement("div");
    item.style.position = "relative";
    item.dataset.index = index;

    const isDestaque = trabalho.destaque === true;
    const qtdCarrossel = trabalho.carrossel ? trabalho.carrossel.length : 0;

    item.innerHTML = `
      <img src="${escapeHtml(trabalho.imagem)}" alt="${escapeHtml(trabalho.alt || 'Tatuagem Wello')}">
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

/* --------------------------------------------------------------------
   Alterar Destaque
   -------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------
   Drag & Drop
   -------------------------------------------------------------------- */
function iniciarDragAndDrop() {
  const container = document.getElementById("gridPreview");
  if (!container) return;

  if (typeof Sortable === "undefined") {
    console.warn("Biblioteca Sortable não carregou — reordenar por arrastar não vai funcionar, mas o resto do painel segue normal.");
    return;
  }

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

/* --------------------------------------------------------------------
   Remover Publicação
   -------------------------------------------------------------------- */
function removerFoto(index) {
  if (confirm("Deseja remover esta publicação inteira da galeria?")) {
    galeriaTrabalhos.splice(index, 1);
    renderizarGaleriaRealTime();
  }
}

/* --------------------------------------------------------------------
   Modal do Carrossel
   -------------------------------------------------------------------- */
function abrirModalCarrossel(index) {
  itemIndexCarrosselAtual = index;
  if (!galeriaTrabalhos[index].carrossel) galeriaTrabalhos[index].carrossel = [];
  renderizarSubfotosModal();
  document.getElementById("modalCarrossel").classList.add("active");
}

window.fecharModalCarrossel = function () {
  const modal = document.getElementById("modalCarrossel");
  if (modal) modal.classList.remove("active");
  itemIndexCarrosselAtual = null;
  renderizarGaleriaRealTime();
};

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
      <img src="${escapeHtml(subImgUrl)}">
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

/* --------------------------------------------------------------------
   Modal de Configuração (repositório + token)
   -------------------------------------------------------------------- */
function abrirConfigModal() {
  document.getElementById("cfgRepo").value = getRepo();
  document.getElementById("cfgToken").value = getToken();
  document.getElementById("modalConfig").classList.add("active");
}

function fecharConfigModal() {
  document.getElementById("modalConfig").classList.remove("active");
}

function salvarConfiguracoes() {
  const repo = document.getElementById("cfgRepo").value.trim();
  const token = document.getElementById("cfgToken").value.trim();

  if (!repo || !repo.includes("/")) {
    alert("Repositório inválido. Use o formato usuario/nome-do-repositorio (ex: ViniciusNarezzi/Site-do-Wello).");
    return;
  }
  if (!token) {
    alert("Insira o seu Personal Access Token do GitHub.");
    return;
  }

  localStorage.setItem("wt_gh_repo", repo);
  localStorage.setItem("wt_gh_token", token);
  alert("Configuração salva com sucesso!");
  fecharConfigModal();
}

/* --------------------------------------------------------------------
   Salvar na API do GitHub
   -------------------------------------------------------------------- */
async function salvarDiretoNoGithub() {
  const token = getToken();
  const repo = getRepo();
  const btn = document.getElementById("btnSalvarSite");

  if (!token) {
    alert("Token do GitHub não configurado! Clique no botão ⚙️ CONFIG no topo e cole seu Personal Access Token.");
    abrirConfigModal();
    return;
  }

  const textoOriginal = btn.innerText;
  btn.innerText = "⏳ SALVANDO NO SITE...";
  btn.disabled = true;

  const url = `https://api.github.com/repos/${repo}/contents/data/galeria.json`;

  try {
    let sha = "";
    const resGet = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (resGet.ok) {
      const dataGet = await resGet.json();
      sha = dataGet.sha;
    } else if (resGet.status !== 404) {
      throw new Error(`Não consegui ler o arquivo atual no GitHub (status ${resGet.status}). Confira o repositório e o token.`);
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
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify(payload)
    });

    if (resPut.ok) {
      alert("✨ Galeria salva com sucesso! Em instantes as alterações estarão visíveis no site.");
    } else {
      const errData = await resPut.json().catch(() => ({}));
      alert("Erro ao salvar: " + (errData.message || `status ${resPut.status}`) + "\n\nVerifique se o token tem permissão de escrita (repo) e se o repositório/branch estão corretos.");
    }
  } catch (err) {
    alert("Erro de conexão ao salvar no GitHub: " + err.message);
  } finally {
    btn.innerText = textoOriginal;
    btn.disabled = false;
  }
}

/* --------------------------------------------------------------------
   Cloudinary — criação dos widgets (só chamada se a lib carregou)
   -------------------------------------------------------------------- */
function criarWidgetPrincipal() {
  return cloudinary.createUploadWidget({
    cloudName: CLOUD_NAME,
    uploadPreset: UPLOAD_PRESET,
    sources: ['local', 'url', 'camera'],
    multiple: false
  }, (error, result) => {
    if (error) {
      console.error("Erro no upload (Cloudinary):", error);
      alert(
        "Não foi possível enviar a foto.\n\n" +
        `Confira se o Upload Preset "${UPLOAD_PRESET}" existe na sua conta Cloudinary e está configurado como "Unsigned" ` +
        "(Cloudinary > Settings > Upload > Upload presets).\n\n" +
        "Detalhe técnico: " + (error.statusText || error.message || JSON.stringify(error))
      );
      return;
    }
    if (result && result.event === "success") {
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
}

function criarWidgetCarrossel() {
  return cloudinary.createUploadWidget({
    cloudName: CLOUD_NAME,
    uploadPreset: UPLOAD_PRESET,
    sources: ['local', 'url', 'camera'],
    multiple: true
  }, (error, result) => {
    if (error) {
      console.error("Erro no upload do carrossel (Cloudinary):", error);
      alert(
        "Não foi possível enviar a foto do carrossel.\n\n" +
        `Confira se o Upload Preset "${UPLOAD_PRESET}" está configurado como "Unsigned" no Cloudinary.\n\n` +
        "Detalhe técnico: " + (error.statusText || error.message || JSON.stringify(error))
      );
      return;
    }
    if (result && result.event === "success" && itemIndexCarrosselAtual !== null) {
      if (!galeriaTrabalhos[itemIndexCarrosselAtual].carrossel) {
        galeriaTrabalhos[itemIndexCarrosselAtual].carrossel = [];
      }
      galeriaTrabalhos[itemIndexCarrosselAtual].carrossel.push(result.info.secure_url);
      renderizarSubfotosModal();
      renderizarGaleriaRealTime();
    }
  });
}

/* --------------------------------------------------------------------
   Inicialização — tudo dentro do DOMContentLoaded e com verificações,
   para que uma falha de rede/CDN não trave o painel inteiro.
   -------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosIniciais();

  const btnUpload = document.getElementById("btnUpload");
  const btnUploadCarrossel = document.getElementById("btnUploadCarrossel");

  if (typeof cloudinary === "undefined") {
    console.error("A biblioteca do Cloudinary não carregou (verifique sua conexão ou se algum bloqueador de anúncios/script está ativo).");
    if (btnUpload) {
      btnUpload.style.opacity = "0.5";
      btnUpload.style.cursor = "not-allowed";
      const p = btnUpload.querySelector("p");
      if (p) p.textContent = "Erro: biblioteca do Cloudinary não carregou. Recarregue a página.";
    }
  } else {
    myWidget = criarWidgetPrincipal();
    widgetCarrossel = criarWidgetCarrossel();
  }

  btnUpload?.addEventListener("click", () => {
    if (myWidget) {
      myWidget.open();
    } else {
      alert("O Cloudinary não carregou corretamente. Verifique sua internet e recarregue a página.");
    }
  });

  btnUploadCarrossel?.addEventListener("click", () => {
    if (widgetCarrossel) {
      widgetCarrossel.open();
    } else {
      alert("O Cloudinary não carregou corretamente. Verifique sua internet e recarregue a página.");
    }
  });

  document.getElementById("btnSalvarSite")?.addEventListener("click", salvarDiretoNoGithub);
  document.getElementById("btnAbrirConfig")?.addEventListener("click", abrirConfigModal);
  document.getElementById("btnFecharConfig")?.addEventListener("click", fecharConfigModal);
  document.getElementById("btnSalvarConfig")?.addEventListener("click", salvarConfiguracoes);
  document.getElementById("btnFecharCarrossel")?.addEventListener("click", fecharModalCarrossel);
  document.getElementById("btnConcluirCarrossel")?.addEventListener("click", fecharModalCarrossel);
});
