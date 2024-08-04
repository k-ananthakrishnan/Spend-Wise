

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import {
  addDoc, collection, doc, getDocs, getFirestore, orderBy, query, updateDoc, where
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const db = initializeFirestore();
const addCategoryButton = document.getElementById('add-category-ok');
const addCategoryDialog = document.getElementById('add-category-dialog');
const slider = document.getElementById('s1');
const currentLimitText = document.getElementById('current-limit');
const submitFormButton = document.getElementById('submitForm');
const closeFormButton = document.getElementById('closeForm');
const closeSlideDialogButton = document.querySelector('.close-slide-dialog');
const formContainer = document.getElementById('formContainer');

submitFormButton.addEventListener('click', handleFormSubmit);
closeFormButton.addEventListener('click', () => formContainer.style.display = 'none');
closeSlideDialogButton.addEventListener('click', () => addCategoryDialog.style.display = 'none');

let count = 0;
let selectedCategoryId = 0;

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

async function fetchExpensesSum(categoryName) {
  let sum = 0;

  const categoryRef = query(collection(db, 'categories'), where('categoryName', '==', categoryName));
  const querySnapshot = await getDocs(categoryRef);
  
  querySnapshot.forEach((doc) => {
    const categoryData = doc.data();
    sum = categoryData.sum || 0;
  });

  console.log(`Fetched sum for category ${categoryName}: ${sum}`);
  return sum;
}




async function loadCategories() {
  const categoryContainer = document.querySelector('.category-container');
  categoryContainer.innerHTML = ''; // Clear existing categories

  const q = query(collection(db, 'categories'), orderBy('count'));
  const querySnapshot = await getDocs(q);

  const tileRow1 = document.createElement('div');
  tileRow1.classList.add('tile-row');
  const tileRow2 = document.createElement('div');
  tileRow2.classList.add('tile-row');

  let isRow1 = true;
  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const limit = data.limit;
    const categoryName = data.categoryName;
    const categoryId = doc.id;

    // Fetch the sum of expenses for the category
    const sum = await fetchExpensesSum(categoryName);
    const exceeded75Percent = (sum / limit) > 0.75;
    const exceeded100Percent = (sum / limit) > 1;

    const tile = createTile(data.iconClass, categoryName, categoryId, limit, exceeded75Percent, exceeded100Percent);

    if (isRow1) {
      tileRow1.appendChild(tile);
    } else {
      tileRow2.appendChild(tile);
    }

    isRow1 = !isRow1;
  }

  categoryContainer.appendChild(tileRow1);
  categoryContainer.appendChild(tileRow2);
}

function createTile(iconClass, categoryName, categoryId, limit, exceeded75Percent, exceeded100Percent) {
  const tile = document.createElement('div');
  tile.classList.add('tile');
  tile.dataset.categoryId = categoryId;
  tile.dataset.limit = limit;

  const iconContainer = document.createElement('div');
  iconContainer.classList.add('icon-container');

  const icon = document.createElement('i');
  icon.className = `fa-solid ${iconClass}`; // Make sure iconClass matches Font Awesome class names
  iconContainer.appendChild(icon);

  const infoContainer = document.createElement('div');
  infoContainer.classList.add('info-container');

  const category = document.createElement('p');
  category.classList.add('category-name');
  category.textContent = categoryName;
  infoContainer.appendChild(category);

  const limitLabel = document.createElement('p');
  limitLabel.classList.add('limit-label');
  limitLabel.textContent = `Limit: $${limit}`;
  infoContainer.appendChild(limitLabel);

  if (exceeded100Percent) {
    const warningMsg = document.createElement('p');
    warningMsg.classList.add('warning-msg');
    warningMsg.textContent = `Critical Warning: You have exceeded 100% of your limit!`;
    infoContainer.appendChild(warningMsg);
  } else if (exceeded75Percent) {
    const warningMsg = document.createElement('p');
    warningMsg.classList.add('warning-msg');
    warningMsg.textContent = `Warning: You have exceeded 75% of your limit!`;
    infoContainer.appendChild(warningMsg);
  }

  tile.appendChild(iconContainer);
  tile.appendChild(infoContainer);

  tile.addEventListener('click', () => {
    openCategoryDialog(categoryId, categoryName, limit);
  });

  return tile;
}


document.getElementById('addButton').addEventListener('click', function () {
  formContainer.style.display = 'block';
});

document.getElementById('addBtn').addEventListener('click', function () {
  formContainer.style.display = 'block';
});

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
      limit: 0,
      sum: 0 
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
});
