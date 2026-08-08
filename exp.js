const description = document.getElementById('descInput');
const amount = document.getElementById('amountInput');
const catogiry = document.getElementById('categoryInput');
const addbtn = document.getElementById('addBtn');

// 1. Load existing state & users from LocalStorage
let transactionState = JSON.parse(localStorage.getItem("CoinFlowData")) || [];
let registeredUsers = JSON.parse(localStorage.getItem("CoinFlowUsers")) || [];
let currentUser = localStorage.getItem("CoinFlowCurrentSession") || null;

// 2. Persistent storage helpers
function SaveTransaction() {
    localStorage.setItem("CoinFlowData", JSON.stringify(transactionState));
}

function SaveUsers() {
    localStorage.setItem("CoinFlowUsers", JSON.stringify(registeredUsers));
}

// 3. Security Guard: Enforce Landing on Welcome & Redirecting on Protected Tabs
function checkAuthGuard(targetPageId) {
    const protectedPages = ['page-budget', 'page-expenses', 'page-performance'];
    const statusEl = document.getElementById('systemStatus');
    
    if (protectedPages.includes(targetPageId) && !currentUser) {
        if (statusEl) statusEl.innerText = "Access Denied: Please sign in or create an account to view your budget.";
        return 'page-signin';
    }
    return targetPageId;
}

// 4. Add Transaction Event Listener with Validation & Automatic Date Stamping
if (addbtn) {
    addbtn.addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('systemStatus').innerText = "Error: You must be signed in to add records.";
            switchPage('page-signin', document.querySelector('.nav-button[onclick*="page-signin"]'));
            return;
        }

        const desvalue = description.value.trim();
        const amtvalue = parseFloat(amount.value);
        const categoryvalue = catogiry.value;

        if (desvalue === "") {
            document.getElementById('systemStatus').innerText = "Error: Description cannot be empty.";
            return;
        }

        if (isNaN(amtvalue) || amtvalue <= 0) {
            document.getElementById('systemStatus').innerText = "Error: Please enter a valid positive dollar amount.";
            return;
        }

        const currentDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const newTransaction = {
            id: Date.now(), 
            user: currentUser,
            description: desvalue,
            amount: amtvalue,
            category: categoryvalue,
            date: currentDate,
            monthYear: new Date().toISOString().slice(0, 7)
        };

        transactionState.push(newTransaction);
        SaveTransaction();
        renderApp();

        description.value = '';
        amount.value = '';
        
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) statusEl.innerText = `Added transaction: ${desvalue}`;
    });
}

// 5. Delete Transaction Function
function deleteTransaction(id) {
    transactionState = transactionState.filter(tx => tx.id !== id);
    SaveTransaction();
    renderApp();
    const statusEl = document.getElementById('systemStatus');
    if (statusEl) statusEl.innerText = "Transaction removed.";
}

// 6. D3 Donut Chart Visualization Engine
function renderD3Chart(income, expense) {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    container.innerHTML = ''; 

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '20px';
    container.style.width = '100%';
    container.style.height = '100%';

    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2 - 5;

    const svgWrapper = d3.select(container)
        .append('div')
        .style('width', `${width}px`)
        .style('height', `${height}px`)
        .style('flex-shrink', '0');

    const svg = svgWrapper.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const total = income + expense;
    const data = [
        { label: 'Income', value: income, color: '#2D6A4F' },
        { label: 'Expense', value: expense, color: '#C94A4A' }
    ];

    if (income === 0 && expense === 0) {
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .attr('fill', '#5C6A60')
            .style('font-size', '12px')
            .text('No Data Available');
        return;
    }

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);

    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .style('stroke', '#FFFFFF')
        .style('stroke-width', '2px');

    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('fill', '#FFFFFF')
        .style('font-size', '10px')
        .style('font-family', 'var(--font-mono)')
        .style('font-weight', '700')
        .text(d => {
            const percent = total > 0 ? (d.data.value / total) * 100 : 0;
            return percent > 5 ? `${percent.toFixed(0)}%` : '';
        });

    const legend = d3.select(container)
        .append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '8px')
        .style('font-family', 'var(--font-sans)')
        .style('font-size', '11px');

    data.forEach(d => {
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
        legend.append('div')
            .html(`
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--dark-green);">
                    <span style="color: ${d.color}; font-size: 13px;">■</span> ${d.label}
                </div>
                <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: 10px; margin-left: 16px;">
                    $${d.value.toFixed(2)} (${pct}%)
                </div>
            `);
    });
}

