/* =========================================================
   EBS - FINANCEIRO
   NOVA ESTRUTURA

   REGRA PRINCIPAL:

   1 atendimento = 1 registro financeiro

   Atendimento concluído
        ↓
   Registro financeiro criado
        ↓
   Pagamento pendente
        ↓
   Pagamento efetuado
        ↓
   Pagamento = pago

   Comissão:
   - calculada automaticamente
   - fica pendente
   - será paga separadamente
========================================================= */


/* =========================================================
   CHAVES DO SISTEMA
========================================================= */

const CHAVE_FINANCEIRO = "ebs_financeiro";

const CHAVE_AGENDA = "agendamentos";

const CHAVE_FUNCIONARIOS = "ebs_funcionarios";

const CHAVE_SERVICOS = "ebs_servicos";

const CHAVE_CLIENTES = "clientes";


/* =========================================================
   ESTADO DO FINANCEIRO
========================================================= */

let registrosFinanceiros = [];

let abaAtual = "recebimentos";

let registroPagamentoAtual = null;

let formaPagamentoSelecionada = "";



/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarFinanceiro();

        sincronizarAtendimentosConcluidos();

        inicializarAbas();

        inicializarPesquisa();

        inicializarFiltros();

        inicializarBotoes();

        inicializarModalDespesa();

        inicializarModalPagamento();

        inicializarFluxo();

        atualizarTela();

    }
);



/* =========================================================
   UTILITÁRIOS
========================================================= */

function escaparHTML(valor) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        valor ?? "";

    return div.innerHTML;

}



function normalizarTexto(valor) {

    return String(
        valor ?? ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();

}



function normalizarFormaPagamento(
    valor
) {

    return normalizarTexto(
        valor
    )
        .replace(
            /[^a-z0-9]/g,
            ""
        );

}



function formatarValor(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-PT",
        {
            style: "currency",
            currency: "EUR"
        }
    );

}



function formatarData(
    data
) {

    if (!data) {
        return "";
    }


    const texto =
        String(data);


    const partes =
        texto.split("-");


    if (
        partes.length === 3 &&
        partes[0].length === 4
    ) {

        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );

    }


    return texto;

}



/* =========================================================
   LOCAL STORAGE
========================================================= */

function obterDadosStorage(
    chave
) {

    const dados =
        localStorage.getItem(
            chave
        );


    if (!dados) {
        return [];
    }


    try {

        const convertido =
            JSON.parse(
                dados
            );


        return Array.isArray(
            convertido
        )
            ? convertido
            : [];

    } catch (erro) {

        console.error(
            "Erro ao ler:",
            chave,
            erro
        );

        return [];

    }

}



/* =========================================================
   AGENDA
========================================================= */

function obterAtendimentos() {

    return obterDadosStorage(
        CHAVE_AGENDA
    );

}



function obterFuncionarios() {

    return obterDadosStorage(
        CHAVE_FUNCIONARIOS
    );

}



function obterServicos() {

    return obterDadosStorage(
        CHAVE_SERVICOS
    );

}



/* =========================================================
   IDENTIFICAÇÃO DO ATENDIMENTO
========================================================= */

function obterIdAtendimento(
    atendimento
) {

    return String(

        atendimento?.id ??
        atendimento?.idAtendimento ??
        ""

    );

}



/* =========================================================
   DADOS DO ATENDIMENTO
========================================================= */

function obterClienteAtendimento(
    atendimento
) {

    return (
        atendimento?.cliente ||
        atendimento?.clienteNome ||
        "Cliente"
    );

}



function obterServicoAtendimento(
    atendimento
) {

    return (
        atendimento?.servico ||
        atendimento?.servicoNome ||
        "Serviço"
    );

}



function obterDataAtendimento(
    atendimento
) {

    return (
        atendimento?.data ||
        atendimento?.dataAtendimento ||
        ""
    );

}



function obterHoraAtendimento(
    atendimento
) {

    return (
        atendimento?.hora ||
        ""
    );

}



function obterValorAtendimento(
    atendimento
) {

    return Number(

        atendimento?.valor ??
        atendimento?.valorTotal ??
        atendimento?.preco ??
        0

    );

}



/* =========================================================
   PROFISSIONAL
========================================================= */

function obterFuncionarioDoAtendimento(
    atendimento
) {

    const funcionarios =
        obterFuncionarios();


    const profissionalId =
        String(
            atendimento?.profissional ??
            atendimento?.profissionalId ??
            ""
        );


    if (!profissionalId) {

        return null;

    }


    const funcionario =
        funcionarios.find(
            item =>
                String(
                    item.id
                ) ===
                profissionalId
        );


    return funcionario || null;

}



function obterNomeProfissional(
    atendimento
) {

    const funcionario =
        obterFuncionarioDoAtendimento(
            atendimento
        );


    if (funcionario) {

        return (
            funcionario.nomeExibicao ||
            funcionario.nomeCompleto ||
            "Não informado"
        );

    }


    /*
     * Compatibilidade com registros
     * antigos da Agenda.
     */

    return (
        atendimento?.profissionalNome ||
        atendimento?.profissional ||
        "Não informado"
    );

}



/* =========================================================
   COMISSÃO DO PROFISSIONAL
========================================================= */

