import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, deleteDoc,orderBy,query } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

// Get the dialog and the FAB button
var dialog = document.querySelector('dialog');
var showDialogButton = document.querySelector('#fab');
var expenses = [];

if (! dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}

// Show dialog on FAB click
showDialogButton.addEventListener('click', function() {
  dialog.showModal();
});

// Close dialog on 'Cancel' button click
dialog.querySelector('.close').addEventListener('click', function() {
  dialog.close();
});

// Handle 'OK' button click
dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', function() {
  // Validate mandatory fields
  var amount = document.getElementById('amount').value;
  var transactionType = document.querySelector('input[name="transactionType"]:checked');
  var category = document.getElementById('category').value;

  if (amount && transactionType && category) {
    // Create expense object
    var expense = {
      amount: amount,
      transactionType: transactionType.value,
      category: category,
      description: document.getElementById('description').value
    };

    // Add expense to the array
    expenses.push(expense);

    // Display the expense on the home page
    displayExpense(expense);

    dialog.close(); // Close the dialog after successful form submission
  } else {
    alert('Please fill out all mandatory fields.');
  }
});

function displayExpense(expense) {
  var expenseList = document.getElementById('expense-list');
  var expenseElement = document.createElement('div');
  expenseElement.classList.add('expense');
  expenseElement.classList.add(expense.transactionType === 'credit' ? 'credit' : 'debit');
  expenseElement.innerHTML = `
    <p><strong>Amount:</strong> $${expense.amount}</p>
    <p><strong>Type:</strong> ${expense.transactionType}</p>
    <p><strong>Category:</strong> ${expense.category}</p>
    <p><strong>Description:</strong> ${expense.description || 'N/A'}</p>
  `;
  expenseList.appendChild(expenseElement);
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

// Function to create and append a tile
function createTile(iconClass, categoryName) {
  const tile = document.createElement('div');
  tile.classList.add('tile');

  const icon = document.createElement('i');
  icon.className = `fa-solid ${iconClass}`;
  tile.appendChild(icon);

  const category = document.createElement('p');
  category.classList.add('category-name');
  category.textContent = categoryName;
  tile.appendChild(category);

  return tile;
}

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
      const tile = createTile(data.iconClass, data.categoryName);
      categoryContainer.appendChild(tile);
      count++;
  });
}

// Function to add a category to Firestore
async function addCategory(iconClass, categoryName) {
  try {
      const docRef = await addDoc(collection(db, 'categories'), {
          iconClass: iconClass,
          categoryName: categoryName,
          count: count+1
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
  // console.log("added category");
  // addCategory('fa-bowl-food', 'Food');
  // addCategory('fa-car', 'Travel');
  // addCategory('fa-bag-shopping', 'Shopping');
  // addCategory('fa-money-bills', 'Utilities');
  // addCategory('fa-globe', 'Entertainment');
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