// 7. Dedicated Expenses Page Painter (User-specific)
function renderExpensesPage() {
    const expenseListContainer = document.getElementById('fullExpenseList');
    const expenseBadge = document.getElementById('expenseBadge');
    if (!expenseListContainer) return;

    expenseListContainer.innerHTML = '';
    const userTransactions = transactionState.filter(tx => tx.user === currentUser);
    const expensesOnly = userTransactions.filter(tx => tx.category === 'expense');

    if (expenseBadge) {
        expenseBadge.innerText = `${expensesOnly.length} Records`;
    }

    if (expensesOnly.length === 0) {
        expenseListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No outgoing expenses recorded.</div>';
        return;
    }

    expensesOnly.slice().reverse().forEach(tx => {
        const div = document.createElement('div');
        const displayDate = tx.date || 'Recent';
        
        div.className = 'trans-row';
        div.innerHTML = `
            <div class="trans-title">
                <h5>${tx.description}</h5>
                <span style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: rgba(201, 74, 74, 0.1); color: var(--accent-red); padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;">OUTFLOW</span>
                    <span style="color: var(--text-muted); font-size: 10px;">• ${displayDate}</span>
                </span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="trans-val" style="color: var(--accent-red);">
                    -$${Number(tx.amount).toFixed(2)}
                </div>
                <button class="btn-del" onclick="deleteTransaction(${tx.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        expenseListContainer.appendChild(div);
    });
}

// 8. Performance Metrics Page
function renderPerformancePage(income, expense) {
    const savingsChart = document.getElementById('savingsChart');
    const trendChart = document.getElementById('trendChart');
    if (!savingsChart || !trendChart) return;

    savingsChart.innerHTML = '';
    trendChart.innerHTML = '';

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

    savingsChart.style.display = 'flex';
    savingsChart.style.flexDirection = 'column';
    savingsChart.style.alignItems = 'center';
    savingsChart.style.justifyContent = 'center';
    savingsChart.style.gap = '10px';

    savingsChart.innerHTML = `
        <div style="font-size: 36px; font-weight: 800; font-family: var(--font-mono); color: var(--sage-green);">
            ${savingsRate.toFixed(1)}%
        </div>
        <div style="font-size: 13px; color: var(--text-muted); text-align: center; max-width: 220px; line-height: 1.4;">
            ${savingsRate >= 20 ? '🌟 Excellent savings health! You are retaining over 20% of income.' : '⚠️ Savings rate is below 20%. Try cutting back on expenses.'}
        </div>
    `;

    trendChart.style.display = 'flex';
    trendChart.style.flexDirection = 'column';
    trendChart.style.alignItems = 'center';
    trendChart.style.justifyContent = 'center';
    trendChart.style.gap = '8px';

    const userCount = transactionState.filter(tx => tx.user === currentUser).length;
    trendChart.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; color: var(--dark-green);">
            Your Total Transactions: ${userCount}
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">
            Inflow vs Outflow: $${income.toFixed(2)} / $${expense.toFixed(2)}
        </div>
    `;
}

// 9. Authentication Engine & Sign Out Handler
const authBox = document.querySelector('.auth-box');
if (authBox) {
    authBox.innerHTML = `
        <h2 id="authTitle" style="font-size: 22px; color: var(--dark-green); margin-bottom: 8px;">Welcome Back</h2>
        <p id="authSubtitle" style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">Sign in to access your secure ledger.</p>
        
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Email Address</label>
            <input type="email" id="authEmail" class="input-control" placeholder="name@company.com">
            
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Secure PIN / Password</label>
            <input type="password" id="authPin" class="input-control" placeholder="••••••••">
            
            <button class="btn-submit" id="authActionBtn" style="margin-top: 10px;">Sign In</button>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                <button id="authToggleMode" style="background: none; border: none; color: var(--sage-green); font-size: 12px; font-weight: 700; cursor: pointer;">
                    Don't have an account? Sign Up
                </button>
                <button id="signOutBtn" style="background: none; border: none; color: var(--accent-red); font-size: 12px; font-weight: 700; cursor: pointer; display: none;">
                    Sign Out
                </button>
            </div>
        </div>
    `;

    let isSignUpMode = false;
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authActionBtn = document.getElementById('authActionBtn');
    const authToggleMode = document.getElementById('authToggleMode');
    const signOutBtn = document.getElementById('signOutBtn');
    const authEmail = document.getElementById('authEmail');
    const authPin = document.getElementById('authPin');

    // Update visibility of Sign Out button based on session state
    if (currentUser) {
        signOutBtn.style.display = 'inline-block';
        authTitle.innerText = "Account Active";
        authSubtitle.innerText = `Logged in as ${currentUser}`;
    }

    signOutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem("CoinFlowCurrentSession");
        localStorage.removeItem("coinFlowActivePage");
        signOutBtn.style.display = 'none';
        authEmail.value = '';
        authPin.value = '';
        document.getElementById('systemStatus').innerText = "Successfully signed out.";
        switchPage('page-welcome', document.querySelector('.nav-button'));
    });

    authToggleMode.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        if (isSignUpMode) {
            authTitle.innerText = "Create Account";
            authSubtitle.innerText = "Register a new CoinFlow ledger profile.";
            authActionBtn.innerText = "Sign Up";
            authToggleMode.innerText = "Already have an account? Sign In";
        } else {
            authTitle.innerText = "Welcome Back";
            authSubtitle.innerText = "Sign in to access your secure ledger.";
            authActionBtn.innerText = "Sign In";
            authToggleMode.innerText = "Don't have an account? Sign Up";
        }
    });

    authActionBtn.addEventListener('click', () => {
        const email = authEmail.value.trim().toLowerCase();
        const pin = authPin.value.trim();
        const statusEl = document.getElementById('systemStatus');

        if (!email || !pin) {
            if (statusEl) statusEl.innerText = "Error: Please enter both email and PIN.";
            return;
        }

        if (isSignUpMode) {
            const existing = registeredUsers.find(u => u.email === email);
            if (existing) {
                if (statusEl) statusEl.innerText = "Error: Account already exists with this email. Please sign in.";
                return;
            }
            registeredUsers.push({ email, pin });
            SaveUsers();
            currentUser = email;
            localStorage.setItem("CoinFlowCurrentSession", currentUser);
            signOutBtn.style.display = 'inline-block';
            if (statusEl) statusEl.innerText = `Account created & logged in as ${email}!`;
            
            const budgetBtn = document.querySelector('.nav-button[onclick*="page-budget"]');
            switchPage('page-budget', budgetBtn);
            renderApp();
        } else {
            const userMatch = registeredUsers.find(u => u.email === email && u.pin === pin);
            if (!userMatch) {
                if (statusEl) statusEl.innerText = "Error: Invalid email or PIN. Please sign up if you don't have an account.";
                return;
            }
            currentUser = email;
            localStorage.setItem("CoinFlowCurrentSession", currentUser);
            signOutBtn.style.display = 'inline-block';
            if (statusEl) statusEl.innerText = `Successfully signed in as ${email}!`;
            
            const budgetBtn = document.querySelector('.nav-button[onclick*="page-budget"]');
            switchPage('page-budget', budgetBtn);
            renderApp();
        }
    });
}