function obterPercentualComissao(
    atendimento
) {

    const funcionario =
        obterFuncionarioDoAtendimento(
            atendimento
        );


    if (!funcionario) {

        return 0;

    }


    const percentual =
        Number(
            funcionario.comissao
        );


    if (
        !Number.isFinite(
            percentual
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        percentual
    );

}



function calcularComissao(
    valor,
    percentual
) {

    const valorNumerico =
        Number(
            valor || 0
        );


    const percentualNumerico =
        Number(
            percentual || 0
        );


    return Number(
        (
            valorNumerico *
            percentualNumerico /
            100
        ).toFixed(2)
    );

}



/* =========================================================
   ESTADO DO ATENDIMENTO
========================================================= */

function atendimentoConcluido(
    atendimento
) {

    /*
     * A Agenda atual usa exatamente:
     *
     * "Concluído"
     */

    return (
        atendimento?.estado ===
        "Concluído"
    );

}



function atendimentoCancelado(
    atendimento
) {

    return (

        atendimento?.estado ===
            "Cancelado" ||

        atendimento?.estado ===
            "Não Compareceu"

    );

}



/* =========================================================
   REGISTRO FINANCEIRO
========================================================= */

function criarRegistroFinanceiro(
    atendimento
) {

    const funcionario =
        obterFuncionarioDoAtendimento(
            atendimento
        );


    const valor =
        obterValorAtendimento(
            atendimento
        );


    const percentual =
        obterPercentualComissao(
            atendimento
        );


    const valorComissao =
        calcularComissao(
            valor,
            percentual
        );


    const idAtendimento =
        obterIdAtendimento(
            atendimento
        );


    return {

        id:
            "fin_" +
            idAtendimento,


        atendimentoId:
            idAtendimento,


        clienteNome:
            obterClienteAtendimento(
                atendimento
            ),


        servicoNome:
            obterServicoAtendimento(
                atendimento
            ),


        profissionalId:
            funcionario?.id ??
            atendimento?.profissional ??
            "",


        profissionalNome:
            obterNomeProfissional(
                atendimento
            ),


        dataAtendimento:
            obterDataAtendimento(
                atendimento
            ),


        horaAtendimento:
            obterHoraAtendimento(
                atendimento
            ),


        valor:


            valor,


        pagamento: {

            status:
                "pendente",

            formaPagamento:
                "",

            dataPagamento:
                ""

        },


        comissao: {

            percentual:
                percentual,

            valor:
                valorComissao,

            status:
                valorComissao > 0
                    ? "pendente"
                    : "sem_comissao",

            dataPagamento:
                ""

        },


        observacoes:
            atendimento?.observacoes ||
            "",


        criadoEm:
            new Date().toISOString()

    };

}



/* =========================================================
   ENCONTRAR REGISTRO POR ATENDIMENTO
========================================================= */

function encontrarRegistroFinanceiro(
    idAtendimento
) {

    return registrosFinanceiros.find(
        registro =>
            String(
                registro.atendimentoId
            ) ===
            String(
                idAtendimento
            )
    );

}



/* =========================================================
   SINCRONIZAR AGENDA → FINANCEIRO
========================================================= */

/* =========================================================
   SINCRONIZAR AGENDA → FINANCEIRO
   1 atendimento = 1 registro
========================================================= */

function sincronizarAtendimentosConcluidos() {

    const atendimentos =
        obterAtendimentos();

    let houveAlteracao = false;


    atendimentos.forEach(atendimento => {

        /* -------------------------------------------------
           Só entram atendimentos concluídos
        ------------------------------------------------- */

        if (
            atendimento.estado !== "Concluído"
        ) {
            return;
        }


        /* -------------------------------------------------
           Cancelados / faltas não entram
        ------------------------------------------------- */

        if (
            atendimento.estado === "Cancelado" ||
            atendimento.estado === "Não Compareceu"
        ) {
            return;
        }


        const idAtendimento =
            String(
                atendimento.id || ""
            );


        if (!idAtendimento) {
            return;
        }


        /* -------------------------------------------------
           Dados reais da Agenda
        ------------------------------------------------- */

        const cliente =
            String(
                atendimento.cliente || ""
            ).trim();


        const servico =
            String(
                atendimento.servico || ""
            ).trim();


        const data =
            String(
                atendimento.data || ""
            );


        const hora =
            String(
                atendimento.hora || ""
            );


        const valor =
            Number(
                atendimento.valor || 0
            );


        /* -------------------------------------------------
           Funcionário
        ------------------------------------------------- */

        const funcionario =
            obterFuncionarioDoAtendimento(
                atendimento
            );


        const profissionalId =
            funcionario?.id ||
            atendimento.profissional ||
            "";


        const profissionalNome =
            funcionario?.nomeExibicao ||
            funcionario?.nomeCompleto ||
            "Não informado";


        /* -------------------------------------------------
           Comissão
        ------------------------------------------------- */

        const percentualComissao =
            funcionario
                ? Number(
                    funcionario.comissao || 0
                )
                : 0;


        const valorComissao =
            calcularComissao(
                valor,
                percentualComissao
            );


        /* -------------------------------------------------
           Verifica se já existe
        ------------------------------------------------- */

        let registro =
            registrosFinanceiros.find(
                item =>
                    item.atendimentoId ===
                    idAtendimento
            );


        /* -------------------------------------------------
           NOVO REGISTRO
        ------------------------------------------------- */

        if (!registro) {

            registro = {

                id:
                    "fin_" +
                    idAtendimento,

                atendimentoId:
                    idAtendimento,

                clienteNome:
                    cliente,

                servicoNome:
                    servico,

                profissionalId:
                    profissionalId,

                profissionalNome:
                    profissionalNome,

                dataAtendimento:
                    data,

                horaAtendimento:
                    hora,

                valor:
                    valor,

                pagamento: {

                    status:
                        "pendente",

                    formaPagamento:
                        "",

                    dataPagamento:
                        ""

                },

                comissao: {

                    percentual:
                        percentualComissao,

                    valor:
                        valorComissao,

                    status:
                        valorComissao > 0
                            ? "pendente"
                            : "sem_comissao",

                    dataPagamento:
                        ""

                },

                observacoes:
                    atendimento.observacoes ||
                    "",

                criadoEm:
                    new Date().toISOString()

            };


            registrosFinanceiros.push(
                registro
            );


            houveAlteracao =
                true;

            return;
        }


        /* -------------------------------------------------
           ATUALIZA DADOS DO ATENDIMENTO
        ------------------------------------------------- */

        registro.clienteNome =
            cliente;


        registro.servicoNome =
            servico;


        registro.profissionalId =
            profissionalId;


        registro.profissionalNome =
            profissionalNome;


        registro.dataAtendimento =
            data;


        registro.horaAtendimento =
            hora;


        registro.valor =
            valor;


        registro.observacoes =
            atendimento.observacoes ||
            "";


        /* -------------------------------------------------
           Atualiza comissão somente se ainda
           não foi paga
        ------------------------------------------------- */

        if (
            !registro.comissao ||
            registro.comissao.status !== "paga"
        ) {

            registro.comissao = {

                percentual:
                    percentualComissao,

                valor:
                    valorComissao,

                status:
                    valorComissao > 0
                        ? "pendente"
                        : "sem_comissao",

                dataPagamento:
                    registro
                        .comissao
                        ?.dataPagamento ||
                    ""

            };

        }


        houveAlteracao =
            true;

    });


    if (
        houveAlteracao
    ) {

        salvarFinanceiro();

    }

}


/* =========================================================
   CARREGAR FINANCEIRO
========================================================= */

function carregarFinanceiro() {

    const dados =
        localStorage.getItem(
            CHAVE_FINANCEIRO
        );


    if (!dados) {

        registrosFinanceiros =
            [];

        return;

    }


    try {

        const convertido =
            JSON.parse(
                dados
            );


        registrosFinanceiros =
            Array.isArray(
                convertido
            )
                ? convertido
                : [];


    } catch (erro) {

        console.error(
            "Erro ao carregar Financeiro:",
            erro
        );


        registrosFinanceiros =
            [];

    }

}



/* =========================================================
   SALVAR FINANCEIRO
========================================================= */

function salvarFinanceiro() {

    localStorage.setItem(

        CHAVE_FINANCEIRO,

        JSON.stringify(
            registrosFinanceiros
        )

    );

}

/* =========================================================
   ABAS DO FINANCEIRO
========================================================= */

function inicializarAbas() {

    const container =
        document.querySelector(
            ".abas-financeiro"
        );


    if (!container) {
        console.error(
            "Container das abas não encontrado."
        );

        return;
    }


    container.addEventListener(
        "click",
        function (evento) {

            const aba =
                evento.target.closest(
                    ".aba-financeiro"
                );


            if (!aba) {
                return;
            }


            const nome =
                aba.dataset.aba;


            if (!nome) {
                return;
            }


            console.log(
                "ABA:",
                nome
            );


            /*
             * Guarda a aba atual
             */

            abaAtual =
                nome;


            /*
             * Remove ativo de todas
             */

            container
                .querySelectorAll(
                    ".aba-financeiro"
                )
                .forEach(
                    item => {

                        item.classList.remove(
                            "ativo"
                        );

                    }
                );


            /*
             * Ativa a clicada
             */

            aba.classList.add(
                "ativo"
            );


            /*
             * Esconde todas as seções
             */

            document
                .querySelectorAll(
                    ".aba-conteudo"
                )
                .forEach(
                    secao => {

                        secao.classList.remove(
                            "ativa"
                        );

                    }
                );


            /*
             * Mapeia cada aba
             */

            const mapa = {
    recebimentos: "abaRecebimentos",
    pagos: "abaPagos",
    comissoes: "abaComissoes",
    despesas: "abaDespesas",
    fluxo: "abaFluxo",
    "fluxo-caixa": "abaFluxo",
    indicadores: "abaIndicadores"
};


            const idSecao =
                mapa[nome];


            const secao =
                document.getElementById(
                    idSecao
                );


            if (!secao) {

                console.error(
                    "Seção não encontrada:",
                    idSecao
                );

                return;
            }


            /*
             * Mostra a seção
             */

            secao.classList.add(
                "ativa"
            );


            /*
             * Atualiza o conteúdo
             */

            if (
                nome ===
                "recebimentos"
            ) {

                renderizarRecebimentos();

            }


            if (
                nome ===
                "pagos"
            ) {

                renderizarPagos();

            }

            if (
              nome ===
             "comissoes"
            ) {

    renderizarComissoes();

            }

            if (
                nome ===
                "despesas"
            ) {

                renderizarDespesas();

            }


            if (
                nome ===
                "fluxo"
            ) {

                renderizarFluxoCaixa();

            }


            if (
                nome ===
                "indicadores"
            ) {

                renderizarIndicadores();

            }

        }
    );

}

/* =========================================================
   RENDERIZAR ABA ATUAL
========================================================= */

function renderizarAbaAtual() {

    document
        .querySelectorAll(
            ".aba-conteudo"
        )
        .forEach(
            secao => {

                secao.classList.remove(
                    "ativa"
                );

            }
        );


    const mapa = {
    recebimentos: "abaRecebimentos",
    pagos: "abaPagos",
    comissoes: "abaComissoes",
    despesas: "abaDespesas",
    fluxo: "abaFluxo",
    "fluxo-caixa": "abaFluxo",
    indicadores: "abaIndicadores"
};


    const idSecao =
        mapaAbas[
            abaAtual
        ];


    const secao =
        document.getElementById(
            idSecao
        );


    if (secao) {

        secao.classList.add(
            "ativa"
        );

    }


    switch (
        abaAtual
    ) {

        case "recebimentos":

            renderizarRecebimentos();

            break;


        case "pagos":

            renderizarPagos();

            break;


        case "despesas":

            renderizarDespesas();

            break;


        case "fluxo":

            renderizarFluxoCaixa();

            break;


        case "indicadores":

            renderizarIndicadores();

            break;

    }

}


/* =========================================================
   PESQUISA
========================================================= */

function inicializarPesquisa() {

    const campos =
        document.querySelectorAll(
            'input[placeholder*="Pesquisar"], input[type="search"]'
        );


    campos.forEach(
        campo => {

            campo.addEventListener(
                "input",
                () => {

                    renderizarAbaAtual();

                }
            );

        }
    );

}


/* =========================================================
   FILTROS
========================================================= */

function inicializarFiltros() {

    const selects =
        document.querySelectorAll(
            ".filtros-financeiro select"
        );


    selects.forEach(
        select => {

            select.addEventListener(
                "change",
                () => {

                    renderizarAbaAtual();

                }
            );

        }
    );


    const dataInicio =
        document.getElementById(
            "dataInicioFluxo"
        );


    const dataFim =
        document.getElementById(
            "dataFimFluxo"
        );


    dataInicio?.addEventListener(
        "change",
        renderizarFluxoCaixa
    );


    dataFim?.addEventListener(
        "change",
        renderizarFluxoCaixa
    );

}


/* =========================================================
   BOTÕES
========================================================= */

function inicializarBotoes() {

    document.addEventListener(
        "click",
        evento => {

            const botaoPagamento =
                evento.target.closest(
                    ".btn-editar-financeiro"
                );


            if (
                botaoPagamento
            ) {

                const id =
                    botaoPagamento.dataset.id;


                if (!id) {

                    alert(
                        "Atendimento não identificado."
                    );

                    return;

                }


                abrirPagamento(
                    id
                );


                return;

            }


            const botaoAtualizar =
                evento.target.closest(
                    ".btn-atualizar"
                );


            if (
                botaoAtualizar
            ) {

                sincronizarAtendimentosConcluidos();

                atualizarTela();

            }

        }
    );

}


/* =========================================================
   RECEBIMENTOS
   SOMENTE:

   - Atendimento concluído
   - Pagamento pendente
========================================================= */

function obterRecebimentosPendentes() {

    return registrosFinanceiros.filter(
        registro => {

            return (
                registro.pagamento?.status ===
                "pendente"
            );

        }
    );

}


/* =========================================================
   PAGAMENTOS
   SOMENTE:

   - Pagamento efetuado
========================================================= */

function obterPagamentosRealizados() {

    return registrosFinanceiros.filter(
        registro => {

            return (
                registro.pagamento?.status ===
                "pago"
            );

        }
    );

}


/* =========================================================
   OBTER DADOS ORIGINAIS DO ATENDIMENTO
========================================================= */

function obterDadosOriginaisAtendimento(registro) {

    const atendimentos =
        obterAtendimentos();

    const atendimento =
        atendimentos.find(
            item =>
                String(
                    item.id ??
                    item.idAtendimento ??
                    ""
                ) ===
                String(
                    registro.atendimentoId ??
                    ""
                )
        );

    if (!atendimento) {

        return {
            cliente:
                registro.clienteNome ||
                "Cliente",

            servico:
                registro.servicoNome ||
                "Serviço",

            profissional:
                registro.profissionalNome ||
                "Não informado",

            data:
                registro.dataAtendimento ||
                "",

            hora:
                registro.horaAtendimento ||
                "",

            valor:
                Number(
                    registro.valor || 0
                )
        };

    }

    return {

        cliente:
            atendimento.cliente ||
            atendimento.clienteNome ||
            "Cliente",

        servico:
            atendimento.servico ||
            atendimento.servicoNome ||
            atendimento.nomeServico ||
            "Serviço",

        profissional:
            registro.profissionalNome ||
            obterNomeProfissional(
                atendimento
            ),

        data:
            atendimento.data ||
            atendimento.dataAtendimento ||
            registro.dataAtendimento ||
            "",

        hora:
            atendimento.hora ||
            registro.horaAtendimento ||
            "",

        valor:
            Number(
                atendimento.valor ??
                atendimento.valorTotal ??
                atendimento.preco ??
                registro.valor ??
                0
            )

    };

}

/* =========================================================
   RENDERIZAR RECEBIMENTOS
========================================================= */

function renderizarRecebimentos() {

    const area =
        document.getElementById(
            "listaRecebimentos"
        );


    const contador =
        document.getElementById(
            "contadorRecebimentos"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioRecebimentos"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizarTexto(

            document
                .getElementById(
                    "pesquisaRecebimento"
                )
                ?.value || ""

        );


    let registros =
        obterRecebimentosPendentes();


    /* =====================================================
       PESQUISA
    ====================================================== */

    if (
        pesquisa
    ) {

        registros =
            registros.filter(
                registro => {

                    const cliente =
                        normalizarTexto(
                            registro.clienteNome
                        );


                    const servico =
                        normalizarTexto(
                            registro.servicoNome
                        );


                    const profissional =
                        normalizarTexto(
                            registro.profissionalNome
                        );


                    return (

                        cliente.includes(
                            pesquisa
                        ) ||

                        servico.includes(
                            pesquisa
                        ) ||

                        profissional.includes(
                            pesquisa
                        )

                    );

                }
            );

    }


   area.innerHTML = "";

/* Garante que a lista volte para o início */
area.scrollLeft = 0;


    if (contador) {

        contador.textContent =

            registros.length ===
            1

                ? "1 registro"

                : `${registros.length} registros`;

    }


    if (
        !registros.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    registros.forEach(
        registro => {

            area.appendChild(
                criarCardRecebimento(
                    registro
                )
            );

        }
    );

}


/* =========================================================
   CARD DE RECEBIMENTO
========================================================= */
function criarCardRecebimento(registro) {

    const dados =
        obterDadosOriginaisAtendimento(
            registro
        );


    /* Atualiza o registro financeiro
       com os dados corretos da Agenda */

    registro.clienteNome =
        dados.cliente;

    registro.servicoNome =
        dados.servico;

    registro.profissionalNome =
        dados.profissional;

    registro.dataAtendimento =
        dados.data;

    registro.horaAtendimento =
        dados.hora;

    registro.valor =
        dados.valor;


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "financeiro-card";


    card.innerHTML = `

        <div class="financeiro-card-principal">

            <strong>
                ${escaparHTML(
                    dados.cliente
                )}
            </strong>

            <span>
                ${escaparHTML(
                    dados.servico
                )}
            </span>

        </div>


        <div class="financeiro-card-info">

            <span>
                ${escaparHTML(
                    formatarData(
                        dados.data
                    )
                )}
            </span>

            <span>
                ${escaparHTML(
                    dados.profissional
                )}
            </span>

        </div>


        <div class="financeiro-card-valor">

            ${formatarValor(
                dados.valor
            )}

        </div>


        <div class="financeiro-card-forma">

            —

        </div>


        <div class="financeiro-card-status">

            <span class="status-financeiro pendente">
                Pendente
            </span>

        </div>


        <div class="financeiro-card-acoes">

            <button
                type="button"
                class="btn-editar-financeiro"
                data-id="${escaparHTML(
                    registro.atendimentoId
                )}"
            >
                Registrar pagamento
            </button>

        </div>

    `;


    return card;

}


/* =========================================================
   RENDERIZAR PAGOS
========================================================= */

function renderizarPagos() {

    const area =
        document.getElementById(
            "listaPagos"
        );


    const contador =
        document.getElementById(
            "contadorPagos"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioPagos"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizarTexto(

            document
                .getElementById(
                    "pesquisaPagos"
                )
                ?.value || ""

        );


    const filtroForma =
        normalizarFormaPagamento(

            document
                .getElementById(
                    "filtroFormaPagamentoPagos"
                )
                ?.value || ""

        );


    let registros =
        obterPagamentosRealizados();


    /* =====================================================
       FILTRO DE PESQUISA
    ====================================================== */

    if (
        pesquisa
    ) {

        registros =
            registros.filter(
                registro => {

                    const cliente =
                        normalizarTexto(
                            registro.clienteNome
                        );


                    const servico =
                        normalizarTexto(
                            registro.servicoNome
                        );


                    const profissional =
                        normalizarTexto(
                            registro.profissionalNome
                        );


                    return (

                        cliente.includes(
                            pesquisa
                        ) ||

                        servico.includes(
                            pesquisa
                        ) ||

                        profissional.includes(
                            pesquisa
                        )

                    );

                }
            );

    }


    /* =====================================================
       FILTRO DE FORMA
    ====================================================== */

    if (
        filtroForma
    ) {

        registros =
            registros.filter(
                registro => {

                    return (

                        normalizarFormaPagamento(
                            registro
                                .pagamento
                                ?.formaPagamento
                        ) ===
                        filtroForma

                    );

                }
            );

    }


    /*
     * Mais recentes primeiro.
     */

    registros.sort(
        (
            a,
            b
        ) =>

            String(
                b.pagamento?.dataPagamento ||
                ""
            ).localeCompare(

                String(
                    a.pagamento?.dataPagamento ||
                    ""
                )

            )
    );


   area.innerHTML = "";

/* Garante que a lista volte para o início */
area.scrollLeft = 0;


    if (contador) {

        contador.textContent =

            registros.length ===
            1

                ? "1 registro"

                : `${registros.length} registros`;

    }


    if (
        !registros.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    registros.forEach(
        registro => {

            area.appendChild(
                criarCardPago(
                    registro
                )
            );

        }
    );

}



/* =========================================
   RENDERIZAR COMISSÕES
========================================= */

function renderizarComissoes() {

    const area =
        document.getElementById(
            "listaComissoes"
        );

    const contador =
        document.getElementById(
            "contadorComissoes"
        );

    const estadoVazio =
        document.getElementById(
            "estadoVazioComissoes"
        );

    if (!area) {
        return;
    }


    area.innerHTML = "";


    /*
     * Busca os funcionários cadastrados
     */

    let funcionarios = [];

    try {

        const dados =
            localStorage.getItem(
                CHAVE_PROFISSIONAIS
            );

        funcionarios =
            dados
                ? JSON.parse(dados)
                : [];

    } catch (erro) {

        console.error(
            "Erro ao carregar profissionais:",
            erro
        );

        funcionarios = [];

    }


    /*
     * Somente pagamentos efetivamente registrados
     */

    const pagamentos =
        lancamentos.filter(
            item =>
                item.tipo === "recebimento" &&
                item.status === "pago"
        );


    /*
     * Agrupar por profissional
     */

    const resumo = {};


    pagamentos.forEach(
        pagamento => {

            const nome =
                pagamento.profissionalNome ||
                "Não informado";


            const funcionario =
                funcionarios.find(
                    funcionario =>
                        funcionario.id ===
                        pagamento.profissionalId
                );


            const percentual =
                funcionario
                    ? Number(
                        funcionario.comissao || 0
                    )
                    : 0;


            const valor =
                Number(
                    pagamento.valor || 0
                );


            const valorComissao =
                Number(
                    (
                        valor *
                        percentual /
                        100
                    ).toFixed(2)
                );


            if (!resumo[nome]) {

                resumo[nome] = {

                    nome: nome,

                    atendimentos: 0,

                    faturamento: 0,

                    percentual: percentual,

                    comissao: 0

                };

            }


            resumo[nome].atendimentos += 1;

            resumo[nome].faturamento += valor;

            resumo[nome].comissao +=
                valorComissao;

        }
    );


    const profissionais =
        Object.values(resumo);


    /*
     * Atualiza indicadores
     */

    const totalComissoes =
        profissionais.reduce(
            (
                total,
                profissional
            ) =>
                total +
                profissional.comissao,
            0
        );


    const totalFaturamento =
        profissionais.reduce(
            (
                total,
                profissional
            ) =>
                total +
                profissional.faturamento,
            0
        );


    const pendentes =
        totalComissoes;


    const elementoPendentes =
        document.getElementById(
            "comissoesPendentes"
        );

    const elementoPagas =
        document.getElementById(
            "comissoesPagas"
        );

    const elementoTotal =
        document.getElementById(
            "comissoesTotalAba"
        );


    if (elementoPendentes) {

        elementoPendentes.textContent =
            formatarValor(
                pendentes
            );

    }


    if (elementoPagas) {

        elementoPagas.textContent =
            formatarValor(0);

    }


    if (elementoTotal) {

        elementoTotal.textContent =
            formatarValor(
                totalComissoes
            );

    }


    /*
     * Nenhuma comissão
     */

    if (
        profissionais.length === 0
    ) {

        contador.textContent =
            "0 profissionais";

        estadoVazio.style.display =
            "block";

        return;

    }


    estadoVazio.style.display =
        "none";


    contador.textContent =
        `${profissionais.length} ${
            profissionais.length === 1
                ? "profissional"
                : "profissionais"
        }`;


    /*
     * Criar os cards
     */

    profissionais.forEach(
        profissional => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "comissao-profissional-card";


            card.innerHTML = `

                <div class="comissao-profissional-info">

                    <strong>
                        ${escaparHTML(
                            profissional.nome
                        )}
                    </strong>

                    <span>
                        ${
                            profissional.atendimentos
                        }
                        ${
                            profissional.atendimentos === 1
                                ? "atendimento"
                                : "atendimentos"
                        }
                    </span>

                </div>


                <div class="comissao-profissional-faturamento">

                    <small>
                        Faturamento
                    </small>

                    <strong>
                        ${formatarValor(
                            profissional.faturamento
                        )}
                    </strong>

                </div>


                <div class="comissao-profissional-percentual">

                    <small>
                        Comissão
                    </small>

                    <strong>
                        ${
                            profissional.percentual
                        }%
                    </strong>

                </div>


                <div class="comissao-profissional-valor">

                    <small>
                        Valor da comissão
                    </small>

                    <strong>
                        ${formatarValor(
                            profissional.comissao
                        )}
                    </strong>

                </div>

            `;


            area.appendChild(
                card
            );

        }
    );

}




/* =========================================================
   CARD DE PAGAMENTO
========================================================= */

function criarCardPago(
    registro
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "financeiro-card";


    const forma =
        registro
            .pagamento
            ?.formaPagamento ||
        "Não informado";


    const dataPagamento =
        registro
            .pagamento
            ?.dataPagamento ||
        "";


    card.innerHTML = `

        <div class="financeiro-card-principal">

            <strong>

                ${escaparHTML(
                    registro.clienteNome
                )}

            </strong>


            <span>

                ${escaparHTML(
                    registro.servicoNome
                )}

            </span>

        </div>


        <div class="financeiro-card-info">

            <span>

                ${escaparHTML(
                    formatarData(
                        registro.dataAtendimento
                    )
                )}

            </span>


            <span>

                ${escaparHTML(
                    registro.profissionalNome
                )}

            </span>

        </div>


        <div class="financeiro-card-valor">

            ${formatarValor(
                registro.valor
            )}

        </div>


        <div class="financeiro-card-forma">

            ${escaparHTML(
                forma
            )}

        </div>


        <div class="financeiro-card-status">

            <span
                class="status-financeiro pago"
            >

                Pago

            </span>

        </div>


        <div class="financeiro-card-info">

            <span>

                Pago em:

            </span>


            <span>

                ${escaparHTML(
                    formatarData(
                        dataPagamento
                    )
                )}

            </span>

        </div>

    `;


    return card;

}


/* =========================================================
   ABRIR MODAL DE PAGAMENTO
========================================================= */

function abrirPagamento(
    atendimentoId
) {

    const registro =
        registrosFinanceiros.find(
            item =>
                String(
                    item.atendimentoId
                ) ===
                String(
                    atendimentoId
                )
        );


    if (!registro) {

        alert(
            "Registro financeiro não encontrado."
        );

        return;

    }


    if (
        registro.pagamento?.status ===
        "pago"
    ) {

        alert(
            "Este atendimento já está pago."
        );

        return;

    }


    registroPagamentoAtual =
        registro;


    formaPagamentoSelecionada =
        "";


    const modal =
        document.getElementById(
            "modalPagamento"
        );


    const campoCliente =
        document.getElementById(
            "pagamentoCliente"
        );


    const campoServico =
        document.getElementById(
            "pagamentoServico"
        );


    const campoValor =
        document.getElementById(
            "pagamentoValor"
        );


    const container =
        document.getElementById(
            "formasPagamento"
        );


    if (!modal) {
        return;
    }


    if (campoCliente) {

        campoCliente.textContent =
            registro.clienteNome;

    }


    if (campoServico) {

        campoServico.textContent =
            registro.servicoNome;

    }


    if (campoValor) {

        campoValor.textContent =
            formatarValor(
                registro.valor
            );

    }


    if (container) {

        container.innerHTML =
            "";


        const formas = [

            {
                nome:
                    "Dinheiro",

                icone:
                    "💵"

            },

            {
                nome:
                    "Cartão",

                icone:
                    "💳"

            },

            {
                nome:
                    "MB WAY",

                icone:
                    "📱"

            },

            {
                nome:
                    "Transferência",

                icone:
                    "🏦"

            }

        ];


        formas.forEach(
            forma => {

                const botao =
                    document.createElement(
                        "button"
                    );


                botao.type =
                    "button";


                botao.className =
                    "forma-pagamento";


                botao.innerHTML = `

                    <span
                        class="forma-pagamento-icone"
                    >

                        ${forma.icone}

                    </span>

                    ${escaparHTML(
                        forma.nome
                    )}

                `;


                botao.addEventListener(
                    "click",
                    () => {

                        formaPagamentoSelecionada =
                            forma.nome;


                        container
                            .querySelectorAll(
                                ".forma-pagamento"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "selecionada"
                                    );

                                }
                            );


                        botao.classList.add(
                            "selecionada"
                        );

                    }
                );


                container.appendChild(
                    botao
                );

            }
        );

    }


    modal.classList.add(
        "ativo"
    );

}


