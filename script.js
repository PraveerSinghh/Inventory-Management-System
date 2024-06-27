const { jsPDF } = window.jspdf;

let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let totalSales = parseFloat(localStorage.getItem('totalSales')) || 0;
let totalProfit = parseFloat(localStorage.getItem('totalProfit')) || 0;

const categories = {
    Phone: ["Samsung", "Apple", "OnePlus", "Xiaomi", "Nokia"],
    Laptop: ["Dell", "HP", "Lenovo", "Asus", "Acer"]
};

const products = {
    Samsung: ["Galaxy S21", "Galaxy S20", "Galaxy Note 20", "Galaxy A51", "Galaxy M31"],
    Apple: ["iPhone 12", "iPhone 11", "iPhone SE", "iPhone X", "iPhone 8"],
    OnePlus: ["OnePlus 8", "OnePlus 7T", "OnePlus 7", "OnePlus 6T", "OnePlus Nord"],
    Xiaomi: ["Mi 11", "Redmi Note 10", "Poco X3", "Mi A3", "Redmi 9"],
    Nokia: ["Nokia 8.3", "Nokia 5.3", "Nokia 3.4", "Nokia 2.4", "Nokia 1.4"],
    Dell: ["XPS 13", "Inspiron 15", "Vostro 14", "Latitude 14", "G5 15"],
    HP: ["Pavilion 15", "Envy 13", "Spectre x360", "Omen 15", "EliteBook 840"],
    Lenovo: ["ThinkPad X1", "IdeaPad 3", "Legion 5", "Yoga C740", "ThinkBook 14"],
    Asus: ["ZenBook 14", "ROG Strix", "VivoBook 15", "TUF Gaming", "ExpertBook"],
    Acer: ["Aspire 5", "Nitro 5", "Swift 3", "Predator Helios", "Spin 3"]
};

document.getElementById('categoryName').addEventListener('change', function() {
    const selectedCategory = this.value;
    const brandSelect = document.getElementById('brandName');
    const productSelect = document.getElementById('itemName');

    brandSelect.innerHTML = '<option value="">Select Brand</option>';
    productSelect.innerHTML = '<option value="">Select Product</option>';

    if (selectedCategory && categories[selectedCategory]) {
        categories[selectedCategory].forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });
    }
});

document.getElementById('brandName').addEventListener('change', function() {
    const selectedBrand = this.value;
    const productSelect = document.getElementById('itemName');

    productSelect.innerHTML = '<option value="">Select Product</option>';

    if (selectedBrand && products[selectedBrand]) {
        products[selectedBrand].forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            productSelect.appendChild(option);
        });
    }
});

function validateNumber(input, maxLength) {
    const regex = new RegExp(`^\\d{1,${maxLength}}$`);
    return regex.test(input);
}

function addItem() {
    const categoryName = document.getElementById('categoryName').value;
    const brandName = document.getElementById('brandName').value;
    const itemName = document.getElementById('itemName').value;
    const itemQuantity = document.getElementById('itemQuantity').value;
    const itemPrice = document.getElementById('itemPrice').value;
    const dateAdded = new Date().toLocaleDateString();

    if (!validateNumber(itemQuantity, 4)) {
        alert('Quantity must be a number up to 4 digits.');
        return;
    }

    if (!validateNumber(itemPrice, 6)) {
        alert('Price must be a number up to 6 digits.');
        return;
    }

    if (categoryName && brandName && itemName && itemQuantity && itemPrice) {
        const newItem = {
            id: Date.now(),
            category: categoryName,
            brand: brandName,
            name: itemName,
            quantity: parseInt(itemQuantity),
            price: parseFloat(itemPrice),
            date: dateAdded
        };

        // Check if item already exists in inventory
        const itemIndex = inventory.findIndex(item => item.name === itemName);
        if (itemIndex !== -1) {
            // If item exists, update quantity and price
            inventory[itemIndex].quantity += parseInt(itemQuantity);
            inventory[itemIndex].price = parseFloat(itemPrice); // Update price to latest added price
        } else {
            // If item does not exist, add new item
            inventory.push(newItem);
        }

        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTable();
        updateStockTable();
        updateStatistics();

        // Clear input fields
        document.getElementById('categoryName').value = '';
        document.getElementById('brandName').innerHTML = '<option value="">Select Brand</option>';
        document.getElementById('itemName').innerHTML = '<option value="">Select Product</option>';
        document.getElementById('itemQuantity').value = '';
        document.getElementById('itemPrice').value = '';
    } else {
        alert('Please fill out all fields.');
    }
}

