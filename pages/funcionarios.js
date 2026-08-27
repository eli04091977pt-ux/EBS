/* =========================================
   EBS - FUNCIONÁRIOS
========================================= */

const CHAVE_FUNCIONARIOS = "ebs_funcionarios";

let funcionarios = [];
let funcionarioEditando = null;
let fotoAtual = "";


/* =========================================
   ELEMENTOS
========================================= */

const modal =
    document.getElementById("modalFuncionario");

const form =
    document.getElementById("formFuncionario");

const listaFuncionarios =
    document.getElementById("listaFuncionarios");

const estadoVazio =
    document.getElementById("estadoVazio");

const pesquisaFuncionario =
    document.getElementById("pesquisaFuncionario");

const filtroCargo =
    document.getElementById("filtroCargo");

const filtroStatus =
    document.getElementById("filtroStatus");

const totalFuncionarios =
    document.getElementById("totalFuncionarios");

const funcionariosAtivos =
    document.getElementById("funcionariosAtivos");

const funcionariosInativos =
    document.getElementById("funcionariosInativos");

const contadorFuncionarios =
    document.getElementById("contadorFuncionarios");

const tituloModal =
    document.getElementById("tituloModal");

const listaEspecialidades =
    document.getElementById("listaEspecialidades");

const fotoPreview =
    document.getElementById("fotoPreview");

const fotoFuncionario =
    document.getElementById("fotoFuncionario");


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    carregarFuncionarios();

    atualizarTela();

    configurarEventos();

    configurarAbas();

    carregarServicosDisponiveis();

});


/* =========================================
   CARREGAR FUNCIONÁRIOS
========================================= */

function carregarFuncionarios() {

    const dados =
        localStorage.getItem(
            CHAVE_FUNCIONARIOS
        );

    if (!dados) {

        funcionarios = [];

        return;
    }

    try {

        funcionarios =
            JSON.parse(dados);

        if (!Array.isArray(funcionarios)) {

            funcionarios = [];

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar funcionários:",
            erro
        );

        funcionarios = [];

    }

}


/* =========================================
   SALVAR FUNCIONÁRIOS
========================================= */

function salvarFuncionarios() {

    localStorage.setItem(
        CHAVE_FUNCIONARIOS,
        JSON.stringify(funcionarios)
    );

}


/* =========================================
   ATUALIZAR TELA
========================================= */

function atualizarTela() {

    atualizarIndicadores();

    atualizarCargos();

    renderizarFuncionarios();

}


/* =========================================
   INDICADORES
========================================= */

function atualizarIndicadores() {

    const total =
        funcionarios.length;

    const ativos =
        funcionarios.filter(
            funcionario =>
                funcionario.status === "ativo"
        ).length;

    const inativos =
        funcionarios.filter(
            funcionario =>
                funcionario.status === "inativo"
        ).length;


    totalFuncionarios.textContent =
        total;

    funcionariosAtivos.textContent =
        ativos;

    funcionariosInativos.textContent =
        inativos;

}


/* =========================================
   CARGOS
========================================= */

function atualizarCargos() {

    const cargoAtual =
        filtroCargo.value;


    const cargos =
        [
            ...new Set(
                funcionarios
                    .map(
                        funcionario =>
                            funcionario.cargo
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-BR"
                )
        );


    filtroCargo.innerHTML = `
        <option value="">
            Todos os cargos
        </option>
    `;


    cargos.forEach(cargo => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            cargo;

        option.textContent =
            cargo;

        filtroCargo.appendChild(
            option
        );

    });


    filtroCargo.value =
        cargos.includes(cargoAtual)
            ? cargoAtual
            : "";

}


/* =========================================
   RENDERIZAR FUNCIONÁRIOS
========================================= */