/* =========================================================
   FECHAR MODAL DE PAGAMENTO
========================================================= */

function fecharModalPagamento() {

    const modal =
        document.getElementById(
            "modalPagamento"
        );


    if (modal) {

        modal.classList.remove(
            "ativo"
        );

    }


    registroPagamentoAtual =
        null;


    formaPagamentoSelecionada =
        "";

}


/* =========================================================
   FINALIZAR PAGAMENTO
========================================================= */

function finalizarPagamento() {

    if (
        !registroPagamentoAtual
    ) {

        return;

    }


    if (
        !formaPagamentoSelecionada
    ) {

        alert(
            "Selecione uma forma de pagamento."
        );

        return;

    }


    const registro =
        registroPagamentoAtual;


    /*
     * Segurança:
     * não permite pagar duas vezes.
     */

    if (
        registro.pagamento?.status ===
        "pago"
    ) {

        alert(
            "Este atendimento já está pago."
        );

        fecharModalPagamento();

        return;

    }


    registro.pagamento = {

        status:
            "pago",

        formaPagamento:
            formaPagamentoSelecionada,

        dataPagamento:
            new Date()
                .toISOString()
                .split("T")[0]

    };


    /*
     * A comissão NÃO é marcada como paga.
     *
     * Ela continua pendente até que
     * seja paga separadamente.
     */

    if (
        registro.comissao &&
        registro.comissao.valor > 0
    ) {

        registro.comissao.status =
            "pendente";

    }


    salvarFinanceiro();


    fecharModalPagamento();


    atualizarTela();


    alert(
        "Pagamento registrado com sucesso!"
    );

}


