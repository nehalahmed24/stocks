/**
 * StockPro Real-time Dashboard & Unit Entry Logic
 */

const state = {
    // Current View Tracking
    currentView: 'dashboard',

    // Unit Management State
    units: [
        { id: 'UN-01', name: 'KG', isLinked: true }, // Mock linked state
        { id: 'UN-02', name: 'LITER', isLinked: false }
    ],
    editingUnitId: null,

    // Inventory Data
    items: [
        { id: 1, name: "Industrial Widget A", currentStock: 450, minStock: 100, category: "Hardware", dailyIn: 50, dailyOut: 30 },
        { id: 2, name: "Nano Processor X1", currentStock: 25, minStock: 50, category: "Electronics", dailyIn: 10, dailyOut: 15 },
        { id: 3, name: "Heavy Duty Cable", currentStock: 1200, minStock: 200, category: "Electrical", dailyIn: 100, dailyOut: 85 },
        { id: 4, name: "Thermal Paste TG-5", currentStock: 12, minStock: 20, category: "Accessories", dailyIn: 5, dailyOut: 8 },
        { id: 5, name: "Solid State Drive 1TB", currentStock: 85, minStock: 40, category: "Storage", dailyIn: 20, dailyOut: 12 }
    ],
    summary: {
        totalStock: 0,
        lowStockCount: 0,
        dailyInTotal: 0,
        dailyOutTotal: 0
    }
};

/**
 * Initialization
 */
function init() {
    setupNavigation();
    setupUnitForm();
    
    // Initial data sync
    updateInventoryState();
    renderDashboard();
    renderUnitsTable();
    generateNextUnitId();

    // Real-time Dashboard Update Loop
    setInterval(() => {
        if (state.currentView === 'dashboard') {
            simulateStockMovement();
            updateInventoryState();
            renderDashboard();
        }
    }, 5000);
}

/**
 * View Navigation Handling
 */
function setupNavigation() {
    const navDashboard = document.getElementById('nav-dashboard');
    const navUnitEntry = document.getElementById('nav-unit-entry');
    
    const dashboardSection = document.getElementById('dashboard-section');
    const unitEntrySection = document.getElementById('unit-entry-section');
    
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'dashboard';
        
        // UI Updates
        dashboardSection.classList.remove('hidden');
        unitEntrySection.classList.add('hidden');
        navDashboard.classList.add('active');
        navUnitEntry.classList.remove('active');
        
        pageTitle.textContent = "Dashboard Overview";
        pageSubtitle.textContent = "Welcome back! Here's what's happening today.";
        
        updateInventoryState();
        renderDashboard();
    });

    navUnitEntry.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'unit-entry';
        
        // UI Updates
        dashboardSection.classList.add('hidden');
        unitEntrySection.classList.remove('hidden');
        navDashboard.classList.remove('active');
        navUnitEntry.classList.add('active');
        
        pageTitle.textContent = "Unit Entry Management";
        pageSubtitle.textContent = "Create and manage measurement units for your inventory.";
        
        renderUnitsTable();
        generateNextUnitId();
    });
}

/**
 * --- UNIT ENTRY LOGIC ---
 */

function setupUnitForm() {
    const form = document.getElementById('unit-form');
    const nameInput = document.getElementById('unit-name');

    // Input Validation: Alphabets only + Auto Uppercase
    nameInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        // Remove non-alphabet characters
        value = value.replace(/[^A-Z]/g, '');
        e.target.value = value;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUnit();
    });
}

function generateNextUnitId() {
    if (state.editingUnitId) return; // Don't generate id if editing

    const lastId = state.units.length > 0 
        ? parseInt(state.units[state.units.length - 1].id.split('-')[1]) 
        : 0;
    
    const nextNum = (lastId + 1).toString().padStart(2, '0');
    document.getElementById('record-id').value = `UN-${nextNum}`;
}

