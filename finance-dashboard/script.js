const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const storageKey = "fluxo-claro-transactions";
const idFactory = () =>
  window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const demoTransactions = [
  { id: idFactory(), title: "Salario", category: "Receita fixa", amount: 10400, type: "income", date: "2026-04-03" },
  { id: idFactory(), title: "Freelance UI", category: "Projeto externo", amount: 4100, type: "income", date: "2026-04-12" },
  { id: idFactory(), title: "Aluguel", category: "Moradia", amount: 2450, type: "expense", date: "2026-04-05" },
  { id: idFactory(), title: "Mercado", category: "Alimentacao", amount: 680, type: "expense", date: "2026-04-15" },
  { id: idFactory(), title: "Academia", category: "Saude", amount: 160, type: "expense", date: "2026-04-18" },
  { id: idFactory(), title: "Combustivel", category: "Transporte", amount: 390, type: "expense", date: "2026-04-21" },
  { id: idFactory(), title: "Cinema", category: "Lazer", amount: 120, type: "expense", date: "2026-04-24" },
];

const budgets = [
  { name: "Alimentacao", limit: 2200 },
  { name: "Transporte", limit: 1200 },
  { name: "Lazer", limit: 900 },
  { name: "Moradia", limit: 3200 },
];

const categoryColors = ["#1f8a70", "#d9822b", "#4267b2", "#c2415d", "#6f5bbd", "#2a8fbd"];

let transactions = loadTransactions();

function loadTransactions() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : demoTransactions;
}

function saveTransactions() {
  localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function getSignedAmount(transaction) {
  return transaction.type === "income" ? transaction.amount : -transaction.amount;
}

function getTotals() {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    savingRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
  };
}

function updateSummary() {
  const totals = getTotals();
  const incomeCount = transactions.filter((transaction) => transaction.type === "income").length;
  const expenseCount = transactions.filter((transaction) => transaction.type === "expense").length;

  document.querySelector("#currentBalance").textContent = money.format(totals.balance);
  document.querySelector("#incomeTotal").textContent = money.format(totals.income);
  document.querySelector("#expenseTotal").textContent = money.format(totals.expenses);
  document.querySelector("#savingRate").textContent = `${totals.savingRate}%`;
  document.querySelector("#incomeHint").textContent = `${incomeCount} entradas registradas`;
  document.querySelector("#expenseHint").textContent = `${expenseCount} saidas registradas`;
  document.querySelector("#balanceHint").textContent =
    totals.balance >= 0 ? "Saldo positivo no periodo" : "Atencao ao saldo do periodo";
}

function getWeeklyData() {
  const weeks = [
    { label: "Sem 1", income: 0, expense: 0 },
    { label: "Sem 2", income: 0, expense: 0 },
    { label: "Sem 3", income: 0, expense: 0 },
    { label: "Sem 4", income: 0, expense: 0 },
    { label: "Sem 5", income: 0, expense: 0 },
  ];

  transactions.forEach((transaction) => {
    const day = Number(transaction.date.slice(-2));
    const index = Math.min(Math.floor((day - 1) / 7), 4);
    weeks[index][transaction.type === "income" ? "income" : "expense"] += transaction.amount;
  });

  return weeks;
}

function renderCashflowChart() {
  const chart = document.querySelector("#cashflowChart");
  const weekly = getWeeklyData();
  const maxValue = Math.max(1, ...weekly.flatMap((item) => [item.income, item.expense]));

  chart.innerHTML = weekly
    .map((item) => {
      const incomeHeight = Math.round((item.income / maxValue) * 230);
      const expenseHeight = Math.round((item.expense / maxValue) * 230);

      return `
        <div class="bar-group">
          <div class="bars">
            <span class="bar income" title="Receita ${money.format(item.income)}" style="height: ${incomeHeight}px"></span>
            <span class="bar expense" title="Despesa ${money.format(item.expense)}" style="height: ${expenseHeight}px"></span>
          </div>
          <span class="bar-label">${item.label}</span>
        </div>
      `;
    })
    .join("");
}

function getCategoryTotals() {
  const totals = new Map();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      totals.set(transaction.category, (totals.get(transaction.category) || 0) + transaction.amount);
    });

  return [...totals.entries()]
    .map(([name, value], index) => ({ name, value, color: categoryColors[index % categoryColors.length] }))
    .sort((a, b) => b.value - a.value);
}