/* =========================================================
   EVENTOS DO MODAL DE PAGAMENTO
========================================================= */

function inicializarModalPagamento() {

    const modal =
        document.getElementById(
            "modalPagamento"
        );


    if (!modal) {
        return;
    }


    document
        .getElementById(
            "fecharModalPagamento"
        )
        ?.addEventListener(
            "click",
            fecharModalPagamento
        );


    document
        .getElementById(
            "cancelarPagamento"
        )
        ?.addEventListener(
            "click",
            fecharModalPagamento
        );


    document
        .getElementById(
            "confirmarPagamento"
        )
        ?.addEventListener(
            "click",
            finalizarPagamento
        );


    modal.addEventListener(
        "click",
        evento => {

            if (
                evento.target ===
                modal
            ) {

                fecharModalPagamento();

            }

        }
    );

}

/* =========================================================
   DESPESAS
========================================================= */

function inicializarModalDespesa() {

    const btnNovaDespesa =
        document.getElementById(
            "btnNovaDespesa"
        );


    const modal =
        document.getElementById(
            "modalDespesa"
        );


    const btnFechar =
        document.getElementById(
            "btnFecharModalDespesa"
        );


    const btnCancelar =
        document.getElementById(
            "btnCancelarDespesa"
        );


    const form =
        document.getElementById(
            "formDespesa"
        );


    if (!modal || !form) {
        return;
    }


    btnNovaDespesa?.addEventListener(
        "click",
        () => {

            form.reset();


            const data =
                document.getElementById(
                    "dataVencimentoDespesa"
                );


            if (data) {

                data.value =
                    new Date()
                        .toISOString()
                        .split("T")[0];

            }


            modal.classList.add(
                "ativo"
            );

        }
    );


    btnFechar?.addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "ativo"
            );

        }
    );


    btnCancelar?.addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "ativo"
            );

        }
    );


    modal.addEventListener(
        "click",
        evento => {

            if (
                evento.target === modal
            ) {

                modal.classList.remove(
                    "ativo"
                );

            }

        }
    );


    form.addEventListener(
        "submit",
        salvarDespesa
    );

}


