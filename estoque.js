/* =========================================================
   EBS — ESTOQUE
   VERSÃO RECONSTRUÍDA
========================================================= */

"use strict";


/* =========================================================
   CHAVES
========================================================= */

const EBS_ESTOQUE_PRODUTOS =
    "ebs_estoque_produtos";

const EBS_ESTOQUE_MOVIMENTACOES =
    "ebs_estoque_movimentacoes";

const EBS_FORNECEDORES =
    "ebs_fornecedores";

const EBS_SERVICOS =
    "ebs_servicos";

const EBS_AGENDA =
    "agendamentos";

const EBS_FINANCEIRO =
    "ebs_financeiro";

const EBS_FUNCIONARIOS =
    "ebs_funcionarios";


/* =========================================================
   DADOS
========================================================= */

let produtos = [];
let movimentacoes = [];
let fornecedores = [];
let servicos = [];

let abaAtual = "produtos";
let tipoMovimentacaoAtual = "entrada";


/* =========================================================
   FUNÇÕES BÁSICAS
========================================================= */

function lerDados(chave) {

    try {

        const dados =
            localStorage.getItem(chave);

        if (!dados) {
            return [];
        }

        const convertido =
            JSON.parse(dados);

        return Array.isArray(convertido)
            ? convertido
            : [];

    } catch (erro) {

        console.error(
            "Erro ao ler dados:",
            chave,
            erro
        );

        return [];
    }
}


function salvarDados(chave, dados) {

    try {

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar dados:",
            chave,
            erro
        );

        alert(
            "Não foi possível salvar os dados."
        );
    }
}


function carregarDados() {

    produtos =
        lerDados(
            EBS_ESTOQUE_PRODUTOS
        );

    movimentacoes =
        lerDados(
            EBS_ESTOQUE_MOVIMENTACOES
        );

    fornecedores =
        lerDados(
            EBS_FORNECEDORES
        );

    servicos =
        lerDados(
            EBS_SERVICOS
        );
}


function numero(valor) {

    const resultado =
        Number(valor);

    return Number.isFinite(resultado)
        ? resultado
        : 0;
}


function texto(valor) {

    return String(
        valor ?? ""
    ).trim();
}


function normalizar(valor) {

    return texto(valor)
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase();
}


function moeda(valor) {

    return numero(valor)
        .toLocaleString(
            "pt-PT",
            {
                style: "currency",
                currency: "EUR"
            }
        );
}


