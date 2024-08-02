import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { 
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, updateDoc, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";


let expenses = [];
let selectedExpenseId = null;

const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#fab');
const expenseList = document.getElementById('expense-list');
const db = initializeFirestore();


showDialogButton.addEventListener('click', () => openDialog('Add Transaction'));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', handleDialogSubmit);
document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
  radio.addEventListener('change', toggleCategoryField);
});


function initializeFirestore() {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD_kUpbp349u2AvKsbFLwbLwhnjTPCZndA",
    authDomain: "mypwa-5fb18.firebaseapp.com",
    projectId: "mypwa-5fb18",
    storageBucket: "mypwa-5fb18.appspot.com",
    messagingSenderId: "662572084401",
    appId: "1:662572084401:web:dff7781d5ba43531fe0690",
    measurementId: "G-DJPD4RB8BN"
};
  
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
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
    // document.getElementById('category-field').classList.add('hidden');
    selectedExpenseId = null;
  }

  function setupExpenseListener() {
    const expensesRef = collection(db, 'expenses');
    onSnapshot(expensesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
          fetchExpenses().then((expenses) => {
            const categoryData = processCategoryData(expenses);
          }).catch((error) => {
            console.error('Error fetching expenses:', error);
          });
        }
      });
    });
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

  async function fetchExpenses() {
    const expenses = [];
    const q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      expenses.push(doc.data());
    });
    return expenses;
  }

function handleDialogSubmit() {
    const amount = document.getElementById('amount').value;
    const transactionType = document.querySelector('input[name="transactionType"]:checked');
    const categoryField = document.getElementById('category-field');
    const category = categoryField.querySelector('select').value;
    const recurring = document.getElementById('recurring').checked;
  
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
      timestamp: new Date(),
      recurring: recurring
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
    <div class="expense">
      <p class="expense-amount-type">
        <strong>$${expense.amount} <span class="${expense.transactionType === 'credit' ? 'credit' : 'debit'}">${expense.transactionType.toUpperCase()}</span></strong>
      </p>
      ${expense.transactionType === 'debit' ? `<p class="expense-category"><strong>Category:</strong> ${expense.category}</p>` : ''}
      <p class="expense-description"><strong>Description:</strong> ${expense.description || 'N/A'}</p>
      <div class="btn-container">
        <button class="edit-btn" data-id="${expense.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn" data-id="${expense.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
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
  
  function editExpense(expense) {
  
    selectedExpenseId = expense.id;
    document.getElementById('dialog-title').textContent = 'Edit Expense';
    document.getElementById('amount').value = expense.amount;
    
    if (expense.transactionType === 'debit') {
      document.getElementById('debit').checked = true;
      document.getElementById('category-field').classList.remove('hidden');
      document.getElementById('category').value = expense.category;
    } else {
      document.getElementById('credit').checked = true;
      document.getElementById('category-field').classList.add('hidden');
    }
  
  
    document.getElementById('description').value = expense.description;
    dialog.showModal();

  }

  async function loadCategories() {
    const categorySelect = document.getElementById('category');
    const option = document.createElement('option');
    const q = query(collection(db, 'categories'), orderBy('count'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const option = document.createElement('option');

      const data = doc.data();
      option.value = data.categoryName; 
      option.textContent = data.categoryName;
      categorySelect.appendChild(option);
    });
  }

function checkMonthChange() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastCheckedDateString = localStorage.getItem("lastCheckedDate");

  if (currentDay === 1 && (!lastCheckedDateString || new Date(lastCheckedDateString).getMonth() !== currentMonth || new Date(lastCheckedDateString).getFullYear() !== currentYear)) {
      myMonthlyFunction(); 
      localStorage.setItem("lastCheckedDate", now.toString());
  }
}

const intervalId = setInterval(checkMonthChange, 1000);

async function myMonthlyFunction() {
  const expenses = await fetchExpenses();

  expenses.forEach(async (expense) => {
      if (expense.recurring) {
          const newTimestamp = new Date();

          const recurringExpense = {
              amount: expense.amount,
              transactionType: expense.transactionType,
              category: expense.category,
              description: expense.description,
              timestamp: newTimestamp,
              recurring: false
          };

          try {
              const docRef = await addDoc(collection(db, 'expenses'), recurringExpense);
              console.log("Recurring expense added with ID: ", docRef.id);
          } catch (e) {
              console.error("Error adding recurring expense: ", e);
          }
      }
  });
}

async function fetchExpensesByMonth(year, month) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const q = query(
    collection(db, 'expenses'),
    where('timestamp', '>=', startOfMonth),
    where('timestamp', '<=', endOfMonth),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const expenses = [];
  querySnapshot.forEach((doc) => {
    expenses.push(doc.data());
  });

  return expenses;
}

  function calculateTotalExpenditure(expenses) {
    return expenses.reduce((total, expense) => {
      return total + (expense.transactionType === 'credit' ? expense.amount : -expense.amount);
    }, 0);
  }

async function compareExpenditures() {
  const now = new Date();
  const currentMonthExpenses = await fetchExpensesByMonth(now.getFullYear(), now.getMonth());
  const previousMonthExpenses = await fetchExpensesByMonth(now.getFullYear(), now.getMonth() - 1);
  const currentMonthTotal = calculateTotalExpenditure(currentMonthExpenses);
  const previousMonthTotal = calculateTotalExpenditure(previousMonthExpenses);
  const difference = currentMonthTotal - previousMonthTotal;
  const badgeDocRef = doc(db, 'badge', 'ScsCz6FvoKZdWRCvv4vs'); 
  try {
    await updateDoc(badgeDocRef, { difference });
    console.log("Difference updated in Firestore");
  } catch (e) {
    console.error("Error updating difference in Firestore: ", e);
  }
  document.getElementById('current-month-total').textContent = `Current Month: $${currentMonthTotal.toFixed(2)}`;
  document.getElementById('previous-month-total').textContent = `Previous Month: $${previousMonthTotal.toFixed(2)}`;
  if (difference >= 0) {
    document.getElementById('expenditure-comparison').textContent = `You have $${difference.toFixed(2)} to cross your previous month expenditure`;
  } else {
    document.getElementById('expenditure-comparison').textContent = `You have crossed $${Math.abs(difference).toFixed(2)} than your previous month expenditure`;
  }
  renderExpenditureChart(currentMonthTotal, previousMonthTotal);
}


async function renderExpenditureChart() {  
  const now = new Date();
  const currentMonth = now.getMonth();
  const year = now.getFullYear();

  // Fetch expenses for the current and previous months
  const previousMonthExpenses = await fetchExpensesByMonth(year, currentMonth - 1);
  const currentMonthExpenses = await fetchExpensesByMonth(year, currentMonth);

  // Calculate total expenditures
  const previousMonthTotal = calculateTotalExpenditure(previousMonthExpenses);
  const currentMonthTotal = calculateTotalExpenditure(currentMonthExpenses);

  // Define data for the chart
  const ctx = document.getElementById('expenditureChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        new Date(year, currentMonth - 1, 1).toLocaleString('default', { month: 'long' }),
        new Date(year, currentMonth, 1).toLocaleString('default', { month: 'long' })
      ],
      datasets: [
        {
          label: 'Expenses',
          data: [
            previousMonthTotal,
            currentMonthTotal
          ],
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          innerWidth: 10,
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Expenditure ($)'
          }
        }
      }
    }
  });
}


  document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadExpenses();
    setupExpenseListener();
    await compareExpenditures();

  });