/* =========================================================
   SALVAR DESPESA
========================================================= */

function salvarDespesa(
    evento
) {

    evento.preventDefault();


    const descricao =
        document
            .getElementById(
                "descricaoDespesa"
            )
            ?.value
            .trim() || "";


    const categoria =
        document
            .getElementById(
                "categoriaDespesa"
            )
            ?.value
            .trim() || "";


    const valor =
        Number(
            document
                .getElementById(
                    "valorDespesa"
                )
                ?.value || 0
        );


    const dataVencimento =
        document
            .getElementById(
                "dataVencimentoDespesa"
            )
            ?.value || "";


    const status =
        document
            .getElementById(
                "statusDespesa"
            )
            ?.value ||
        "pendente";


    const formaPagamento =
        document
            .getElementById(
                "formaPagamentoDespesa"
            )
            ?.value || "";


    const observacao =
        document
            .getElementById(
                "observacaoDespesa"
            )
            ?.value
            .trim() || "";


    if (
        !descricao ||
        !categoria ||
        valor <= 0 ||
        !dataVencimento
    ) {

        alert(
            "Preencha corretamente os campos obrigatórios."
        );

        return;

    }


    /*
     * Despesa é um lançamento separado.
     * Não é um atendimento.
     */

    registrosFinanceiros.push({

        id:
            "desp_" +
            Date.now(),


        tipo:
            "despesa",


        descricao,

        categoria,

        valor,


        dataVencimento,


        observacao,


        status:


            status ===
            "paga"

                ? "paga"

                : "pendente",


        pagamento: {

            formaPagamento,

            dataPagamento:
                status ===
                "paga"

                    ? new Date()
                        .toISOString()
                        .split("T")[0]

                    : ""

        },


        criadoEm:
            new Date().toISOString()

    });


    salvarFinanceiro();


    document
        .getElementById(
            "modalDespesa"
        )
        ?.classList.remove(
            "ativo"
        );


    document
        .getElementById(
            "formDespesa"
        )
        ?.reset();


    atualizarTela();


    alert(
        "Despesa cadastrada com sucesso!"
    );

}


