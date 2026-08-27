/* =========================================
   EBS - SERVIÇOS
========================================= */
const CHAVE_SERVICOS = "ebs_servicos";

let servicos = [];
let servicoEditando = null;


/* =========================================
   ELEMENTOS
========================================= */

const modal = document.getElementById("modalServico");

const form = document.getElementById("formServico");

const listaServicos =
    document.getElementById("listaServicos");

const estadoVazio =
    document.getElementById("estadoVazio");

const pesquisaServico =
    document.getElementById("pesquisaServico");

const filtroCategoria =
    document.getElementById("filtroCategoria");

const filtroStatus =
    document.getElementById("filtroStatus");

const totalServicos =
    document.getElementById("totalServicos");

const servicosAtivos =
    document.getElementById("servicosAtivos");

const servicosInativos =
    document.getElementById("servicosInativos");

const contadorServicos =
    document.getElementById("contadorServicos");

const tituloModal =
    document.getElementById("tituloModal");


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    carregarServicos();

    carregarProfissionais();

    atualizarTela();

});


/* =========================================
   CARREGAR SERVIÇOS
========================================= */

function carregarServicos() {

    const dados =
        localStorage.getItem(CHAVE_SERVICOS);

    if (!dados) {

        servicos = [];

        return;
    }

    try {

        servicos = JSON.parse(dados);

    } catch (erro) {

        console.error(
            "Erro ao carregar serviços:",
            erro
        );

        servicos = [];
    }
}


/* =========================================
   SALVAR SERVIÇOS
========================================= */

function salvarServicos() {

    localStorage.setItem(
        CHAVE_SERVICOS,
        JSON.stringify(servicos)
    );
}


/* =========================================
   ATUALIZAR TELA
========================================= */

function atualizarTela() {

    atualizarIndicadores();

    atualizarCategorias();

    renderizarServicos();

}


/* =========================================
   INDICADORES
========================================= */

function atualizarIndicadores() {

    const total = servicos.length;

    const ativos =
        servicos.filter(
            servico => servico.status === "ativo"
        ).length;

    const inativos =
        servicos.filter(
            servico => servico.status === "inativo"
        ).length;

    totalServicos.textContent = total;

    servicosAtivos.textContent = ativos;

    servicosInativos.textContent = inativos;
}


/* =========================================
   CATEGORIAS
========================================= */

function atualizarCategorias() {

    const categoriaAtual =
        filtroCategoria.value;

    const categorias =
        [...new Set(
            servicos
                .map(servico => servico.categoria)
                .filter(Boolean)
        )]
        .sort();

    filtroCategoria.innerHTML = `
        <option value="">
            Todas as categorias
        </option>
    `;

    categorias.forEach(categoria => {

        const option =
            document.createElement("option");

        option.value = categoria;

        option.textContent = categoria;

        filtroCategoria.appendChild(option);

    });

    filtroCategoria.value =
        categorias.includes(categoriaAtual)
            ? categoriaAtual
            : "";
}


/* =========================================
   RENDERIZAR
========================================= */

function renderizarServicos() {

    const texto =
        pesquisaServico.value
            .trim()
            .toLowerCase();

    const categoria =
        filtroCategoria.value;

    const status =
        filtroStatus.value;


    const filtrados =
        servicos.filter(servico => {

            const correspondeTexto =
                !texto ||
                servico.nome
                    .toLowerCase()
                    .includes(texto) ||
                (servico.descricao || "")
                    .toLowerCase()
                    .includes(texto);

            const correspondeCategoria =
                !categoria ||
                servico.categoria === categoria;

            const correspondeStatus =
                !status ||
                servico.status === status;

            return (
                correspondeTexto &&
                correspondeCategoria &&
                correspondeStatus
            );

        });


    listaServicos.innerHTML = "";


    contadorServicos.textContent =
        `${filtrados.length} ${
            filtrados.length === 1
                ? "serviço"
                : "serviços"
        }`;


    if (filtrados.length === 0) {

        estadoVazio.style.display = "block";

        return;
    }


    estadoVazio.style.display = "none";


    filtrados.forEach(servico => {

        listaServicos.appendChild(
            criarCardServico(servico)
        );

    });

}


