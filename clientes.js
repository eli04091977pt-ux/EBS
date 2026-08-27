/* =========================================
   CLIENTES - EBS
========================================= */

let clientes =
    JSON.parse(
        localStorage.getItem("clientes")
    ) || [];

let indiceEdicao = -1;


/* =========================================
   ELEMENTOS
========================================= */

const btnNovoCliente =
    document.getElementById("btnNovoCliente");

const modalCliente =
    document.getElementById("modalCliente");

const modalDetalhes =
    document.getElementById("modalDetalhes");

const btnFecharModal =
    document.getElementById("btnFecharModal");

const btnCancelarCliente =
    document.getElementById("btnCancelarCliente");

const btnSalvarCliente =
    document.getElementById("btnSalvarCliente");

const btnFecharDetalhes =
    document.getElementById("btnFecharDetalhes");

const btnFecharDetalhes2 =
    document.getElementById("btnFecharDetalhes2");

const btnEditarCliente =
    document.getElementById("btnEditarCliente");

const pesquisaCliente =
    document.getElementById("pesquisaCliente");

const filtroStatus =
    document.getElementById("filtroStatus");


/* =========================================
   NOVO CLIENTE
========================================= */

btnNovoCliente.addEventListener(
    "click",
    () => {

        indiceEdicao = -1;

        limparFormulario();

        document.getElementById(
            "tituloModal"
        ).textContent =
            "Novo Cliente";

        modalCliente.style.display =
            "flex";

    }
);


/* =========================================
   FECHAR MODAL
========================================= */

function fecharModalCliente() {

    modalCliente.style.display =
        "none";

    indiceEdicao = -1;

}


btnFecharModal.addEventListener(
    "click",
    fecharModalCliente
);


btnCancelarCliente.addEventListener(
    "click",
    fecharModalCliente
);


/* =========================================
   SALVAR CLIENTE
========================================= */

btnSalvarCliente.addEventListener(
    "click",
    () => {

        const nome =
            document.getElementById(
                "nomeCliente"
            ).value.trim();

        const telefone =
            document.getElementById(
                "telefoneCliente"
            ).value.trim();

        const whatsapp =
            document.getElementById(
                "whatsappCliente"
            ).value.trim();

        const email =
            document.getElementById(
                "emailCliente"
            ).value.trim();

        const nascimento =
            document.getElementById(
                "nascimentoCliente"
            ).value;

        const instagram =
            document.getElementById(
                "instagramCliente"
            ).value.trim();

        const observacoes =
            document.getElementById(
                "observacoesCliente"
            ).value.trim();

        const status =
            document.getElementById(
                "statusCliente"
            ).value;


        /* -----------------------------
           VALIDAÇÃO
        ----------------------------- */

        if (!nome) {

            alert(
                "Informe o nome completo do cliente."
            );

            return;
        }


        /* -----------------------------
           VERIFICA DUPLICIDADE
        ----------------------------- */

        const clienteDuplicado =
            clientes.some(
                (cliente, indice) => {

                    if (
                        indice ===
                        indiceEdicao
                    ) {
                        return false;
                    }

                    const mesmoNome =
                        cliente.nome
                            .toLowerCase() ===
                        nome.toLowerCase();

                    const mesmoTelefone =
                        telefone &&
                        cliente.telefone ===
                        telefone;

                    const mesmoEmail =
                        email &&
                        cliente.email
                            .toLowerCase() ===
                        email.toLowerCase();

                    return (
                        mesmoNome &&
                        (
                            mesmoTelefone ||
                            mesmoEmail ||
                            !telefone && !email
                        )
                    );

                }
            );


        if (clienteDuplicado) {

            alert(
                "Este cliente já está cadastrado."
            );

            return;
        }


        /* -----------------------------
           OBJETO DO CLIENTE
        ----------------------------- */

        const cliente = {

            id:
                indiceEdicao >= 0
                    ? clientes[
                        indiceEdicao
                    ].id
                    : gerarId(),

            nome,

            telefone,

            whatsapp,

            email,

            nascimento,

            instagram,

            observacoes,

            status,

            criadoEm:
                indiceEdicao >= 0
                    ? clientes[
                        indiceEdicao
                    ].criadoEm
                    : new Date().toISOString(),

            atualizadoEm:
                new Date().toISOString()

        };


        /* -----------------------------
           SALVAR / EDITAR
        ----------------------------- */

        if (indiceEdicao >= 0) {

            clientes[
                indiceEdicao
            ] = cliente;

        } else {

            clientes.push(cliente);

        }


        salvarClientes();

        fecharModalCliente();

        renderizarClientes();

        atualizarIndicadores();

    }
);


/* =========================================
   GERAR ID
========================================= */

function gerarId() {

    return (
        "CLI-" +
        Date.now() +
        "-" +
        Math.floor(
            Math.random() * 1000
        )
    );

}


/* =========================================
   LOCAL STORAGE
========================================= */

function salvarClientes() {

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

}


/* =========================================
   LIMPAR FORMULÁRIO
========================================= */

