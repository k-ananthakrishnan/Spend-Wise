import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { 
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, updateDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const pieChartButton = document.getElementById('pie-chart-btn');
const closePieChartButton = document.getElementById('close-pie-chart-btn');
const pieChartCanvas = document.getElementById('pieChartCanvas');
pieChartButton.addEventListener('click', displayPieChart);
const db = initializeFirestore();
let pieChartInstance = null;

closePieChartButton.addEventListener('click', () => togglePieChartDisplay(false));



initializePieChart();

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