function renderCategories() {
  const list = document.querySelector("#categoryList");
  const totals = getTotals();
  const categories = getCategoryTotals();

  if (categories.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhuma despesa registrada.</div>';
    return;
  }

  list.innerHTML = categories
    .map((category) => {
      const percent = Math.round((category.value / totals.expenses) * 100);

      return `
        <div class="category-item">
          <div class="category-row">
            <strong>${category.name}</strong>
            <span>${money.format(category.value)} - ${percent}%</span>
          </div>
          <div class="progress-track">
            <span style="width: ${percent}%; background: ${category.color}"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function getFilteredTransactions() {
  const search = document.querySelector("#searchInput").value.trim().toLowerCase();
  const type = document.querySelector("#typeFilter").value;

  return transactions
    .filter((transaction) => type === "all" || transaction.type === type)
    .filter((transaction) => `${transaction.title} ${transaction.category}`.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactions() {
  const list = document.querySelector("#transactionsList");
  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhuma transacao encontrada.</div>';
    return;
  }

  list.innerHTML = filteredTransactions
    .map((transaction) => {
      const amountClass = transaction.type === "income" ? "income" : "expense";
      const icon = transaction.title.charAt(0).toUpperCase();

      return `
        <div class="transaction-item">
          <span class="transaction-icon">${icon}</span>
          <span class="transaction-title">
            <strong>${transaction.title}</strong>
            <span class="transaction-meta">${transaction.category} - ${formatDate(transaction.date)}</span>
          </span>
          <span class="transaction-actions">
            <span class="amount ${amountClass}">${money.format(getSignedAmount(transaction))}</span>
            <button class="delete-button" type="button" data-id="${transaction.id}" aria-label="Remover transacao">x</button>
          </span>
        </div>
      `;
    })
    .join("");
}

function renderBudgets() {
  const list = document.querySelector("#budgetList");
  const categories = getCategoryTotals();

  list.innerHTML = budgets
    .map((budget) => {
      const category = categories.find((item) => item.name === budget.name);
      const spent = category ? category.value : 0;
      const percent = Math.min(Math.round((spent / budget.limit) * 100), 100);

      return `
        <div class="budget-item">
          <div class="budget-row">
            <strong>${budget.name}</strong>
            <span>${money.format(spent)} / ${money.format(budget.limit)}</span>
          </div>
          <div class="progress-track">
            <span style="width: ${percent}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function setupForm() {
  document.querySelector("#transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.querySelector("#titleInput").value.trim();
    const category = document.querySelector("#categoryInput").value.trim();
    const amount = Number(document.querySelector("#amountInput").value);
    const type = document.querySelector("#typeInput").value;

    if (!title || !category || amount <= 0) {
      return;
    }

    transactions.unshift({
      id: idFactory(),
      title,
      category,
      amount,
      type,
      date: new Date().toISOString().slice(0, 10),
    });

    event.target.reset();
    saveTransactions();
    renderApp();
  });
}

function setupTransactionActions() {
  document.querySelector("#transactionsList").addEventListener("click", (event) => {
    const button = event.target.closest(".delete-button");

    if (!button) {
      return;
    }

    transactions = transactions.filter((transaction) => transaction.id !== button.dataset.id);
    saveTransactions();
    renderApp();
  });
}

function setupFilters() {
  document.querySelector("#searchInput").addEventListener("input", renderTransactions);
  document.querySelector("#typeFilter").addEventListener("change", renderTransactions);
}

function setupExport() {
  document.querySelector("#exportButton").addEventListener("click", () => {
    const header = ["data", "tipo", "descricao", "categoria", "valor"];
    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.title,
      transaction.category,
      transaction.amount.toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fluxo-claro-transacoes.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function setupReset() {
  document.querySelector("#resetButton").addEventListener("click", () => {
    transactions = demoTransactions.map((transaction) => ({ ...transaction, id: idFactory() }));
    saveTransactions();
    renderApp();
  });
}

function setupThemeToggle() {
  const button = document.querySelector("#themeToggle");
  const savedTheme = localStorage.getItem("fluxo-claro-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  button.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "fluxo-claro-theme",
      document.body.classList.contains("dark") ? "dark" : "light",
    );
  });
}

function renderApp() {
  updateSummary();
  renderCashflowChart();
  renderCategories();
  renderTransactions();
  renderBudgets();
}

setupForm();
setupTransactionActions();
setupFilters();
setupExport();
setupReset();
setupThemeToggle();
renderApp();