function limparFormulario() {

    document.getElementById(
        "nomeCliente"
    ).value = "";

    document.getElementById(
        "telefoneCliente"
    ).value = "";

    document.getElementById(
        "whatsappCliente"
    ).value = "";

    document.getElementById(
        "emailCliente"
    ).value = "";

    document.getElementById(
        "nascimentoCliente"
    ).value = "";

    document.getElementById(
        "instagramCliente"
    ).value = "";

    document.getElementById(
        "observacoesCliente"
    ).value = "";

    document.getElementById(
        "statusCliente"
    ).value = "Ativo";

}


/* =========================================
   RENDERIZAR CLIENTES
========================================= */

function renderizarClientes() {

    const lista =
        document.getElementById(
            "listaClientes"
        );

    const pesquisa =
        pesquisaCliente.value
            .toLowerCase()
            .trim();

    const statusSelecionado =
        filtroStatus.value;


    const filtrados =
        clientes.filter(
            cliente => {

                const correspondePesquisa =

                    cliente.nome
                        .toLowerCase()
                        .includes(pesquisa)

                    ||

                    (cliente.telefone || "")
                        .toLowerCase()
                        .includes(pesquisa)

                    ||

                    (cliente.email || "")
                        .toLowerCase()
                        .includes(pesquisa);


                const correspondeStatus =

                    statusSelecionado ===
                    "todos"

                    ||

                    cliente.status ===
                    statusSelecionado;


                return (
                    correspondePesquisa &&
                    correspondeStatus
                );

            }
        );


    document.getElementById(
        "contadorResultados"
    ).textContent =

        filtrados.length === 1
            ? "1 cliente"
            : `${filtrados.length} clientes`;


    if (!filtrados.length) {

        lista.innerHTML = `

            <div class="vazio">

                <strong>
                    Nenhum cliente encontrado
                </strong>

                <span>
                    Cadastre um novo cliente
                    para começar.
                </span>

            </div>

        `;

        return;
    }


    lista.innerHTML =
        filtrados
            .map(
                cliente =>
                    criarCardCliente(
                        cliente
                    )
            )
            .join("");


    adicionarEventosCards();

}


/* =========================================
   CARD DO CLIENTE
========================================= */

function criarCardCliente(
    cliente
) {

    const inicial =
        cliente.nome
            .charAt(0)
            .toUpperCase();


    const ultimoAtendimento =
        obterUltimoAtendimento(
            cliente
        );


    return `

        <div
            class="cliente-card"
            data-id="${cliente.id}"
        >

            <div class="avatar">
                ${inicial}
            </div>


            <div>

                <div class="cliente-nome">
                    ${escaparHTML(
                        cliente.nome
                    )}
                </div>

                <div class="cliente-email">
                    ${escaparHTML(
                        cliente.email ||
                        "Sem e-mail"
                    )}
                </div>

            </div>


            <div class="cliente-info telefone">

                ${escaparHTML(
                    cliente.telefone ||
                    "Sem telefone"
                )}

            </div>


            <div
                class="cliente-info ultimo-atendimento"
            >

                ${ultimoAtendimento}

            </div>


            <div>

                <span
                    class="status ${
                        cliente.status ===
                        "Ativo"
                            ? "ativo"
                            : "inativo"
                    }"
                >

                    ${cliente.status}

                </span>

            </div>


            <button
                class="btn-detalhes"
                data-id="${cliente.id}"
            >
                Ver
            </button>

        </div>

    `;

}


/* =========================================
   EVENTOS DOS CARDS
========================================= */