/* =========================================================
   FILTRAR DESPESAS
========================================================= */

function obterDespesas() {

    return registrosFinanceiros.filter(
        registro =>
            registro.tipo ===
            "despesa"
    );

}



/* =========================================================
   RENDERIZAR DESPESAS
========================================================= */

function renderizarDespesas() {

    const area =
        document.getElementById(
            "listaDespesas"
        );


    const contador =
        document.getElementById(
            "contadorDespesas"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioDespesas"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizarTexto(

            document
                .getElementById(
                    "pesquisaDespesa"
                )
                ?.value || ""

        );


    const categoria =
        normalizarTexto(

            document
                .getElementById(
                    "filtroCategoriaDespesa"
                )
                ?.value || ""

        );


    const status =
        normalizarTexto(

            document
                .getElementById(
                    "filtroStatusDespesa"
                )
                ?.value || ""

        );


    const forma =
        normalizarFormaPagamento(

            document
                .getElementById(
                    "filtroFormaPagamentoDespesa"
                )
                ?.value || ""

        );


    let despesas =
        obterDespesas();


    despesas =
        despesas.filter(
            despesa => {

                const textoDescricao =
                    normalizarTexto(
                        despesa.descricao
                    );


                const textoCategoria =
                    normalizarTexto(
                        despesa.categoria
                    );


                const statusDespesa =
                    normalizarTexto(
                        despesa.status
                    );


                const formaDespesa =
                    normalizarFormaPagamento(
                        despesa
                            .pagamento
                            ?.formaPagamento
                    );


                if (
                    pesquisa &&
                    !textoDescricao.includes(
                        pesquisa
                    ) &&
                    !textoCategoria.includes(
                        pesquisa
                    )
                ) {

                    return false;

                }


                if (
                    categoria &&
                    textoCategoria !==
                    categoria
                ) {

                    return false;

                }


                if (
                    status &&
                    statusDespesa !==
                    status
                ) {

                    return false;

                }


                if (
                    forma &&
                    formaDespesa !==
                    forma
                ) {

                    return false;

                }


                return true;

            }
        );


   area.innerHTML = "";

/* Garante que a lista volte para o início */
area.scrollLeft = 0;


    if (contador) {

        contador.textContent =

            despesas.length ===
            1

                ? "1 despesa"

                : `${despesas.length} despesas`;

    }


    if (
        !despesas.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    despesas.forEach(
        despesa => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "financeiro-card";


            const paga =
                despesa.status ===
                "paga";


            const forma =
                despesa
                    .pagamento
                    ?.formaPagamento ||
                "Não informado";


            card.innerHTML = `

                <div
                    class="financeiro-card-principal"
                >

                    <strong>

                        ${escaparHTML(
                            despesa.descricao
                        )}

                    </strong>


                    <span>

                        ${escaparHTML(
                            despesa.categoria
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-info"
                >

                    <span>

                        ${escaparHTML(
                            formatarData(
                                despesa.dataVencimento
                            )
                        )}

                    </span>


                    <span>

                        ${escaparHTML(
                            forma
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-valor despesa"
                >

                    - ${formatarValor(
                        despesa.valor
                    )}

                </div>


                <div
                    class="financeiro-card-forma"
                >

                    ${
                        despesa
                            .observacao ||
                        "—"
                    }

                </div>


                <div
                    class="financeiro-card-status"
                >

                    <span
                        class="status-financeiro ${
                            paga
                                ? "pago"
                                : "pendente"
                        }"
                    >

                        ${
                            paga
                                ? "Paga"
                                : "Pendente"
                        }

                    </span>

                </div>


                <div></div>

            `;


            area.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CATEGORIAS DE DESPESAS
========================================================= */

function atualizarCategoriasDespesas() {

    const select =
        document.getElementById(
            "filtroCategoriaDespesa"
        );


    if (!select) {
        return;
    }


    const valorAtual =
        select.value;


    const categorias =
        [
            ...new Set(

                obterDespesas()
                    .map(
                        despesa =>
                            String(
                                despesa.categoria ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)

            )
        ]
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "pt-PT"
                )
        );


    select.innerHTML = `

        <option value="">
            Todas as categorias
        </option>

        ${
            categorias
                .map(
                    categoria => `

                        <option
                            value="${escaparHTML(
                                categoria
                            )}"
                        >

                            ${escaparHTML(
                                categoria
                            )}

                        </option>

                    `
                )
                .join("")
        }

    `;


    if (
        categorias.includes(
            valorAtual
        )
    ) {

        select.value =
            valorAtual;

    }

}


/* =========================================================
   COMISSÕES
========================================================= */

function obterRegistrosComissao() {

    return registrosFinanceiros.filter(
        registro =>
            registro.tipo !==
            "despesa" &&
            registro.comissao &&
            Number(
                registro.comissao.valor
            ) > 0
    );

}


/* =========================================================
   COMISSÕES PENDENTES
========================================================= */

function obterComissoesPendentes() {

    return obterRegistrosComissao()
        .filter(
            registro =>
                registro.comissao.status ===
                "pendente"
        );

}


/* =========================================================
   COMISSÕES PAGAS
========================================================= */

function obterComissoesPagas() {

    return obterRegistrosComissao()
        .filter(
            registro =>
                registro.comissao.status ===
                "paga"
        );

}


/* =========================================================
   TOTAL DE COMISSÕES PENDENTES
========================================================= */

function calcularTotalComissoesPendentes() {

    return obterComissoesPendentes()
        .reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro
                        .comissao
                        .valor ||
                    0
                ),
            0
        );

}


/* =========================================================
   TOTAL DE COMISSÕES PAGAS
========================================================= */

function calcularTotalComissoesPagas() {

    return obterComissoesPagas()
        .reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro
                        .comissao
                        .valor ||
                    0
                ),
            0
        );

}


/* =========================================================
   PAGAR COMISSÃO
========================================================= */

function pagarComissao(
    atendimentoId
) {

    const registro =
        registrosFinanceiros.find(
            item =>
                String(
                    item.atendimentoId
                ) ===
                String(
                    atendimentoId
                )
        );


    if (!registro) {

        alert(
            "Registro financeiro não encontrado."
        );

        return;

    }


    if (
        !registro.comissao ||
        Number(
            registro.comissao.valor
        ) <= 0
    ) {

        alert(
            "Este atendimento não possui comissão."
        );

        return;

    }


    if (
        registro.comissao.status ===
        "paga"
    ) {

        alert(
            "Esta comissão já está paga."
        );

        return;

    }


    const confirmar =
        confirm(
            `Confirmar pagamento de comissão no valor de ${formatarValor(
                registro.comissao.valor
            )} para ${registro.profissionalNome}?`
        );


    if (!confirmar) {

        return;

    }


    registro.comissao.status =
        "paga";


    registro.comissao.dataPagamento =
        new Date()
            .toISOString()
            .split("T")[0];


    salvarFinanceiro();


    atualizarTela();


    alert(
        "Comissão marcada como paga."
    );

}


/* =========================================================
   RENDERIZAR COMISSÕES
========================================================= */

