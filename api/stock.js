// api/stock.js - For GitHub Pages
const FINNHUB_API_KEY = '{{API_KEY}}'; // Will be replaced by GitHub Actions

async function getStockQuote(symbol) {
    try {
        if (FINNHUB_API_KEY && FINNHUB_API_KEY.startsWith('ck_')) {
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.c !== 0) {
                    return data;
                }
            }
        }
        
        // Fallback to mock data
        return generateMockQuote(symbol);
        
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return generateMockQuote(symbol);
    }
}

async function getStockNews(symbol) {
    try {
        if (FINNHUB_API_KEY && FINNHUB_API_KEY.startsWith('ck_')) {
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 30);
            
            const response = await fetch(
                `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`
            );
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data.slice(0, 5) : [];
            }
        }
        
        // Fallback to mock news
        return generateMockNews(symbol);
        
    } catch (error) {
        console.error('Error fetching news:', error);
        return generateMockNews(symbol);
    }
}

function generateMockQuote(symbol) {
    const basePrices = {
        'AAPL': 182, 'MSFT': 375, 'GOOGL': 143, 'AMZN': 175, 'TSLA': 242,
        'NVDA': 600, 'META': 350, 'NFLX': 500, 'AMD': 120, 'INTC': 45
    };
    
    const basePrice = basePrices[symbol] || 100;
    const changePercent = (Math.random() - 0.5) * 4;
    const change = (basePrice * changePercent) / 100;
    
    return {
        c: parseFloat((basePrice + change).toFixed(2)),
        d: parseFloat(change.toFixed(2)),
        dp: parseFloat(changePercent.toFixed(2)),
        h: parseFloat((basePrice + Math.random() * 5).toFixed(2)),
        l: parseFloat((basePrice - Math.random() * 5).toFixed(2)),
        o: parseFloat((basePrice + (Math.random() - 0.5) * 2).toFixed(2)),
        pc: basePrice
    };
}

function generateMockNews(symbol) {
    const companies = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft',
        'GOOGL': 'Google',
        'AMZN': 'Amazon',
        'TSLA': 'Tesla',
        'NVDA': 'NVIDIA',
        'META': 'Meta',
        'NFLX': 'Netflix',
        'AMD': 'AMD',
        'INTC': 'Intel'
    };
    
    const company = companies[symbol] || symbol;
    
    return [
        {
            headline: `${company} announces quarterly earnings`,
            summary: `${company} reported better-than-expected earnings for the last quarter, beating analysts' estimates.`,
            url: '#',
            datetime: Date.now() - 86400000
        },
        {
            headline: `Analysts raise price target for ${company}`,
            summary: `Several major analysts have increased their price targets for ${company} following recent developments.`,
            url: '#',
            datetime: Date.now() - 172800000
        }
    ];
}

// Export for use in stock.js
window.finnhubAPI = {
    getStockQuote,
    getStockNews
};