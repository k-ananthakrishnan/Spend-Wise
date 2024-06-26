import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { addDoc, collection, doc, getDocs, getFirestore, orderBy, query, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const addCategoryButton = document.getElementById('add-category-ok');
var slider = document.getElementById('s1');
var currentLimitText = document.getElementById('current-limit');
let selectedCategoryId = 0;
var addCategoryDialog = document.getElementById('add-category-dialog');
var dialog = document.querySelector('dialog');
var showDialogButton = document.querySelector('#fab');
var expenses = [];
let selectedExpenseId = null;

if (!dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}

showDialogButton.addEventListener('click', function () {
  document.getElementById('dialog-title').textContent = 'Add Transaction';
  resetForm();
  dialog.showModal();
});

dialog.querySelector('.close').addEventListener('click', function () {
  dialog.close();
});

document.querySelectorAll('input[name="transactionType"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    var categoryField = document.getElementById('category-field');
    if (this.value === 'debit') {
      categoryField.classList.remove('hidden');
      categoryField.querySelector('select').setAttribute('required', 'required');
    } else {
      categoryField.classList.add('hidden');
      categoryField.querySelector('select').removeAttribute('required');
    }
  });
});

dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', async function () {
  var amount = document.getElementById('amount').value;
  var transactionType = document.querySelector('input[name="transactionType"]:checked');
  var categoryField = document.getElementById('category-field');
  var category = categoryField.querySelector('select').value;

  if (isNaN(amount) || amount === '') {
    alert('Please enter a valid number for the amount.');
    return;
  }

  if (transactionType && transactionType.value === 'debit' && !category) {
    alert('Please select a category for debit transactions.');
    return;
  }

  if (amount && transactionType && (transactionType.value !== 'debit' || category)) {
    var expense = {
      amount: parseFloat(amount),
      transactionType: transactionType.value,
      category: transactionType.value === 'debit' ? category : '',
      description: document.getElementById('description').value,
      timestamp: new Date()
    };

    if (selectedExpenseId) {
      await updateExpense(selectedExpenseId, expense);
    } else {
      await addExpense(expense);
    }

    loadExpenses();
    dialog.close();
  } else {
    alert('Please fill out all mandatory fields.');
  }
});

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

async function loadExpenses() {
  const expenseList = document.getElementById('expense-list');
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
  var expenseList = document.getElementById('expense-list');
  var expenseElement = document.createElement('div');
  expenseElement.classList.add('expense');
  expenseElement.classList.add(expense.transactionType === 'credit' ? 'credit' : 'debit');

  var expenseContent = `
    <p><strong>Amount:</strong> $${expense.amount}</p>
    <p><strong>Type:</strong> ${expense.transactionType}</p>
    ${expense.transactionType === 'debit' ? `<p><strong>Category:</strong> ${expense.category}</p>` : ''}
    <p><strong>Description:</strong> ${expense.description || 'N/A'}</p>
    <button class="edit-btn mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" data-id="${expense.id}">Edit</button>
    
  `;

  expenseElement.innerHTML = expenseContent;
  expenseList.appendChild(expenseElement);

  expenseElement.querySelector('.edit-btn').addEventListener('click', () => editExpense(expense));

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

function resetForm() {
  document.getElementById('amount').value = '';
  document.getElementById('description').value = '';
  document.getElementById('category').value = '';
  var transactionTypes = document.querySelectorAll('input[name="transactionType"]');
  transactionTypes.forEach(type => {
    type.checked = false;
  });
  document.getElementById('category-field').classList.add('hidden');
  selectedExpenseId = null;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBraAv342Or0Wr4D_bEl46grOmqgAX06Lo",
  authDomain: "capstone-project-7ec2d.firebaseapp.com",
  databaseURL: "https://capstone-project-7ec2d-default-rtdb.firebaseio.com",
  projectId: "capstone-project-7ec2d",
  storageBucket: "capstone-project-7ec2d.appspot.com",
  messagingSenderId: "734534479783",
  appId: "1:734534479783:web:fe0190f54699a23bbdd082"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let count = 0;

// Function to load categories from Firestore and display them
async function loadCategories() {
  const categoryContainer = document.getElementById('category-container');
  categoryContainer.innerHTML = ''; // Clear existing categories
  const q = query(collection(db, 'categories'), orderBy('count'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const tile = createTile(data.iconClass, data.categoryName, doc.id, data.limit);
    categoryContainer.appendChild(tile);

    var categoryOptions = document.createElement('option');
    categoryOptions.value = data.categoryName;
    categoryOptions.innerHTML = data.categoryName;
    const categoryDiv = document.getElementById("category");
    categoryDiv.appendChild(categoryOptions);

    count++;
  });
}

// Function to create and append a tile
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

  tile.addEventListener('click', () => {
    openCategoryDialog(categoryId, categoryName, limit, tile);
  });

  return tile;
}

// Function to open the category dialog
function openCategoryDialog(categoryId, categoryName, limit) {
  selectedCategoryId = categoryId;
  document.getElementById('category-dialog-title').textContent = categoryName;
  slider.value = limit;
  currentLimitText.textContent = `Current Limit: ${limit}`;
  addCategoryDialog.style.display = 'block';
}

// Close the category dialog
document.querySelector('.close-slide-dialog').addEventListener('click', () => {
  addCategoryDialog.style.display = 'none';
});

// Handle category dialog 'OK' button click
addCategoryButton.addEventListener('click', async () => {
  const newLimit = slider.value;
  currentLimitText.textContent = `Current Limit: ${newLimit}`;
  await updateCategoryLimit(selectedCategoryId, newLimit);
  addCategoryDialog.style.display = 'none';
  await loadCategories();
});

// Update category limit in Firestore
async function updateCategoryLimit(categoryId, newLimit) {
  const categoryDocRef = doc(db, 'categories', categoryId);
  await updateDoc(categoryDocRef, {
    limit: newLimit
  });
}

// Function to add a category to Firestore
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

// Add event listener for the Add Custom Tile button
document.getElementById('addButton').addEventListener('click', function () {
  document.getElementById('formContainer').style.display = 'block';
});

// Load categories when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadExpenses();
});

// Form actions
document.getElementById('submitForm').addEventListener('click', async function () {
  const categoryName = document.getElementById('categoryName').value;
  const iconClass = "fa-tag";
  if (!iconClass) {
    iconClass = "fa-tag";
  }
  if (iconClass && categoryName) {
    await addCategory(iconClass, categoryName);
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('categoryName').value = '';
  } else {
    alert('Please fill out both fields.');
  }
});

document.getElementById('closeForm').addEventListener('click', function () {
  document.getElementById('formContainer').style.display = 'none';
});

// Update limit text when slider value changes
slider.addEventListener('input', () => {
  currentLimitText.textContent = `Current Limit: ${slider.value}`;
});