function renderizarComissoes() {

    const area =
        document.getElementById(
            "listaComissoes"
        );


    const contador =
        document.getElementById(
            "contadorComissoes"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioComissoes"
        );


    /*
     * Caso a tela de Comissões ainda não
     * esteja presente no HTML, simplesmente
     * não fazemos nada.
     */

    if (!area) {

        return;

    }


    const pesquisa =
        normalizarTexto(

            document
                .getElementById(
                    "pesquisaComissao"
                )
                ?.value || ""

        );


    const filtroStatus =
        normalizarTexto(

            document
                .getElementById(
                    "filtroStatusComissao"
                )
                ?.value || ""

        );


    let registros =
        obterRegistrosComissao();


    registros =
        registros.filter(
            registro => {

                const profissional =
                    normalizarTexto(
                        registro.profissionalNome
                    );


                const cliente =
                    normalizarTexto(
                        registro.clienteNome
                    );


                if (
                    pesquisa &&
                    !profissional.includes(
                        pesquisa
                    ) &&
                    !cliente.includes(
                        pesquisa
                    )
                ) {

                    return false;

                }


                const status =
                    normalizarTexto(
                        registro.comissao.status
                    );


                if (
                    filtroStatus &&
                    status !==
                    filtroStatus
                ) {

                    return false;

                }


                return true;

            }
        );


    area.innerHTML =
        "";


    if (contador) {

        contador.textContent =

            registros.length ===
            1

                ? "1 comissão"

                : `${registros.length} comissões`;

    }


    if (
        !registros.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    registros.forEach(
        registro => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "financeiro-card";


            const comissaoPaga =
                registro
                    .comissao
                    .status ===
                "paga";


            card.innerHTML = `

                <div
                    class="financeiro-card-principal"
                >

                    <strong>

                        ${escaparHTML(
                            registro.profissionalNome
                        )}

                    </strong>


                    <span>

                        ${escaparHTML(
                            registro.clienteNome
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-info"
                >

                    <span>

                        ${escaparHTML(
                            registro.servicoNome
                        )}

                    </span>


                    <span>

                        ${escaparHTML(
                            formatarData(
                                registro.dataAtendimento
                            )
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-valor"
                >

                    ${formatarValor(
                        registro
                            .comissao
                            .valor
                    )}

                </div>


                <div
                    class="financeiro-card-forma"
                >

                    ${
                        Number(
                            registro
                                .comissao
                                .percentual
                        )
                    }%

                </div>


                <div
                    class="financeiro-card-status"
                >

                    <span
                        class="status-financeiro ${
                            comissaoPaga
                                ? "pago"
                                : "pendente"
                        }"
                    >

                        ${
                            comissaoPaga
                                ? "Paga"
                                : "Pendente"
                        }

                    </span>

                </div>


                <div
                    class="financeiro-card-acoes"
                >

                    ${
                        comissaoPaga
                            ? ""

                            : `
                                <button
                                    type="button"
                                    class="btn-pagar-comissao"
                                    data-id="${escaparHTML(
                                        registro
                                            .atendimentoId
                                    )}"
                                >

                                    Pagar comissão

                                </button>
                            `
                    }

                </div>

            `;


            const botao =
                card.querySelector(
                    ".btn-pagar-comissao"
                );


            botao?.addEventListener(
                "click",
                () => {

                    pagarComissao(
                        registro.atendimentoId
                    );

                }
            );


            area.appendChild(
                card
            );

        }
    );

}

/* =========================================================
   FLUXO DE CAIXA
========================================================= */

function inicializarFluxo() {

    const dataInicio =
        document.getElementById(
            "dataInicioFluxo"
        );


    const dataFim =
        document.getElementById(
            "dataFimFluxo"
        );


    dataInicio?.addEventListener(
        "change",
        renderizarFluxoCaixa
    );


    dataFim?.addEventListener(
        "change",
        renderizarFluxoCaixa
    );

}


/* =========================================================
   VERIFICAR DATA DO PERÍODO
========================================================= */

function dentroDoPeriodo(
    data,
    inicio,
    fim
) {

    if (!data) {
        return true;
    }


    const dataNormalizada =
        String(data).slice(
            0,
            10
        );


    if (
        inicio &&
        dataNormalizada < inicio
    ) {

        return false;

    }


    if (
        fim &&
        dataNormalizada > fim
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   RENDERIZAR FLUXO DE CAIXA
========================================================= */

function renderizarFluxoCaixa() {

    const area =
        document.getElementById(
            "listaMovimentacoes"
        );


    const contador =
        document.getElementById(
            "contadorMovimentacoes"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioFluxo"
        );


    if (!area) {
        return;
    }


    const inicio =
        document
            .getElementById(
                "dataInicioFluxo"
            )
            ?.value || "";


    const fim =
        document
            .getElementById(
                "dataFimFluxo"
            )
            ?.value || "";


    const movimentacoes =
        [];


    /* =====================================================
       ENTRADAS
       SOMENTE PAGAMENTOS EFETIVAMENTE RECEBIDOS
    ====================================================== */

    obterPagamentosRealizados()
        .forEach(
            registro => {

                const data =
                    registro
                        .pagamento
                        ?.dataPagamento ||
                    registro
                        .dataAtendimento ||
                    "";


                if (
                    !dentroDoPeriodo(
                        data,
                        inicio,
                        fim
                    )
                ) {

                    return;

                }


                movimentacoes.push({

                    tipo:
                        "entrada",

                    data,

                    descricao:
                        `${registro.clienteNome} — ${registro.servicoNome}`,

                    categoria:
                        "Recebimento",

                    forma:
                        registro
                            .pagamento
                            ?.formaPagamento ||
                        "Não informado",

                    valor:
                        Number(
                            registro.valor ||
                            0
                        )

                });

            }
        );


    /* =====================================================
       SAÍDAS - DESPESAS PAGAS
    ====================================================== */

    obterDespesas()
        .filter(
            despesa =>
                despesa.status ===
                "paga"
        )
        .forEach(
            despesa => {

                const data =
                    despesa
                        .pagamento
                        ?.dataPagamento ||
                    despesa
                        .dataVencimento ||
                    "";


                if (
                    !dentroDoPeriodo(
                        data,
                        inicio,
                        fim
                    )
                ) {

                    return;

                }


                movimentacoes.push({

                    tipo:
                        "saida",

                    data,

                    descricao:
                        despesa.descricao,

                    categoria:
                        despesa.categoria,

                    forma:
                        despesa
                            .pagamento
                            ?.formaPagamento ||
                        "Não informado",

                    valor:
                        Number(
                            despesa.valor ||
                            0
                        )

                });

            }
        );


    /* =====================================================
       SAÍDAS - COMISSÕES PAGAS
    ====================================================== */

    obterComissoesPagas()
        .forEach(
            registro => {

                const data =
                    registro
                        .comissao
                        ?.dataPagamento ||
                    "";


                if (
                    !dentroDoPeriodo(
                        data,
                        inicio,
                        fim
                    )
                ) {

                    return;

                }


                movimentacoes.push({

                    tipo:
                        "saida",

                    data,

                    descricao:
                        `Comissão — ${registro.profissionalNome}`,

                    categoria:
                        "Comissão",

                    forma:
                        "Pagamento de comissão",

                    valor:
                        Number(
                            registro
                                .comissao
                                .valor ||
                            0
                        )

                });

            }
        );


    /* =====================================================
       ORDENAR
    ====================================================== */

    movimentacoes.sort(
        (
            a,
            b
        ) =>

            String(
                b.data
            ).localeCompare(
                String(
                    a.data
                )
            )

    );


    /* =====================================================
       TOTAIS
    ====================================================== */

    const entradas =
        movimentacoes
            .filter(
                item =>
                    item.tipo ===
                    "entrada"
            )
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    item.valor,
                0
            );


    const saidas =
        movimentacoes
            .filter(
                item =>
                    item.tipo ===
                    "saida"
            )
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    item.valor,
                0
            );


    const saldo =
        entradas -
        saidas;


    /* =====================================================
       ATUALIZAR RESUMO
    ====================================================== */

    atualizarElemento(
        "fluxoEntradas",
        formatarValor(
            entradas
        )
    );


    atualizarElemento(
        "fluxoSaidas",
        formatarValor(
            saidas
        )
    );


    atualizarElemento(
        "fluxoSaldo",
        formatarValor(
            saldo
        )
    );


    /* =====================================================
       LIMPAR LISTA
    ====================================================== */

    area.innerHTML =
        "";


    if (contador) {

        contador.textContent =

            movimentacoes.length ===
            1

                ? "1 movimentação"

                : `${movimentacoes.length} movimentações`;

    }


    if (
        !movimentacoes.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    /* =====================================================
       RENDERIZAR MOVIMENTAÇÕES
    ====================================================== */

    movimentacoes.forEach(
        movimento => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "financeiro-card";


            const entrada =
                movimento.tipo ===
                "entrada";


            card.innerHTML = `

                <div
                    class="financeiro-card-principal"
                >

                    <strong>

                        ${escaparHTML(
                            movimento.descricao
                        )}

                    </strong>


                    <span>

                        ${escaparHTML(
                            movimento.categoria
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-info"
                >

                    <span>

                        ${escaparHTML(
                            formatarData(
                                movimento.data
                            )
                        )}

                    </span>


                    <span>

                        ${escaparHTML(
                            movimento.forma
                        )}

                    </span>

                </div>


                <div
                    class="financeiro-card-valor ${
                        entrada
                            ? ""
                            : "despesa"
                    }"
                >

                    ${
                        entrada
                            ? "+ "
                            : "- "
                    }

                    ${formatarValor(
                        movimento.valor
                    )}

                </div>


                <div
                    class="financeiro-card-forma"
                >

                    ${
                        entrada
                            ? "Entrada"
                            : "Saída"
                    }

                </div>


                <div
                    class="financeiro-card-status"
                >

                    <span
                        class="status-financeiro ${
                            entrada
                                ? "pago"
                                : "pendente"
                        }"
                    >

                        ${
                            entrada
                                ? "Recebido"
                                : "Pago"
                        }

                    </span>

                </div>


                <div></div>

            `;


            area.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   INDICADORES
========================================================= */

function renderizarIndicadores() {

    const recebimentos =
        obterPagamentosRealizados();


    const despesas =
        obterDespesas().filter(
            despesa =>
                despesa.status ===
                "paga"
        );


    const comissoes =
        obterComissoesPagas();


    /* =====================================================
       FATURAMENTO
    ====================================================== */

    const faturamento =
        recebimentos.reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro.valor ||
                    0
                ),
            0
        );


    /* =====================================================
       DESPESAS
    ====================================================== */

    const totalDespesas =
        despesas.reduce(
            (
                total,
                despesa
            ) =>
                total +
                Number(
                    despesa.valor ||
                    0
                ),
            0
        );


    /* =====================================================
       COMISSÕES
    ====================================================== */

    const totalComissoes =
        comissoes.reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro
                        .comissao
                        .valor ||
                    0
                ),
            0
        );


    /* =====================================================
       LUCRO LÍQUIDO
    ====================================================== */

    const lucro =
        faturamento -
        totalDespesas -
        totalComissoes;


    /* =====================================================
       TICKET MÉDIO
    ====================================================== */

    const ticketMedio =
        recebimentos.length > 0

            ? faturamento /
              recebimentos.length

            : 0;


    /* =====================================================
       TOTAL DE ATENDIMENTOS
    ====================================================== */

    const totalAtendimentos =
        obterAtendimentos()
            .filter(
                atendimento =>
                    atendimentoConcluido(
                        atendimento
                    )
            )
            .length;


    /* =====================================================
       ATUALIZAR CARDS
    ====================================================== */

    atualizarElemento(
        "indicadorFaturamento",
        formatarValor(
            faturamento
        )
    );


    atualizarElemento(
        "indicadorTicketMedio",
        formatarValor(
            ticketMedio
        )
    );


    atualizarElemento(
        "indicadorLucro",
        formatarValor(
            lucro
        )
    );


    atualizarElemento(
        "indicadorAtendimentos",
        String(
            totalAtendimentos
        )
    );


    renderizarReceitaPorServico(
        recebimentos
    );


    renderizarReceitaPorProfissional(
        recebimentos
    );

}


