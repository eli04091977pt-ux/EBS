const btnNovo = document.getElementById("btnNovoAgendamento");
const modal = document.getElementById("modalAgendamento");
const btnCancelar = document.querySelector(".btn-cancelar");
const btnExcluir = document.getElementById("btnExcluirAgendamento");
const btnAnterior = document.getElementById("btnAnterior");
const btnHoje = document.getElementById("btnHoje");
const btnProximo = document.getElementById("btnProximo");

let clientes = [];
let funcionarios = [];

const CHAVE_CLIENTES = "clientes";

const campoCliente =
    document.getElementById("cliente");

const sugestoesClientes =
    document.getElementById("sugestoesClientes");

let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
let indiceEdicao = -1;
let dataAtual = new Date();

// Abrir modal
btnNovo.addEventListener("click", () => {
    indiceEdicao = -1;
    limparFormulario();
    btnExcluir.style.display = "none";
    modal.style.display = "flex";

});

// Fechar pelo botão Cancelar
btnCancelar.addEventListener("click", () => {
    modal.style.display = "none";

    document.querySelector("form").reset();
    indiceEdicao = -1;
    btnExcluir.style.display = "none";
});

// Fechar clicando fora da janela
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

document.getElementById("servico").addEventListener("change", function () {

    const servicoId = this.value;

    const servicos = JSON.parse(
        localStorage.getItem("ebs_servicos") || "[]"
    );

    const servico = servicos.find(
        item => String(item.id) === String(servicoId)
    );

    if (!servico) {
        return;
    }

    document.getElementById("duracao").value =
        servico.duracaoEstimada || "";

    document.getElementById("valor").value =
        servico.valorPadrao ?? "";
});

const btnSalvar = document.getElementById("btnSalvarAgendamento");

btnSalvar.addEventListener("click", function () {

    const cliente = document.getElementById("cliente").value;
    

    const profissional = document.getElementById("profissional").value;
    const servico = document.getElementById("servico").value;
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;
    const duracao = document.getElementById("duracao").value;
    const valor = document.getElementById("valor").value;
    const estado = document.getElementById("estado").value;
    const observacoes = document.getElementById("observacoes").value;
 
     if (verificarConflito(data, profissional, hora, duracao, indiceEdicao)) {
    alert("Já existe um agendamento neste horário para este profissional.");
    return;
}

   const novoAgendamento = {
    id: indiceEdicao >= 0
        ? agendamentos[indiceEdicao].id
        : "agendamento_" + Date.now(),

    cliente,
    profissional,
    servico,
    data,
    hora,
    duracao,
    valor,
    estado,
    observacoes
};

if (indiceEdicao >= 0) {
    agendamentos[indiceEdicao] = novoAgendamento;
    indiceEdicao = -1;
} else {
    agendamentos.push(novoAgendamento);
}

localStorage.setItem(
    "agendamentos",
    JSON.stringify(agendamentos)
);


modal.style.display = "none";
limparFormulario();
indiceEdicao = -1;

desenharAgenda();

});

function limparFormulario() {

    document.getElementById("cliente").value = "";
    document.getElementById("profissional").selectedIndex = 0;
    document.getElementById("servico").selectedIndex = 0;
    document.getElementById("data").value = "";
    document.getElementById("hora").value = "";
    document.getElementById("duracao").selectedIndex = 0;

    if (document.getElementById("valor"))
        document.getElementById("valor").value = "";

    if (document.getElementById("estado"))
        document.getElementById("estado").selectedIndex = 0;

    if (document.getElementById("observacoes"))
        document.getElementById("observacoes").value = "";

}



btnExcluir.addEventListener("click", function () {

    if (indiceEdicao < 0) {
        alert("Selecione um agendamento para excluir.");
        return;
    }

    if (!confirm("Deseja realmente excluir este agendamento?")) {
        return;
    }

    agendamentos.splice(indiceEdicao, 1);
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    indiceEdicao = -1;

    modal.style.display = "none";
    limparFormulario();
    desenharAgenda();

});

function gerarHorarios(horaInicial, duracao) {
    const horarios = [];
    const partes = horaInicial.split(":");
    let horas = Number(partes[0]);
    let minutos = Number(partes[1]);
    const quantidadeBlocos = Number(duracao) / 15;
    for (let i = 0; i < quantidadeBlocos; i++) {

        horarios.push(
            String(horas).padStart(2, "0") +
            ":" +
            String(minutos).padStart(2, "0")
        );

        minutos += 15;

        if (minutos >= 60) {
            minutos = 0;
            horas++;
        }

    }

    return horarios;

}

