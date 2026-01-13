// Get symbol from URL
const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get('symbol') || 'AAPL';

// Update page title
document.getElementById('stock-title').textContent = symbol;

// Store stock data
let stockData = null;

async function loadStockDetails() {
    try {
        // Load quote data
        const quoteRes = await fetch(`/.netlify/functions/finnhub?symbol=${symbol}`);
        const quoteData = await quoteRes.json();
        
        if (!quoteData || typeof quoteData.c !== 'number') {
            throw new Error('Invalid stock data');
        }
        
        stockData = quoteData;
        updateStockDisplay();
        
        // Load company profile (we'll enhance this later)
        // loadCompanyProfile();
        
        // Load news (we'll enhance this later)
        // loadStockNews();
        
    } catch (error) {
        console.error('Error loading stock details:', error);
        document.getElementById('current-price').textContent = 'Error loading data';
    }
}

function updateStockDisplay() {
    if (!stockData) return;
    
    const price = Number(stockData.c).toFixed(2);
    const change = Number(stockData.d).toFixed(2);
    const percentChange = Number(stockData.dp).toFixed(2);
    const isPositive = change >= 0;
    
    // Update price
    document.getElementById('current-price').textContent = `$${price}`;
    
    // Update change
    const changeElement = document.getElementById('price-change');
    changeElement.textContent = `${isPositive ? '+' : ''}${change} (${isPositive ? '+' : ''}${percentChange}%)`;
    changeElement.className = isPositive ? 'change up' : 'change down';
    changeElement.style.backgroundColor = isPositive ? '#d1fae5' : '#fee2e2';
    changeElement.style.padding = '6px 12px';
    changeElement.style.borderRadius = '6px';
    
    // Update price details
    document.getElementById('day-high').textContent = `$${Number(stockData.h).toFixed(2)}`;
    document.getElementById('day-low').textContent = `$${Number(stockData.l).toFixed(2)}`;
    document.getElementById('day-open').textContent = `$${Number(stockData.o).toFixed(2)}`;
    document.getElementById('prev-close').textContent = `$${Number(stockData.pc).toFixed(2)}`;
    
    // Update title
    document.getElementById('stock-title').textContent = `${symbol} - $${price}`;
}

// Load stock details on page load
loadStockDetails();

// Auto-refresh every 30 seconds
setInterval(loadStockDetails, 30000);