function idNovo(prefixo) {

    return (
        prefixo +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function dataHoje() {

    const data =
        new Date();

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            data.getDate()
        ).padStart(2, "0");

    return (
        ano +
        "-" +
        mes +
        "-" +
        dia
    );
}


function escapar(valor) {

    return texto(valor)
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


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarEstoque
);


function iniciarEstoque() {

    console.log(
        "EBS Estoque — iniciando..."
    );

    carregarDados();

    configurarAbas();

    configurarBotoes();

    configurarFormularios();

    configurarFiltros();

    configurarFechamentoModais();

    atualizarTela();

    console.log(
        "EBS Estoque — pronto."
    );
}


/* =========================================================
   ABAS
========================================================= */

function configurarAbas() {

    const container =
        document.querySelector(
            ".abas-estoque"
        );

    if (!container) {

        console.error(
            "Container das abas não encontrado."
        );

        return;
    }


    const botoes =
        container.querySelectorAll(
            ".aba-estoque"
        );


    botoes.forEach(
        botao => {

            botao.addEventListener(
                "click",
                function() {

                    const aba =
                        botao.dataset.aba;

                    if (!aba) {
                        return;
                    }

                    abrirAba(
                        aba
                    );
                }
            );
        }
    );
}


function abrirAba(aba) {

    abaAtual =
        aba;


    document
        .querySelectorAll(
            ".aba-estoque"
        )
        .forEach(
            botao => {

                botao.classList.toggle(
                    "ativo",
                    botao.dataset.aba ===
                        aba
                );
            }
        );


    document
        .querySelectorAll(
            ".aba-conteudo"
        )
        .forEach(
            conteudo => {

                conteudo.classList.remove(
                    "ativa"
                );
            }
        );


    const mapa = {

        produtos:
            "abaProdutos",

        movimentacoes:
            "abaMovimentacoes",

        fornecedores:
            "abaFornecedores",

        alertas:
            "abaAlertas"
    };


    const elemento =
        document.getElementById(
            mapa[aba]
        );


    if (elemento) {

        elemento.classList.add(
            "ativa"
        );
    }


    if (aba === "produtos") {

        renderizarProdutos();

    } else if (
        aba === "movimentacoes"
    ) {

        renderizarMovimentacoes();

    } else if (
        aba === "fornecedores"
    ) {

        renderizarFornecedores();

    } else if (
        aba === "alertas"
    ) {

        renderizarAlertas();
    }
}


/* =========================================================
   BOTÕES
========================================================= */

function configurarBotoes() {

    const btnAtualizar =
        document.getElementById(
            "btnAtualizar"
        );


    const btnNovoProduto =
        document.getElementById(
            "btnNovoProduto"
        );


    const btnNovoFornecedor =
        document.getElementById(
            "btnNovoFornecedor"
        );


    const btnNovaEntrada =
        document.getElementById(
            "btnNovaEntrada"
        );


    const btnNovaSaida =
        document.getElementById(
            "btnNovaSaida"
        );


    const btnAdicionarConsumo =
        document.getElementById(
            "btnAdicionarConsumo"
        );


    if (btnAtualizar) {

        btnAtualizar.addEventListener(
            "click",
            function() {

                carregarDados();

                atualizarTela();
            }
        );
    }


    if (btnNovoProduto) {

        btnNovoProduto.addEventListener(
            "click",
            function(evento) {

                evento.preventDefault();

                abrirModalProduto();
            }
        );
    }


    if (btnNovoFornecedor) {

        btnNovoFornecedor.addEventListener(
            "click",
            function(evento) {

                evento.preventDefault();

                abrirModalFornecedor();
            }
        );
    }


    if (btnNovaEntrada) {

        btnNovaEntrada.addEventListener(
            "click",
            function(evento) {

                evento.preventDefault();

                abrirModalMovimentacao(
                    "entrada"
                );
            }
        );
    }


    if (btnNovaSaida) {

        btnNovaSaida.addEventListener(
            "click",
            function(evento) {

                evento.preventDefault();

                abrirModalMovimentacao(
                    "saida"
                );
            }
        );
    }


    if (btnAdicionarConsumo) {

        btnAdicionarConsumo.addEventListener(
            "click",
            function(evento) {

                evento.preventDefault();

                adicionarLinhaConsumo();
            }
        );
    }
}


/* =========================================================
   FORMULÁRIOS
========================================================= */

function configurarFormularios() {

    const formProduto =
        document.getElementById(
            "formProduto"
        );


    const formFornecedor =
        document.getElementById(
            "formFornecedor"
        );


    const formMovimentacao =
        document.getElementById(
            "formMovimentacao"
        );


    if (formProduto) {

        formProduto.addEventListener(
            "submit",
            salvarProduto
        );
    }


    if (formFornecedor) {

        formFornecedor.addEventListener(
            "submit",
            salvarFornecedor
        );
    }


    if (formMovimentacao) {

        formMovimentacao.addEventListener(
            "submit",
            salvarMovimentacao
        );
    }
}


/* =========================================================
   FILTROS
========================================================= */

function configurarFiltros() {

    const filtrosProduto = [

        "pesquisaProduto",

        "filtroCategoriaProduto",

        "filtroStatusProduto"
    ];


    filtrosProduto.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (!elemento) {
                return;
            }


            elemento.addEventListener(
                "input",
                renderizarProdutos
            );


            elemento.addEventListener(
                "change",
                renderizarProdutos
            );
        }
    );


    const filtrosMovimentacao = [

        "pesquisaMovimentacao",

        "filtroTipoMovimentacao",

        "filtroOrigemMovimentacao"
    ];


    filtrosMovimentacao.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (!elemento) {
                return;
            }


            elemento.addEventListener(
                "input",
                renderizarMovimentacoes
            );


            elemento.addEventListener(
                "change",
                renderizarMovimentacoes
            );
        }
    );


    const filtrosFornecedor = [

        "pesquisaFornecedor",

        "filtroStatusFornecedor"
    ];


    filtrosFornecedor.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (!elemento) {
                return;
            }


            elemento.addEventListener(
                "input",
                renderizarFornecedores
            );


            elemento.addEventListener(
                "change",
                renderizarFornecedores
            );
        }
    );


    const quantidade =
        document.getElementById(
            "movimentacaoQuantidade"
        );


    const custo =
        document.getElementById(
            "movimentacaoCusto"
        );


    const origem =
        document.getElementById(
            "movimentacaoOrigem"
        );


    if (quantidade) {

        quantidade.addEventListener(
            "input",
            atualizarTotalCompra
        );
    }


    if (custo) {

        custo.addEventListener(
            "input",
            atualizarTotalCompra
        );
    }


    if (origem) {

        origem.addEventListener(
            "change",
            function() {

                atualizarCamposCompra();

                atualizarTotalCompra();
            }
        );
    }
}


/* =========================================================
   FECHAMENTO DOS MODAIS
========================================================= */

function configurarFechamentoModais() {

    document
        .querySelectorAll(
            "[data-close]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function(evento) {

                        evento.preventDefault();

                        fecharModal(
                            botao.dataset.close
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    function(evento) {

                        if (
                            evento.target ===
                            modal
                        ) {

                            fecharModal(
                                modal.id
                            );
                        }
                    }
                );
            }
        );


    document.addEventListener(
        "keydown",
        function(evento) {

            if (
                evento.key !==
                "Escape"
            ) {
                return;
            }


            document
                .querySelectorAll(
                    ".modal.ativo"
                )
                .forEach(
                    modal => {

                        fecharModal(
                            modal.id
                        );
                    }
                );
        }
    );
}


function abrirModal(id) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        console.error(
            "Modal não encontrado:",
            id
        );

        return;
    }


    modal.classList.add(
        "ativo"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";
}


function fecharModal(id) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "ativo"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        !document.querySelector(
            ".modal.ativo"
        )
    ) {

        document.body.style.overflow =
            "";
    }
}


/* =========================================================
   PRODUTOS
========================================================= */

