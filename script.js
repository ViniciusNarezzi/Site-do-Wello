window.addEventListener("DOMContentLoaded", () => {

    /* -------------------------------------------------------------
       1. Botão "Ler Mais / Ler Menos"
       ------------------------------------------------------------- */
    const btnLerMais = document.getElementById("btnLerMais");
    const sobreConteudo = document.getElementById("sobreConteudo");

    if (btnLerMais && sobreConteudo) {
        btnLerMais.addEventListener("click", (e) => {
            e.preventDefault();
            sobreConteudo.classList.toggle("expandido");

            if (sobreConteudo.classList.contains("expandido")) {
                btnLerMais.innerText = "Ler Menos";
            } else {
                btnLerMais.innerText = "Ler Mais";
            }
        });
    }

    /* -------------------------------------------------------------
       2. Scroll Reveal Bidirecional
       ------------------------------------------------------------- */
    const scrollElements = document.querySelectorAll("[data-scroll]");

    if ("IntersectionObserver" in window) {
        const observerOptions = {
            root: null,
            rootMargin: "0px",
            threshold: 0.15
        };

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                } else {
                    entry.target.classList.remove("is-visible");
                }
            });
        }, observerOptions);

        scrollElements.forEach(el => scrollObserver.observe(el));
    } else {
        scrollElements.forEach(el => el.classList.add("is-visible"));
    }

    /* -------------------------------------------------------------
       3. Esconder a Imagem do Hero ao Rolar para Baixo (Evita Vazamento)
       ------------------------------------------------------------- */
    window.addEventListener("scroll", () => {
        const heroBg = document.querySelector(".hero-bg");
        const heroContent = document.querySelector(".hero-content");
        const scrollPosition = window.scrollY;

        if (heroBg && heroContent) {
            let opacityValue = 1 - (scrollPosition / 400);
            if (opacityValue < 0) opacityValue = 0;

            heroBg.style.opacity = opacityValue;
            heroContent.style.opacity = opacityValue;
        }
    });


    /* -------------------------------------------------------------
       4. Carregar Galeria Dinâmica do JSON — direto do GitHub, sem
          depender de um novo deploy no Netlify a cada foto salva.
       ------------------------------------------------------------- */
    const REPO_GALERIA = "ViniciusNarezzi/Site-do-Wello";
    const BRANCH_GALERIA = "main";

    async function carregarGaleria() {
        const gridGaleria = document.querySelector('.grid-galeria');
        if (!gridGaleria) return;

        const urlGithub = `https://raw.githubusercontent.com/${REPO_GALERIA}/${BRANCH_GALERIA}/data/galeria.json?_=${Date.now()}`;

        try {
            let dados;
            try {
                // Busca direto do GitHub — reflete o que foi salvo no admin
                // na hora, sem precisar esperar um deploy do Netlify.
                const resposta = await fetch(urlGithub);
                if (!resposta.ok) throw new Error(`GitHub retornou status ${resposta.status}`);
                dados = await resposta.json();
            } catch (erroGithub) {
                // Se o GitHub falhar por algum motivo (fora do ar, offline, etc.),
                // cai pra cópia local publicada como plano B.
                console.warn("Não consegui buscar do GitHub, usando cópia local:", erroGithub);
                const respostaLocal = await fetch('data/galeria.json');
                dados = await respostaLocal.json();
            }

            gridGaleria.innerHTML = '';

            let listaExibida = dados.trabalhos || [];

            // Usa os atributos da própria grid (definidos no HTML) para decidir
            // o filtro — mais confiável do que adivinhar pela URL da página.
            // Só a grid da página inicial tem data-destaque="true".
            if (gridGaleria.dataset.destaque === "true") {
                const fotosDestaque = listaExibida.filter(trabalho => trabalho.destaque === true);
                // Se houver fotos marcadas em destaque, usa elas. Senão, usa a lista toda
                // (o corte de quantidade abaixo garante o limite de qualquer forma).
                if (fotosDestaque.length > 0) {
                    listaExibida = fotosDestaque;
                }
            }

            // Só a grid da página inicial tem data-limite="4"; a galeria completa
            // não tem esse atributo, então mostra todos os trabalhos.
            const limite = parseInt(gridGaleria.dataset.limite, 10);
            if (!isNaN(limite)) {
                listaExibida = listaExibida.slice(0, limite);
            }

            listaExibida.forEach(trabalho => {
                const img = document.createElement('img');
                img.src = trabalho.imagem;
                img.alt = trabalho.alt || "Tatuagem por Wello";

                // O carrossel sempre começa pela foto de capa, seguida das fotos
                // extras cadastradas no painel — sem isso, o clique pulava direto
                // para a segunda foto e não dava pra "voltar" pra capa.
                const listaCarrossel = [trabalho.imagem, ...(trabalho.carrossel || [])];
                img.setAttribute('data-carrossel', listaCarrossel.join(', '));

                gridGaleria.appendChild(img);
            });

            // Ativa o lightbox para abrir o carrossel nas fotos
            iniciarLightbox();

        } catch (erro) {
            console.error("Erro ao carregar a galeria:", erro);
        }
    }

    function iniciarLightbox() {
        const galleryImages = document.querySelectorAll(".grid-galeria img");
        const lightbox = document.getElementById("lightbox");
        const lightboxImg = document.getElementById("lightbox-img");
        const closeBtn = document.querySelector(".lightbox-close");
        const prevBtn = document.querySelector(".lightbox-prev");
        const nextBtn = document.querySelector(".lightbox-next");

        let currentCarouselList = [];
        let currentImageIndex = 0;

        if (galleryImages.length > 0 && lightbox) {
            const openLightbox = (imgElement) => {
                const rawData = imgElement.getAttribute("data-carrossel");
                if (rawData) {
                    currentCarouselList = rawData.split(",").map(url => url.trim());
                } else {
                    currentCarouselList = [imgElement.src];
                }

                currentImageIndex = 0;
                lightboxImg.src = currentCarouselList[currentImageIndex];

                // Reset de animação para garantir que a imagem não suma
                lightboxImg.style.opacity = 1;
                lightboxImg.style.transform = "scale(1)";

                lightbox.classList.add("active");
                document.body.style.overflow = "hidden";

                if (currentCarouselList.length <= 1) {
                    lightbox.classList.add("single-image");
                } else {
                    lightbox.classList.remove("single-image");
                }
            };

            const closeLightbox = () => {
                lightbox.classList.remove("active");
                document.body.style.overflow = "auto";
            };

            const showNext = () => {
                if (currentCarouselList.length <= 1) return;
                currentImageIndex = (currentImageIndex + 1) % currentCarouselList.length;

                lightboxImg.style.opacity = 0.5;
                setTimeout(() => {
                    lightboxImg.src = currentCarouselList[currentImageIndex];
                    lightboxImg.style.opacity = 1;
                }, 150);
            };

            const showPrev = () => {
                if (currentCarouselList.length <= 1) return;
                currentImageIndex = (currentImageIndex - 1 + currentCarouselList.length) % currentCarouselList.length;

                lightboxImg.style.opacity = 0.5;
                setTimeout(() => {
                    lightboxImg.src = currentCarouselList[currentImageIndex];
                    lightboxImg.style.opacity = 1;
                }, 150);
            };

            galleryImages.forEach((img) => {
                img.style.cursor = "pointer";
                img.addEventListener("click", () => openLightbox(img));
            });

            if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
            if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });
            if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });

            lightbox.addEventListener("click", (e) => {
                if (e.target === lightbox || e.target.classList.contains("lightbox-content")) {
                    closeLightbox();
                }
            });

            document.addEventListener("keydown", (e) => {
                if (!lightbox.classList.contains("active")) return;
                if (e.key === "Escape") closeLightbox();
                if (e.key === "ArrowRight") showNext();
                if (e.key === "ArrowLeft") showPrev();
            });
        }
    }

    // Manda o JavaScript carregar as fotos assim que a página abrir
    carregarGaleria();

    /* -------------------------------------------------------------
       5. Interação dos Cards de Estilos (Expansão e Foco)
       ------------------------------------------------------------- */
    const estilosGrid = document.querySelector(".estilos-grid");
    const estiloCards = document.querySelectorAll(".estilo-card");

    if (estilosGrid && estiloCards.length > 0) {
        estiloCards.forEach(card => {
            card.addEventListener("click", () => {
                if (card.classList.contains("ativo")) {
                    card.classList.remove("ativo");
                    estilosGrid.classList.remove("has-active");
                } else {
                    estiloCards.forEach(c => c.classList.remove("ativo"));
                    card.classList.add("ativo");
                    estilosGrid.classList.add("has-active");
                }
            });
        });
    }

    /* -------------------------------------------------------------
       Link Inteligente do WhatsApp (Botão e Formulário)
       ------------------------------------------------------------- */
    const btnWhatsapp = document.getElementById("btnWhatsapp");
    const formOrcamento = document.getElementById("form-orcamento");
    const numeroTelefone = "5518996352122";

    if (btnWhatsapp) {
        btnWhatsapp.addEventListener("click", (e) => {
            e.preventDefault();

            const agora = new Date();
            const hora = agora.getHours();
            const diaSemana = agora.getDay();

            let saudacao = "Olá";
            if (hora >= 5 && hora < 12) {
                saudacao = "Bom dia";
            } else if (hora >= 12 && hora < 18) {
                saudacao = "Boa tarde";
            } else {
                saudacao = "Boa noite";
            }

            const emHorarioAtendimento = (diaSemana >= 2 && diaSemana <= 6) && (hora >= 10 && hora < 19);

            let mensagem = `${saudacao}, Wello! Tudo bem? Vi seu site e gostaria de fazer um orçamento para uma tatuagem.`;

            if (!emHorarioAtendimento) {
                mensagem += ` Sei que estou mandando mensagem fora do horário, mas assim que você conseguir me responder a gente troca uma ideia e marca um horário!`;
            }

            const urlWhatsapp = `https://wa.me/${numeroTelefone}?text=${encodeURIComponent(mensagem)}`;
            window.open(urlWhatsapp, "_blank");
        });
    }

    if (formOrcamento) {
        formOrcamento.addEventListener("submit", (e) => {
            e.preventDefault();

            const nome = document.getElementById("nome").value;
            const ideia = document.getElementById("ideia").value;

            const mensagemForm = `Olá, Wello! Meu nome é ${nome}.\n\nGostaria de fazer um orçamento com a seguinte ideia:\n"${ideia}"`;
            const urlForm = `https://wa.me/${numeroTelefone}?text=${encodeURIComponent(mensagemForm)}`;

            window.open(urlForm, "_blank");
        });
    }

    /* -------------------------------------------------------------
       Funcionalidades de Voltar ao Topo (Botão Flutuante e Logo Header)
       ------------------------------------------------------------- */
    const btnVoltarTopo = document.getElementById("btnVoltarTopo");
    const logoTopo = document.getElementById("logoTopo");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
            btnVoltarTopo?.classList.add("visivel");
        } else {
            btnVoltarTopo?.classList.remove("visivel");
        }
    });

    if (btnVoltarTopo) {
        btnVoltarTopo.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (logoTopo) {
        logoTopo.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

});
