import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { 
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, updateDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const addCategoryButton = document.getElementById('add-category-ok');
const slider = document.getElementById('s1');
const currentLimitText = document.getElementById('current-limit');
const addCategoryDialog = document.getElementById('add-category-dialog');
const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#fab');
const expenseList = document.getElementById('expense-list');
const categoryContainer = document.getElementById('category-container');
const closeSlideDialogButton = document.querySelector('.close-slide-dialog');
const submitFormButton = document.getElementById('submitForm');
const closeFormButton = document.getElementById('closeForm');
const formContainer = document.getElementById('formContainer');
const pieChartButton = document.getElementById('pie-chart-btn');
const closePieChartButton = document.getElementById('close-pie-chart-btn');
const pieChartCanvas = document.getElementById('pieChartCanvas');
const db = initializeFirestore();

let expenses = [];
let selectedExpenseId = null;
let selectedCategoryId = 0;
let pieChartInstance = null;
let count = 0;

initializeAppElements();
initializePieChart();

function initializeFirestore() {
  const firebaseConfig = {
    apiKey: "AIzaSyBraAv342Or0Wr4D_bEl46grOmqgAX06Lo",
    authDomain: "capstone-project-7ec2d.firebaseapp.com",
    databaseURL: "https://capstone-project-7ec2d-default-rtdb.firebaseio.com",
    projectId: "capstone-project-7ec2d",
    storageBucket: "capstone-project-7ec2d.appspot.com",
    messagingSenderId: "734534479783",
    appId: "1:734534479783:web:fe0190f54699a23bbdd082"
  };

  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
}

function initializeAppElements() {
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }

  showDialogButton.addEventListener('click', () => openDialog('Add Transaction'));
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  closeSlideDialogButton.addEventListener('click', () => addCategoryDialog.style.display = 'none');
  closeFormButton.addEventListener('click', () => formContainer.style.display = 'none');
  submitFormButton.addEventListener('click', handleFormSubmit);
  pieChartButton.addEventListener('click', displayPieChart);
  closePieChartButton.addEventListener('click', () => togglePieChartDisplay(false));
  slider.addEventListener('input', updateSliderText);

  document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
    radio.addEventListener('change', toggleCategoryField);
  });

  dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', handleDialogSubmit);

  document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadExpenses();
    setupExpenseListener();
  });
}

function openDialog(title) {
  document.getElementById('dialog-title').textContent = title;
  resetForm();
  dialog.showModal();
}

function resetForm() {
  document.getElementById('amount').value = '';
  document.getElementById('description').value = '';
  document.getElementById('category').value = '';
  document.querySelectorAll('input[name="transactionType"]').forEach(type => type.checked = false);
  document.getElementById('category-field').classList.add('hidden');
  selectedExpenseId = null;
}

function toggleCategoryField() {
  const categoryField = document.getElementById('category-field');
  if (this.value === 'debit') {
    categoryField.classList.remove('hidden');
    categoryField.querySelector('select').setAttribute('required', 'required');
  } else {
    categoryField.classList.add('hidden');
    categoryField.querySelector('select').removeAttribute('required');
  }
}

function handleDialogSubmit() {
  const amount = document.getElementById('amount').value;
  const transactionType = document.querySelector('input[name="transactionType"]:checked');
  const categoryField = document.getElementById('category-field');
  const category = categoryField.querySelector('select').value;

  if (isNaN(amount) || amount === '') {
    alert('Please enter a valid number for the amount.');
    return;
  }

  if (transactionType && transactionType.value === 'debit' && !category) {
    alert('Please select a category for debit transactions.');
    return;
  }

  const expense = {
    amount: parseFloat(amount),
    transactionType: transactionType.value,
    category: transactionType.value === 'debit' ? category : '',
    description: document.getElementById('description').value,
    timestamp: new Date()
  };

  if (selectedExpenseId) {
    updateExpense(selectedExpenseId, expense).then(() => loadExpenses());
  } else {
    addExpense(expense).then(() => loadExpenses());
  }

  dialog.close();
}