function abrirModalProduto(id = "") {

    const form =
        document.getElementById(
            "formProduto"
        );


    if (!form) {

        console.error(
            "formProduto não encontrado."
        );

        return;
    }


    form.reset();


    const produto =
        produtos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const campoId =
        document.getElementById(
            "produtoId"
        );


    const titulo =
        document.getElementById(
            "tituloModalProduto"
        );


    if (campoId) {

        campoId.value =
            produto?.id || "";
    }


    if (titulo) {

        titulo.textContent =
            produto
                ? "Editar produto"
                : "Novo produto";
    }


    definirValor(
        "produtoNome",
        produto?.nome || ""
    );


    definirValor(
        "produtoCategoria",
        produto?.categoria || ""
    );


    definirValor(
        "produtoUnidade",
        produto?.unidade || "un"
    );


    definirValor(
        "produtoQuantidade",
        produto
            ? numero(
                produto.quantidadeAtual
            )
            : 0
    );


    definirValor(
        "produtoMinimo",
        produto
            ? numero(
                produto.quantidadeMinima
            )
            : 0
    );


    definirValor(
        "produtoCusto",
        produto
            ? numero(
                produto.custoMedio
            )
            : 0
    );


    const ativo =
        document.getElementById(
            "produtoAtivo"
        );


    if (ativo) {

        ativo.checked =
            produto
                ? produto.ativo !== false
                : true;
    }


    preencherFornecedoresProduto(
        produto?.fornecedorIds ||
        (
            produto?.fornecedorId
                ? [
                    produto.fornecedorId
                ]
                : []
        )
    );


    renderizarConsumoServico(
        produto?.consumoServicos ||
        []
    );


    abrirModal(
        "modalProduto"
    );
}


function definirValor(id, valor) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.value =
            valor;
    }
}


/* =========================================================
   FORNECEDORES NO PRODUTO
========================================================= */

