import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, deleteDoc,orderBy,query } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

// Get the dialog and the FAB button start
var dialog = document.querySelector('dialog');
var showDialogButton = document.querySelector('#fab');
var addCategoryDialog = document.getElementById('add-category-dialog');
var showCategoryDialogButton = document.getElementById('add-category-btn');
var expenses = [];
var categories = ['entertainment', 'learning', 'travel'];

if (!dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}

showDialogButton.addEventListener('click', function () {
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

dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', function () {
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
    // Create expense object
    var expense = {
      amount: amount,
      transactionType: transactionType.value,
      category: transactionType.value === 'debit' ? category : '',
      description: document.getElementById('description').value
    };

    expenses.push(expense);

    displayExpense(expense);

    resetForm();

    dialog.close();
  } else {
    alert('Please fill out all mandatory fields.');
  }
});

function displayExpense(expense) {
  var expenseList = document.getElementById('expense-list');
  var expenseElement = document.createElement('div');
  expenseElement.classList.add('expense');
  expenseElement.classList.add(expense.transactionType === 'credit' ? 'credit' : 'debit');

  // Create the expense content based on whether it's credit or debit
  var expenseContent = `
    <p><strong>Amount:</strong> $${expense.amount}</p>
    <p><strong>Type:</strong> ${expense.transactionType}</p>
    ${expense.transactionType === 'debit' ? `<p><strong>Category:</strong> ${expense.category}</p>` : ''}
    <p><strong>Description:</strong> ${expense.description || 'N/A'}</p>
  `;

  expenseElement.innerHTML = expenseContent;
  expenseList.appendChild(expenseElement);
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
    // console.log(count);
      const data = doc.data();
      const tile = createTile(data.iconClass, data.categoryName,doc.id, data.limit);
      
      categoryContainer.appendChild(tile);

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
          count: count+1,
          limit:0
      });
      console.log("Document written with ID: ", docRef.id);
      // Reload categories to reflect the newly added category
      await loadCategories();
  } catch (e) {
      console.error("Error adding document: ", e);
  }
}

// Add event listener for the Add Custom Tile button
document.getElementById('addButton').addEventListener('click', function() {
  document.getElementById('formContainer').style.display = 'block';
});

// Load categories when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
});;

//Form actions
document.getElementById('submitForm').addEventListener('click', async function() {
  // const iconClass = document.getElementById('iconClass').value;
  const categoryName = document.getElementById('categoryName').value;
  const iconClass = "fa-tag";
  if(!iconClass){
    iconClass="fa-tag";
  }
  if (iconClass && categoryName) {
      await addCategory(iconClass, categoryName);
      document.getElementById('formContainer').style.display = 'none';
      document.getElementById('categoryName').value = '';
  } else {
      alert('Please fill out both fields.');
  }
});
document.getElementById('closeForm').addEventListener('click', function() {
  document.getElementById('formContainer').style.display = 'none';
});

// Update limit text when slider value changes
slider.addEventListener('input', () => {
  currentLimitText.textContent = `Current Limit: ${slider.value}`;
});