// ============================================================
// Banco SENAC - script completo
// Inclui: rascunho (localStorage), cookies de login,
// cadastro de clientes, depósito, saque e transferência.
// ============================================================

// 1. Dados dos clientes (persistidos no localStorage)
const CHAVE_CLIENTES = 'senac_clientes';

const clientesIniciais = [
    { cpf: "111.222.333-44", senha: "123", nome: "Dennis Lopes", saldo: 5000 },
    { cpf: "222.333.444-55", senha: "123", nome: "Nicolas Silva", saldo: 1500 },
    { cpf: "333.444.555-66", senha: "123", nome: "Ana Maria", saldo: 3000 },
    { cpf: "444.555.666-77", senha: "123", nome: "Bruno Costa", saldo: 500 },
    { cpf: "555.666.777-88", senha: "123", nome: "Carla Souza", saldo: 10000 }
];

function carregarClientes() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_CLIENTES));
        if (Array.isArray(salvo) && salvo.length > 0) return salvo;
    } catch (erro) {
        // JSON inválido ou localStorage indisponível: usa a lista inicial
    }
    return clientesIniciais.map(c => ({ ...c }));
}

function salvarClientes() {
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

const clientes = carregarClientes();
let usuarioLogado = null;

// 2. Seleção de Elementos (DOM)
const secaoLogin = document.querySelector('#login-section');
const secaoCadastro = document.querySelector('#cadastro-section');
const secaoSucesso = document.querySelector('#sucesso-section');
const secaoPainel = document.querySelector('#painel-section');

const campoSaldo = document.querySelector('#saldo-valor');
const boasVindas = document.querySelector('#boas-vindas');
const loginErro = document.querySelector('#login-erro');
const campoValor = document.querySelector('#valor-op');
const campoDestino = document.querySelector('#conta-destino');

// 3. Funções auxiliares

// Cookies (salvar, ler, apagar)
function salvarCookie(nome, valor, dias) {
    const d = new Date();
    d.setTime(d.getTime() + (dias * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = nome + "=" + encodeURIComponent(valor) + ";" + expires + ";path=/";
}

function lerCookie(nome) {
    let nameEQ = nome + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function apagarCookie(nome) {
    document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// Formatação de moeda no padrão brasileiro (R$ 5.000,00)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarSaldoNaTela() {
    campoSaldo.textContent = formatarMoeda(usuarioLogado.saldo);
}

// Evita injeção de HTML ao exibir valores vindos de cookies
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// Lê o valor digitado e valida (número maior que zero)
function lerValorOperacao() {
    const valor = parseFloat(campoValor.value);
    if (!(valor > 0)) {
        alert('Informe um valor válido, maior que zero.');
        return null;
    }
    return Math.round(valor * 100) / 100;
}

// 4. Alternância entre Telas (Login <-> Cadastro)
document.querySelector('#link-ir-cadastro').addEventListener('click', (e) => {
    e.preventDefault();
    secaoLogin.style.display = 'none';
    secaoCadastro.style.display = 'block';
});

document.querySelector('#link-voltar-login').addEventListener('click', (e) => {
    e.preventDefault();
    secaoCadastro.style.display = 'none';
    secaoLogin.style.display = 'block';
});

// 5. Login com gravação de cookies
document.querySelector('#btn-login').addEventListener('click', () => {
    const cpfDigitado = document.querySelector('#input-cpf').value.trim();
    const senhaDigitada = document.querySelector('#input-senha').value.trim();

    const clienteEncontrado = clientes.find(c => c.cpf === cpfDigitado && c.senha === senhaDigitada);

    if (clienteEncontrado) {
        usuarioLogado = clienteEncontrado;
        loginErro.style.display = 'none';

        // Gravando cookies para identificação do dispositivo
        const primeiroNome = clienteEncontrado.nome.split(' ')[0];
        const agora = new Date().toLocaleString('pt-BR');

        salvarCookie('senac_cpf', clienteEncontrado.cpf, 30);
        salvarCookie('senac_nome', primeiroNome, 30);
        salvarCookie('senac_ultimo_acesso', agora, 30);

        secaoLogin.style.display = 'none';
        secaoPainel.style.display = 'block';

        atualizarSaldoNaTela();
        boasVindas.textContent = `Olá, ${usuarioLogado.nome}`;
    } else {
        loginErro.style.display = 'block';
    }
});

// 6. Rascunho do cadastro (localStorage)
const formCadastro = document.querySelector('#form-cadastro');

// 6.1 Salva em tempo real (senhas não entram no rascunho)
formCadastro.addEventListener('input', () => {
    const dadosRascunho = {
        dados: {
            nome: document.querySelector('#cad-nome').value,
            cpf: document.querySelector('#cad-cpf').value,
            email: document.querySelector('#cad-email').value,
            celular: document.querySelector('#cad-celular').value,
            cep: document.querySelector('#cad-cep').value,
            endereco: document.querySelector('#cad-endereco').value,
            cidade: document.querySelector('#cad-cidade').value,
            estado: document.querySelector('#cad-estado').value
        },
        timestamp: new Date().getTime()
    };
    localStorage.setItem('senac_rascunho_cadastro', JSON.stringify(dadosRascunho));
});

// 6.2 Restaura o rascunho ao carregar a página
function restaurarRascunho() {
    const rascunhoSalvo = localStorage.getItem('senac_rascunho_cadastro');
    if (!rascunhoSalvo) return;

    try {
        const d = JSON.parse(rascunhoSalvo).dados;

        document.querySelector('#cad-nome').value = d.nome || '';
        document.querySelector('#cad-cpf').value = d.cpf || '';
        document.querySelector('#cad-email').value = d.email || '';
        document.querySelector('#cad-celular').value = d.celular || '';
        document.querySelector('#cad-cep').value = d.cep || '';
        document.querySelector('#cad-endereco').value = d.endereco || '';
        document.querySelector('#cad-cidade').value = d.cidade || '';
        document.querySelector('#cad-estado').value = d.estado || '';

        console.log("Rascunho de cadastro recuperado com sucesso!");
    } catch (erro) {
        localStorage.removeItem('senac_rascunho_cadastro');
    }
}

// 6.3 Descarte manual do rascunho
const btnLimparRascunho = document.querySelector('#link-limpar-rascunho');
if (btnLimparRascunho) {
    btnLimparRascunho.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Deseja realmente descartar o rascunho do cadastro?')) {
            localStorage.removeItem('senac_rascunho_cadastro');
            formCadastro.reset();
        }
    });
}

// 7. Envio do cadastro: validação com RegEx + criação do cliente
const regexNome = /^[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ'.-]+)+$/;      // nome e sobrenome
const regexCPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexCelular = /^\(\d{2}\) \d{5}-\d{4}$/;
const regexCEP = /^\d{5}-\d{3}$/;
const regexUF = /^[A-Z]{2}$/;
const regexSenha = /^.{8,}$/;

formCadastro.addEventListener('submit', (e) => {
    // Evita o recarregamento da página
    e.preventDefault();

    const nome = document.querySelector('#cad-nome').value.trim();
    const cpf = document.querySelector('#cad-cpf').value.trim();
    const email = document.querySelector('#cad-email').value.trim();
    const celular = document.querySelector('#cad-celular').value.trim();
    const cep = document.querySelector('#cad-cep').value.trim();
    const endereco = document.querySelector('#cad-endereco').value.trim();
    const cidade = document.querySelector('#cad-cidade').value.trim();
    const estado = document.querySelector('#cad-estado').value.trim().toUpperCase();
    const senha = document.querySelector('#cad-senha').value;
    const confirmaSenha = document.querySelector('#cad-confirma-senha').value;

    // Validações (mostra o primeiro erro encontrado)
    const erros = [
        [!regexNome.test(nome), 'Informe o nome completo (nome e sobrenome).'],
        [!regexCPF.test(cpf), 'CPF inválido. Use o formato 000.000.000-00.'],
        [!regexEmail.test(email), 'E-mail inválido.'],
        [!regexCelular.test(celular), 'Celular inválido. Use o formato (00) 00000-0000.'],
        [!regexCEP.test(cep), 'CEP inválido. Use o formato 00000-000.'],
        [endereco === '', 'Informe o endereço.'],
        [cidade === '', 'Informe a cidade.'],
        [!regexUF.test(estado), 'Estado inválido. Use a sigla com 2 letras (ex: SP).'],
        [!regexSenha.test(senha), 'A senha deve ter no mínimo 8 caracteres.'],
        [senha !== confirmaSenha, 'As senhas não coincidem.'],
        [clientes.some(c => c.cpf === cpf), 'Este CPF já está cadastrado.']
    ];

    const erroEncontrado = erros.find(([falhou]) => falhou);
    if (erroEncontrado) {
        alert(erroEncontrado[1]);
        return;
    }

    // Cria o novo cliente e persiste a lista
    clientes.push({ cpf, senha, nome, email, celular, cep, endereco, cidade, estado, saldo: 0 });
    salvarClientes();

    // Limpa o rascunho e o formulário
    localStorage.removeItem('senac_rascunho_cadastro');
    formCadastro.reset();

    secaoCadastro.style.display = 'none';
    secaoSucesso.style.display = 'block';
});

// 8. Voltar ao início a partir da tela de sucesso
document.querySelector('#btn-voltar-inicio').addEventListener('click', () => {
    location.reload();
});

// 9. Operações bancárias
document.querySelector('#btn-depositar').addEventListener('click', () => {
    const valor = lerValorOperacao();
    if (valor === null) return;

    usuarioLogado.saldo += valor;
    salvarClientes();
    atualizarSaldoNaTela();
    campoValor.value = '';
    alert(`Depósito de ${formatarMoeda(valor)} realizado com sucesso!`);
});

document.querySelector('#btn-sacar').addEventListener('click', () => {
    const valor = lerValorOperacao();
    if (valor === null) return;

    if (valor > usuarioLogado.saldo) {
        alert('Saldo insuficiente.');
        return;
    }

    usuarioLogado.saldo -= valor;
    salvarClientes();
    atualizarSaldoNaTela();
    campoValor.value = '';
    alert(`Saque de ${formatarMoeda(valor)} realizado com sucesso!`);
});

document.querySelector('#btn-transferir').addEventListener('click', () => {
    const valor = lerValorOperacao();
    if (valor === null) return;

    const cpfDestino = campoDestino.value.trim();
    const destino = clientes.find(c => c.cpf === cpfDestino);

    if (!destino) {
        alert('Favorecido não encontrado. Confira o CPF.');
        return;
    }
    if (destino === usuarioLogado) {
        alert('Não é possível transferir para a própria conta.');
        return;
    }
    if (valor > usuarioLogado.saldo) {
        alert('Saldo insuficiente.');
        return;
    }

    usuarioLogado.saldo -= valor;
    destino.saldo += valor;
    salvarClientes();
    atualizarSaldoNaTela();
    campoValor.value = '';
    campoDestino.value = '';
    alert(`Transferência de ${formatarMoeda(valor)} para ${destino.nome} realizada com sucesso!`);
});

document.querySelector('#btn-sair').addEventListener('click', () => {
    location.reload();
});

// 10. Reconhecimento do cliente pelos cookies
function verificarReconhecimento() {
    const cpfSalvo = lerCookie('senac_cpf');
    const nomeSalvo = lerCookie('senac_nome');
    const ultimoAcesso = lerCookie('senac_ultimo_acesso');
    const subtitulo = document.querySelector('#login-section .subtitle');

    if (cpfSalvo && nomeSalvo) {
        document.querySelector('#input-cpf').value = cpfSalvo;

        subtitulo.innerHTML = `Que bom ter você de volta, <strong>${escaparHTML(nomeSalvo)}</strong>!<br>
            <small style="color: #6c757d;">Último acesso: ${escaparHTML(ultimoAcesso || '-')}</small><br>
            <a href="#" id="link-trocar-usuario" style="font-size: 0.75rem; color: #0056b3; font-weight: bold;">
                Não é você? Trocar de conta
            </a>`;

        document.querySelector('#input-senha').focus();

        document.querySelector('#link-trocar-usuario').addEventListener('click', (e) => {
            e.preventDefault();
            apagarCookie('senac_cpf');
            apagarCookie('senac_nome');
            apagarCookie('senac_ultimo_acesso');

            document.querySelector('#input-cpf').value = '';
            document.querySelector('#input-senha').value = '';
            subtitulo.textContent = 'Portal do Cliente';
            document.querySelector('#input-cpf').focus();
        });
    }
}

// 11. Inicialização
window.addEventListener('DOMContentLoaded', () => {
    restaurarRascunho();
    verificarReconhecimento();
});