/* =========================================================
   RECEITA POR SERVIÇO
========================================================= */

function renderizarReceitaPorServico(
    registros
) {

    const area =
        document.getElementById(
            "receitaPorServico"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioServicos"
        );


    if (!area) {
        return;
    }


    const mapa =
        {};


    registros.forEach(
        registro => {

            const nome =
                registro.servicoNome ||
                "Serviço";


            mapa[nome] =
                (
                    mapa[nome] ||
                    0
                ) +
                Number(
                    registro.valor ||
                    0
                );

        }
    );


    const itens =
        Object.entries(
            mapa
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    area.innerHTML =
        "";


    if (
        !itens.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    itens.forEach(
        (
            [
                nome,
                valor
            ]
        ) => {

            const linha =
                document.createElement(
                    "div"
                );


            linha.className =
                "item-indicador";


            linha.innerHTML = `

                <strong>

                    ${escaparHTML(
                        nome
                    )}

                </strong>


                <span>

                    ${formatarValor(
                        valor
                    )}

                </span>

            `;


            area.appendChild(
                linha
            );

        }
    );

}


/* =========================================================
   RECEITA POR PROFISSIONAL
========================================================= */

function renderizarReceitaPorProfissional(
    registros
) {

    const area =
        document.getElementById(
            "receitaPorProfissional"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazioProfissionais"
        );


    if (!area) {
        return;
    }


    const mapa =
        {};


    registros.forEach(
        registro => {

            const nome =
                registro.profissionalNome ||
                "Não informado";


            mapa[nome] =
                (
                    mapa[nome] ||
                    0
                ) +
                Number(
                    registro.valor ||
                    0
                );

        }
    );


    const itens =
        Object.entries(
            mapa
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    area.innerHTML =
        "";


    if (
        !itens.length
    ) {

        if (estadoVazio) {

            estadoVazio.style.display =
                "flex";

        }

        return;

    }


    if (estadoVazio) {

        estadoVazio.style.display =
            "none";

    }


    itens.forEach(
        (
            [
                nome,
                valor
            ]
        ) => {

            const linha =
                document.createElement(
                    "div"
                );


            linha.className =
                "item-indicador";


            linha.innerHTML = `

                <strong>

                    ${escaparHTML(
                        nome
                    )}

                </strong>


                <span>

                    ${formatarValor(
                        valor
                    )}

                </span>

            `;


            area.appendChild(
                linha
            );

        }
    );

}


/* =========================================================
   ATUALIZAÇÃO DOS CARDS SUPERIORES
========================================================= */

function atualizarResumoFinanceiro() {

    const recebimentos =
        obterPagamentosRealizados();


    const despesas =
        obterDespesas().filter(
            despesa =>
                despesa.status ===
                "paga"
        );


    const comissoes =
        obterComissoesPagas();


    const totalReceitas =
        recebimentos.reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro.valor ||
                    0
                ),
            0
        );


    const totalDespesas =
        despesas.reduce(
            (
                total,
                despesa
            ) =>
                total +
                Number(
                    despesa.valor ||
                    0
                ),
            0
        );


    const totalComissoes =
        comissoes.reduce(
            (
                total,
                registro
            ) =>
                total +
                Number(
                    registro
                        .comissao
                        .valor ||
                    0
                ),
            0
        );


    const saldo =
        totalReceitas -
        totalDespesas -
        totalComissoes;


    atualizarElemento(
        "totalReceitas",
        formatarValor(
            totalReceitas
        )
    );


    atualizarElemento(
        "totalDespesas",
        formatarValor(
            totalDespesas
        )
    );


    atualizarElemento(
        "saldoAtual",
        formatarValor(
            saldo
        )
    );


    atualizarElemento(
        "totalComissoes",
        formatarValor(
            totalComissoes
        )
    );

}


/* =========================================================
   ATUALIZAR ELEMENTO
========================================================= */

function atualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (
        elemento
    ) {

        elemento.textContent =
            valor;

    }

}


/* =========================================================
   ATUALIZAÇÃO GERAL
========================================================= */

function atualizarTela() {

    /*
     * Primeiro verifica se existem novos
     * atendimentos concluídos.
     */

    sincronizarAtendimentosConcluidos();


    /*
     * Atualiza o resumo financeiro.
     */

    atualizarResumoFinanceiro();


    /*
     * Atualiza as categorias
     * utilizadas pelas despesas.
     */

    atualizarCategoriasDespesas();


    /*
     * Renderiza a aba atual.
     */

    renderizarAbaAtual();

}
