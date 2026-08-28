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
   4. Lightbox / Carrossel Exclusivo Por Imagem (Com Transição Suave)
   ------------------------------------------------------------- */
const galleryImages = document.querySelectorAll(".grid-galeria img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox-close");
const prevBtn = document.querySelector(".lightbox-prev");
const nextBtn = document.querySelector(".lightbox-next");

let currentCarouselList = []; 
let currentImageIndex = 0;   

if (galleryImages.length > 0 && lightbox) {

    // Função para trocar a imagem com efeito suave
    const changeImage = (newIndex) => {
        lightboxImg.classList.add("fade-out"); // Começa a sumir suavemente
        
        setTimeout(() => {
            currentImageIndex = newIndex;
            lightboxImg.src = currentCarouselList[currentImageIndex];
            lightboxImg.classList.remove("fade-out"); // Reaparece com a nova foto
        }, 200); // Tempo da transição (em milissegundos)
    };

    const openLightbox = (imgElement) => {
        const rawData = imgElement.getAttribute("data-carrossel");
        
        if (rawData) {
            currentCarouselList = rawData.split(",").map(url => url.trim());
        } else {
            currentCarouselList = [imgElement.src];
        }

        currentImageIndex = 0;
        lightboxImg.src = currentCarouselList[currentImageIndex];
        lightboxImg.classList.remove("fade-out");
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
        const nextIndex = (currentImageIndex + 1) % currentCarouselList.length;
        changeImage(nextIndex);
    };

    const showPrev = () => {
        if (currentCarouselList.length <= 1) return;
        const prevIndex = (currentImageIndex - 1 + currentCarouselList.length) % currentCarouselList.length;
        changeImage(prevIndex);
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

/* -------------------------------------------------------------
   5. Interação dos Cards de Estilos (Expansão e Foco)
   ------------------------------------------------------------- */
const estilosGrid = document.querySelector(".estilos-grid");
const estiloCards = document.querySelectorAll(".estilo-card");

if (estilosGrid && estiloCards.length > 0) {
    estiloCards.forEach(card => {
        card.addEventListener("click", () => {
            // Se o card clicado já estiver ativo, ele fecha e reseta os outros
            if (card.classList.contains("ativo")) {
                card.classList.remove("ativo");
                estilosGrid.classList.remove("has-active");
            } else {
                // Remove a classe 'ativo' de todos os outros cards
                estiloCards.forEach(c => c.classList.remove("ativo"));
                
                // Ativa o card clicado e sinaliza o grid
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
const numeroTelefone = "5518996352122"; // Número configurado

// 1. Ação do Botão Principal do WhatsApp
if (btnWhatsapp) {
    btnWhatsapp.addEventListener("click", (e) => {
        e.preventDefault();

        const agora = new Date();
        const hora = agora.getHours();
        const diaSemana = agora.getDay();

        // Saudação por horário
        let saudacao = "Olá";
        if (hora >= 5 && hora < 12) {
            saudacao = "Bom dia";
        } else if (hora >= 12 && hora < 18) {
            saudacao = "Boa tarde";
        } else {
            saudacao = "Boa noite";
        }

        // Status do atendimento
        const emHorarioAtendimento = (diaSemana >= 2 && diaSemana <= 6) && (hora >= 10 && hora < 19);

        let mensagem = `${saudacao}, Wello! Tudo bem? Vi seu site e gostaria de fazer um orçamento para uma tatuagem.`;

        if (!emHorarioAtendimento) {
            mensagem += ` Sei que estou mandando mensagem fora do horário, mas assim que você conseguir me responder a gente troca uma ideia e marca um horário!`;
        }

        const urlWhatsapp = `https://wa.me/${numeroTelefone}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWhatsapp, "_blank");
    });
}

// 2. Ação do Formulário de Orçamento (Envia a ideia preenchida direto pro WhatsApp)
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

// 1. Exibe ou oculta o botão dependendo da rolagem da página
window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
        btnVoltarTopo.classList.add("visivel");
    } else {
        btnVoltarTopo.classList.remove("visivel");
    }
});

// 2. Ação de clique no botão flutuante para subir suavemente
if (btnVoltarTopo) {
    btnVoltarTopo.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// 3. Ação de clique no título Wello Tattoo no Header para subir suavemente
if (logoTopo) {
    logoTopo.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

});