function verificarConflito(data, profissional, hora, duracao,indiceEdicao) {

    const novoHorario = gerarHorarios(hora, duracao);
    console.log("Novo:", novoHorario);
    console.log("indiceEdicao:", indiceEdicao);
    console.log("profissional:", profissional);
    console.log("hora:", hora);

    return agendamentos.some((item, indice) => {

    // Se estamos editando este mesmo agendamento,
    // não considerar ele próprio como conflito
    if (indiceEdicao >= 0 && indice === indiceEdicao) {
        return false;
    }

    // Ignora agendamentos de outra data
    if (item.data !== data) {
        return false;
    }

    // Ignora agendamentos de outro profissional
    if (String(item.profissional) !== String(profissional)) {
        return false;
    }

    const horariosExistentes = gerarHorarios(
        item.hora,
        item.duracao
    );

    return novoHorario.some(h =>
        horariosExistentes.includes(h)
    );
});

}


function desenharAgenda() {

    // Remove todos os agendamentos da tela
    document.querySelectorAll(".agendamento").forEach(card => {
        card.remove();
    });

    console.log(agendamentos);
    const dataTela = dataAtual.toISOString().split("T")[0];
    agendamentos
    .forEach((agendamento, indice) => {

    if (agendamento.data !== dataTela) {
        return;
    }

   const celula = document.querySelector(
    `.celula[data-profissional="${agendamento.profissional}"][data-hora="${agendamento.hora}"]`
);

    if (!celula) {
    console.log("Célula não encontrada:", agendamento.profissional, agendamento.hora);
    return;
}

const altura = (Number(agendamento.duracao) / 15) * 45;
let cor = "#9BE7B0"; // Agendado
switch (agendamento.estado) {
    case "Confirmado":
        cor = "#4CAF50";
        break;

    case "Em Atendimento":
        cor = "#FF9800";
        break;

    case "Concluído":
        cor = "#2196F3";
        break;

    case "Cancelado":
        cor = "#F44336";
        break;

    case "Não Compareceu":
        cor = "#757575";
        break;
}

const coresProfissionais = {
    "FRAN": "#9BE7B0",
    "JOYCE": "#FFF0A8",
    "TESTE": "#B8DDF8",
    "ANA": "#F6C1D9"
};

const funcionarioAgendamento = funcionarios.find(
    funcionario =>
        String(funcionario.id) === String(agendamento.profissional)
);

const nomeProfissional = (
    funcionarioAgendamento?.nomeExibicao ||
    funcionarioAgendamento?.nomeCompleto ||
    ""
).toUpperCase();

const corProfissional =
    coresProfissionais[nomeProfissional] || "#D9D9D9";


const horaInicio = agendamento.hora;
const duracao = Number(agendamento.duracao);
const [horas, minutos] = horaInicio.split(":").map(Number);
const inicioEmMinutos = horas * 60 + minutos;
const fimEmMinutos = inicioEmMinutos + duracao;
const horaFimHoras = Math.floor(fimEmMinutos / 60) % 24;
const horaFimMinutos = fimEmMinutos % 60;
const horaFim =
    `${String(horaFimHoras).padStart(2, "0")}:${String(horaFimMinutos).padStart(2, "0")}`;

const coresEstados = {
    "Agendado": "#9BE7B0",
    "Confirmado": "#4CAF50",
    "Em Atendimento": "#FF9800",
    "Concluído": "#2196F3",
    "Cancelado": "#F44336",
    "Não Compareceu": "#757575"
};
const corEstado =
    coresEstados[agendamento.estado] || "#9BE7B0";
    
    
celula.insertAdjacentHTML("beforeend", `
    <div class="agendamento"
        data-profissional="${agendamento.profissional}"
        style="
            height:${altura}px;
            border-left:6px solid ${corProfissional};
            position:absolute;
            display:flex;
            flex-direction:column;
            align-items:flex-start;
            justify-content:flex-start;
            box-sizing:border-box;
            overflow:hidden;
        ">

        <div class="cliente"
            style="
                position:static;
                display:block;
                width:100%;
                margin:0 0 5px 0;
                padding:0;
                box-sizing:border-box;
            ">
            ${agendamento.cliente}
        </div>

        <div class="servico"
            style="
                position:static;
                display:block;
                width:100%;
                margin:0 0 5px 0;
                padding:0;
                box-sizing:border-box;
            ">
            ${agendamento.servico}
        </div>

        <div class="horario"
            style="
                position:static;
                display:block;
                width:100%;
                margin:0;
                padding:0;
                box-sizing:border-box;
            ">
            ${agendamento.hora} - ${horaFim}

<div style="
    margin-top:4px;
    font-size:11px;
    font-weight:600;
    color:${corEstado};
">
    ● ${agendamento.estado}
</div>

    </div>
`);


const cartao = celula.lastElementChild;

cartao.addEventListener("click", () => {
console.log("CLIQUE NO AGENDAMENTO FUNCIONOU");

    indiceEdicao = indice;
    console.log("Indice edição:", indiceEdicao);

    document.getElementById("cliente").value = agendamento.cliente;
    document.getElementById("profissional").value = agendamento.profissional;
    document.getElementById("servico").value = agendamento.servico;
    document.getElementById("data").value = agendamento.data;
    document.getElementById("hora").value = agendamento.hora;
    document.getElementById("duracao").value = agendamento.duracao;

    console.log(agendamento.data);
    console.log(agendamento.hora);

    if (document.getElementById("valor")) {
        document.getElementById("valor").value = agendamento.valor || "";
    }

    if (document.getElementById("estado")) {
        document.getElementById("estado").value = agendamento.estado || "";
    }

    if (document.getElementById("observacoes")) {
        document.getElementById("observacoes").value = agendamento.observacoes || "";
    }
    btnExcluir.style.display = "inline-block";
    modal.style.display = "flex";
});

});
atualizarResumo();
}

