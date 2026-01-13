// Get symbol from URL
const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get('symbol') || 'AAPL';

// Update page title
document.getElementById('stock-title').textContent = symbol;

// Store stock data
let stockData = null;

async function loadStockDetails() {
    try {
        // Load quote data using the API module
        const quoteData = await window.finnhubAPI.getStockQuote(symbol);
        
        if (!quoteData || typeof quoteData.c !== 'number') {
            throw new Error('Invalid stock data');
        }
        
        stockData = quoteData;
        updateStockDisplay();
        
        // Load company news
        loadStockNews();
        
    } catch (error) {
        console.error('Error loading stock details:', error);
        document.getElementById('current-price').textContent = 'Error loading data';
    }
}

async function loadStockNews() {
    try {
        const news = await window.finnhubAPI.getStockNews(symbol);
        updateNewsDisplay(news);
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('news-list').innerHTML = 
            '<div class="news-item">Unable to load news at this time</div>';
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

function updateNewsDisplay(news) {
    const newsList = document.getElementById('news-list');
    
    if (!news || news.length === 0) {
        newsList.innerHTML = '<div class="news-item">No news available</div>';
        return;
    }
    
    newsList.innerHTML = news.map(item => `
        <div class="news-item">
            <h4>${item.headline}</h4>
            <p>${item.summary}</p>
            ${item.url !== '#' ? `<a href="${item.url}" target="_blank" rel="noopener">Read more</a>` : ''}
        </div>
    `).join('');
}

// Load stock details on page load
loadStockDetails();

// Auto-refresh every 30 seconds
setInterval(loadStockDetails, 30000);