function adicionarEventosCards() {

    document
        .querySelectorAll(
            ".cliente-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    evento => {

                        if (
                            evento.target.classList
                                .contains(
                                    "btn-detalhes"
                                )
                        ) {

                            abrirDetalhes(
                                card.dataset.id
                            );

                            return;
                        }


                        abrirDetalhes(
                            card.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================
   ABRIR DETALHES
========================================= */

function abrirDetalhes(id) {

    const cliente =
        clientes.find(
            item =>
                item.id === id
        );


    if (!cliente) {
        return;
    }


    document.getElementById(
        "detalhesNome"
    ).textContent =
        cliente.nome;


    document.getElementById(
        "detalhesStatus"
    ).textContent =
        cliente.status;


    document.getElementById(
        "detalhesTelefone"
    ).textContent =
        cliente.telefone ||
        "—";


    document.getElementById(
        "detalhesWhatsapp"
    ).textContent =
        cliente.whatsapp ||
        "—";


    document.getElementById(
        "detalhesEmail"
    ).textContent =
        cliente.email ||
        "—";


    document.getElementById(
        "detalhesNascimento"
    ).textContent =
        formatarData(
            cliente.nascimento
        );


    document.getElementById(
        "detalhesInstagram"
    ).textContent =
        cliente.instagram ||
        "—";


    const historico =
        obterHistoricoCliente(
            cliente
        );


    document.getElementById(
        "detalhesUltimoAtendimento"
    ).textContent =
        historico.ultimo;


    document.getElementById(
        "detalhesQuantidadeAtendimentos"
    ).textContent =
        historico.quantidade;


    document.getElementById(
        "detalhesObservacoes"
    ).textContent =
        cliente.observacoes ||
        "Nenhuma observação registrada.";


    btnEditarCliente.dataset.id =
        cliente.id;


    modalDetalhes.style.display =
        "flex";

}


/* =========================================
   FECHAR DETALHES
========================================= */

function fecharDetalhes() {

    modalDetalhes.style.display =
        "none";

}


btnFecharDetalhes.addEventListener(
    "click",
    fecharDetalhes
);

btnFecharDetalhes2.addEventListener(
    "click",
    fecharDetalhes
);


/* =========================================
   EDITAR CLIENTE
========================================= */

btnEditarCliente.addEventListener(
    "click",
    () => {

        const id =
            btnEditarCliente.dataset.id;

        const cliente =
            clientes.find(
                item =>
                    item.id === id
            );


        if (!cliente) {
            return;
        }


        indiceEdicao =
            clientes.findIndex(
                item =>
                    item.id === id
            );


        document.getElementById(
            "tituloModal"
        ).textContent =
            "Editar Cliente";


        document.getElementById(
            "nomeCliente"
        ).value =
            cliente.nome;


        document.getElementById(
            "telefoneCliente"
        ).value =
            cliente.telefone || "";


        document.getElementById(
            "whatsappCliente"
        ).value =
            cliente.whatsapp || "";


        document.getElementById(
            "emailCliente"
        ).value =
            cliente.email || "";


        document.getElementById(
            "nascimentoCliente"
        ).value =
            cliente.nascimento || "";


        document.getElementById(
            "instagramCliente"
        ).value =
            cliente.instagram || "";


        document.getElementById(
            "observacoesCliente"
        ).value =
            cliente.observacoes || "";


        document.getElementById(
            "statusCliente"
        ).value =
            cliente.status || "Ativo";


        fecharDetalhes();

        modalCliente.style.display =
            "flex";

    }
);


/* =========================================
   INDICADORES
========================================= */

function atualizarIndicadores() {

    document.getElementById(
        "totalClientes"
    ).textContent =
        clientes.length;


    const inicioMes =
        new Date();

    inicioMes.setDate(1);

    inicioMes.setHours(
        0,
        0,
        0,
        0
    );


    const novos =
        clientes.filter(
            cliente =>
                new Date(
                    cliente.criadoEm
                ) >= inicioMes
        ).length;


    document.getElementById(
        "novosClientes"
    ).textContent =
        novos;


    const mesAtual =
        new Date().getMonth();


    const aniversariantes =
        clientes.filter(
            cliente => {

                if (
                    !cliente.nascimento
                ) {
                    return false;
                }


                return (
                    new Date(
                        cliente.nascimento +
                        "T00:00:00"
                    ).getMonth() ===
                    mesAtual
                );

            }
        ).length;


    document.getElementById(
        "aniversariantes"
    ).textContent =
        aniversariantes;


    /*
       A fidelização será integrada
       posteriormente ao histórico
       completo de atendimentos.
    */

    const fidelizados =
        clientes.filter(
            cliente =>
                obterHistoricoCliente(
                    cliente
                ).quantidade >= 3
        ).length;


    document.getElementById(
        "clientesFidelizados"
    ).textContent =
        fidelizados;

}


/* =========================================
   HISTÓRICO COM AGENDA ATUAL
========================================= */

function obterHistoricoCliente(
    cliente
) {

    const agendamentos =
        JSON.parse(
            localStorage.getItem(
                "agendamentos"
            )
        ) || [];


    const registros =
        agendamentos.filter(
            agendamento =>
                (
                    agendamento.cliente ||
                    ""
                )
                    .toLowerCase()
                    .trim() ===
                cliente.nome
                    .toLowerCase()
                    .trim()
        );


    if (!registros.length) {

        return {

            quantidade: 0,

            ultimo: "Nenhum atendimento"

        };

    }


    registros.sort(
        (a, b) =>
            new Date(
                `${b.data}T${b.hora || "00:00"}`
            )
            -
            new Date(
                `${a.data}T${a.hora || "00:00"}`
            )
    );


    return {

        quantidade:
            registros.length,

        ultimo:
            formatarData(
                registros[0].data
            )

    };

}


function obterUltimoAtendimento(
    cliente
) {

    return obterHistoricoCliente(
        cliente
    ).ultimo;

}


/* =========================================
   FORMATAR DATA
========================================= */

function formatarData(data) {

    if (!data) {
        return "—";
    }


    const partes =
        data.split("-");


    if (partes.length !== 3) {
        return data;
    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


/* =========================================
   SEGURANÇA BÁSICA DO HTML
========================================= */

function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================
   PESQUISA
========================================= */

pesquisaCliente.addEventListener(
    "input",
    renderizarClientes
);


filtroStatus.addEventListener(
    "change",
    renderizarClientes
);


/* =========================================
   FECHAR CLICANDO FORA
========================================= */

modalCliente.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            modalCliente
        ) {

            fecharModalCliente();

        }

    }
);


modalDetalhes.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            modalDetalhes
        ) {

            fecharDetalhes();

        }

    }
);


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderizarClientes();

        atualizarIndicadores();

    }
);