// 10. Main App Painter & Calculation Engine
function renderApp() {
    if (!currentUser) return;
    
    const list = document.getElementById('transList');
    if (!list) return;
    
    list.innerHTML = ''; 

    const userTransactions = transactionState.filter(tx => tx.user === currentUser);

    userTransactions.slice().reverse().forEach(tx => {
        const div = document.createElement('div');
        const isIncome = tx.category === 'income';
        const displayDate = tx.date || 'Recent';
        
        div.className = 'trans-row';
        div.innerHTML = `
            <div class="trans-title">
                <h5>${tx.description}</h5>
                <span style="display: flex; gap: 8px; align-items: center;">
                    <span>${tx.category.toUpperCase()}</span>
                    <span style="color: var(--text-muted); font-size: 10px;">• ${displayDate}</span>
                </span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="trans-val ${isIncome ? 'income' : ''}">
                    ${isIncome ? '+' : '-'}$${Number(tx.amount).toFixed(2)}
                </div>
                <button class="btn-del" onclick="deleteTransaction(${tx.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        list.appendChild(div);
    });

    const totalIncome = userTransactions
        .filter(tx => tx.category === 'income')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalExpense = userTransactions
        .filter(tx => tx.category === 'expense')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const netBalance = totalIncome - totalExpense;

    const statIncomeEl = document.getElementById('statIncome');
    const statExpenseEl = document.getElementById('statExpense');
    const statBalanceEl = document.getElementById('statBalance');

    if (statIncomeEl) statIncomeEl.innerText = `$${totalIncome.toFixed(2)}`;
    if (statExpenseEl) statExpenseEl.innerText = `$${totalExpense.toFixed(2)}`;
    
    if (statBalanceEl) {
        statBalanceEl.innerText = `$${netBalance.toFixed(2)}`;
        statBalanceEl.className = netBalance >= 0 ? '' : 'expense';
    }

    renderD3Chart(totalIncome, totalExpense);
    renderExpensesPage();
    renderPerformancePage(totalIncome, totalExpense);
}

// 11. Navigation & Page Memory Handler with Strict Guard
function switchPage(pageId, clickedBtn) {
    pageId = checkAuthGuard(pageId);
    if (pageId === 'page-signin') {
        clickedBtn = document.querySelector('.nav-button[onclick*="page-signin"]');
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    
    if (clickedBtn) clickedBtn.classList.add('active');

    localStorage.setItem("coinFlowActivePage", pageId);
}

// 12. Startup Boot Sequence
const savedPage = localStorage.getItem("coinFlowActivePage");
if (currentUser && savedPage && savedPage !== 'page-signin') {
    const targetButton = document.querySelector(`.nav-button[onclick*="${savedPage}"]`);
    if (targetButton) {
        switchPage(savedPage, targetButton);
    }
} else {
    localStorage.removeItem("coinFlowActivePage");
    switchPage('page-welcome', document.querySelector('.nav-button'));
}

if (currentUser) {
    renderApp();
}