function saveUnit() {
    const id = document.getElementById('record-id').value;
    const name = document.getElementById('unit-name').value;

    if (!name) return;

    if (state.editingUnitId) {
        // Update existing
        const index = state.units.findIndex(u => u.id === state.editingUnitId);
        if (index !== -1) {
            state.units[index].name = name;
        }
        state.editingUnitId = null;
        document.getElementById('save-unit-btn').textContent = "Save Unit";
    } else {
        // Create new
        state.units.push({ id, name, isLinked: false });
    }

    // Reset Form
    document.getElementById('unit-form').reset();
    generateNextUnitId();
    renderUnitsTable();
    
    alert(`Unit ${name} saved successfully.`);
}

function renderUnitsTable() {
    const tableBody = document.getElementById('unit-table-body');
    tableBody.innerHTML = '';

    state.units.forEach(unit => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${unit.id}</td>
            <td><strong>${unit.name}</strong></td>
            <td class="text-right">
                <div class="action-btns">
                    <button class="btn-action btn-edit" onclick="editUnit('${unit.id}')">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteUnit('${unit.id}')">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.editUnit = function(id) {
    const unit = state.units.find(u => u.id === id);
    if (!unit) return;

    state.editingUnitId = id;
    document.getElementById('record-id').value = unit.id;
    document.getElementById('unit-name').value = unit.name;
    document.getElementById('save-unit-btn').textContent = "Update Unit";
    
    // Focus the name input
    document.getElementById('unit-name').focus();
};

window.deleteUnit = function(id) {
    const unit = state.units.find(u => u.id === id);
    if (!unit) return;

    // Validation: Check if linked
    if (unit.isLinked) {
        alert(`CANNOT DELETE: This unit (${unit.name}) is currently linked to existing inventory records. Please reassign those items before deleting this unit.`);
        return;
    }

    if (confirm(`Are you sure you want to delete the unit "${unit.name}"?`)) {
        state.units = state.units.filter(u => u.id !== id);
        renderUnitsTable();
        generateNextUnitId();
    }
};

/**
 * --- DASHBOARD LOGIC ---
 */

function updateInventoryState() {
    state.summary.totalStock = state.items.reduce((acc, item) => acc + item.currentStock, 0);
    state.summary.lowStockCount = state.items.filter(item => item.currentStock <= item.minStock).length;
    state.summary.dailyInTotal = state.items.reduce((acc, item) => acc + item.dailyIn, 0);
    state.summary.dailyOutTotal = state.items.reduce((acc, item) => acc + item.dailyOut, 0);
}

function renderDashboard() {
    const totalStockEl = document.getElementById('total-stock-value');
    const lowStockEl = document.getElementById('low-stock-value');
    const dailyInEl = document.getElementById('daily-in-value');
    const dailyOutEl = document.getElementById('daily-out-value');

    if (totalStockEl) totalStockEl.textContent = state.summary.totalStock.toLocaleString();
    if (lowStockEl) lowStockEl.textContent = state.summary.lowStockCount;
    if (dailyInEl) dailyInEl.textContent = state.summary.dailyInTotal;
    if (dailyOutEl) dailyOutEl.textContent = state.summary.dailyOutTotal;

    const alertBtn = document.getElementById('alert-button');
    const alertText = alertBtn.querySelector('.alert-text');
    
    if (state.summary.lowStockCount > 0) {
        alertBtn.className = 'btn-alert critical';
        alertText.textContent = `Alert: ${state.summary.lowStockCount} Items Low`;
    } else {
        alertBtn.className = 'btn-alert normal';
        alertText.textContent = 'Status: Optimal';
    }

    refreshVisualGrid();
}

function refreshVisualGrid() {
    const bars = document.querySelectorAll('.grid-bar');
    bars.forEach(bar => {
        const height = Math.floor(Math.random() * 60) + 30;
        bar.style.height = `${height}%`;
    });
}

function simulateStockMovement() {
    state.items.forEach(item => {
        const delta = Math.floor(Math.random() * 11) - 5;
        item.currentStock = Math.max(0, item.currentStock + delta);
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