function renderizarFuncionarios() {

    const texto =
        pesquisaFuncionario.value
            .trim()
            .toLowerCase();

    const cargo =
        filtroCargo.value;

    const status =
        filtroStatus.value;


    const filtrados =
        funcionarios.filter(
            funcionario => {

                const correspondeTexto =
                    !texto ||

                    (funcionario.nomeCompleto || "")
                        .toLowerCase()
                        .includes(texto) ||

                    (funcionario.nomeExibicao || "")
                        .toLowerCase()
                        .includes(texto) ||

                    (funcionario.cargo || "")
                        .toLowerCase()
                        .includes(texto) ||

                    (funcionario.email || "")
                        .toLowerCase()
                        .includes(texto);


                const correspondeCargo =
                    !cargo ||
                    funcionario.cargo === cargo;


                const correspondeStatus =
                    !status ||
                    funcionario.status === status;


                return (
                    correspondeTexto &&
                    correspondeCargo &&
                    correspondeStatus
                );

            }
        );


    listaFuncionarios.innerHTML = "";


    contadorFuncionarios.textContent =
        `${filtrados.length} ${
            filtrados.length === 1
                ? "funcionário"
                : "funcionários"
        }`;


    if (filtrados.length === 0) {

        estadoVazio.style.display =
            "block";

        return;

    }


    estadoVazio.style.display =
        "none";


    filtrados.forEach(
        funcionario => {

            listaFuncionarios.appendChild(
                criarCardFuncionario(
                    funcionario
                )
            );

        }
    );

}


/* =========================================
   CARD DO FUNCIONÁRIO
========================================= */

function criarCardFuncionario(
    funcionario
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "funcionario-card";


    const nome =
        funcionario.nomeExibicao ||
        funcionario.nomeCompleto ||
        "Sem nome";


    const cargo =
        funcionario.cargo ||
        "Sem cargo";


    const statusTexto =
        funcionario.status === "ativo"
            ? "Ativo"
            : "Inativo";


    const foto =
        funcionario.foto
            ? `
                <img
                    src="${funcionario.foto}"
                    alt="${escaparHTML(nome)}"
                >
              `
            : `
                <span>
                    👩‍💼
                </span>
              `;


    card.innerHTML = `

        <div class="funcionario-foto">
            ${foto}
        </div>


        <div class="funcionario-principal">

            <div class="funcionario-nome">
                ${escaparHTML(nome)}
            </div>

            <div class="funcionario-cargo">
                ${escaparHTML(cargo)}
            </div>

        </div>


        <div class="funcionario-contato">

            <span>
                ${escaparHTML(
                    funcionario.telefone ||
                    "Sem telefone"
                )}
            </span>

            <span>
                ${escaparHTML(
                    funcionario.email ||
                    "Sem e-mail"
                )}
            </span>

        </div>


        <div class="funcionario-comissao">

            ${
                funcionario.comissao !== "" &&
                funcionario.comissao !== null &&
                funcionario.comissao !== undefined
                    ? `${funcionario.comissao}%`
                    : "—"
            }

        </div>


        <div>

            <span class="status ${funcionario.status}">
                ${statusTexto}
            </span>

        </div>


        <div class="acoes">

            <button
                type="button"
                class="btn-editar"
                data-id="${funcionario.id}"
            >
                Editar
            </button>


            <button
                type="button"
                class="btn-status"
                data-id="${funcionario.id}"
            >
                ${
                    funcionario.status === "ativo"
                        ? "Inativar"
                        : "Ativar"
                }
            </button>

        </div>

    `;


    const btnEditar =
        card.querySelector(
            ".btn-editar"
        );

    const btnStatus =
        card.querySelector(
            ".btn-status"
        );


    btnEditar.addEventListener(
        "click",
        () =>
            editarFuncionario(
                funcionario.id
            )
    );


    btnStatus.addEventListener(
        "click",
        () =>
            alterarStatus(
                funcionario.id
            )
    );


    return card;

}


/* =========================================
   CONFIGURAR EVENTOS
========================================= */

function configurarEventos() {

    document
        .getElementById(
            "btnNovoFuncionario"
        )
        .addEventListener(
            "click",
            () => abrirModal()
        );


    document
        .getElementById(
            "btnFecharModal"
        )
        .addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById(
            "btnCancelar"
        )
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


    form.addEventListener(
        "submit",
        salvarFuncionario
    );


    pesquisaFuncionario.addEventListener(
        "input",
        renderizarFuncionarios
    );


    filtroCargo.addEventListener(
        "change",
        renderizarFuncionarios
    );


    filtroStatus.addEventListener(
        "change",
        renderizarFuncionarios
    );


    fotoFuncionario.addEventListener(
        "change",
        tratarFoto
    );

}


