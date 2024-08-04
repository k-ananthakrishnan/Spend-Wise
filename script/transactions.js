import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import {
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore,
  onSnapshot, orderBy, query, updateDoc, where
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
  selectedExpenseId = null;
}

function setupExpenseListener() {
  const expensesRef = collection(db, 'expenses');
  onSnapshot(expensesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
        fetchExpenses().then((expenses) => {
          const categoryData = processCategoryData(expenses);
          checkCategoryLimits(categoryData); // Pass category data for limit checking
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

async function addExpense(expense) {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    console.log("Document written with ID: ", docRef.id);

    if (expense.transactionType === 'debit' && expense.category) {
      await updateCategorySum(expense.category, expense.amount);
    }
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function updateCategorySum(categoryName, amount) {
  const categoryRef = query(collection(db, 'categories'), where('categoryName', '==', categoryName));
  const querySnapshot = await getDocs(categoryRef);
  
  querySnapshot.forEach(async (doc) => {
    const categoryDocRef = doc.ref;
    const categoryData = doc.data();
    const newSum = (categoryData.sum || 0) + amount;
    await updateDoc(categoryDocRef, { sum: newSum });
    console.log("Category sum updated for category: ", categoryName);
  });
}

async function updateExpensesum(id, expense) {
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
  const q = query(collection(db, 'categories'), orderBy('categoryName'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const option = document.createElement('option');
    const data = doc.data();
    option.value = data.categoryName; 
    option.textContent = data.categoryName;
    categorySelect.appendChild(option);
  });
}

async function fetchCategoriesWithLimits() {
  const categoryRef = collection(db, 'categories');
  const querySnapshot = await getDocs(query(categoryRef));
  const categories = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    categories.push({
      id: doc.id,
      categoryName: data.categoryName,
      limit: data.limit, 
    });
  });
  return categories;
}

async function checkCategoryLimits(categoryData) {
  const categories = await fetchCategoriesWithLimits();

  categories.forEach(category => {
    const sum = categoryData[category.categoryName] || 0;
    const limit = category.limit;
    const percentage = (sum / limit) * 100;

    if (percentage > 75) {
      const message = `Warning: You have exceeded 75% of the limit for the category "${category.categoryName}".`;
      console.warn(message);
      displayWarning(message);
    }
  });
}

function checkMonthChange() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastCheckedDateString = localStorage.getItem("lastCheckedDate");

  if (currentDay === 1 && (!lastCheckedDateString || new Date(lastCheckedDateString).getMonth() !== currentMonth || new Date(lastCheckedDateString).getFullYear() !== currentYear)) {
    alert('Don\'t forget to review your expenses for the previous month!');
    localStorage.setItem("lastCheckedDate", now.toISOString());
  }
}

function handleDialogSubmit() {
  const amount = parseFloat(document.getElementById('amount').value);
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  const transactionType = document.querySelector('input[name="transactionType"]:checked').value;

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (transactionType === 'debit' && !category) {
    alert('Please select a category for debit transactions.');
    return;
  }

  const expense = {
    amount,
    description,
    category: transactionType === 'debit' ? category : null,
    transactionType,
    timestamp: new Date()
  };

  if (selectedExpenseId) {
    updateExpense(selectedExpenseId, expense).then(async () => {
      loadExpenses();
      dialog.close();
      checkCategoryLimits(await processCategoryData(await fetchExpenses())); 
    });
  } else {
    addExpense(expense).then(async () => {
      loadExpenses();
      dialog.close();
      checkCategoryLimits(await processCategoryData(await fetchExpenses())); 
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadExpenses();
  await loadCategories();
  setupExpenseListener();
  checkMonthChange();
});