function preencherFornecedoresProduto(
    selecionados = []
) {

    const select =
        document.getElementById(
            "produtoFornecedores"
        );


    if (!select) {
        return;
    }


    const ativos =
        fornecedores.filter(
            fornecedor =>
                fornecedor.ativo !== false
        );


    select.innerHTML = "";


    if (!ativos.length) {

        const option =
            document.createElement(
                "option"
            );


        option.disabled =
            true;

        option.textContent =
            "Nenhum fornecedor cadastrado";


        select.appendChild(
            option
        );

        return;
    }


    ativos.forEach(
        fornecedor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                fornecedor.id;


            option.textContent =
                fornecedor.nome;


            option.selected =
                selecionados.includes(
                    fornecedor.id
                );


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   CONSUMO POR SERVIÇO
========================================================= */

function renderizarConsumoServico(
    linhas
) {

    const area =
        document.getElementById(
            "listaConsumoServico"
        );


    if (!area) {
        return;
    }


    area.innerHTML =
        "";


    if (
        !Array.isArray(linhas) ||
        !linhas.length
    ) {

        adicionarLinhaConsumo();

        return;
    }


    linhas.forEach(
        linha => {

            adicionarLinhaConsumo(
                linha
            );
        }
    );
}


function adicionarLinhaConsumo(
    dados = {}
) {

    const area =
        document.getElementById(
            "listaConsumoServico"
        );


    if (!area) {
        return;
    }


    const linha =
        document.createElement(
            "div"
        );


    linha.className =
        "consumo-row";


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "consumo-servico";


    const primeira =
        document.createElement(
            "option"
        );


    primeira.value =
        "";

    primeira.textContent =
        "Selecione o serviço";


    select.appendChild(
        primeira
    );


    servicos.forEach(
        servico => {

            const id =
                texto(
                    servico.id ||
                    servico.idServico
                );


            const nome =
                texto(
                    servico.nome ||
                    servico.nomeServico ||
                    servico.descricao
                );


            if (!id) {
                return;
            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                nome ||
                "Serviço";


            option.selected =
                String(
                    dados.servicoId ||
                    ""
                ) ===
                String(id);


            select.appendChild(
                option
            );
        }
    );


    const quantidade =
        document.createElement(
            "input"
        );


    quantidade.type =
        "number";


    quantidade.min =
        "0.001";


    quantidade.step =
        "0.001";


    quantidade.value =
        numero(
            dados.quantidade ||
            1
        );


    quantidade.className =
        "consumo-quantidade";


    quantidade.placeholder =
        "Quantidade";


    const remover =
        document.createElement(
            "button"
        );


    remover.type =
        "button";


    remover.textContent =
        "×";


    remover.title =
        "Remover";


    remover.addEventListener(
        "click",
        function() {

            linha.remove();
        }
    );


    linha.appendChild(
        select
    );

    linha.appendChild(
        quantidade
    );

    linha.appendChild(
        remover
    );


    area.appendChild(
        linha
    );
}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

function salvarProduto(evento) {

    evento.preventDefault();


    const nome =
        texto(
            valorCampo(
                "produtoNome"
            )
        );


    if (!nome) {

        alert(
            "Informe o nome do produto."
        );

        return;
    }


    const id =
        texto(
            valorCampo(
                "produtoId"
            )
        );


    const fornecedorSelect =
        document.getElementById(
            "produtoFornecedores"
        );


    const fornecedorIds =
        fornecedorSelect
            ? Array.from(
                fornecedorSelect.selectedOptions
            )
                .map(
                    option =>
                        option.value
                )
                .filter(Boolean)
            : [];


    const consumo =
        [];


    document
        .querySelectorAll(
            "#listaConsumoServico .consumo-row"
        )
        .forEach(
            linha => {

                const servicoId =
                    texto(
                        linha
                            .querySelector(
                                ".consumo-servico"
                            )
                            ?.value
                    );


                const quantidade =
                    numero(
                        linha
                            .querySelector(
                                ".consumo-quantidade"
                            )
                            ?.value
                    );


                if (
                    servicoId &&
                    quantidade > 0
                ) {

                    consumo.push({

                        servicoId:
                            servicoId,

                        quantidade:
                            quantidade
                    });
                }
            }
        );


    const agora =
        new Date().toISOString();


    const dados = {

        nome:

            nome,

        categoria:

            texto(
                valorCampo(
                    "produtoCategoria"
                )
            ),

        unidade:

            texto(
                valorCampo(
                    "produtoUnidade"
                )
            ) ||
            "un",

        quantidadeAtual:

            numero(
                valorCampo(
                    "produtoQuantidade"
                )
            ),

        quantidadeMinima:

            numero(
                valorCampo(
                    "produtoMinimo"
                )
            ),

        custoMedio:

            numero(
                valorCampo(
                    "produtoCusto"
                )
            ),

        fornecedorIds:

            fornecedorIds,

        fornecedorId:

            fornecedorIds[0] ||
            "",

        consumoServicos:

            consumo,

        ativo:

            document.getElementById(
                "produtoAtivo"
            )?.checked !== false,

        updatedAt:

            agora
    };


    if (id) {

        const produto =
            produtos.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!produto) {

            alert(
                "Produto não encontrado."
            );

            return;
        }


        Object.assign(
            produto,
            dados
        );

    } else {

        produtos.push({

            id:
                idNovo("prod"),

            ...dados,

            createdAt:
                agora
        });
    }


    salvarDados(
        EBS_ESTOQUE_PRODUTOS,
        produtos
    );


    fecharModal(
        "modalProduto"
    );


    atualizarTela();


    alert(
        "Produto salvo com sucesso."
    );
}


function valorCampo(id) {

    return (
        document.getElementById(
            id
        )?.value || ""
    );
}


/* =========================================================
   FORNECEDORES
========================================================= */

function abrirModalFornecedor(
    id = ""
) {

    const form =
        document.getElementById(
            "formFornecedor"
        );


    if (!form) {

        console.error(
            "formFornecedor não encontrado."
        );

        return;
    }


    form.reset();


    const fornecedor =
        fornecedores.find(
            item =>
                String(item.id) ===
                String(id)
        );


    definirValor(
        "fornecedorId",
        fornecedor?.id || ""
    );


    definirTexto(
        "tituloModalFornecedor",
        fornecedor
            ? "Editar fornecedor"
            : "Novo fornecedor"
    );


    definirValor(
        "fornecedorNome",
        fornecedor?.nome || ""
    );


    definirValor(
        "fornecedorRazao",
        fornecedor?.razaoSocial || ""
    );


    definirValor(
        "fornecedorDocumento",
        fornecedor?.documento || ""
    );


    definirValor(
        "fornecedorTelefone",
        fornecedor?.telefone || ""
    );


    definirValor(
        "fornecedorWhatsapp",
        fornecedor?.whatsapp || ""
    );


    definirValor(
        "fornecedorEmail",
        fornecedor?.email || ""
    );


    definirValor(
        "fornecedorWebsite",
        fornecedor?.website || ""
    );


    definirValor(
        "fornecedorContato",
        fornecedor?.contatoPrincipal || ""
    );


    definirValor(
        "fornecedorObservacoes",
        fornecedor?.observacoes || ""
    );


    const ativo =
        document.getElementById(
            "fornecedorAtivo"
        );


    if (ativo) {

        ativo.checked =
            fornecedor
                ? fornecedor.ativo !== false
                : true;
    }


    abrirModal(
        "modalFornecedor"
    );
}


function salvarFornecedor(evento) {

    evento.preventDefault();


    const nome =
        texto(
            valorCampo(
                "fornecedorNome"
            )
        );


    if (!nome) {

        alert(
            "Informe o nome do fornecedor."
        );

        return;
    }


    const id =
        texto(
            valorCampo(
                "fornecedorId"
            )
        );


    const dados = {

        nome:

            nome,

        razaoSocial:

            texto(
                valorCampo(
                    "fornecedorRazao"
                )
            ),

        documento:

            texto(
                valorCampo(
                    "fornecedorDocumento"
                )
            ),

        telefone:

            texto(
                valorCampo(
                    "fornecedorTelefone"
                )
            ),

        whatsapp:

            texto(
                valorCampo(
                    "fornecedorWhatsapp"
                )
            ),

        email:

            texto(
                valorCampo(
                    "fornecedorEmail"
                )
            ),

        website:

            texto(
                valorCampo(
                    "fornecedorWebsite"
                )
            ),

        contatoPrincipal:

            texto(
                valorCampo(
                    "fornecedorContato"
                )
            ),

        observacoes:

            texto(
                valorCampo(
                    "fornecedorObservacoes"
                )
            ),

        ativo:

            document.getElementById(
                "fornecedorAtivo"
            )?.checked !== false,

        updatedAt:

            new Date().toISOString()
    };


    if (id) {

        const fornecedor =
            fornecedores.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!fornecedor) {

            alert(
                "Fornecedor não encontrado."
            );

            return;
        }


        Object.assign(
            fornecedor,
            dados
        );

    } else {

        fornecedores.push({

            id:
                idNovo("forn"),

            ...dados,

            createdAt:
                new Date().toISOString()
        });
    }


    salvarDados(
        EBS_FORNECEDORES,
        fornecedores
    );


    fecharModal(
        "modalFornecedor"
    );


    atualizarTela();


    alert(
        "Fornecedor salvo com sucesso."
    );
}


/* =========================================================
   MOVIMENTAÇÃO
========================================================= */

function abrirModalMovimentacao(
    tipo = "entrada",
    produtoId = ""
) {

    tipoMovimentacaoAtual =
        tipo;


    const form =
        document.getElementById(
            "formMovimentacao"
        );


    if (!form) {

        console.error(
            "formMovimentacao não encontrado."
        );

        return;
    }


    form.reset();


    definirValor(
        "movimentacaoTipo",
        tipo
    );


    definirTexto(
        "tituloModalMovimentacao",
        tipo === "entrada"
            ? "Registrar entrada"
            : "Registrar saída"
    );


    definirValor(
        "movimentacaoData",
        dataHoje()
    );


    definirValor(
        "movimentacaoOrigem",
        tipo === "entrada"
            ? "Compra"
            : "Ajuste"
    );


    preencherProdutosMovimentacao(
        produtoId
    );


    preencherFornecedoresMovimentacao();


    atualizarCamposCompra();

    atualizarTotalCompra();


    abrirModal(
        "modalMovimentacao"
    );
}


function preencherProdutosMovimentacao(
    produtoId = ""
) {

    const select =
        document.getElementById(
            "movimentacaoProduto"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Selecione o produto
        </option>

    `;


    produtos
        .filter(
            produto =>
                produto.ativo !== false
        )
        .forEach(
            produto => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    produto.id;


                option.textContent =
                    produto.nome +
                    " · " +
                    numero(
                        produto.quantidadeAtual
                    ) +
                    " " +
                    (
                        produto.unidade ||
                        "un"
                    );


                option.selected =
                    String(
                        produtoId
                    ) ===
                    String(
                        produto.id
                    );


                select.appendChild(
                    option
                );
            }
        );
}


function preencherFornecedoresMovimentacao() {

    const select =
        document.getElementById(
            "movimentacaoFornecedor"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Selecione o fornecedor
        </option>

    `;


    fornecedores
        .filter(
            fornecedor =>
                fornecedor.ativo !== false
        )
        .forEach(
            fornecedor => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    fornecedor.id;


                option.textContent =
                    fornecedor.nome;


                select.appendChild(
                    option
                );
            }
        );
}


function atualizarCamposCompra() {

    const area =
        document.getElementById(
            "camposCompra"
        );


    if (!area) {
        return;
    }


    const origem =
        valorCampo(
            "movimentacaoOrigem"
        );


    area.style.display =
        (
            tipoMovimentacaoAtual ===
                "entrada" &&
            origem ===
                "Compra"
        )
            ? "block"
            : "none";
}


function atualizarTotalCompra() {

    const quantidade =
        numero(
            valorCampo(
                "movimentacaoQuantidade"
            )
        );


    const custo =
        numero(
            valorCampo(
                "movimentacaoCusto"
            )
        );


    const total =
        document.getElementById(
            "totalCompra"
        );


    if (total) {

        total.textContent =
            moeda(
                quantidade *
                custo
            );
    }
}


/* =========================================================
   SALVAR MOVIMENTAÇÃO
========================================================= */

function salvarMovimentacao(
    evento
) {

    evento.preventDefault();


    const tipo =
        texto(
            valorCampo(
                "movimentacaoTipo"
            )
        ) ||
        tipoMovimentacaoAtual;


    const produtoId =
        texto(
            valorCampo(
                "movimentacaoProduto"
            )
        );


    const quantidade =
        numero(
            valorCampo(
                "movimentacaoQuantidade"
            )
        );


    const data =
        texto(
            valorCampo(
                "movimentacaoData"
            )
        );


    const origem =
        texto(
            valorCampo(
                "movimentacaoOrigem"
            )
        );


    const produto =
        produtos.find(
            item =>
                String(item.id) ===
                String(produtoId)
        );


    if (!produto) {

        alert(
            "Selecione um produto."
        );

        return;
    }


    if (quantidade <= 0) {

        alert(
            "Informe uma quantidade maior que zero."
        );

        return;
    }


    if (!data) {

        alert(
            "Informe a data."
        );

        return;
    }


    const saldoAnterior =
        numero(
            produto.quantidadeAtual
        );


    let saldoPosterior;


    if (
        tipo === "entrada"
    ) {

        saldoPosterior =
            saldoAnterior +
            quantidade;

    } else {

        saldoPosterior =
            saldoAnterior -
            quantidade;
    }


    if (
        saldoPosterior < 0
    ) {

        alert(
            "O estoque não pode ficar negativo."
        );

        return;
    }


    const custo =
        numero(
            valorCampo(
                "movimentacaoCusto"
            )
        );


    const fornecedorId =
        texto(
            valorCampo(
                "movimentacaoFornecedor"
            )
        );


    const fornecedor =
        fornecedores.find(
            item =>
                String(item.id) ===
                String(fornecedorId)
        );


    /* Custo médio */

    if (
        tipo === "entrada" &&
        origem === "Compra" &&
        custo > 0
    ) {

        const valorAtual =
            saldoAnterior *
            numero(
                produto.custoMedio
            );


        const valorEntrada =
            quantidade *
            custo;


        const quantidadeTotal =
            saldoAnterior +
            quantidade;


        if (
            quantidadeTotal > 0
        ) {

            produto.custoMedio =
                (
                    valorAtual +
                    valorEntrada
                ) /
                quantidadeTotal;
        }
    }


    produto.quantidadeAtual =
        saldoPosterior;


    produto.updatedAt =
        new Date().toISOString();


    const movimento = {

        id:
            idNovo("mov"),

        produtoId:
            produto.id,

        produtoNome:
            produto.nome,

        tipo:
            tipo,

        origem:
            origem,

        quantidade:
            quantidade,

        unidade:
            produto.unidade ||
            "un",

        custoUnitario:
            custo,

        valorTotal:
            quantidade *
            custo,

        saldoAnterior:
            saldoAnterior,

        saldoPosterior:
            saldoPosterior,

        fornecedorId:
            fornecedorId,

        fornecedorNome:
            fornecedor?.nome ||
            "",

        data:
            data,

        observacao:
            texto(
                valorCampo(
                    "movimentacaoObservacao"
                )
            ),

        criadoEm:
            new Date().toISOString()
    };


    movimentacoes.unshift(
        movimento
    );


    salvarDados(
        EBS_ESTOQUE_PRODUTOS,
        produtos
    );


    salvarDados(
        EBS_ESTOQUE_MOVIMENTACOES,
        movimentacoes
    );


    fecharModal(
        "modalMovimentacao"
    );


    atualizarTela();


    alert(
        tipo === "entrada"
            ? "Entrada registrada com sucesso."
            : "Saída registrada com sucesso."
    );
}


/* =========================================================
   RENDER PRODUTOS
========================================================= */

function renderizarProdutos() {

    const area =
        document.getElementById(
            "listaProdutos"
        );


    const vazio =
        document.getElementById(
            "estadoVazioProdutos"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizar(
            valorCampo(
                "pesquisaProduto"
            )
        );


    const categoria =
        normalizar(
            valorCampo(
                "filtroCategoriaProduto"
            )
        );


    const status =
        valorCampo(
            "filtroStatusProduto"
        );


    const lista =
        produtos.filter(
            produto => {

                const ativo =
                    produto.ativo !== false;


                const textoProduto =
                    normalizar(
                        [
                            produto.nome,
                            produto.categoria
                        ].join(" ")
                    );


                const buscaOk =
                    !pesquisa ||
                    textoProduto.includes(
                        pesquisa
                    );


                const categoriaOk =
                    !categoria ||
                    normalizar(
                        produto.categoria
                    ) ===
                    categoria;


                const statusOk =
                    !status ||
                    (
                        status ===
                            "ativo" &&
                        ativo
                    ) ||
                    (
                        status ===
                            "inativo" &&
                        !ativo
                    );


                return (
                    buscaOk &&
                    categoriaOk &&
                    statusOk
                );
            }
        );


    area.innerHTML =
        "";


    if (!lista.length) {

        area.style.display =
            "none";


        if (vazio) {

            vazio.style.display =
                "flex";
        }


        return;
    }


    area.style.display =
        "block";


    if (vazio) {

        vazio.style.display =
            "none";
    }


    lista.forEach(
        produto => {

            const situacao =
                situacaoProduto(
                    produto
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item-card";


            item.innerHTML = `

                <div class="item-principal">

                    <strong>
                        ${escapar(
                            produto.nome
                        )}
                    </strong>

                    <span>
                        ${escapar(
                            produto.categoria ||
                            "Sem categoria"
                        )}

                        ·

                        ${escapar(
                            produto.unidade ||
                            "un"
                        )}
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${numero(
                            produto.quantidadeAtual
                        )}

                        ${escapar(
                            produto.unidade ||
                            "un"
                        )}
                    </strong>

                    <span>
                        Mínimo:
                        ${numero(
                            produto.quantidadeMinima
                        )}
                    </span>

                </div>


                <div class="item-info">

                    <strong class="valor">
                        ${moeda(
                            produto.custoMedio
                        )}
                    </strong>

                    <span>
                        Custo médio
                    </span>

                </div>


                <div>

                    <span
                        class="status ${situacao.classe}"
                    >
                        ${situacao.nome}
                    </span>

                </div>


                <div class="card-actions">

                    <button
                        type="button"
                        data-acao="editar-produto"
                        data-id="${escapar(
                            produto.id
                        )}"
                    >
                        Editar
                    </button>


                    <button
                        type="button"
                        data-acao="entrada-produto"
                        data-id="${escapar(
                            produto.id
                        )}"
                    >
                        Entrada
                    </button>

                </div>

            `;


            area.appendChild(
                item
            );
        }
    );


    configurarAcoesProdutos();
}


function situacaoProduto(produto) {

    if (
        produto.ativo === false
    ) {

        return {

            nome:
                "Inativo",

            classe:
                "inativo"
        };
    }


    const atual =
        numero(
            produto.quantidadeAtual
        );


    const minimo =
        numero(
            produto.quantidadeMinima
        );


    if (
        atual <= 0
    ) {

        return {

            nome:
                "Crítico",

            classe:
                "critico"
        };
    }


    if (
        minimo > 0 &&
        atual <= minimo
    ) {

        return {

            nome:
                "Baixo",

            classe:
                "baixo"
        };
    }


    return {

        nome:
            "Normal",

        classe:
            "ok"
    };
}


function configurarAcoesProdutos() {

    const area =
        document.getElementById(
            "listaProdutos"
        );


    if (!area) {
        return;
    }


    area
        .querySelectorAll(
            "button[data-acao]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function() {

                        const id =
                            botao.dataset.id;


                        if (
                            botao.dataset.acao ===
                            "editar-produto"
                        ) {

                            abrirModalProduto(
                                id
                            );
                        }


                        if (
                            botao.dataset.acao ===
                            "entrada-produto"
                        ) {

                            abrirModalMovimentacao(
                                "entrada",
                                id
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   CATEGORIAS
========================================================= */

function atualizarCategorias() {

    const select =
        document.getElementById(
            "filtroCategoriaProduto"
        );


    if (!select) {
        return;
    }


    const valorAtual =
        select.value;


    const categorias =
        [
            ...new Set(
                produtos
                    .map(
                        produto =>
                            texto(
                                produto.categoria
                            )
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt"
                )
        );


    select.innerHTML = `

        <option value="">
            Todas as categorias
        </option>

    `;


    categorias.forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria;


            option.textContent =
                categoria;


            select.appendChild(
                option
            );
        }
    );


    select.value =
        valorAtual;
}


/* =========================================================
   MOVIMENTAÇÕES
========================================================= */

function renderizarMovimentacoes() {

    const area =
        document.getElementById(
            "listaMovimentacoes"
        );


    const vazio =
        document.getElementById(
            "estadoVazioMovimentacoes"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizar(
            valorCampo(
                "pesquisaMovimentacao"
            )
        );


    const tipo =
        valorCampo(
            "filtroTipoMovimentacao"
        );


    const origem =
        valorCampo(
            "filtroOrigemMovimentacao"
        );


    const lista =
        movimentacoes.filter(
            movimento => {

                const textoMovimento =
                    normalizar(
                        [
                            movimento.produtoNome,
                            movimento.fornecedorNome,
                            movimento.observacao
                        ].join(" ")
                    );


                return (

                    (
                        !pesquisa ||
                        textoMovimento.includes(
                            pesquisa
                        )
                    )

                    &&

                    (
                        !tipo ||
                        movimento.tipo ===
                            tipo
                    )

                    &&

                    (
                        !origem ||
                        movimento.origem ===
                            origem
                    )
                );
            }
        );


    area.innerHTML =
        "";


    if (!lista.length) {

        area.style.display =
            "none";


        if (vazio) {

            vazio.style.display =
                "flex";
        }


        return;
    }


    area.style.display =
        "block";


    if (vazio) {

        vazio.style.display =
            "none";
    }


    lista.forEach(
        movimento => {

            const entrada =
                movimento.tipo ===
                    "entrada";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item-card";


            item.innerHTML = `

                <div class="item-principal">

                    <strong>
                        ${escapar(
                            movimento.produtoNome
                        )}
                    </strong>

                    <span>
                        ${escapar(
                            movimento.origem ||
                            ""
                        )}
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${escapar(
                            movimento.data ||
                            ""
                        )}
                    </strong>

                    <span>
                        Data
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${entrada ? "+" : "-"}
                        ${numero(
                            movimento.quantidade
                        )}
                        ${escapar(
                            movimento.unidade ||
                            "un"
                        )}
                    </strong>

                    <span>
                        ${
                            movimento.tipo ===
                                "entrada"
                                ? "Entrada"
                                : movimento.tipo ===
                                    "consumo"
                                    ? "Consumo"
                                    : "Saída"
                        }
                    </span>

                </div>


                <div class="item-info">

                    <strong class="valor">
                        ${moeda(
                            movimento.valorTotal
                        )}
                    </strong>

                    <span>
                        Valor
                    </span>

                </div>


                <div>

                    <span
                        class="status ${
                            entrada
                                ? "ok"
                                : "baixo"
                        }"
                    >
                        ${
                            entrada
                                ? "Entrada"
                                : "Saída"
                        }
                    </span>

                </div>

            `;


            area.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   FORNECEDORES — LISTA
========================================================= */

function renderizarFornecedores() {

    const area =
        document.getElementById(
            "listaFornecedores"
        );


    const vazio =
        document.getElementById(
            "estadoVazioFornecedores"
        );


    if (!area) {
        return;
    }


    const pesquisa =
        normalizar(
            valorCampo(
                "pesquisaFornecedor"
            )
        );


    const status =
        valorCampo(
            "filtroStatusFornecedor"
        );


    const lista =
        fornecedores.filter(
            fornecedor => {

                const ativo =
                    fornecedor.ativo !== false;


                const busca =
                    normalizar(
                        [
                            fornecedor.nome,
                            fornecedor.documento,
                            fornecedor.email,
                            fornecedor.telefone
                        ].join(" ")
                    );


                return (

                    (
                        !pesquisa ||
                        busca.includes(
                            pesquisa
                        )
                    )

                    &&

                    (
                        !status ||
                        (
                            status ===
                                "ativo" &&
                            ativo
                        ) ||
                        (
                            status ===
                                "inativo" &&
                            !ativo
                        )
                    )
                );
            }
        );


    area.innerHTML =
        "";


    if (!lista.length) {

        area.style.display =
            "none";


        if (vazio) {

            vazio.style.display =
                "flex";
        }


        return;
    }


    area.style.display =
        "block";


    if (vazio) {

        vazio.style.display =
            "none";
    }


    lista.forEach(
        fornecedor => {

            const produtosFornecedor =
                produtos.filter(
                    produto =>
                        (
                            produto.fornecedorIds ||
                            []
                        ).includes(
                            fornecedor.id
                        )
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item-card";


            item.innerHTML = `

                <div class="item-principal">

                    <strong>
                        ${escapar(
                            fornecedor.nome
                        )}
                    </strong>

                    <span>
                        ${escapar(
                            fornecedor.documento ||
                            "Documento não informado"
                        )}
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${produtosFornecedor.length}
                    </strong>

                    <span>
                        Produtos vinculados
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${escapar(
                            fornecedor.telefone ||
                            "—"
                        )}
                    </strong>

                    <span>
                        Telefone
                    </span>

                </div>


                <div class="item-info">

                    <strong>
                        ${escapar(
                            fornecedor.email ||
                            "—"
                        )}
                    </strong>

                    <span>
                        E-mail
                    </span>

                </div>


                <div class="card-actions">

                    <button
                        type="button"
                        data-acao="editar-fornecedor"
                        data-id="${escapar(
                            fornecedor.id
                        )}"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        data-acao="compra-fornecedor"
                        data-id="${escapar(
                            fornecedor.id
                        )}"
                    >
                        Registrar compra
                    </button>

                </div>

            `;


            area.appendChild(
                item
            );
        }
    );


    area
        .querySelectorAll(
            "button[data-acao]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    function() {

                        const id =
                            botao.dataset.id;


                        if (
                            botao.dataset.acao ===
                            "editar-fornecedor"
                        ) {

                            abrirModalFornecedor(
                                id
                            );
                        }


                        if (
                            botao.dataset.acao ===
                            "compra-fornecedor"
                        ) {

                            abrirModalMovimentacao(
                                "entrada"
                            );


                            setTimeout(
                                function() {

                                    definirValor(
                                        "movimentacaoFornecedor",
                                        id
                                    );

                                },
                                0
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   ALERTAS
========================================================= */

function renderizarAlertas() {

    const area =
        document.getElementById(
            "listaAlertas"
        );


    const vazio =
        document.getElementById(
            "estadoVazioAlertas"
        );


    if (!area) {
        return;
    }


    const alertas =
        produtos
            .filter(
                produto =>
                    produto.ativo !== false
            )
            .map(
                produto => ({

                    produto:
                        produto,

                    situacao:
                        situacaoProduto(
                            produto
                        )
                })
            )
            .filter(
                item =>
                    item.situacao.classe ===
                        "critico" ||
                    item.situacao.classe ===
                        "baixo"
            );


    const criticos =
        alertas.filter(
            item =>
                item.situacao.classe ===
                    "critico"
        ).length;


    const baixos =
        alertas.filter(
            item =>
                item.situacao.classe ===
                    "baixo"
        ).length;


    const contadorCriticos =
        document.getElementById(
            "contadorAlertasCriticos"
        );


    const contadorBaixos =
        document.getElementById(
            "contadorAlertasBaixos"
        );


    const contadorProximos =
        document.getElementById(
            "contadorAlertasProximos"
        );


    if (contadorCriticos) {

        contadorCriticos.textContent =
            criticos;
    }


    if (contadorBaixos) {

        contadorBaixos.textContent =
            baixos;
    }


    if (contadorProximos) {

        contadorProximos.textContent =
            "0";
    }


    area.innerHTML =
        "";


    if (!alertas.length) {

        area.style.display =
            "none";


        if (vazio) {

            vazio.style.display =
                "flex";
        }


        return;
    }


    area.style.display =
        "block";


    if (vazio) {

        vazio.style.display =
            "none";
    }


    alertas.forEach(
        alerta => {

            const produto =
                alerta.produto;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "alert-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapar(
                            produto.nome
                        )}
                    </strong>

                    <div class="item-info">

                        <span>
                            Atual:
                            ${numero(
                                produto.quantidadeAtual
                            )}

                            ${escapar(
                                produto.unidade ||
                                "un"
                            )}

                            ·

                            Mínimo:
                            ${numero(
                                produto.quantidadeMinima
                            )}
                        </span>

                    </div>

                </div>


                <div>

                    <span
                        class="status ${alerta.situacao.classe}"
                    >
                        ${alerta.situacao.nome}
                    </span>

                </div>

            `;


            area.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo() {

    const ativos =
        produtos.filter(
            produto =>
                produto.ativo !== false
        );


    const baixos =
        ativos.filter(
            produto =>
                situacaoProduto(
                    produto
                ).classe ===
                    "baixo"
        );


    const criticos =
        ativos.filter(
            produto =>
                situacaoProduto(
                    produto
                ).classe ===
                    "critico"
        );


    const valor =
        ativos.reduce(
            (
                total,
                produto
            ) => {

                return (
                    total +
                    (
                        numero(
                            produto.quantidadeAtual
                        ) *
                        numero(
                            produto.custoMedio
                        )
                    )
                );
            },
            0
        );


    definirTexto(
        "totalProdutos",
        ativos.length
    );


    definirTexto(
        "totalBaixo",
        baixos.length
    );


    definirTexto(
        "totalCritico",
        criticos.length
    );


    definirTexto(
        "valorEstoque",
        moeda(valor)
    );
}


function definirTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            texto;
    }
}


/* =========================================================
   ATUALIZAÇÃO GERAL
========================================================= */

function atualizarTela() {

    atualizarCategorias();

    atualizarResumo();

    if (
        abaAtual ===
        "produtos"
    ) {

        renderizarProdutos();

    } else if (
        abaAtual ===
        "movimentacoes"
    ) {

        renderizarMovimentacoes();

    } else if (
        abaAtual ===
        "fornecedores"
    ) {

        renderizarFornecedores();

    } else if (
        abaAtual ===
        "alertas"
    ) {

        renderizarAlertas();
    }
}


/* =========================================================
   API EBS
========================================================= */

window.EBS_Estoque = {

    atualizar:
        function() {

            carregarDados();

            atualizarTela();
        },


    obterProdutos:
        function() {

            return [
                ...produtos
            ];
        },


    obterMovimentacoes:
        function() {

            return [
                ...movimentacoes
            ];
        },


    obterFornecedores:
        function() {

            return [
                ...fornecedores
            ];
        }

};


/* =========================================================
   FIM
========================================================= */

console.log(
    "EBS Estoque — JS carregado corretamente."
);
