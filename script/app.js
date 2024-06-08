
// Get the dialog and the FAB button
var dialog = document.querySelector('dialog');
var showDialogButton = document.querySelector('#fab');
var expenses = [];

if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
}

// Show dialog on FAB click
showDialogButton.addEventListener('click', function () {
    dialog.showModal();
});

// Close dialog on 'Cancel' button click
dialog.querySelector('.close').addEventListener('click', function () {
    dialog.close();
});

// Show/Hide category field based on transaction type selection
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

// Handle 'OK' button click
dialog.querySelector('.mdl-dialog__actions button:last-child').addEventListener('click', function () {
    // Validate mandatory fields
    var amount = document.getElementById('amount').value;
    var transactionType = document.querySelector('input[name="transactionType"]:checked');
    var categoryField = document.getElementById('category-field');
    var category = categoryField.querySelector('select').value;

    // Check if category is required and not selected
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

        // Add expense to the array
        expenses.push(expense);

        // Display the expense on the home page
        displayExpense(expense);

        // Clear the form fields
        resetForm();

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
