// Estado da aplicação
let currentUser = null;
let transactions = [];

// Elementos DOM
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const currentUserSpan = document.getElementById('current-user');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    updateDisplay();
    
    // Definir data padrão como hoje no formato brasileiro
    const today = new Date();
    const dateInput = document.getElementById('date');
    dateInput.valueAsDate = today;
    dateInput.setAttribute('lang', 'pt-BR');
});

// Funções de autenticação
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('error', 'Campos obrigatórios', 'Por favor, preencha todos os campos!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        showMainScreen();
        loadUserData();
        showToast('success', 'Login realizado', 'Bem-vindo de volta!');
    } else {
        showToast('error', 'Erro no login', 'Usuário ou senha incorretos!');
    }
}

function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('error', 'Campos obrigatórios', 'Por favor, preencha todos os campos!');
        return;
    }
    
    if (username.length < 3) {
        showToast('error', 'Nome inválido', 'Nome de usuário deve ter pelo menos 3 caracteres!');
        return;
    }
    
    if (password.length < 4) {
        showToast('error', 'Senha inválida', 'Senha deve ter pelo menos 4 caracteres!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username]) {
        showToast('error', 'Usuário existente', 'Este nome de usuário já está em uso!');
        return;
    }
    
    users[username] = {
        password: password,
        transactions: []
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    showToast('success', 'Cadastro realizado', 'Usuário cadastrado com sucesso!');
    
    // Limpar campos
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function logout() {
    currentUser = null;
    transactions = [];
    localStorage.removeItem('currentUser');
    showAuthScreen();
    
    // Limpar campos
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Funções de navegação
function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
}

function showMainScreen() {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userData = users[currentUser] || {};
    
    document.getElementById('current-user').textContent = userData.displayName || currentUser;
    document.getElementById('user-avatar').textContent = userData.avatar || '👤';
}

// Carregar dados do usuário
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[currentUser]) {
            transactions = users[currentUser].transactions || [];
            showMainScreen();
            updateDisplay();
        }
    }
}

// Salvar dados do usuário
function saveUserData() {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser]) {
        users[currentUser].transactions = transactions;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Manipulação de transações
transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    
    if (!name || !amount || !type || !date) {
        showToast('error', 'Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    if (amount <= 0) {
        showToast('error', 'Valor inválido', 'O valor deve ser maior que zero!');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        name,
        description: description || 'Sem descrição',
        amount,
        type,
        date,
        timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveUserData();
    updateDisplay();
    
    // Limpar formulário
    transactionForm.reset();
    const dateInput = document.getElementById('date');
    dateInput.valueAsDate = new Date();
    dateInput.setAttribute('lang', 'pt-BR');
    
    showToast('success', 'Transação adicionada', 'Sua transação foi registrada com sucesso!');
});

// Deletar transação
function deleteTransaction(id) {
    showConfirm(
        'Excluir Transação',
        'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
        function(confirmed) {
            if (confirmed) {
                transactions = transactions.filter(t => t.id !== id);
                saveUserData();
                updateDisplay();
                
                showToast('success', 'Transação excluída', 'A transação foi removida com sucesso!');
                
                // Atualizar modal se estiver aberto
                const historyModal = document.getElementById('history-modal');
                if (!historyModal.classList.contains('hidden')) {
                    openHistoryModal();
                }
            }
        }
    );
}

// Atualizar display
function updateDisplay() {
    updateSummary();
    updateTransactionsList();
}

function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    balanceEl.textContent = formatCurrency(balance);
    
    // Alterar cor do saldo baseado no valor
    balanceEl.style.color = balance >= 0 ? '#28a745' : '#dc3545';
}

function updateTransactionsList() {
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma transação encontrada.</p>';
        return;
    }
    
    // Mostrar apenas as últimas 3 transações
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = sortedTransactions.slice(0, 3);
    
    transactionsList.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <h4>${transaction.name || transaction.description}</h4>
                <p>${formatDate(transaction.date)} • ${transaction.type === 'income' ? 'Ganho' : 'Gasto'}</p>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('') + (transactions.length > 3 ? '<p style="text-align: center; color: #667eea; padding: 10px; font-weight: 600;">Clique para ver todas as transações...</p>' : '');
}

