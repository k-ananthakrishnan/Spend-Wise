import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { 
  collection, getDocs, getFirestore, orderBy, query, where
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const pieChartCanvas = document.getElementById('pieChartCanvas');
let pieChartInstance = null;
const db = initializeFirestore();

window.addEventListener('load', () => {
    displayPieChart();
});

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

async function displayPieChart() {
    try {
        const expenses = await fetchExpenses();
        const categoryData = processCategoryData(expenses);
        renderPieChart(categoryData);
    } catch (error) {
        console.error('Error displaying pie chart:', error);
    }
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
                    title: { display: true, text: 'Categories' }
                }
            }
        });
    } else {
        pieChartInstance.data = data;
        pieChartInstance.update();
    }
}

const { currentMonthTotal, previousMonthTotal } = await compareExpenditures();  async function fetchExpensesByMonth(year, month) {
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
  return difference;

}
renderExpenditureChart(currentMonthTotal, previousMonthTotal);

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