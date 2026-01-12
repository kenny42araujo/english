// Configurações de exibição das labels (Fácil de editar)
const labelsConfig = {
    texto_F: "change into simple past",
    texto_B: "change into simple present"
};

// O array agora começa vazio, pois será preenchido pelo arquivo externo
let flashcardsData = [];

// Variaveis de controle
let indiceAtual = 0;
let estaVirado = false;
let modoInvertido = false; 
let audioLocal = new Audio();

// Elementos do DOM
const cardElement = document.getElementById('flashcard');
const textoFrente = document.getElementById('texto-frente');
const textoVerso = document.getElementById('texto-verso');
const contadorElement = document.getElementById('contador');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Selecionamos as labels das faces
const labelFrente = document.querySelector('.face-front .label-face');
const labelVerso = document.querySelector('.face-back .label-face');

/**
 * Funcao para carregar dados de um arquivo externo
 */
async function carregarDadosExternos() {
    try {
        const resposta = await fetch('js/frases.tsv'); 
        const textoOriginal = await resposta.text();
        
        const linhas = textoOriginal.split('\n');
        
        flashcardsData = linhas.map(linha => {
            const colunas = linha.split('\t');
            if (colunas.length >= 4) {
                return {
                    card_F: colunas[0].trim(),
                    card_B: colunas[1].trim(),
                    audio_F: colunas[2].trim(),
                    audio_B: colunas[3].trim()
                };
            }
            return null;
        }).filter(item => item !== null);

        if (flashcardsData.length > 0) {
            atualizarCartao();
        } else {
            console.error("O arquivo esta vazio ou mal formatado.");
        }
    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro);
    }
}

// Funcao para atualizar o conteudo do cartao
function atualizarCartao() {
    if (flashcardsData.length === 0) return;

    if (estaVirado) {
        virarCartao(); 
        setTimeout(preencherTexto, 200); 
    } else {
        preencherTexto();
        tocarAudioLadoAtual();
    }
}

function preencherTexto() {
    const dados = flashcardsData[indiceAtual];
    
    if (!modoInvertido) {
        textoFrente.innerHTML = dados.card_F;
        textoVerso.innerHTML = dados.card_B;
        if (labelFrente) labelFrente.textContent = labelsConfig.texto_F;
        if (labelVerso) labelVerso.textContent = labelsConfig.texto_B;
    } else {
        textoFrente.innerHTML = dados.card_B;
        textoVerso.innerHTML = dados.card_F;
        if (labelFrente) labelFrente.textContent = labelsConfig.texto_B;
        if (labelVerso) labelVerso.textContent = labelsConfig.texto_F;
    }

    const sufixoModo = modoInvertido ? " (Invertido)" : "";
    contadorElement.textContent = (indiceAtual + 1) + " / " + flashcardsData.length + sufixoModo;

    // Bloqueia o retrocesso apenas se for o primeiro cartao do modo NORMAL
    btnPrev.disabled = (indiceAtual === 0 && !modoInvertido);
    
    // O botao proximo nunca fica desativado devido ao loop infinito
    btnNext.disabled = false;
}

function tocarAudioLocal(caminho) {
    if(!caminho) return;
    audioLocal.src = caminho;
    audioLocal.play().catch(e => {
        console.log("Audio bloqueado ou nao encontrado: " + caminho);
    });
}

function tocarAudioLadoAtual() {
    if (flashcardsData.length === 0) return;
    const dados = flashcardsData[indiceAtual];
    let audioParaTocar;

    if (!estaVirado) {
        audioParaTocar = !modoInvertido ? dados.audio_F : dados.audio_B;
    } else {
        audioParaTocar = !modoInvertido ? dados.audio_B : dados.audio_F;
    }
    
    tocarAudioLocal(audioParaTocar);
}

function virarCartao() {
    if (flashcardsData.length === 0) return;
    estaVirado = !estaVirado;
    if (estaVirado) {
        cardElement.classList.add('is-flipped');
    } else {
        cardElement.classList.remove('is-flipped');
    }
    tocarAudioLadoAtual();
}

function proximoCartao() {
    if (indiceAtual < flashcardsData.length - 1) {
        indiceAtual++;
    } else {
        // Loop Infinito: alterna entre os modos e volta ao inicio
        indiceAtual = 0;
        modoInvertido = !modoInvertido;
    }
    atualizarCartao();
}

function cartaoAnterior() {
    // Permite voltar apenas se nao estiver no primeiro cartao do modo normal
    if (indiceAtual > 0) {
        indiceAtual--;
        atualizarCartao();
    } else if (modoInvertido) {
        // Se estiver no primeiro do modo invertido, volta para o ultimo do modo normal
        indiceAtual = flashcardsData.length - 1;
        modoInvertido = false;
        atualizarCartao();
    }
    // Se (indiceAtual === 0 && !modoInvertido), a funcao nao faz nada (retrocesso proibido)
}

// Event Listeners
cardElement.addEventListener('click', virarCartao);
btnNext.addEventListener('click', proximoCartao);
btnPrev.addEventListener('click', cartaoAnterior);

// Inicializacao
window.onload = carregarDadosExternos;