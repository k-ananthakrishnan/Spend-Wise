import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { 
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, updateDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const db = initializeFirestore();
const addCategoryButton = document.getElementById('add-category-ok');
const addCategoryDialog = document.getElementById('add-category-dialog');
const slider = document.getElementById('s1');
const currentLimitText = document.getElementById('current-limit');
const submitFormButton = document.getElementById('submitForm');
submitFormButton.addEventListener('click', handleFormSubmit);
const closeFormButton = document.getElementById('closeForm');
closeFormButton.addEventListener('click', () => formContainer.style.display = 'none');
const closeSlideDialogButton = document.querySelector('.close-slide-dialog');
closeSlideDialogButton.addEventListener('click', () => addCategoryDialog.style.display = 'none');



let count = 0;

let selectedCategoryId = 0;

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
  function createTile(iconClass, categoryName, categoryId, limit) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.categoryId = categoryId;
    tile.dataset.limit = limit;
  
    const iconContainer = document.createElement('div');
    iconContainer.classList.add('icon-container');
  
    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconClass}`;
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
  
    tile.appendChild(iconContainer);
    tile.appendChild(infoContainer);
  
    // Add click event listener to open dialog or perform action
    tile.addEventListener('click', () => {
      openCategoryDialog(categoryId, categoryName, limit);
    });
  
    return tile;
  }

  // Function to load categories and populate tiles
async function loadCategories() {
    const categoryContainer = document.querySelector('.category-container');
    // const categorySelect = document.getElementById('category');
    categoryContainer.innerHTML = ''; 
  
    const q = query(collection(db, 'categories'), orderBy('count'));
    const querySnapshot = await getDocs(q);
  
    const tileRow1 = document.createElement('div');
    tileRow1.classList.add('tile-row');
    const tileRow2 = document.createElement('div');
    tileRow2.classList.add('tile-row');
  
    let isRow1 = true;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
    //   const option = document.createElement('option');
    //   option.value = data.categoryName; 
    //   option.textContent = data.categoryName;
    //   categorySelect.appendChild(option);
      const tile = createTile(data.iconClass, data.categoryName, doc.id, data.limit);
  
      if (isRow1) {
        tileRow1.appendChild(tile);
      } else {
        tileRow2.appendChild(tile);
      }
  
      isRow1 = !isRow1; 
    });
  
    categoryContainer.appendChild(tileRow1);
    categoryContainer.appendChild(tileRow2);
  }

// Add event listener for the Add Custom Tile button
document.getElementById('addButton').addEventListener('click', function () {
    document.getElementById('formContainer').style.display = 'block';
  })
  document.getElementById('addBtn').addEventListener('click', function () {
    document.getElementById('formContainer').style.display = 'block';
  })
  
  
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
  document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
  });