function atualizarResumo() {

    const resumo = {
        Agendado: 0,
        Confirmado: 0,
        "Em Atendimento": 0,
        Concluído: 0,
        Cancelado: 0,
        "Não Compareceu": 0
    };

    agendamentos.forEach(item => {

        if (resumo[item.estado] !== undefined) {
            resumo[item.estado]++;
        }

    });

document.getElementById("totalAgendamentos").textContent = agendamentos.length;
document.getElementById("totalConfirmados").textContent = resumo["Confirmado"];
document.getElementById("totalPendentes").textContent = resumo["Agendado"];
document.getElementById("totalEmAtendimento").textContent = resumo["Em Atendimento"];
document.getElementById("totalConcluidos").textContent = resumo["Concluído"];
document.getElementById("totalCancelados").textContent = resumo["Cancelado"];
document.getElementById("totalNaoCompareceu").textContent = resumo["Não Compareceu"];

const hoje = dataAtual.toISOString().split("T")[0];
const agora = new Date();
const horaAtual = agora.getHours() * 60 + agora.getMinutes();
const proximos = agendamentos
    .filter(item => {
        if (item.data !== hoje) return false;

        const [h, m] = item.hora.split(":").map(Number);
        const horarioAgendamento = h * 60 + m;

        return horarioAgendamento > horaAtual;
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));

const painelProximo = document.getElementById("proximoAtendimento");

if (painelProximo) {

    if (proximos.length === 0) {

        painelProximo.innerHTML = `
            <p style="text-align:center;">
                Nenhum outro atendimento hoje.
            </p>
        `;

    } else {

               painelProximo.innerHTML = proximos.map(agendamento => {

            const horaInicio = agendamento.hora;

            const duracao =
                Number(agendamento.duracao);

            const [horas, minutos] =
                horaInicio
                    .split(":")
                    .map(Number);

            const inicioEmMinutos =
                horas * 60 + minutos;

            const fimEmMinutos =
                inicioEmMinutos + duracao;

            const horaFimHoras =
                Math.floor(fimEmMinutos / 60) % 24;

            const horaFimMinutos =
                fimEmMinutos % 60;

            const horaFim =
                `${String(horaFimHoras).padStart(2, "0")}:${String(horaFimMinutos).padStart(2, "0")}`;

            return `
                <div>
                    ...
                </div>
            `;

        }).join("");

    }
}

    
}


function criarGradeAgenda() {
    const grade = document.getElementById("gradeAgenda");
    grade.innerHTML = "";

const cabecalhoProfissionais =
    document.getElementById("cabecalhoProfissionais");

cabecalhoProfissionais.innerHTML = "";

const coresProfissionais = {
    "FRAN": "#9BE7B0",
    "JOYCE": "#FFF0A8",
    "TESTE": "#B8DDF8",
    "ANA": "#F6C1D9"
};

funcionarios
    .filter(funcionario =>
        (funcionario.status || "").toLowerCase() === "ativo"
    )
    .forEach(funcionario => {

        const nome =
            funcionario.nomeExibicao ||
            funcionario.nomeCompleto;

        if (!nome) {
            return;
        }

        const coluna =
            document.createElement("div");

        coluna.className = "profissional";

        coluna.dataset.profissional = String(funcionario.id);

       const corProfissional = coresProfissionais[nome.toUpperCase()] || "#D9D9D9";

coluna.innerHTML = `
    <span 
        class="cor-profissional"
        style="background-color: ${corProfissional};">
    </span>
    <strong>${nome}</strong>
`;

        cabecalhoProfissionais.appendChild(coluna);
    });




const profissionais =
    funcionarios.filter(funcionario =>
        (funcionario.status || "").toLowerCase() === "ativo"
    );

for (let hora = 8; hora < 20; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 15) {

        const horario =
            String(hora).padStart(2, "0") +
            ":" +
            String(minuto).padStart(2, "0");

        let html = `
            <div class="linha-agenda">
                <div class="hora">${horario}</div>
        `;

        profissionais.forEach(funcionario => {

            html += `
                <div class="celula"
                     data-profissional="${funcionario.id}"
                     data-hora="${horario}">
                </div>
            `;

        });

        html += "</div>";

        grade.insertAdjacentHTML("beforeend", html);
    }
}

}