async function addExpense(expense) {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function updateExpense(id, expense) {
  try {
    const expenseDoc = doc(db, 'expenses', id);
    await updateDoc(expenseDoc, expense);
    console.log("Document updated with ID: ", id);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

async function deleteExpense(id) {
  try {
    await deleteDoc(doc(db, 'expenses', id));
    console.log("Document deleted with ID: ", id);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}

async function loadExpenses() {
  expenseList.innerHTML = '';
  const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  expenses = [];
  querySnapshot.forEach(doc => {
    const expense = doc.data();
    expense.id = doc.id;
    expenses.push(expense);
    displayExpense(expense);
  });
}

function displayExpense(expense) {
  const expenseElement = document.createElement('div');
  expenseElement.classList.add('expense');
  expenseElement.classList.add(expense.transactionType === 'credit' ? 'credit' : 'debit');

  const expenseContent = `
    <p><strong>Amount:</strong> $${expense.amount}</p>
    <p><strong>Type:</strong> ${expense.transactionType}</p>
    ${expense.transactionType === 'debit' ? `<p><strong>Category:</strong> ${expense.category}</p>` : ''}
    <p><strong>Description:</strong> ${expense.description || 'N/A'}</p>
    <button class="edit-btn mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" data-id="${expense.id}">Edit</button>
    <button class="delete-btn mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" data-id="${expense.id}">Delete</button>
  `;

  expenseElement.innerHTML = expenseContent;
  expenseList.appendChild(expenseElement);

  expenseElement.querySelector('.edit-btn').addEventListener('click', () => editExpense(expense));
  expenseElement.querySelector('.delete-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expense.id);
      loadExpenses();
    }
  });
}

function editExpense(expense) {
  selectedExpenseId = expense.id;
  document.getElementById('dialog-title').textContent = 'Edit Expense';
  document.getElementById('amount').value = expense.amount;
  document.querySelector(`input[name="transactionType"][value="${expense.transactionType}"]`).checked = true;
  document.getElementById('description').value = expense.description;
  if (expense.transactionType === 'debit') {
    document.getElementById('category-field').classList.remove('hidden');
    document.getElementById('category').value = expense.category;
  } else {
    document.getElementById('category-field').classList.add('hidden');
  }
  dialog.showModal();
}

async function loadCategories() {
  categoryContainer.innerHTML = '';
  const q = query(collection(db, 'categories'), orderBy('count'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const tile = createTile(data.iconClass, data.categoryName, doc.id, data.limit);
    categoryContainer.appendChild(tile);

    const categoryOptions = document.createElement('option');
    categoryOptions.value = data.categoryName;
    categoryOptions.innerHTML = data.categoryName;
    document.getElementById('category').appendChild(categoryOptions);

    count++;
  });
}

function createTile(iconClass, categoryName, categoryId, limit) {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.dataset.categoryId = categoryId;
  tile.dataset.limit = limit;

  const icon = document.createElement('i');
  icon.className = `fa-solid ${iconClass}`;
  tile.appendChild(icon);

  const category = document.createElement('p');
  category.classList.add('category-name');
  category.textContent = categoryName;
  tile.appendChild(category);

  const limitLabel = document.createElement('p');
  limitLabel.classList.add('limit-label');
  limitLabel.textContent = `Limit: $${limit}`;
  tile.appendChild(limitLabel);

  tile.addEventListener('click', () => openCategoryDialog(categoryId, categoryName, limit, tile));

  return tile;
}

function openCategoryDialog(categoryId, categoryName, limit) {
  selectedCategoryId = categoryId;
  document.getElementById('category-dialog-title').textContent = categoryName;
  slider.value = limit;
  currentLimitText.textContent = `Current Limit: ${limit}`;
  addCategoryDialog.style.display = 'block';
}

addCategoryButton.addEventListener('click', async () => {
  const newLimit = slider.value;
  currentLimitText.textContent = `Current Limit: ${newLimit}`;
  await updateCategoryLimit(selectedCategoryId, newLimit);
  addCategoryDialog.style.display = 'none';
  await loadCategories();
});

async function updateCategoryLimit(categoryId, newLimit) {
  const categoryDocRef = doc(db, 'categories', categoryId);
  await updateDoc(categoryDocRef, { limit: newLimit });
}

async function addCategory(iconClass, categoryName) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      iconClass: iconClass,
      categoryName: categoryName,
      count: count + 1,
      limit: 0
    });
    console.log("Document written with ID: ", docRef.id);
    await loadCategories();
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

function handleFormSubmit() {
  const categoryName = document.getElementById('categoryName').value;
  const iconClass = "fa-tag";
  if (iconClass && categoryName) {
    addCategory(iconClass, categoryName).then(() => {
      formContainer.style.display = 'none';
      document.getElementById('categoryName').value = '';
    });
  } else {
    alert('Please fill out both fields.');
  }
}

function updateSliderText() {
  currentLimitText.textContent = `Current Limit: ${slider.value}`;
}

async function fetchExpenses() {
  const expenses = [];
  const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    expenses.push(doc.data());
  });
  return expenses;
}

function processCategoryData(expenses) {
  const categoryTotals = {};

  expenses.forEach(expense => {
    if (expense.transactionType === 'debit') {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    }
  });

  return categoryTotals;
}

function initializePieChart() {
  pieChartCanvas.style.display = 'none';
  closePieChartButton.style.display = 'none';
}

async function displayPieChart() {
  const expenses = await fetchExpenses();
  const categoryData = processCategoryData(expenses);
  renderPieChart(categoryData);
  togglePieChartDisplay(true);
}

function togglePieChartDisplay(show) {
  pieChartCanvas.style.display = show ? 'block' : 'none';
  closePieChartButton.style.display = show ? 'block' : 'none';
}

function renderPieChart(categoryData) {
  const ctx = pieChartCanvas.getContext('2d');

  const data = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  };

  if (!pieChartInstance) {
    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Expenses by Category' }
        }
      },
    });
  } else {
    pieChartInstance.data = data;
    pieChartInstance.update();
  }
}

function setupExpenseListener() {
  const expensesRef = collection(db, 'expenses');
  onSnapshot(expensesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
        fetchExpenses().then((expenses) => {
          const categoryData = processCategoryData(expenses);
          renderPieChart(categoryData);
        }).catch((error) => {
          console.error('Error fetching expenses:', error);
        });
      }
    });
  });
}