/* =========================================
   ABAS DO MODAL
========================================= */

function configurarAbas() {

    const abas =
        document.querySelectorAll(
            ".aba-modal"
        );


    abas.forEach(aba => {

        aba.addEventListener(
            "click",
            () => {

                const nomeAba =
                    aba.dataset.aba;


                abas.forEach(
                    item =>
                        item.classList.remove(
                            "ativa"
                        )
                );


                document
                    .querySelectorAll(
                        ".conteudo-aba"
                    )
                    .forEach(
                        conteudo =>
                            conteudo.classList.remove(
                                "ativa"
                            )
                    );


                aba.classList.add(
                    "ativa"
                );


                const conteudo =
                    document.getElementById(
                        `aba-${nomeAba}`
                    );


                if (conteudo) {

                    conteudo.classList.add(
                        "ativa"
                    );

                }

            }
        );

    });

}


/* =========================================
   ABRIR MODAL
========================================= */

function abrirModal(
    funcionario = null
) {

    funcionarioEditando =
        funcionario
            ? funcionario.id
            : null;


    fotoAtual =
        funcionario?.foto || "";


    form.reset();


    tituloModal.textContent =
        funcionario
            ? "Editar Funcionário"
            : "Novo Funcionário";


    if (funcionario) {

        preencherCampo(
            "nomeCompleto",
            funcionario.nomeCompleto
        );

        preencherCampo(
            "nomeExibicao",
            funcionario.nomeExibicao
        );

        preencherCampo(
            "cargo",
            funcionario.cargo
        );

        preencherCampo(
            "telefone",
            funcionario.telefone
        );

        preencherCampo(
            "email",
            funcionario.email
        );

        preencherCampo(
            "dataAdmissao",
            funcionario.dataAdmissao
        );

        preencherCampo(
            "statusFuncionario",
            funcionario.status ||
                "ativo"
        );

        preencherCampo(
            "comissao",
            funcionario.comissao
        );

        preencherCampo(
            "metaMensal",
            funcionario.metaMensal
        );


        carregarJornada(
            funcionario.jornada
        );


        fotoPreview.innerHTML =
            funcionario.foto
                ? `
                    <img
                        src="${funcionario.foto}"
                        alt="Foto do funcionário"
                    >
                  `
                : "👩‍💼";

    } else {

        document.getElementById(
            "statusFuncionario"
        ).value = "ativo";


        fotoPreview.innerHTML =
            "👩‍💼";


        configurarJornadaPadrao();

    }


    carregarServicosDisponiveis(
        funcionario?.servicosHabilitados ||
        []
    );


    abrirPrimeiraAba();


    modal.style.display =
        "flex";

}


/* =========================================
   PRIMEIRA ABA
========================================= */

function abrirPrimeiraAba() {

    document
        .querySelectorAll(
            ".aba-modal"
        )
        .forEach(
            aba =>
                aba.classList.remove(
                    "ativa"
                )
        );


    document
        .querySelectorAll(
            ".conteudo-aba"
        )
        .forEach(
            conteudo =>
                conteudo.classList.remove(
                    "ativa"
                )
        );


    const primeiraAba =
        document.querySelector(
            '.aba-modal[data-aba="dados"]'
        );


    const primeiroConteudo =
        document.getElementById(
            "aba-dados"
        );


    if (primeiraAba) {

        primeiraAba.classList.add(
            "ativa"
        );

    }


    if (primeiroConteudo) {

        primeiroConteudo.classList.add(
            "ativa"
        );

    }

}


/* =========================================
   PREENCHER CAMPO
========================================= */

function preencherCampo(
    id,
    valor
) {

    const campo =
        document.getElementById(id);


    if (campo) {

        campo.value =
            valor ?? "";

    }

}


/* =========================================
   FECHAR MODAL
========================================= */

function fecharModal() {

    modal.style.display =
        "none";


    funcionarioEditando =
        null;


    fotoAtual =
        "";


    form.reset();


    fotoPreview.innerHTML =
        "👩‍💼";


    abrirPrimeiraAba();

}


/* =========================================
   SALVAR FUNCIONÁRIO
========================================= */