function sellItem() {
    const sellItemName = document.getElementById('sellItemName').value;
    const sellItemQuantity = document.getElementById('sellItemQuantity').value;
    const sellItemPrice = document.getElementById('sellItemPrice').value;

    if (!validateNumber(sellItemQuantity, 4)) {
        alert('Quantity must be a number up to 4 digits.');
        return;
    }

    if (!validateNumber(sellItemPrice, 6)) {
        alert('Price must be a number up to 6 digits.');
        return;
    }

    const itemIndex = inventory.findIndex(item => item.name === sellItemName);

    if (itemIndex !== -1) {
        const availableQuantity = inventory[itemIndex].quantity;

        if (parseInt(sellItemQuantity) > availableQuantity) {
            alert('Insufficient quantity in stock.');
            return;
        }

        const totalPrice = parseFloat(sellItemQuantity) * parseFloat(sellItemPrice);
        const profit = totalPrice - (parseFloat(sellItemQuantity) * inventory[itemIndex].price);

        // Update inventory
        inventory[itemIndex].quantity -= parseInt(sellItemQuantity);
        localStorage.setItem('inventory', JSON.stringify(inventory));

        // Update sales and profit
        totalSales += totalPrice;
        totalProfit += profit;
        localStorage.setItem('totalSales', totalSales);
        localStorage.setItem('totalProfit', totalProfit);

        updateInventoryTable();
        updateStockTable();
        updateStatistics();

        // Clear sell item fields
        document.getElementById('sellItemName').value = '';
        document.getElementById('sellItemQuantity').value = '';
        document.getElementById('sellItemPrice').value = '';
    } else {
        alert('Item not found in inventory.');
    }
}

function updateInventoryTable() {
    const tableBody = document.querySelector('#inventoryTable tbody');
    tableBody.innerHTML = '';

    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.category}</td>
            <td>${item.brand}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.date}</td>
            <td>
                <button onclick="editItem(${item.id})">Edit</button>
                <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateStockTable() {
    const stockTableBody = document.querySelector('#stockTable tbody');
    stockTableBody.innerHTML = '';

    const stock = {};

    inventory.forEach(item => {
        if (stock[item.name]) {
            stock[item.name] += item.quantity;
        } else {
            stock[item.name] = item.quantity;
        }
    });

    Object.keys(stock).forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product}</td>
            <td>${stock[product]}</td>
        `;
        stockTableBody.appendChild(row);
    });
}

function updateStatistics() {
    let totalQuantity = 0;
    let totalAmount = 0;

    inventory.forEach(item => {
        totalQuantity += item.quantity;
        totalAmount += item.quantity * item.price;
    });

    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalAmount').textContent = `₹${totalAmount.toFixed(2)}`;
    document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `₹${totalProfit.toFixed(2)}`;
}

function editItem(id) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        document.getElementById('categoryName').value = item.category;
        document.getElementById('brandName').innerHTML = `<option value="${item.brand}">${item.brand}</option>`;
        document.getElementById('itemName').innerHTML = `<option value="${item.name}">${item.name}</option>`;
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemPrice').value = item.price;

        deleteItem(id);
    }
}

function deleteItem(id) {
    inventory = inventory.filter(item => item.id !== id);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTable();
    updateStockTable();
    updateStatistics();
}

function generateInvoice() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Invoice", 105, 20, null, null, 'center');

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    // Add table headers
    doc.autoTable({
        startY: 40,
        head: [['Category', 'Brand', 'Product', 'Quantity', 'Price per Unit', 'Date']],
        body: inventory.map(item => [
            item.category, 
            item.brand, 
            item.name, 
            item.quantity, 
            `₹${item.price.toFixed(2)}`, 
            item.date
        ]),
        theme: 'grid',
        styles: {
            fontSize: 10,
        }
    });

    // Add totals
    const finalY = doc.autoTable.previous.finalY;
    doc.text(`Total Sales: ₹${totalSales.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Total Profit: ₹${totalProfit.toFixed(2)}`, 14, finalY + 20);

    doc.save("invoice.pdf");
}

function signup() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (username && password && confirmPassword) {
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        // Check if username already exists in local storage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.some(user => user.username === username)) {
            alert('Username already exists. Please choose a different username.');
            return;
        }

        // Store new user in local storage
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));

        // Redirect to login page
        alert('Signup successful! Please login.');
        window.location.href = 'index.html';
    } else {
        alert('Please fill out all fields.');
    }
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (username && password) {
        // Retrieve users from local storage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if username and password match
        const authenticatedUser = users.find(user => user.username === username && user.password === password);

        if (authenticatedUser) {
            alert(`Welcome, ${username}!`);
            window.location.href = 'dashboard.html'; // Redirect to dashboard or inventory management page
        } else {
            alert('Invalid username or password.');
        }
    } else {
        alert('Please fill out all fields.');
    }
}

// Initialize the tables and statistics with existing data
updateInventoryTable();
updateStockTable();
updateStatistics();