// Funções utilitárias
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Funções dos modais
function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    const fullList = document.getElementById('full-transactions-list');
    
    if (transactions.length === 0) {
        fullList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma transação encontrada.</p>';
    } else {
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        fullList.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item-modal" onclick="openDetailsModal(${transaction.id})">
                <div class="transaction-info">
                    <h4>${transaction.name || transaction.description}</h4>
                    <p>${formatDate(transaction.date)} • ${transaction.type === 'income' ? 'Ganho' : 'Gasto'}</p>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTransaction(${transaction.id})"></button>
            </div>
        `).join('');
    }
    
    modal.classList.remove('hidden');
}

function closeHistoryModal() {
    document.getElementById('history-modal').classList.add('hidden');
}

function openDetailsModal(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const modal = document.getElementById('details-modal');
    const details = document.getElementById('transaction-details');
    
    details.innerHTML = `
        <div class="transaction-details">
            <div class="detail-row">
                <span class="detail-label">Nome:</span>
                <span class="detail-value">${transaction.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Descrição:</span>
                <span class="detail-value">${transaction.description || 'Sem descrição'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Valor:</span>
                <span class="detail-value transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${transaction.type === 'income' ? 'Ganho' : 'Gasto'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${formatDate(transaction.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Criado em:</span>
                <span class="detail-value">${new Date(transaction.timestamp).toLocaleString('pt-BR')}</span>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.add('hidden');
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    const historyModal = document.getElementById('history-modal');
    const detailsModal = document.getElementById('details-modal');
    
    if (e.target === historyModal) {
        closeHistoryModal();
    }
    if (e.target === detailsModal) {
        closeDetailsModal();
    }
});

// Funções do perfil
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    loadProfileData();
    modal.classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

function loadProfileData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userData = users[currentUser] || {};
    
    // Carregar avatar
    const currentAvatar = userData.avatar || '👤';
    document.getElementById('user-avatar').textContent = currentAvatar;
    
    // Selecionar avatar atual
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.avatar === currentAvatar) {
            option.classList.add('selected');
        }
    });
    
    // Carregar dados do perfil
    document.getElementById('display-name').value = userData.displayName || currentUser;
    document.getElementById('user-email').value = userData.email || '';
}

function saveProfileData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Verificar senha atual se tentar alterar
    if (newPassword && users[currentUser].password !== currentPassword) {
        showToast('error', 'Senha incorreta', 'A senha atual está incorreta!');
        return false;
    }
    
    // Verificar confirmação de senha
    if (newPassword && newPassword !== confirmPassword) {
        showToast('error', 'Senhas não coincidem', 'Nova senha e confirmação devem ser iguais!');
        return false;
    }
    
    // Salvar dados
    const selectedAvatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '👤';
    
    users[currentUser] = {
        ...users[currentUser],
        avatar: selectedAvatar,
        displayName: document.getElementById('display-name').value.trim() || currentUser,
        email: document.getElementById('user-email').value.trim()
    };
    
    // Alterar senha se fornecida
    if (newPassword) {
        users[currentUser].password = newPassword;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Atualizar interface
    document.getElementById('user-avatar').textContent = selectedAvatar;
    document.getElementById('current-user').textContent = users[currentUser].displayName;
    
    return true;
}

// Event listeners para o perfil
document.addEventListener('DOMContentLoaded', function() {
    // Seleção de avatar
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('avatar-option')) {
            document.querySelectorAll('.avatar-option').forEach(option => {
                option.classList.remove('selected');
            });
            e.target.classList.add('selected');
        }
    });
    
    // Formulário de perfil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (saveProfileData()) {
                showToast('success', 'Perfil atualizado', 'Suas informações foram salvas com sucesso!');
                closeProfileModal();
                // Limpar campos de senha
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            }
        });
    }
});

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    const historyModal = document.getElementById('history-modal');
    const detailsModal = document.getElementById('details-modal');
    const profileModal = document.getElementById('profile-modal');
    const confirmModal = document.getElementById('confirm-modal');
    
    if (e.target === historyModal) {
        closeHistoryModal();
    }
    if (e.target === detailsModal) {
        closeDetailsModal();
    }
    if (e.target === profileModal) {
        closeProfileModal();
    }
    if (e.target === confirmModal) {
        closeConfirmModal(false);
    }
});

// Sistema de notificações toast
function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '⚠',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this)">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remover após 4 segundos
    setTimeout(() => closeToast(toast.querySelector('.toast-close')), 4000);
}

function closeToast(button) {
    const toast = button.closest('.toast');
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

// Sistema de confirmação personalizado
let confirmCallback = null;

function showConfirm(title, message, callback) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    modal.classList.remove('hidden');
}

function closeConfirmModal(confirmed) {
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('hidden');
    
    if (confirmCallback) {
        confirmCallback(confirmed);
        confirmCallback = null;
    }
}

// Verificar se há usuário logado ao carregar a página
window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        loadUserData();
    }
});