function salvarFuncionario(
    evento
) {

    evento.preventDefault();


    const nomeCompleto =
        document
            .getElementById(
                "nomeCompleto"
            )
            .value
            .trim();


    const nomeExibicao =
        document
            .getElementById(
                "nomeExibicao"
            )
            .value
            .trim();


    const cargo =
        document
            .getElementById(
                "cargo"
            )
            .value
            .trim();


    const telefone =
        document
            .getElementById(
                "telefone"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "email"
            )
            .value
            .trim();


    const dataAdmissao =
        document
            .getElementById(
                "dataAdmissao"
            )
            .value;


    const status =
        document
            .getElementById(
                "statusFuncionario"
            )
            .value;


    const comissao =
        document
            .getElementById(
                "comissao"
            )
            .value;


    const metaMensal =
        document
            .getElementById(
                "metaMensal"
            )
            .value;


    /* =====================================
       VALIDAÇÃO
    ====================================== */

    if (
        !nomeCompleto ||
        !nomeExibicao ||
        !cargo
    ) {

        alert(
            "Preencha os campos obrigatórios: nome completo, nome de exibição e cargo."
        );

        return;

    }


    /* =====================================
       SERVIÇOS HABILITADOS
    ====================================== */

    const servicosHabilitados =
        obterServicosSelecionados();


    /* =====================================
       JORNADA
    ====================================== */

    const jornada =
        obterJornada();


    /* =====================================
       OBJETO
    ====================================== */

    const funcionario = {

        id:
            funcionarioEditando ||
            gerarId(),

        nomeCompleto,

        nomeExibicao,

        cargo,

        telefone,

        email,

        dataAdmissao,

        status,

        comissao,

        metaMensal,

        foto:
            fotoAtual,

        servicosHabilitados,

        jornada,

        updatedAt:
            new Date().toISOString()

    };


    /* =====================================
       EDITAR
    ====================================== */

    if (funcionarioEditando) {

        const indice =
            funcionarios.findIndex(
                item =>
                    item.id ===
                    funcionarioEditando
            );


        if (indice === -1) {

            alert(
                "Funcionário não encontrado."
            );

            return;

        }


        funcionarios[indice] = {

            ...funcionarios[indice],

            ...funcionario

        };

    }


    /* =====================================
       NOVO
    ====================================== */

    else {

        funcionario.createdAt =
            new Date().toISOString();


        funcionarios.push(
            funcionario
        );

    }


    /* =====================================
       GRAVAR
    ====================================== */

    salvarFuncionarios();


    /* =====================================
       ATUALIZAR INTERFACE
    ====================================== */

    atualizarTela();


    fecharModal();

}


/* =========================================
   EDITAR FUNCIONÁRIO
========================================= */

function editarFuncionario(id) {

    const funcionario =
        funcionarios.find(
            item =>
                item.id === id
        );


    if (!funcionario) {

        alert(
            "Funcionário não encontrado."
        );

        return;

    }


    abrirModal(
        funcionario
    );

}


/* =========================================
   ALTERAR STATUS
========================================= */

function alterarStatus(id) {

    const funcionario =
        funcionarios.find(
            item =>
                item.id === id
        );


    if (!funcionario) {

        return;

    }


    funcionario.status =
        funcionario.status === "ativo"
            ? "inativo"
            : "ativo";


    funcionario.updatedAt =
        new Date().toISOString();


    salvarFuncionarios();


    atualizarTela();

}


/* =========================================
   SERVIÇOS DISPONÍVEIS
========================================= */

function carregarServicosDisponiveis(
    selecionados = []
) {

    if (!listaEspecialidades) {

        return;

    }


    listaEspecialidades.innerHTML =
        "";


    let servicos =
        JSON.parse(
            localStorage.getItem(
                "ebs_servicos"
            ) || "[]"
        );


    /*
       Se ainda não houver serviços
       cadastrados, mostramos uma orientação.
    */

    if (!servicos.length) {

        listaEspecialidades.innerHTML = `

            <div class="sem-servicos">

                Nenhum serviço cadastrado ainda.

                <br>

                Cadastre os serviços primeiro
                para habilitá-los aqui.

            </div>

        `;

        return;

    }


    servicos.forEach(
        servico => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "especialidade-opcao";


            const checked =
                selecionados.includes(
                    servico.id
                );


            label.innerHTML = `

                <input
                    type="checkbox"
                    value="${servico.id}"
                    ${checked ? "checked" : ""}
                >

                <span>
                    ${escaparHTML(
                        servico.nome
                    )}
                </span>

            `;


            listaEspecialidades.appendChild(
                label
            );

        }
    );

}


