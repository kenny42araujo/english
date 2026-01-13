// Configurações das labels das faces (Fácil de editar)
const labelsConfig = {
    texto_F: "Português",
    texto_B: "Inglês",
};

let flashcardsData = [];
let indiceAtual = 0;
let estaVirado = false;
let modoInvertido = false; // Controla se a sequência é PT->EN ou EN->PT
let audioLocal = new Audio();

// Elementos do DOM
const cardElement = document.getElementById("flashcard");
const conteudoFrente = document.getElementById("conteudo-frente");
const conteudoVerso = document.getElementById("conteudo-verso");
const contadorElement = document.getElementById("contador");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

const labelFrente = document.getElementById("label-frente");
const labelVerso = document.getElementById("label-verso");

/**
 * Carrega o arquivo TSV:
 * Coluna 0: Legenda PT | Coluna 1: Significado EN | Coluna 2: Áudio | Coluna 3: Imagem
 */
async function carregarDadosExternos() {
    try {
        const resposta = await fetch("js/frases.tsv");
        const textoOriginal = await resposta.text();
        const linhas = textoOriginal.split("\n");

        flashcardsData = linhas
            .map((linha) => {
                const colunas = linha.split("\t");
                if (colunas.length >= 4) {
                    return {
                        legenda_PT: colunas[0].trim(),
                        significado_EN: colunas[1].trim(),
                        audio_path: colunas[2].trim(),
                        imagem_path: colunas[3].trim(),
                    };
                }
                return null;
            })
            .filter((item) => item !== null);

        if (flashcardsData.length > 0) {
            atualizarCartao();
        }
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

/**
 * Atualiza o conteúdo do cartão
 */
function atualizarCartao() {
    if (flashcardsData.length === 0) return;

    const dados = flashcardsData[indiceAtual];
    
    // Configura o estado inicial do cartão baseado no modo
    if (!modoInvertido) {
        estaVirado = false;
        cardElement.classList.remove("is-flipped");
    } else {
        estaVirado = true;
        cardElement.classList.add("is-flipped");
        // No modo invertido, o áudio toca IMEDIATAMENTE ao carregar o cartão
        tocarAudioLocal(dados.audio_path);
    }

    // Mantém o conteúdo em seus lados originais para respeitar a formatação CSS
    labelFrente.textContent = labelsConfig.texto_F;
    labelVerso.textContent = labelsConfig.texto_B;

    conteudoFrente.innerHTML = `
        <img src="${dados.imagem_path}" class="flashcard-img" alt="imagem" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Nao+Encontrada'">
        <div class="caption">${dados.legenda_PT}</div>
    `;
    
    conteudoVerso.innerHTML = `<div class="meaning">${dados.significado_EN}</div>`;

    // Atualiza contador e status do modo
    const textoModo = modoInvertido ? " (Inverso)" : "";
    contadorElement.textContent = `${indiceAtual + 1} / ${flashcardsData.length}${textoModo}`;

    // Lógica dos botões para navegação contínua
    btnPrev.disabled = (indiceAtual === 0 && !modoInvertido);
    btnNext.disabled = (indiceAtual === flashcardsData.length - 1 && modoInvertido);
}

function tocarAudioLocal(caminho) {
    if (!caminho) return;
    // Reseta o áudio anterior antes de tocar o novo
    audioLocal.pause();
    audioLocal.currentTime = 0;
    audioLocal.src = caminho;
    audioLocal.play().catch((e) => console.log("Áudio não carregado ou bloqueado: " + caminho));
}

function virarCartao() {
    if (flashcardsData.length === 0) return;
    estaVirado = !estaVirado;

    if (estaVirado) {
        cardElement.classList.add("is-flipped");
        // Toca o áudio ao mostrar o verso (Inglês)
        tocarAudioLocal(flashcardsData[indiceAtual].audio_path);
    } else {
        cardElement.classList.remove("is-flipped");
        audioLocal.pause();
        audioLocal.currentTime = 0;
    }
}

function proximoCartao() {
    if (indiceAtual < flashcardsData.length - 1) {
        indiceAtual++;
        atualizarCartao();
    } else if (!modoInvertido) {
        // Fim da sequência normal -> Inicia sequência inversa
        indiceAtual = 0;
        modoInvertido = true;
        atualizarCartao();
    }
}

function cartaoAnterior() {
    if (indiceAtual > 0) {
        indiceAtual--;
        atualizarCartao();
    } else if (modoInvertido) {
        // Volta do início do modo inverso para o fim do modo normal
        indiceAtual = flashcardsData.length - 1;
        modoInvertido = false;
        atualizarCartao();
    }
}

// Event Listeners
cardElement.addEventListener("click", virarCartao);
btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    proximoCartao();
});
btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    cartaoAnterior();
});

// Inicialização
window.onload = carregarDadosExternos;