/* =========================================
   CARD
========================================= */

function criarCardServico(servico) {

    const card =
        document.createElement("div");

    card.className = "servico-card";


    const duracao =
        formatarDuracao(
            servico.duracaoEstimada
        );


    const valor =
        formatarValor(
            servico.valorPadrao
        );


    const statusTexto =
        servico.status === "ativo"
            ? "Ativo"
            : "Inativo";


    card.innerHTML = `

        <div class="servico-icone">
            💅
        </div>

        <div>
            <div class="servico-nome">
                ${escaparHTML(servico.nome)}
            </div>

            <div class="servico-descricao">
                ${escaparHTML(
                    servico.descricao || "Sem descrição"
                )}
            </div>
        </div>

        <div class="servico-info categoria">
            ${escaparHTML(
                servico.categoria || "Sem categoria"
            )}
        </div>

        <div class="servico-info duracao">
            ${duracao}
        </div>

        <div class="servico-valor">
            ${valor}
        </div>

        <div>
            <span class="status ${servico.status}">
                ${statusTexto}
            </span>
        </div>

        <div class="acoes">

            <button
                class="btn-editar"
                data-id="${servico.id}"
            >
                Editar
            </button>

            <button
                class="btn-status"
                data-id="${servico.id}"
            >
                ${
                    servico.status === "ativo"
                        ? "Inativar"
                        : "Ativar"
                }
            </button>

        </div>

    `;


    const btnEditar =
        card.querySelector(".btn-editar");

    const btnStatus =
        card.querySelector(".btn-status");


    btnEditar.addEventListener(
        "click",
        () => editarServico(servico.id)
    );


    btnStatus.addEventListener(
        "click",
        () => alterarStatus(servico.id)
    );


    return card;
}


/* =========================================
   NOVO SERVIÇO
========================================= */

document
    .getElementById("btnNovoServico")
    .addEventListener("click", () => {

        abrirModal();

    });


/* =========================================
   ABRIR MODAL
========================================= */

function abrirModal(servico = null) {

    servicoEditando =
        servico ? servico.id : null;


    form.reset();


    if (servico) {

        tituloModal.textContent =
            "Editar Serviço";

        document.getElementById(
            "nomeServico"
        ).value = servico.nome;

        document.getElementById(
            "categoriaServico"
        ).value =
            servico.categoria || "";

        document.getElementById(
            "duracaoServico"
        ).value =
            servico.duracaoEstimada;

        document.getElementById(
            "valorServico"
        ).value =
            servico.valorPadrao;

        document.getElementById(
            "statusServico"
        ).value =
            servico.status;

        document.getElementById(
            "descricaoServico"
        ).value =
            servico.descricao || "";

    } else {

        tituloModal.textContent =
            "Novo Serviço";

        document.getElementById(
            "statusServico"
        ).value = "ativo";

    }


    carregarProfissionais(
        servico?.profissionais || []
    );


    modal.style.display = "flex";
}


/* =========================================
   FECHAR MODAL
========================================= */

function fecharModal() {

    modal.style.display = "none";

    servicoEditando = null;

    form.reset();
}


document
    .getElementById("btnFecharModal")
    .addEventListener(
        "click",
        fecharModal
    );


document
    .getElementById("btnCancelar")
    .addEventListener(
        "click",
        fecharModal
    );


modal.addEventListener(
    "click",
    evento => {

        if (
            evento.target === modal
        ) {
            fecharModal();
        }

    }
);


/* =========================================
   SALVAR SERVIÇO
========================================= */