/* =========================================
   OBTER SERVIÇOS SELECIONADOS
========================================= */

function obterServicosSelecionados() {

    return [
        ...document.querySelectorAll(
            "#listaEspecialidades input:checked"
        )
    ].map(
        input =>
            input.value
    );

}


/* =========================================
   FOTO
========================================= */

function tratarFoto(evento) {

    const arquivo =
        evento.target.files[0];


    if (!arquivo) {

        return;

    }


    if (
        !arquivo.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Selecione uma imagem válida."
        );

        fotoFuncionario.value =
            "";

        return;

    }


    const leitor =
        new FileReader();


    leitor.onload =
        function (eventoLeitura) {

            fotoAtual =
                eventoLeitura.target.result;


            fotoPreview.innerHTML = `

                <img
                    src="${fotoAtual}"
                    alt="Foto do funcionário"
                >

            `;

        };


    leitor.readAsDataURL(
        arquivo
    );

}


/* =========================================
   JORNADA PADRÃO
========================================= */

function configurarJornadaPadrao() {

    const dias =
        [
            "segunda",
            "terca",
            "quarta",
            "quinta",
            "sexta"
        ];


    dias.forEach(
        dia => {

            const checkbox =
                document.querySelector(
                    `input[name="diaTrabalho"][value="${dia}"]`
                );


            if (checkbox) {

                checkbox.checked =
                    true;

            }

        }
    );


    const fimSemana =
        [
            "sabado",
            "domingo"
        ];


    fimSemana.forEach(
        dia => {

            const checkbox =
                document.querySelector(
                    `input[name="diaTrabalho"][value="${dia}"]`
                );


            if (checkbox) {

                checkbox.checked =
                    false;

            }

        }
    );

}


/* =========================================
   CARREGAR JORNADA
========================================= */

function carregarJornada(
    jornada
) {

    if (!jornada) {

        configurarJornadaPadrao();

        return;

    }


    const dias =
        [
            "segunda",
            "terca",
            "quarta",
            "quinta",
            "sexta",
            "sabado",
            "domingo"
        ];


    dias.forEach(
        dia => {

            const dados =
                jornada[dia];


            const checkbox =
                document.querySelector(
                    `input[name="diaTrabalho"][value="${dia}"]`
                );


            const inicio =
                document.getElementById(
                    `inicio${capitalizar(dia)}`
                );


            const fim =
                document.getElementById(
                    `fim${capitalizar(dia)}`
                );


            if (
                checkbox &&
                dados
            ) {

                checkbox.checked =
                    !!dados.ativo;


                if (inicio) {

                    inicio.value =
                        dados.inicio || "";

                }


                if (fim) {

                    fim.value =
                        dados.fim || "";

                }

            }

        }
    );

}


/* =========================================
   OBTER JORNADA
========================================= */

function obterJornada() {

    const dias =
        [
            "segunda",
            "terca",
            "quarta",
            "quinta",
            "sexta",
            "sabado",
            "domingo"
        ];


    const jornada = {};


    dias.forEach(
        dia => {

            const checkbox =
                document.querySelector(
                    `input[name="diaTrabalho"][value="${dia}"]`
                );


            const inicio =
                document.getElementById(
                    `inicio${capitalizar(dia)}`
                );


            const fim =
                document.getElementById(
                    `fim${capitalizar(dia)}`
                );


            jornada[dia] = {

                ativo:
                    checkbox
                        ? checkbox.checked
                        : false,

                inicio:
                    inicio
                        ? inicio.value
                        : "",

                fim:
                    fim
                        ? fim.value
                        : ""

            };

        }
    );


    return jornada;

}


/* =========================================
   UTILITÁRIOS
========================================= */

function gerarId() {

    return (
        "funcionario_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


function capitalizar(texto) {

    return (
        texto.charAt(0).toUpperCase() +
        texto.slice(1)
    );

}


function escaparHTML(texto) {

    return String(texto)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
