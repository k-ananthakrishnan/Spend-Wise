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