function atualizarDataAtual() {

    const diasSemana = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"
    ];

    const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    const diaSemana = document.getElementById("diaSemana");

    if (diaSemana)
    diaSemana.textContent = diasSemana[dataAtual.getDay()];

    const dataCompleta = document.getElementById("dataCompleta");    
    if (dataCompleta) {
    dataCompleta.textContent =
        dataAtual.getDate() + " " +
        meses[dataAtual.getMonth()] + " " +
        dataAtual.getFullYear();
       
    }


}

btnAnterior.addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() - 1);
    atualizarDataAtual();
    desenharAgenda();
});

btnHoje.addEventListener("click", () => {
    modal.style.display = "none";
    dataAtual = new Date();
    atualizarDataAtual();
    desenharAgenda();
});

btnProximo.addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() + 1);
    atualizarDataAtual();
    desenharAgenda();
});

function carregarClientesAgenda() {

    clientes =
        JSON.parse(
            localStorage.getItem(CHAVE_CLIENTES)
        ) || [];

    funcionarios =
        JSON.parse(
        localStorage.getItem("ebs_funcionarios")
        ) || [];

}

function mostrarSugestoesClientes() {

    const texto =
        campoCliente.value
            .trim()
            .toLowerCase();

    sugestoesClientes.innerHTML = "";

    if (!texto) {
        return;
    }

    const encontrados =
        clientes.filter(cliente =>
            cliente.nome
                .toLowerCase()
                .includes(texto)
        );

    encontrados.forEach(cliente => {

        const item =
            document.createElement("div");

        item.textContent =
            cliente.nome;

        item.addEventListener(
            "click",
            () => {

                campoCliente.value =
                    cliente.nome;

                sugestoesClientes.innerHTML = "";
            }
        );

        sugestoesClientes.appendChild(item);

    });
}

campoCliente.addEventListener(
    "input",
    mostrarSugestoesClientes
);

document.addEventListener("DOMContentLoaded", () => {
    carregarClientesAgenda();
    carregarProfissionaisAgenda();
    carregarServicosAgenda();
    criarGradeAgenda();
    atualizarDataAtual();
    desenharAgenda();
});

function carregarProfissionaisAgenda() {

    const campoProfissional =
        document.getElementById("profissional");

    campoProfissional.innerHTML =
        '<option value="">Selecione o profissional</option>';

    funcionarios.forEach(funcionario => {

        const nome =
            funcionario.nomeExibicao ||
            funcionario.nomeCompleto;

        if (!nome) {
            return;
        }

        const opcao =
            document.createElement("option");

        opcao.value = funcionario.id;

        opcao.textContent = nome;

        campoProfissional.appendChild(opcao);
    });
}

function carregarServicosAgenda() {

    const campoServico = document.getElementById("servico");

    if (!campoServico) return;

    campoServico.innerHTML =
        '<option value="">Selecione o serviço</option>';

    const servicos =
        JSON.parse(
            localStorage.getItem("ebs_servicos")
        ) || [];

    servicos
        .filter(servico =>
            (servico.status || "").toLowerCase() === "ativo"
        )
        .forEach(servico => {

            const opcao =
                document.createElement("option");

            opcao.value = servico.nome;
            opcao.textContent = servico.nome;

            campoServico.appendChild(opcao);
        });
}

function atualizarDadosDoServico() {

    const campoServico = document.getElementById("servico");
    const campoDuracao = document.getElementById("duracao");
    const campoValor = document.getElementById("valor");

    if (!campoServico || !campoDuracao || !campoValor) return;

    const nomeServico = campoServico.value;

    if (!nomeServico) {
        campoDuracao.value = "";
        campoValor.value = "";
        return;
    }

    const servicos =
        JSON.parse(
            localStorage.getItem("ebs_servicos")
        ) || [];

    const servicoSelecionado = servicos.find(
        servico => servico.nome === nomeServico
    );

    if (!servicoSelecionado) return;

   // Preenche a duração
campoDuracao.value = String(servicoSelecionado.duracaoEstimada);

// Preenche o valor
campoValor.value = servicoSelecionado.valorPadrao ?? "";
}
const campoServico = document.getElementById("servico");

if (campoServico) {
    campoServico.addEventListener("change", atualizarDadosDoServico);
}