document
    .querySelector(".btn-salvar")
    .addEventListener("click", function (evento) {

        evento.preventDefault();

        const nome = document
            .getElementById("nomeServico")
            .value
            .trim();

        const categoria = document
            .getElementById("categoriaServico")
            .value
            .trim();

        const duracao = Number(
            document
                .getElementById("duracaoServico")
                .value
        );

        const valor = Number(
            document
                .getElementById("valorServico")
                .value
        );

        const status = document
            .getElementById("statusServico")
            .value;

        const descricao = document
            .getElementById("descricaoServico")
            .value
            .trim();

        const profissionais =
            obterProfissionaisSelecionadas();


        if (!nome) {
            alert("Informe o nome do serviço.");
            return;
        }

        if (!duracao) {
            alert("Informe a duração do serviço.");
            return;
        }


        const agora =
            new Date().toISOString();


        const servico = {

            id:
                servicoEditando ||
                gerarId(),

            nome: nome,

            descricao: descricao,

            categoria: categoria,

            duracaoEstimada: duracao,

            valorPadrao: valor,

            status: status,

            profissionais: profissionais,

            updatedAt: agora

        };


        if (servicoEditando) {

            const indice =
                servicos.findIndex(
                    item =>
                        item.id ===
                        servicoEditando
                );

            if (indice !== -1) {

                servicos[indice] = {
                    ...servicos[indice],
                    ...servico
                };

            }

        } else {

            servico.createdAt = agora;

            servicos.push(servico);

        }


        salvarServicos();

        atualizarTela();

        fecharModal();

    });


/* =========================================
   EDITAR
========================================= */

function editarServico(id) {

    const servico =
        servicos.find(
            item => item.id === id
        );

    if (!servico) return;

    abrirModal(servico);
}


/* =========================================
   ALTERAR STATUS
========================================= */

function alterarStatus(id) {

    const servico =
        servicos.find(
            item => item.id === id
        );

    if (!servico) return;


    servico.status =
        servico.status === "ativo"
            ? "inativo"
            : "ativo";


    servico.updatedAt =
        new Date().toISOString();


    salvarServicos();

    atualizarTela();
}


/* =========================================
   PROFISSIONAIS
========================================= */

function carregarProfissionais(
    selecionadas = []
) {

    const container =
        document.getElementById(
            "listaProfissionais"
        );


    container.innerHTML = "";


    /*
       Primeiro tenta buscar o cadastro
       oficial de profissionais.
    */

    let profissionais =
    JSON.parse(
        localStorage.getItem(
            "ebs_funcionarios"
        ) || "[]"
    );
    
    profissionais = profissionais.filter(
    funcionario =>
        String(funcionario.status || "")
            .toLowerCase() === "ativo"
);

    
    profissionais.forEach(
        profissional => {

            const label =
                document.createElement(
                    "label"
                );

            label.className =
                "profissional-opcao";


            const checked =
                selecionadas.includes(
                    profissional.id
                );


            label.innerHTML = `

                <input
                    type="checkbox"
                    value="${profissional.id}"
                    ${checked ? "checked" : ""}
                >

                <span>
                   ${escaparHTML(
                    profissional.nomeExibicao || profissional.nomeCompleto
)}
                </span>

            `;


            container.appendChild(label);

        }
    );
}


function obterProfissionaisSelecionadas() {

    return [
        ...document.querySelectorAll(
            "#listaProfissionais input:checked"
        )
    ].map(
        input => input.value
    );

}


/* =========================================
   FILTROS
========================================= */

pesquisaServico.addEventListener(
    "input",
    renderizarServicos
);

filtroCategoria.addEventListener(
    "change",
    renderizarServicos
);

filtroStatus.addEventListener(
    "change",
    renderizarServicos
);


/* =========================================
   UTILITÁRIOS
========================================= */

function gerarId() {

    return (
        "servico_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


function formatarDuracao(minutos) {

    if (minutos < 60) {

        return `${minutos} min`;

    }


    const horas =
        Math.floor(minutos / 60);

    const resto =
        minutos % 60;


    if (!resto) {

        return `${horas}h`;

    }


    return `${horas}h ${resto}min`;

}


function formatarValor(valor) {

    return new Intl.NumberFormat(
        "pt-PT",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(valor || 0);

}


function escaparHTML(texto) {

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
