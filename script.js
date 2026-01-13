// script.js - COMPLETE STOCK TRADING GAME WITH CHARTS & INFO
document.addEventListener('DOMContentLoaded', function() {
    console.log('Stock Trading Game loading...');

    // ========== GAME CONFIGURATION ==========
    const GAME_CONFIG = {
        defaultStocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'],
        startingBalance: 10000,
        transactionFee: 4.99,
        taxRate: 0.001,
        demoMode: true,
        updateInterval: 30000,
        chartDays: 30
    };
        // ========== API CONFIGURATION ==========
    const API_CONFIG = {
        useRealData: true, // Set to true if you want to use real API calls
        finnhubKey: '', // Will be populated if available
        mockMode: true
    };

    // ========== GAME STATE ==========
    let gameState = {
        player: {
            id: localStorage.getItem('player_id') || generatePlayerId(),
            name: localStorage.getItem('player_name') || 'Trader',
            avatar: localStorage.getItem('player_avatar') || '👤',
            balance: parseFloat(localStorage.getItem('player_balance')) || GAME_CONFIG.startingBalance,
            portfolio: JSON.parse(localStorage.getItem('stock_game_portfolio')) || {},
            trades: JSON.parse(localStorage.getItem('stock_game_trades')) || [],
            history: JSON.parse(localStorage.getItem('player_history')) || [],
            totalInvested: 0,
            totalProfit: 0,
            rank: 1,
            level: parseInt(localStorage.getItem('player_level')) || 1,
            xp: parseInt(localStorage.getItem('player_xp')) || 0,
            achievements: JSON.parse(localStorage.getItem('player_achievements')) || [],
            joinedDate: localStorage.getItem('player_joined') || new Date().toISOString()
        },
        stocks: [],
        filteredStocks: [],
        stockHistory: JSON.parse(localStorage.getItem('stock_history')) || {},
        currentTheme: localStorage.getItem('stock_theme') || 'dark',
        currentStock: null,
        selectedStock: null,
        tradeQuantity: 1,
        leaderboard: JSON.parse(localStorage.getItem('leaderboard')) || [],
        updateInterval: null,
        gameStarted: localStorage.getItem('game_started') || new Date().toISOString(),
        chartType: '1D'
    };

    // ========== DOM ELEMENTS ==========
    const elements = {
        stockTable: document.getElementById('stock-table'),
        stockCount: document.getElementById('stock-count'),
        searchInput: document.getElementById('search'),
        searchInfo: document.getElementById('search-info'),
        loading: document.getElementById('loading'),
        themeToggle: document.getElementById('theme-toggle'),
        detailsPanel: document.getElementById('details-panel'),
        overlay: document.getElementById('overlay'),
        closePanel: document.getElementById('close-panel'),
        lastUpdated: document.getElementById('last-updated'),
        playerBalance: null,
        portfolioValue: null,
        dailyChange: null,
        playerRank: null,
        buyBtn: null,
        sellBtn: null,
        portfolioBtn: null,
        leaderboardBtn: null,
        profileBtn: null,
        newsTicker: null
    };

    // ========== INITIALIZATION ==========
    function init() {
        console.log('Initializing game...');
        
        // Add CSS animations if they don't exist
        addMissingCSS();
        
        // Create game UI
        createGameUI();
        
        // Set up theme
        initTheme();
        
        // Initialize leaderboard
        initLeaderboard();
        
        // Initialize achievements
        initAchievements();
        
        // Initialize stock history
        initStockHistory();
        
        // Load initial data
        loadInitialData();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start price updates
        startPriceUpdates();
        
        console.log('Game initialized successfully!');
    }

    // ========== ADD MISSING CSS ==========
    function addMissingCSS() {
        if (!document.getElementById('game-styles')) {
            const style = document.createElement('style');
            style.id = 'game-styles';
            style.textContent = `
                /* Chart Styles */
                .chart-container {
                    height: 200px;
                    margin: 1.5rem 0;
                    position: relative;
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    padding: 1rem;
                    background: var(--card-bg);
                }
                
                .chart-canvas {
                    width: 100%;
                    height: 100%;
                }
                
                .chart-controls {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    justify-content: center;
                }
                
                .chart-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-color);
                    color: var(--text-color);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }
                
                .chart-btn:hover {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                
                .chart-btn.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                
                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                
                .chart-title {
                    font-size: 1.1rem;
                    font-weight: bold;
                }
                
                .chart-price {
                    font-size: 1.25rem;
                    font-weight: bold;
                }
                
                .chart-change {
                    font-size: 0.9rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    margin-left: 0.5rem;
                }
                
                .chart-change.up {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                }
                
                .chart-change.down {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                
                /* Info Panel Styles */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin: 1.5rem 0;
                }
                
                .info-card {
                    padding: 1rem;
                    background: var(--bg-color);
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                }
                
                .info-card h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                
                .info-value {
                    font-size: 1.1rem;
                    font-weight: bold;
                }
                
                .info-change {
                    font-size: 0.8rem;
                    margin-top: 0.25rem;
                }
                
                .company-info {
                    margin: 1.5rem 0;
                    padding: 1rem;
                    background: var(--bg-color);
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                }
                
                .company-description {
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin: 1rem 0;
                }
                
                .stat-card {
                    text-align: center;
                    padding: 1rem;
                    background: var(--bg-color);
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                }
                
                .stat-value {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }
                
                .stat-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                
                .technical-indicators {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                    margin: 1rem 0;
                }
                
                .indicator {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: var(--bg-color);
                    border-radius: 0.5rem;
                    border: 1px solid var(--border-color);
                }
                
                .indicator-label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                
                .indicator-value {
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .indicator-value.up { color: #10b981; }
                .indicator-value.down { color: #ef4444; }
                
                /* Time markers */
                .time-markers {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                
                /* Loading spinner for charts */
                .chart-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary);
                }
                
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--border-color);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 0.5rem;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Detailed view tabs */
                .detail-tabs {
                    display: flex;
                    border-bottom: 1px solid var(--border-color);
                    margin: 1rem 0;
                }
                
                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s;
                }
                
                .tab-btn:hover {
                    color: var(--primary-color);
                }
                
                .tab-btn.active {
                    color: var(--primary-color);
                    border-bottom-color: var(--primary-color);
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                /* Performance metrics */
                .performance-metrics {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                
                .metric {
                    text-align: center;
                    padding: 1rem;
                    background: var(--bg-color);
                    border-radius: 0.75rem;
                }
                
                .metric-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }
                
                .metric-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                
                /* News Ticker */
                .news-ticker {
                    background: var(--bg-color);
                    padding: 0.75rem 1rem;
                    border-top: 1px solid var(--border-color);
                    white-space: nowrap;
                    overflow: hidden;
                    position: relative;
                }
                
                .news-content {
                    display: inline-block;
                    animation: ticker 30s linear infinite;
                    padding-left: 100%;
                }
                
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .info-grid, .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .technical-indicators {
                        grid-template-columns: 1fr;
                    }
                    
                    .performance-metrics {
                        grid-template-columns: 1fr;
                    }
                    
                    .chart-controls {
                        flex-wrap: wrap;
                    }
                    
                    .chart-btn {
                        flex: 1;
                        min-width: 60px;
                        text-align: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========== CREATE GAME UI ==========
    function createGameUI() {
        // Create game header
        if (!document.querySelector('.game-header')) {
            const xpForNextLevel = calculateXPForLevel(gameState.player.level + 1);
            const xpPercent = Math.min((gameState.player.xp / xpForNextLevel) * 100, 100);
            
            const gameHeaderHTML = `
                <div class="game-header">
                    <div class="player-info">
                        <div class="player-avatar-display" style="display: flex; align-items: center; gap: 1rem;">
                            <div class="player-avatar" id="profile-toggle">
                                ${gameState.player.avatar}
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <strong style="font-size: 1.1rem;">${gameState.player.name}</strong>
                                    <span class="level-badge">Lvl ${gameState.player.level}</span>
                                </div>
                                <div class="xp-bar">
                                    <div class="xp-fill" style="width: ${xpPercent}%"></div>
                                </div>
                                <small style="color: var(--text-secondary); font-size: 0.8rem;">${gameState.player.xp}/${xpForNextLevel} XP</small>
                            </div>
                        </div>
                        <div class="player-stats">
                            <div class="stat">
                                <span class="stat-label">💰 Balance</span>
                                <span id="player-balance" class="stat-value">$${gameState.player.balance.toFixed(2)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">📈 Portfolio</span>
                                <span id="portfolio-value" class="stat-value">$${calculatePortfolioValue().toFixed(2)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">📊 Today</span>
                                <span id="daily-change" class="stat-value">+$0.00</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">🏆 Rank</span>
                                <span id="player-rank" class="stat-value">#${gameState.player.rank}</span>
                            </div>
                        </div>
                    </div>
                    <div class="game-controls">
                        <button id="buy-btn" class="game-btn" disabled>🛒 Buy</button>
                        <button id="sell-btn" class="game-btn" disabled>💰 Sell</button>
                        <button id="portfolio-btn" class="game-btn">📊 Portfolio</button>
                        <button id="leaderboard-btn" class="game-btn">🏆 Leaderboard</button>
                    </div>
                </div>
            `;
            
            const header = document.querySelector('header');
            if (header) {
                header.insertAdjacentHTML('afterend', gameHeaderHTML);
            } else {
                document.body.insertAdjacentHTML('afterbegin', gameHeaderHTML);
            }
        }
        
        // Cache elements
        elements.playerBalance = document.getElementById('player-balance');
        elements.portfolioValue = document.getElementById('portfolio-value');
        elements.dailyChange = document.getElementById('daily-change');
        elements.playerRank = document.getElementById('player-rank');
        elements.buyBtn = document.getElementById('buy-btn');
        elements.sellBtn = document.getElementById('sell-btn');
        elements.portfolioBtn = document.getElementById('portfolio-btn');
        elements.leaderboardBtn = document.getElementById('leaderboard-btn');
        elements.profileToggle = document.getElementById('profile-toggle');
        
        // Create news ticker (don't call updateNewsTicker yet - it will be called after data loads)
        if (!document.querySelector('.news-ticker')) {
            const newsHTML = `
                <div class="news-ticker">
                    <div class="news-content">
                        📈 Welcome to Stock Trader Challenge! • 💰 Starting Balance: $10,000 • 🏆 Compete with friends • 📊 Real-time prices • 🚀 Make your first trade to begin!
                    </div>
                </div>
            `;
            document.querySelector('main').insertAdjacentHTML('beforeend', newsHTML);
        }
    }

    // ========== THEME MANAGEMENT ==========
    function initTheme() {
        document.documentElement.setAttribute('data-theme', gameState.currentTheme);
        if (elements.themeToggle) {
            elements.themeToggle.textContent = gameState.currentTheme === 'dark' 
                ? '☀️ Light Mode' 
                : '🌙 Dark Mode';
        }
    }

    // ========== STOCK HISTORY SYSTEM ==========
    function initStockHistory() {
        // Initialize empty history for each stock if not exists
        GAME_CONFIG.defaultStocks.forEach(symbol => {
            if (!gameState.stockHistory[symbol]) {
                gameState.stockHistory[symbol] = generateInitialHistory(symbol);
            }
        });
        saveStockHistory();
    }

    function generateInitialHistory(symbol) {
        const basePrices = {
            'AAPL': 182, 'MSFT': 375, 'GOOGL': 143, 'AMZN': 175, 'TSLA': 242,
            'NVDA': 600, 'META': 350, 'NFLX': 500, 'AMD': 120, 'INTC': 45
        };
        
        const basePrice = basePrices[symbol] || 100;
        const history = [];
        const now = new Date();
        
        // Generate 30 days of historical data
        for (let i = GAME_CONFIG.chartDays; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add some random walk to the price
            const randomChange = (Math.random() - 0.5) * 0.02;
            const prevPrice = history.length > 0 ? history[history.length - 1].price : basePrice;
            const price = i === 0 ? basePrice : prevPrice * (1 + randomChange);
            
            const volume = Math.floor(Math.random() * 10000000) + 1000000;
            
            history.push({
                date: date.toISOString().split('T')[0],
                price: parseFloat(price.toFixed(2)),
                volume: volume,
                open: parseFloat((price * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
                high: parseFloat((price * (1 + Math.random() * 0.02)).toFixed(2)),
                low: parseFloat((price * (1 - Math.random() * 0.02)).toFixed(2)),
                close: parseFloat(price.toFixed(2))
            });
        }
        
        return history;
    }

    function updateStockHistory(symbol, currentPrice, volume) {
        if (!gameState.stockHistory[symbol]) {
            gameState.stockHistory[symbol] = [];
        }
        
        const today = new Date().toISOString().split('T')[0];
        const lastEntry = gameState.stockHistory[symbol][gameState.stockHistory[symbol].length - 1];
        
        if (lastEntry && lastEntry.date === today) {
            // Update today's entry
            lastEntry.close = currentPrice;
            lastEntry.volume = volume;
            if (currentPrice > lastEntry.high) lastEntry.high = currentPrice;
            if (currentPrice < lastEntry.low) lastEntry.low = currentPrice;
        } else {
            // Add new day entry
            const newEntry = {
                date: today,
                price: currentPrice,
                volume: volume,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice
            };
            gameState.stockHistory[symbol].push(newEntry);
            
            // Keep only last N days
            if (gameState.stockHistory[symbol].length > GAME_CONFIG.chartDays) {
                gameState.stockHistory[symbol] = gameState.stockHistory[symbol].slice(-GAME_CONFIG.chartDays);
            }
        }
        
        saveStockHistory();
    }

    function saveStockHistory() {
        localStorage.setItem('stock_history', JSON.stringify(gameState.stockHistory));
    }

    // ========== NEWS TICKER FUNCTION ==========
    function updateNewsTicker() {
        const newsTicker = document.querySelector('.news-ticker');
        if (!newsTicker) return;
        
        const newsItems = [
            `💰 Balance: $${gameState.player.balance.toFixed(2)} • 📈 Portfolio: $${calculatePortfolioValue().toFixed(2)}`,
            `🏆 Rank: #${gameState.player.rank} • 📊 Today's P/L: $${calculateDailyChange().toFixed(2)}`,
            `🎮 Level ${gameState.player.level} Trader • ⭐ ${gameState.player.achievements.filter(a => a.earned).length} achievements unlocked`,
            `📈 ${gameState.player.trades.length} trades made • 📦 ${Object.keys(gameState.player.portfolio).length} stocks in portfolio`
        ];
        
        const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
        const newsContent = document.querySelector('.news-content');
        if (newsContent) {
            newsContent.textContent = randomNews;
        }
    }

    // ========== CHART SYSTEM ==========
    function createStockChart(symbol) {
        const history = gameState.stockHistory[symbol];
        if (!history || history.length < 2) {
            const container = document.createElement('div');
            container.className = 'chart-loading';
            container.innerHTML = '<div class="spinner"></div>Loading chart...';
            return container;
        }
        
        const container = document.createElement('div');
        container.className = 'chart-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'chart-canvas';
        container.appendChild(canvas);
        
        // Chart controls
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        
        const periods = [
            { label: '1D', days: 1 },
            { label: '1W', days: 7 },
            { label: '1M', days: 30 },
            { label: '3M', days: 90 }
        ];
        
        periods.forEach(period => {
            const btn = document.createElement('button');
            btn.className = `chart-btn ${gameState.chartType === period.label ? 'active' : ''}`;
            btn.textContent = period.label;
            btn.onclick = () => {
                gameState.chartType = period.label;
                renderChart(symbol, canvas, period.days);
                controls.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            controls.appendChild(btn);
        });
        
        container.appendChild(controls);
        
        // Initial render
        setTimeout(() => {
            renderChart(symbol, canvas, getDaysFromChartType(gameState.chartType));
        }, 100);
        
        return container;
    }

    function renderChart(symbol, canvas, days) {
        const history = gameState.stockHistory[symbol];
        if (!history) return;
        
        // Get data for selected period
        const data = history.slice(-days);
        if (data.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate min and max prices
        const prices = data.map(d => d.price);
        const volumes = data.map(d => d.volume);
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const maxVolume = Math.max(...volumes);
        
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2 - 30;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        const priceSteps = 5;
        for (let i = 0; i <= priceSteps; i++) {
            const y = padding + (chartHeight * (1 - i / priceSteps));
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            // Price labels
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            const price = minPrice + (maxPrice - minPrice) * (i / priceSteps);
            ctx.fillText('$' + price.toFixed(2), padding - 5, y + 3);
        }
        
        // Draw price line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, i) => {
            const x = padding + (chartWidth * (i / (data.length - 1)));
            const y = padding + chartHeight * (1 - (point.price - minPrice) / (maxPrice - minPrice));
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Fill under line
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        
        data.forEach((point, i) => {
            const x = padding + (chartWidth * (i / (data.length - 1)));
            const y = padding + chartHeight * (1 - (point.price - minPrice) / (maxPrice - minPrice));
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(width - padding, padding + chartHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw volume bars
        const volumeHeight = 30;
        const volumeTop = height - volumeHeight;
        
        data.forEach((point, i) => {
            const x = padding + (chartWidth * (i / (data.length - 1)));
            const barWidth = Math.max(1, chartWidth / data.length - 1);
            const barHeight = (point.volume / maxVolume) * volumeHeight;
            
            ctx.fillStyle = point.close >= point.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(x - barWidth/2, volumeTop + volumeHeight - barHeight, barWidth, barHeight);
        });
        
        // Draw current price indicator
        const currentPrice = data[data.length - 1].price;
        const y = padding + chartHeight * (1 - (currentPrice - minPrice) / (maxPrice - minPrice));
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(width - padding, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add price label
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('$' + currentPrice.toFixed(2), width - padding - 10, y - 10);
        
        // Add date labels
        if (data.length > 1) {
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            
            const firstDate = new Date(data[0].date);
            const lastDate = new Date(data[data.length - 1].date);
            
            ctx.fillText(formatDate(firstDate), padding, height - 10);
            ctx.fillText(formatDate(lastDate), width - padding, height - 10);
            
            if (data.length > 2) {
                const midIndex = Math.floor(data.length / 2);
                const midDate = new Date(data[midIndex].date);
                const midX = padding + (chartWidth * (midIndex / (data.length - 1)));
                ctx.fillText(formatDate(midDate), midX, height - 10);
            }
        }
    }

    function getDaysFromChartType(type) {
        switch(type) {
            case '1D': return 1;
            case '1W': return 7;
            case '1M': return 30;
            case '3M': return 90;
            default: return 30;
        }
    }

    function formatDate(date) {
        if (gameState.chartType === '1D') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    // ========== STOCK INFORMATION SYSTEM ==========
    function getStockInfo(symbol) {
        const info = {
            'AAPL': {
                name: 'Apple Inc.',
                sector: 'Technology',
                industry: 'Consumer Electronics',
                description: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
                employees: '164,000',
                marketCap: '2.8T',
                peRatio: 28.5,
                dividendYield: '0.5%',
                beta: 1.2,
                avgVolume: '55M',
                yearHigh: 198.23,
                yearLow: 124.17
            },
            'MSFT': {
                name: 'Microsoft Corporation',
                sector: 'Technology',
                industry: 'Software',
                description: 'Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide.',
                employees: '221,000',
                marketCap: '3.0T',
                peRatio: 35.2,
                dividendYield: '0.7%',
                beta: 0.9,
                avgVolume: '25M',
                yearHigh: 420.82,
                yearLow: 219.35
            },
            'GOOGL': {
                name: 'Alphabet Inc.',
                sector: 'Technology',
                industry: 'Internet',
                description: 'Alphabet is a holding company with Google as its main subsidiary, providing internet-related services and products.',
                employees: '190,234',
                marketCap: '1.8T',
                peRatio: 24.8,
                dividendYield: 'N/A',
                beta: 1.1,
                avgVolume: '30M',
                yearHigh: 153.78,
                yearLow: 88.12
            },
            'AMZN': {
                name: 'Amazon.com Inc.',
                sector: 'Consumer Cyclical',
                industry: 'Internet Retail',
                description: 'Amazon operates as an online retailer and web services provider in North America and internationally.',
                employees: '1,608,000',
                marketCap: '1.6T',
                peRatio: 76.3,
                dividendYield: 'N/A',
                beta: 1.2,
                avgVolume: '45M',
                yearHigh: 189.77,
                yearLow: 88.12
            },
            'TSLA': {
                name: 'Tesla Inc.',
                sector: 'Consumer Cyclical',
                industry: 'Auto Manufacturers',
                description: 'Tesla designs, develops, manufactures, leases, and sells electric vehicles and energy generation and storage systems.',
                employees: '140,473',
                marketCap: '780B',
                peRatio: 65.4,
                dividendYield: 'N/A',
                beta: 2.0,
                avgVolume: '110M',
                yearHigh: 299.29,
                yearLow: 152.37
            },
            'NVDA': {
                name: 'NVIDIA Corporation',
                sector: 'Technology',
                industry: 'Semiconductors',
                description: 'NVIDIA provides graphics, computing, and networking solutions worldwide.',
                employees: '26,196',
                marketCap: '1.5T',
                peRatio: 60.2,
                dividendYield: '0.03%',
                beta: 1.7,
                avgVolume: '45M',
                yearHigh: 974.00,
                yearLow: 255.10
            },
            'META': {
                name: 'Meta Platforms Inc.',
                sector: 'Technology',
                industry: 'Internet',
                description: 'Meta develops products that enable people to connect and share with friends and family through mobile devices and computers.',
                employees: '86,482',
                marketCap: '1.2T',
                peRatio: 32.1,
                dividendYield: '0.5%',
                beta: 1.3,
                avgVolume: '18M',
                yearHigh: 531.49,
                yearLow: 172.01
            },
            'NFLX': {
                name: 'Netflix Inc.',
                sector: 'Communication Services',
                industry: 'Entertainment',
                description: 'Netflix provides subscription streaming entertainment service including TV series, films, and games.',
                employees: '13,000',
                marketCap: '240B',
                peRatio: 48.5,
                dividendYield: 'N/A',
                beta: 1.2,
                avgVolume: '5M',
                yearHigh: 639.00,
                yearLow: 285.33
            },
            'AMD': {
                name: 'Advanced Micro Devices',
                sector: 'Technology',
                industry: 'Semiconductors',
                description: 'AMD operates as a semiconductor company worldwide, providing processors and graphics cards.',
                employees: '25,000',
                marketCap: '260B',
                peRatio: 320.5,
                dividendYield: 'N/A',
                beta: 1.8,
                avgVolume: '60M',
                yearHigh: 227.30,
                yearLow: 96.30
            },
            'INTC': {
                name: 'Intel Corporation',
                sector: 'Technology',
                industry: 'Semiconductors',
                description: 'Intel designs, manufactures, and sells computer components and related products worldwide.',
                employees: '131,900',
                marketCap: '190B',
                peRatio: 110.2,
                dividendYield: '1.6%',
                beta: 0.7,
                avgVolume: '45M',
                yearHigh: 51.28,
                yearLow: 29.73
            }
        };
        
        return info[symbol] || {
            name: symbol,
            sector: 'Unknown',
            industry: 'Unknown',
            description: 'Company information not available.',
            employees: 'N/A',
            marketCap: 'N/A',
            peRatio: 'N/A',
            dividendYield: 'N/A',
            beta: 'N/A',
            avgVolume: 'N/A',
            yearHigh: 0,
            yearLow: 0
        };
    }

    function calculateTechnicalIndicators(symbol) {
        const history = gameState.stockHistory[symbol];
        if (!history || history.length < 20) return {};
        
        const prices = history.map(h => h.price);
        const volumes = history.map(h => h.volume);
        
        // Simple Moving Average (20-day)
        const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
        
        // Relative Strength Index (14-day)
        const recentPrices = prices.slice(-15);
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i < recentPrices.length; i++) {
            const change = recentPrices[i] - recentPrices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        // MACD (12,26,9)
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        const macd = ema12 - ema26;
        
        // Bollinger Bands
        const recent20Prices = prices.slice(-20);
        const stdDev = calculateStdDev(recent20Prices);
        const upperBand = sma20 + (stdDev * 2);
        const lowerBand = sma20 - (stdDev * 2);
        
        // Volume analysis
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const currentVolume = volumes[volumes.length - 1];
        const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
        
        return {
            sma20: sma20,
            rsi: rsi,
            macd: macd,
            upperBand: upperBand,
            lowerBand: lowerBand,
            volumeRatio: volumeRatio,
            trend: prices[prices.length - 1] > sma20 ? 'up' : 'down',
            momentum: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
        };
    }

    function calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }

    function calculateStdDev(values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return Math.sqrt(avgSquareDiff);
    }

    // ========== UTILITY FUNCTIONS ==========
    function generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    function calculateXPForLevel(level) {
        return level * 100;
    }

    function calculatePortfolioValue() {
        let total = gameState.player.balance;
        let totalInvested = 0;
        
        for (const [symbol, holding] of Object.entries(gameState.player.portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                total += holding.shares * stock.price;
                totalInvested += holding.shares * holding.avgPrice;
            }
        }
        
        gameState.player.totalInvested = totalInvested;
        gameState.player.totalProfit = total - GAME_CONFIG.startingBalance;
        
        return total;
    }

    function calculateDailyChange() {
        let totalChange = 0;
        
        for (const [symbol, holding] of Object.entries(gameState.player.portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                const stockData = gameState.stocks.find(s => s.symbol === symbol);
                if (stockData) {
                    totalChange += holding.shares * stockData.change;
                }
            }
        }
        
        return totalChange;
    }

    // ========== DATA LOADING ==========
    function loadInitialData() {
        console.log('Loading initial data...');
        
        if (elements.loading) {
            elements.loading.style.display = 'block';
        }
        
        setTimeout(() => {
            gameState.stocks = GAME_CONFIG.defaultStocks.map(symbol => generateMockStock(symbol));
            gameState.filteredStocks = [...gameState.stocks];
            
            if (elements.loading) {
                elements.loading.style.display = 'none';
            }
            
            renderTable();
            updateGameUI();
            updateStockCount();
            updateLastUpdated();
            updateNewsTicker(); // Now it's safe to call
            
            // Check achievements on load
            checkAchievements();
            
            console.log('Data loaded:', gameState.stocks);
        }, 1000);
    }

    function generateMockStock(symbol) {
        const basePrices = {
            'AAPL': 182, 'MSFT': 375, 'GOOGL': 143, 'AMZN': 175, 'TSLA': 242,
            'NVDA': 600, 'META': 350, 'NFLX': 500, 'AMD': 120, 'INTC': 45
        };
        
        const basePrice = basePrices[symbol] || 100;
        const changePercent = (Math.random() - 0.5) * 4;
        const change = (basePrice * changePercent) / 100;
        const price = basePrice + change;
        
        const dayHigh = price + Math.random() * 5;
        const dayLow = price - Math.random() * 5;
        const volume = Math.floor(Math.random() * 10000000) + 1000000;
        
        return {
            symbol: symbol,
            name: getCompanyName(symbol),
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            dayHigh: parseFloat(dayHigh.toFixed(2)),
            dayLow: parseFloat(dayLow.toFixed(2)),
            volume: volume,
            open: parseFloat((basePrice + (Math.random() - 0.5) * 2).toFixed(2)),
            previousClose: basePrice
        };
    }

    function getCompanyName(symbol) {
        const names = {
            'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corporation',
            'GOOGL': 'Alphabet Inc.', 'AMZN': 'Amazon.com Inc.',
            'TSLA': 'Tesla Inc.', 'NVDA': 'NVIDIA Corporation',
            'META': 'Meta Platforms Inc.', 'NFLX': 'Netflix Inc.',
            'AMD': 'Advanced Micro Devices', 'INTC': 'Intel Corporation'
        };
        return names[symbol] || symbol;
    }

    // ========== TABLE RENDERING ==========
    function renderTable() {
        if (!elements.stockTable) return;
        
        elements.stockTable.innerHTML = '';
        
        if (gameState.filteredStocks.length === 0) {
            elements.stockTable.innerHTML = `
                <tr>
                    <td colspan="5" class="no-results">No stocks found. Try a different search.</td>
                </tr>
            `;
            return;
        }
        
        gameState.filteredStocks.forEach(stock => {
            const row = document.createElement('tr');
            row.className = 'stock-row';
            row.dataset.symbol = stock.symbol;
            
            const changeClass = stock.change >= 0 ? 'up' : 'down';
            const changeSign = stock.change >= 0 ? '+' : '';
            
            const owned = gameState.player.portfolio[stock.symbol];
            const ownedHTML = owned ? `<div class="owned-badge">📦 ${owned.shares} shares</div>` : '';
            
            row.innerHTML = `
                <td>
                    <strong>${stock.symbol}</strong>
                    <br><small>${stock.name}</small>
                    ${ownedHTML}
                </td>
                <td>$${stock.price.toFixed(2)}</td>
                <td class="${changeClass}">${changeSign}$${Math.abs(stock.change).toFixed(2)}</td>
                <td class="${changeClass}">${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%</td>
                <td>
                    <button class="fav-star" data-symbol="${stock.symbol}">☆</button>
                </td>
            `;
            
            elements.stockTable.appendChild(row);
        });
    }

    function updateStockCount() {
        if (elements.stockCount) {
            elements.stockCount.textContent = gameState.filteredStocks.length;
        }
    }

    function updateLastUpdated() {
        if (elements.lastUpdated) {
            const now = new Date();
            elements.lastUpdated.textContent = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // ========== GAME UI UPDATES ==========
    function updateGameUI() {
        // Update balance
        if (elements.playerBalance) {
            elements.playerBalance.textContent = `$${gameState.player.balance.toFixed(2)}`;
        }
        
        // Update portfolio value
        const portfolioValue = calculatePortfolioValue();
        if (elements.portfolioValue) {
            elements.portfolioValue.textContent = `$${portfolioValue.toFixed(2)}`;
        }
        
        // Update daily change
        if (elements.dailyChange) {
            const change = calculateDailyChange();
            const changeClass = change >= 0 ? 'up' : 'down';
            elements.dailyChange.textContent = `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
            elements.dailyChange.className = `stat-value ${changeClass}`;
        }
        
        // Update trade buttons
        updateTradeButtonStates();
        
        // Save game state
        saveGameState();
    }

    function updateTradeButtonStates() {
        if (!elements.buyBtn || !elements.sellBtn) return;
        
        const hasStock = !!gameState.currentStock;
        const hasShares = hasStock && gameState.player.portfolio[gameState.currentStock?.symbol]?.shares > 0;
        
        elements.buyBtn.disabled = !hasStock;
        elements.sellBtn.disabled = !hasStock || !hasShares;
    }

    // ========== LEADERBOARD ==========
    function initLeaderboard() {
        if (gameState.leaderboard.length === 0) {
            gameState.leaderboard = [
                { id: 'player1', name: 'WallStreetWolf', portfolioValue: 12500, profit: 2500, trades: 15, level: 5 },
                { id: gameState.player.id, name: gameState.player.name, portfolioValue: 10000, profit: 0, trades: 0, level: 1 },
                { id: 'player2', name: 'StockGuru', portfolioValue: 9800, profit: -200, trades: 8, level: 3 },
                { id: 'player3', name: 'BullMarket', portfolioValue: 11000, profit: 1000, trades: 12, level: 4 },
                { id: 'player4', name: 'TraderPro', portfolioValue: 9500, profit: -500, trades: 5, level: 2 }
            ];
            saveLeaderboard();
        }
        updateLeaderboard();
    }

    function updateLeaderboard() {
        gameState.leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);
        
        gameState.leaderboard.forEach((player, index) => {
            player.rank = index + 1;
            if (player.id === gameState.player.id) {
                gameState.player.rank = player.rank;
                if (elements.playerRank) {
                    elements.playerRank.textContent = `#${player.rank}`;
                }
            }
        });
        
        saveLeaderboard();
    }

    function saveLeaderboard() {
        localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
    }

    // ========== ACHIEVEMENTS SYSTEM ==========
    function initAchievements() {
        const defaultAchievements = [
            { id: 'first_trade', name: 'First Trade', description: 'Make your first trade', earned: false, xp: 50 },
            { id: 'profit_500', name: 'Profit Maker', description: 'Make $500 profit', earned: false, xp: 100 },
            { id: 'balance_15000', name: 'Balance Master', description: 'Reach $15,000 balance', earned: false, xp: 150 },
            { id: 'trader_10', name: 'Active Trader', description: 'Make 10 trades', earned: false, xp: 200 },
            { id: 'diversify_5', name: 'Diversifier', description: 'Own 5 different stocks', earned: false, xp: 250 },
            { id: 'top_3', name: 'Top Ranker', description: 'Reach top 3 in leaderboard', earned: false, xp: 500 }
        ];
        
        if (gameState.player.achievements.length === 0) {
            gameState.player.achievements = defaultAchievements;
            saveGameState();
        }
    }

    function checkAchievements() {
        let newAchievements = [];
        
        gameState.player.achievements.forEach(achievement => {
            if (!achievement.earned) {
                let earned = false;
                
                switch(achievement.id) {
                    case 'first_trade':
                        earned = gameState.player.trades.length > 0;
                        break;
                    case 'profit_500':
                        earned = gameState.player.totalProfit >= 500;
                        break;
                    case 'balance_15000':
                        earned = gameState.player.balance >= 15000;
                        break;
                    case 'trader_10':
                        earned = gameState.player.trades.length >= 10;
                        break;
                    case 'diversify_5':
                        earned = Object.keys(gameState.player.portfolio).length >= 5;
                        break;
                    case 'top_3':
                        earned = gameState.player.rank <= 3;
                        break;
                }
                
                if (earned) {
                    achievement.earned = true;
                    achievement.earnedDate = new Date().toISOString();
                    newAchievements.push(achievement);
                    addXP(achievement.xp);
                }
            }
        });
        
        if (newAchievements.length > 0) {
            saveGameState();
            newAchievements.forEach(achievement => {
                showNotification(`🏆 Achievement Unlocked: ${achievement.name} (+${achievement.xp} XP)`, 'xp');
            });
        }
    }

    function addXP(amount) {
        gameState.player.xp += amount;
        
        // Check for level up
        const xpNeeded = calculateXPForLevel(gameState.player.level + 1);
        if (gameState.player.xp >= xpNeeded) {
            gameState.player.level++;
            gameState.player.xp = gameState.player.xp - xpNeeded;
            showNotification(`🎉 Level Up! You are now Level ${gameState.player.level}`, 'success');
        }
        
        saveGameState();
        updateHeaderXP();
    }

    function updateHeaderXP() {
        const xpBar = document.querySelector('.xp-fill');
        const xpText = document.querySelector('.xp-bar + small');
        const levelBadge = document.querySelector('.level-badge');
        
        if (xpBar && xpText && levelBadge) {
            const xpForNextLevel = calculateXPForLevel(gameState.player.level + 1);
            const xpPercent = Math.min((gameState.player.xp / xpForNextLevel) * 100, 100);
            
            xpBar.style.width = `${xpPercent}%`;
            xpText.textContent = `${gameState.player.xp}/${xpForNextLevel} XP`;
            levelBadge.textContent = `Lvl ${gameState.player.level}`;
        }
    }

    // ========== PRICE UPDATES ==========
    function startPriceUpdates() {
        gameState.updateInterval = setInterval(() => {
            updateStockPrices();
        }, GAME_CONFIG.updateInterval);
    }

    function updateStockPrices() {
        gameState.stocks.forEach(stock => {
            // Random price movement (±2%)
            const changePercent = (Math.random() - 0.5) * 4;
            const change = (stock.price * changePercent) / 100;
            
            // Update price and change
            const newPrice = parseFloat((stock.price + change).toFixed(2));
            stock.change = parseFloat((stock.change + change).toFixed(2));
            stock.changePercent = parseFloat(((newPrice - stock.previousClose) / stock.previousClose * 100).toFixed(2));
            stock.price = newPrice;
            
            // Update high/low
            if (stock.price > stock.dayHigh) stock.dayHigh = stock.price;
            if (stock.price < stock.dayLow) stock.dayLow = stock.price;
            
            // Update volume
            stock.volume += Math.floor(Math.random() * 1000000);
            
            // Update history
            updateStockHistory(stock.symbol, stock.price, stock.volume);
        });
        
        gameState.filteredStocks = [...gameState.stocks];
        renderTable();
        updateGameUI();
        updateLastUpdated();
        updateNewsTicker();
        
        showNotification('Stock prices updated!', 'info');
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', function() {
                gameState.currentTheme = gameState.currentTheme === 'light' ? 'dark' : 'light';
                localStorage.setItem('stock_theme', gameState.currentTheme);
                initTheme();
                showNotification(`${gameState.currentTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
            });
        }
        
        // Search
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', function() {
                const term = this.value.toLowerCase().trim();
                if (term === '') {
                    gameState.filteredStocks = [...gameState.stocks];
                    if (elements.searchInfo) {
                        elements.searchInfo.textContent = '';
                    }
                } else {
                    gameState.filteredStocks = gameState.stocks.filter(stock => 
                        stock.symbol.toLowerCase().includes(term) ||
                        stock.name.toLowerCase().includes(term)
                    );
                    if (elements.searchInfo) {
                        elements.searchInfo.textContent = `Found ${gameState.filteredStocks.length} stock(s)`;
                    }
                }
                renderTable();
                updateStockCount();
            });
        }
        
        // Game buttons
        if (elements.buyBtn) {
            elements.buyBtn.addEventListener('click', () => {
                if (gameState.currentStock) {
                    showTradeModal('buy');
                } else {
                    showNotification('Please select a stock first', 'error');
                }
            });
        }
        
        if (elements.sellBtn) {
            elements.sellBtn.addEventListener('click', () => {
                if (gameState.currentStock) {
                    showTradeModal('sell');
                } else {
                    showNotification('Please select a stock first', 'error');
                }
            });
        }
        
        if (elements.portfolioBtn) {
            elements.portfolioBtn.addEventListener('click', showPortfolio);
        }
        
        if (elements.leaderboardBtn) {
            elements.leaderboardBtn.addEventListener('click', showLeaderboard);
        }
        
        if (elements.profileToggle) {
            elements.profileToggle.addEventListener('click', showProfile);
        }
        
        // Stock row clicks
        document.addEventListener('click', (e) => {
            const stockRow = e.target.closest('.stock-row');
            if (stockRow && !e.target.closest('.fav-star')) {
                handleStockSelect(stockRow);
            }
            
            const favStar = e.target.closest('.fav-star');
            if (favStar) {
                toggleFavorite(favStar.dataset.symbol, favStar);
            }
        });
        
        // Double click on stock row for detailed view
        document.addEventListener('dblclick', (e) => {
            const stockRow = e.target.closest('.stock-row');
            if (stockRow) {
                const symbol = stockRow.dataset.symbol;
                showStockDetails(symbol);
            }
        });
    }

    function handleStockSelect(stockRow) {
        const symbol = stockRow.dataset.symbol;
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (stock) {
            document.querySelectorAll('.stock-row').forEach(row => {
                row.classList.remove('selected');
            });
            
            stockRow.classList.add('selected');
            
            gameState.currentStock = stock;
            updateTradeButtonStates();
        }
    }

    function toggleFavorite(symbol, starElement) {
        starElement.textContent = starElement.textContent === '☆' ? '★' : '☆';
        showNotification(`${symbol} ${starElement.textContent === '★' ? 'added to' : 'removed from'} favorites`, 'success');
    }

    // ========== DETAILED STOCK VIEW ==========
    function showStockDetails(symbol) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (!stock) return;
        
        const info = getStockInfo(symbol);
        const owned = gameState.player.portfolio[symbol];
        const indicators = calculateTechnicalIndicators(symbol);
        const history = gameState.stockHistory[symbol];
        
        const changeClass = stock.change >= 0 ? 'up' : 'down';
        const changeSign = stock.change >= 0 ? '+' : '';
        
        // Calculate performance metrics
        const currentPrice = stock.price;
        const yearHigh = info.yearHigh;
        const yearLow = info.yearLow;
        const fromYearHigh = ((currentPrice - yearHigh) / yearHigh * 100).toFixed(1);
        const fromYearLow = ((currentPrice - yearLow) / yearLow * 100).toFixed(1);
        const yearRange = yearHigh - yearLow;
        const currentPosition = yearRange > 0 ? ((currentPrice - yearLow) / yearRange * 100).toFixed(1) : 0;
        
        const modalHTML = `
            <div class="stock-details-modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <div>
                            <h3 style="margin: 0;">${symbol} - ${info.name}</h3>
                            <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem;">
                                <span class="chart-price">$${stock.price.toFixed(2)}</span>
                                <span class="chart-change ${changeClass}">
                                    ${changeSign}$${Math.abs(stock.change).toFixed(2)} (${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%)
                                </span>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">${info.sector} • ${info.industry}</span>
                            </div>
                        </div>
                        <button class="close-details-btn close-btn">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="detail-tabs">
                            <button class="tab-btn active" data-tab="chart">📈 Chart</button>
                            <button class="tab-btn" data-tab="info">📊 Info</button>
                            <button class="tab-btn" data-tab="stats">📋 Stats</button>
                            <button class="tab-btn" data-tab="technical">⚙️ Technical</button>
                            ${owned ? '<button class="tab-btn" data-tab="holding">📦 Holding</button>' : ''}
                        </div>
                        
                        <div id="tab-chart" class="tab-content active">
                            ${createStockChart(symbol).outerHTML}
                            
                            <div class="performance-metrics">
                                <div class="metric">
                                    <div class="metric-value ${currentPrice > (indicators.sma20 || 0) ? 'up' : 'down'}">
                                        ${currentPrice > (indicators.sma20 || 0) ? '↑' : '↓'} $${Math.abs(currentPrice - (indicators.sma20 || currentPrice)).toFixed(2)}
                                    </div>
                                    <div class="metric-label">vs 20-Day Avg</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">
                                        ${indicators.rsi ? indicators.rsi.toFixed(1) : 'N/A'}
                                    </div>
                                    <div class="metric-label">RSI (14)</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">
                                        ${currentPosition}%
                                    </div>
                                    <div class="metric-label">52W Range</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value ${stock.change >= 0 ? 'up' : 'down'}">
                                        ${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%
                                    </div>
                                    <div class="metric-label">Today</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="tab-info" class="tab-content">
                            <div class="company-info">
                                <h4>Company Description</h4>
                                <p class="company-description">${info.description}</p>
                            </div>
                            
                            <div class="info-grid">
                                <div class="info-card">
                                    <h4>Market Cap</h4>
                                    <div class="info-value">$${info.marketCap}</div>
                                </div>
                                <div class="info-card">
                                    <h4>P/E Ratio</h4>
                                    <div class="info-value">${info.peRatio}</div>
                                </div>
                                <div class="info-card">
                                    <h4>Dividend Yield</h4>
                                    <div class="info-value">${info.dividendYield}</div>
                                </div>
                                <div class="info-card">
                                    <h4>Beta</h4>
                                    <div class="info-value">${info.beta}</div>
                                </div>
                                <div class="info-card">
                                    <h4>Employees</h4>
                                    <div class="info-value">${info.employees}</div>
                                </div>
                                <div class="info-card">
                                    <h4>Avg Volume</h4>
                                    <div class="info-value">${info.avgVolume}</div>
                                </div>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value">$${yearHigh.toFixed(2)}</div>
                                    <div class="stat-label">52W High</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">$${yearLow.toFixed(2)}</div>
                                    <div class="stat-label">52W Low</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value ${fromYearHigh >= 0 ? 'up' : 'down'}">
                                        ${fromYearHigh >= 0 ? '+' : ''}${fromYearHigh}%
                                    </div>
                                    <div class="stat-label">From High</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value ${fromYearLow >= 0 ? 'up' : 'down'}">
                                        ${fromYearLow >= 0 ? '+' : ''}${fromYearLow}%
                                    </div>
                                    <div class="stat-label">From Low</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="tab-stats" class="tab-content">
                            <h4 style="margin-bottom: 1rem;">Trading Statistics</h4>
                            <div class="technical-indicators">
                                <div class="indicator">
                                    <span class="indicator-label">Open</span>
                                    <span class="indicator-value">$${stock.open.toFixed(2)}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Day High</span>
                                    <span class="indicator-value">$${stock.dayHigh.toFixed(2)}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Day Low</span>
                                    <span class="indicator-value">$${stock.dayLow.toFixed(2)}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Prev Close</span>
                                    <span class="indicator-value">$${stock.previousClose.toFixed(2)}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Volume</span>
                                    <span class="indicator-value">${stock.volume.toLocaleString()}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Avg Volume</span>
                                    <span class="indicator-value">${info.avgVolume}</span>
                                </div>
                            </div>
                            
                            <div style="margin-top: 1.5rem;">
                                <h4>Price Performance</h4>
                                <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
                                    ${history && history.length >= 7 ? `
                                        <div class="info-card">
                                            <h4>Week Change</h4>
                                            <div class="info-value ${history[history.length - 1].price >= history[history.length - 7].price ? 'up' : 'down'}">
                                                ${((history[history.length - 1].price - history[history.length - 7].price) / history[history.length - 7].price * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${history && history.length >= 30 ? `
                                        <div class="info-card">
                                            <h4>Month Change</h4>
                                            <div class="info-value ${history[history.length - 1].price >= history[history.length - 30].price ? 'up' : 'down'}">
                                                ${((history[history.length - 1].price - history[history.length - 30].price) / history[history.length - 30].price * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    ` : ''}
                                    <div class="info-card">
                                        <h4>YTD Change</h4>
                                        <div class="info-value ${stock.price >= stock.previousClose ? 'up' : 'down'}">
                                            ${stock.changePercent.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="tab-technical" class="tab-content">
                            <h4 style="margin-bottom: 1rem;">Technical Indicators</h4>
                            <div class="technical-indicators">
                                <div class="indicator">
                                    <span class="indicator-label">20-Day SMA</span>
                                    <span class="indicator-value">$${indicators.sma20 ? indicators.sma20.toFixed(2) : 'N/A'}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">RSI (14)</span>
                                    <span class="indicator-value ${indicators.rsi ? (indicators.rsi > 70 ? 'down' : indicators.rsi < 30 ? 'up' : '') : ''}">
                                        ${indicators.rsi ? indicators.rsi.toFixed(1) : 'N/A'}
                                        ${indicators.rsi ? (indicators.rsi > 70 ? ' (Overbought)' : indicators.rsi < 30 ? ' (Oversold)' : '') : ''}
                                    </span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">MACD</span>
                                    <span class="indicator-value ${indicators.macd ? (indicators.macd > 0 ? 'up' : 'down') : ''}">
                                        ${indicators.macd ? indicators.macd.toFixed(3) : 'N/A'}
                                    </span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Upper BB</span>
                                    <span class="indicator-value">$${indicators.upperBand ? indicators.upperBand.toFixed(2) : 'N/A'}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Lower BB</span>
                                    <span class="indicator-value">$${indicators.lowerBand ? indicators.lowerBand.toFixed(2) : 'N/A'}</span>
                                </div>
                                <div class="indicator">
                                    <span class="indicator-label">Volume Ratio</span>
                                    <span class="indicator-value ${indicators.volumeRatio ? (indicators.volumeRatio > 1.5 ? 'up' : indicators.volumeRatio < 0.5 ? 'down' : '') : ''}">
                                        ${indicators.volumeRatio ? indicators.volumeRatio.toFixed(2) + 'x' : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="info-card" style="margin-top: 1.5rem;">
                                <h4>Technical Summary</h4>
                                <div style="margin-top: 0.5rem;">
                                    <p style="margin: 0.25rem 0; font-size: 0.9rem;">
                                        <strong>Trend:</strong> <span class="${indicators.trend === 'up' ? 'up' : 'down'}">${indicators.trend === 'up' ? 'Bullish' : 'Bearish'}</span>
                                    </p>
                                    <p style="margin: 0.25rem 0; font-size: 0.9rem;">
                                        <strong>Momentum:</strong> <span class="${indicators.momentum === 'overbought' ? 'down' : indicators.momentum === 'oversold' ? 'up' : ''}">${indicators.momentum}</span>
                                    </p>
                                    <p style="margin: 0.25rem 0; font-size: 0.9rem;">
                                        <strong>Volume:</strong> ${indicators.volumeRatio ? (indicators.volumeRatio > 1.2 ? 'High' : indicators.volumeRatio < 0.8 ? 'Low' : 'Normal') : 'Normal'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        ${owned ? `
                            <div id="tab-holding" class="tab-content">
                                <div class="info-card">
                                    <h4>Your Holdings</h4>
                                    <div style="margin-top: 1rem;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Shares Owned:</span>
                                            <strong>${owned.shares}</strong>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Average Price:</span>
                                            <strong>$${owned.avgPrice.toFixed(2)}</strong>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Current Value:</span>
                                            <strong>$${(owned.shares * stock.price).toFixed(2)}</strong>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Total Invested:</span>
                                            <strong>$${owned.totalInvested.toFixed(2)}</strong>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Unrealized P/L:</span>
                                            <strong class="${(stock.price - owned.avgPrice) >= 0 ? 'up' : 'down'}">
                                                ${(stock.price - owned.avgPrice) >= 0 ? '+' : ''}$${Math.abs((stock.price - owned.avgPrice) * owned.shares).toFixed(2)}
                                                (${((stock.price - owned.avgPrice) / owned.avgPrice * 100).toFixed(2)}%)
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                                    <button class="game-btn" style="flex: 1;" onclick="
                                        document.querySelector('.stock-details-modal')?.remove();
                                        showTradeModal('buy');
                                    ">
                                        🛒 Buy More
                                    </button>
                                    <button class="game-btn" style="flex: 1;" onclick="
                                        document.querySelector('.stock-details-modal')?.remove();
                                        showTradeModal('sell');
                                    ">
                                        💰 Sell Shares
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                            <button class="game-btn" style="flex: 1;" onclick="
                                document.querySelector('.stock-details-modal')?.remove();
                                showTradeModal('buy');
                            ">
                                🛒 Buy ${symbol}
                            </button>
                            ${owned ? `
                                <button class="game-btn" style="flex: 1;" onclick="
                                    document.querySelector('.stock-details-modal')?.remove();
                                    showTradeModal('sell');
                                ">
                                    💰 Sell ${symbol}
                                </button>
                            ` : ''}
                            <button class="game-btn" style="background: var(--bg-color); color: var(--text-color);" onclick="
                                document.querySelector('.stock-details-modal')?.remove();
                                showNotification('Added to watchlist', 'success');
                            ">
                                ⭐ Watch
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup tab switching
        const modal = document.querySelector('.stock-details-modal');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `tab-${tabId}`) {
                        content.classList.add('active');
                    }
                });
                
                // Redraw chart if on chart tab
                if (tabId === 'chart') {
                    const canvas = modal.querySelector('.chart-canvas');
                    if (canvas) {
                        setTimeout(() => {
                            renderChart(symbol, canvas, getDaysFromChartType(gameState.chartType));
                        }, 100);
                    }
                }
            });
        });
        
        // Setup close button
        const closeBtn = modal.querySelector('.close-details-btn');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Resize chart on window resize
        window.addEventListener('resize', () => {
            const canvas = modal.querySelector('.chart-canvas');
            if (canvas) {
                setTimeout(() => {
                    renderChart(symbol, canvas, getDaysFromChartType(gameState.chartType));
                }, 100);
            }
        });
    }

    // ========== TRADE SYSTEM ==========
    function showTradeModal(action) {
        const stock = gameState.currentStock;
        if (!stock) return;
        
        const holding = gameState.player.portfolio[stock.symbol];
        const maxShares = action === 'buy' 
            ? Math.floor((gameState.player.balance - GAME_CONFIG.transactionFee) / stock.price)
            : (holding?.shares || 0);
        
        if (action === 'buy' && maxShares <= 0) {
            showNotification('Insufficient funds to buy any shares', 'error');
            return;
        }
        
        if (action === 'sell' && maxShares <= 0) {
            showNotification('You don\'t own any shares of this stock', 'error');
            return;
        }
        
        const modalHTML = `
            <div class="trade-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${action === 'buy' ? '🛒 Buy' : '💰 Sell'} ${stock.symbol}</h3>
                        <button class="close-modal-btn close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 1rem;"><strong>${stock.name}</strong></p>
                        <p style="margin-bottom: 0.5rem;">Current Price: <strong>$${stock.price.toFixed(2)}</strong></p>
                        
                        <div class="quantity-controls">
                            <button class="qty-btn minus">-</button>
                            <input type="number" class="qty-input" value="1" min="1" max="${maxShares}">
                            <button class="qty-btn plus">+</button>
                        </div>
                        <p class="max-shares">Maximum: ${maxShares} shares</p>
                        
                        <div class="trade-total">
                            <div>
                                <span>Shares:</span>
                                <span id="share-count">1</span>
                            </div>
                            <div>
                                <span>Price per share:</span>
                                <span>$${stock.price.toFixed(2)}</span>
                            </div>
                            <div>
                                <span>Subtotal:</span>
                                <span>$<span id="subtotal">${stock.price.toFixed(2)}</span></span>
                            </div>
                            <div>
                                <span>Transaction Fee:</span>
                                <span>$<span id="fee">${GAME_CONFIG.transactionFee.toFixed(2)}</span></span>
                            </div>
                            <div>
                                <strong>Total:</strong>
                                <strong>$<span id="final-total">${(stock.price + GAME_CONFIG.transactionFee).toFixed(2)}</span></strong>
                            </div>
                        </div>
                        
                        <button class="confirm-trade-btn" id="confirm-trade">
                            ${action === 'buy' ? '🛒 Confirm Purchase' : '💰 Confirm Sale'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.trade-modal');
        const qtyInput = modal.querySelector('.qty-input');
        const minusBtn = modal.querySelector('.minus');
        const plusBtn = modal.querySelector('.plus');
        const confirmBtn = modal.querySelector('#confirm-trade');
        const closeBtn = modal.querySelector('.close-modal-btn');
        
        function updateTradeSummary() {
            const quantity = parseInt(qtyInput.value) || 1;
            const subtotal = quantity * stock.price;
            const fee = GAME_CONFIG.transactionFee;
            const finalTotal = action === 'buy' ? subtotal + fee : subtotal - fee;
            
            modal.querySelector('#share-count').textContent = quantity;
            modal.querySelector('#subtotal').textContent = subtotal.toFixed(2);
            modal.querySelector('#final-total').textContent = finalTotal.toFixed(2);
            
            // Validate trade
            if (quantity < 1) {
                qtyInput.value = 1;
                updateTradeSummary();
                return;
            }
            
            if (quantity > maxShares) {
                qtyInput.value = maxShares;
                updateTradeSummary();
                return;
            }
            
            if (action === 'buy' && finalTotal > gameState.player.balance) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '❌ Insufficient Funds';
                confirmBtn.style.background = '#ef4444';
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = action === 'buy' ? '🛒 Confirm Purchase' : '💰 Confirm Sale';
                confirmBtn.style.background = '';
            }
        }
        
        minusBtn.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current > 1) {
                qtyInput.value = current - 1;
                updateTradeSummary();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current < maxShares) {
                qtyInput.value = current + 1;
                updateTradeSummary();
            }
        });
        
        qtyInput.addEventListener('input', updateTradeSummary);
        qtyInput.addEventListener('change', updateTradeSummary);
        
        confirmBtn.addEventListener('click', () => {
            const quantity = parseInt(qtyInput.value) || 1;
            executeTrade(action, quantity);
            modal.remove();
        });
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        updateTradeSummary();
    }

    function executeTrade(action, quantity) {
        const stock = gameState.currentStock;
        const totalCost = quantity * stock.price;
        const fee = GAME_CONFIG.transactionFee;
        
        if (action === 'buy') {
            // BUY LOGIC
            const totalWithFee = totalCost + fee;
            
            if (gameState.player.balance < totalWithFee) {
                showNotification('❌ Insufficient funds for this trade', 'error');
                return;
            }
            
            if (quantity <= 0) {
                showNotification('❌ Invalid quantity', 'error');
                return;
            }
            
            // Update balance
            gameState.player.balance -= totalWithFee;
            
            // Update portfolio
            if (!gameState.player.portfolio[stock.symbol]) {
                gameState.player.portfolio[stock.symbol] = {
                    shares: 0,
                    avgPrice: 0,
                    totalInvested: 0
                };
            }
            
            const holding = gameState.player.portfolio[stock.symbol];
            const newShares = holding.shares + quantity;
            const newTotalInvested = holding.totalInvested + totalCost;
            const newAvgPrice = newTotalInvested / newShares;
            
            gameState.player.portfolio[stock.symbol] = {
                shares: newShares,
                avgPrice: newAvgPrice,
                totalInvested: newTotalInvested
            };
            
            // Record trade
            const trade = {
                id: Date.now().toString(),
                action: 'buy',
                symbol: stock.symbol,
                quantity: quantity,
                price: stock.price,
                total: totalCost,
                fee: fee,
                timestamp: new Date().toISOString()
            };
            
            gameState.player.trades.push(trade);
            gameState.player.history.push({
                type: 'trade',
                data: trade,
                timestamp: new Date().toISOString()
            });
            
            // Add XP for trade
            addXP(10);
            
            showNotification(`✅ Bought ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)}`, 'success');
            
        } else {
            // SELL LOGIC
            const holding = gameState.player.portfolio[stock.symbol];
            
            if (!holding || holding.shares < quantity) {
                showNotification('❌ Not enough shares to sell', 'error');
                return;
            }
            
            if (quantity <= 0) {
                showNotification('❌ Invalid quantity', 'error');
                return;
            }
            
            // Calculate profit
            const costBasis = holding.avgPrice * quantity;
            const profit = totalCost - costBasis;
            const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
            
            // Update balance
            gameState.player.balance += (totalCost - fee);
            
            // Update portfolio
            const newShares = holding.shares - quantity;
            
            if (newShares === 0) {
                delete gameState.player.portfolio[stock.symbol];
            } else {
                // Keep same average price for remaining shares
                holding.shares = newShares;
                holding.totalInvested = holding.avgPrice * newShares;
            }
            
            // Record trade
            const trade = {
                id: Date.now().toString(),
                action: 'sell',
                symbol: stock.symbol,
                quantity: quantity,
                price: stock.price,
                total: totalCost,
                fee: fee,
                profit: profit,
                profitPercent: profitPercent,
                timestamp: new Date().toISOString()
            };
            
            gameState.player.trades.push(trade);
            gameState.player.history.push({
                type: 'trade',
                data: trade,
                timestamp: new Date().toISOString()
            });
            
            // Add XP for profitable trade
            if (profit > 0) {
                addXP(Math.min(Math.floor(profit / 10), 100));
            }
            
            showNotification(`✅ Sold ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)} (Profit: $${profit.toFixed(2)})`, 'success');
        }
        
        // Update game state
        saveGameState();
        updateGameUI();
        renderTable();
        updateNewsTicker();
    }

    // ========== PORTFOLIO VIEW ==========
    function showPortfolio() {
        const portfolio = gameState.player.portfolio;
        const portfolioValue = calculatePortfolioValue();
        const totalProfit = gameState.player.totalProfit;
        const profitPercent = (totalProfit / GAME_CONFIG.startingBalance) * 100;
        
        let holdingsHTML = '';
        
        for (const [symbol, holding] of Object.entries(portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                const currentValue = holding.shares * stock.price;
                const cost = holding.totalInvested;
                const profit = currentValue - cost;
                const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
                
                holdingsHTML += `
                    <div class="holding-item" onclick="
                        const event = new CustomEvent('stockSelected', { detail: '${symbol}' });
                        document.dispatchEvent(event);
                        document.querySelector('.trade-modal')?.remove();
                    ">
                        <div class="holding-header">
                            <strong>${symbol}</strong>
                            <span class="holding-price">$${stock.price.toFixed(2)}</span>
                        </div>
                        <div class="holding-details">
                            <span>${holding.shares} shares</span>
                            <span class="${profit >= 0 ? 'up' : 'down'}">
                                ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%)
                            </span>
                        </div>
                        <div class="holding-details">
                            <small>Cost: $${cost.toFixed(2)}</small>
                            <small>Value: $${currentValue.toFixed(2)}</small>
                        </div>
                    </div>
                `;
            }
        }
        
        // Listen for stock selection from portfolio
        document.addEventListener('stockSelected', function(e) {
            const symbol = e.detail;
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                gameState.currentStock = stock;
                showTradeModal('sell');
            }
        });
        
        const modalHTML = `
            <div class="portfolio-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 ${gameState.player.name}'s Portfolio</h3>
                        <button class="close-portfolio-btn close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="portfolio-summary">
                            <div class="summary-item">
                                <span class="summary-label">💰 Total Value</span>
                                <span class="summary-value">$${portfolioValue.toFixed(2)}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">💵 Cash Balance</span>
                                <span class="summary-value">$${gameState.player.balance.toFixed(2)}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">📈 Total Profit</span>
                                <span class="summary-value ${totalProfit >= 0 ? 'up' : 'down'}">
                                    ${totalProfit >= 0 ? '+' : ''}$${Math.abs(totalProfit).toFixed(2)} (${profitPercent.toFixed(2)}%)
                                </span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">🔄 Total Trades</span>
                                <span class="summary-value">${gameState.player.trades.length}</span>
                            </div>
                        </div>
                        
                        <h4 style="margin: 1.5rem 0 1rem 0;">📦 Holdings (${Object.keys(portfolio).length})</h4>
                        ${Object.keys(portfolio).length === 0 ? 
                            '<p class="empty-portfolio">No stocks yet. Click on a stock in the table to buy!</p>' :
                            `<div class="holdings-list">${holdingsHTML}</div>`
                        }
                        
                        ${gameState.player.trades.length > 0 ? `
                            <h4 style="margin: 1.5rem 0 1rem 0;">📝 Recent Trades</h4>
                            <div class="holdings-list">
                                ${gameState.player.trades.slice(-3).reverse().map(trade => `
                                    <div class="holding-item">
                                        <div class="holding-header">
                                            <strong>${trade.symbol}</strong>
                                            <span class="${trade.action === 'buy' ? 'up' : 'down'}">
                                                ${trade.action === 'buy' ? '🛒 Buy' : '💰 Sell'}
                                            </span>
                                        </div>
                                        <div class="holding-details">
                                            <span>${trade.quantity} shares @ $${trade.price.toFixed(2)}</span>
                                            <span>$${trade.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.portfolio-modal');
        const closeBtn = modal.querySelector('.close-portfolio-btn');
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ========== PROFILE SYSTEM ==========
    function showProfile() {
        const joinedDate = new Date(gameState.player.joinedDate);
        const daysActive = Math.floor((new Date() - joinedDate) / (1000 * 60 * 60 * 24));
        
        const avatars = ['👤', '🦸', '👨‍💼', '👩‍💼', '🧑‍🚀', '🧙', '🦹', '🧛', '🧟', '🧞'];
        
        const modalHTML = `
            <div class="profile-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>👤 Trader Profile</h3>
                        <button class="close-profile-btn close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar-large" id="current-avatar">
                                ${gameState.player.avatar}
                            </div>
                            <div class="profile-info">
                                <div class="profile-name">${gameState.player.name}</div>
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                    <span class="level-badge">Level ${gameState.player.level}</span>
                                    <span style="color: var(--text-secondary);">#${gameState.player.rank} on Leaderboard</span>
                                </div>
                                <div class="xp-bar">
                                    <div class="xp-fill" style="width: ${(gameState.player.xp / calculateXPForLevel(gameState.player.level + 1)) * 100}%"></div>
                                </div>
                                <small style="color: var(--text-secondary);">${gameState.player.xp}/${calculateXPForLevel(gameState.player.level + 1)} XP</small>
                            </div>
                        </div>
                        
                        <div class="profile-stats-grid">
                            <div class="profile-stat">
                                <div class="profile-stat-value">$${gameState.player.balance.toFixed(2)}</div>
                                <div class="profile-stat-label">Cash Balance</div>
                            </div>
                            <div class="profile-stat">
                                <div class="profile-stat-value">${gameState.player.trades.length}</div>
                                <div class="profile-stat-label">Total Trades</div>
                            </div>
                            <div class="profile-stat">
                                <div class="profile-stat-value ${gameState.player.totalProfit >= 0 ? 'up' : 'down'}">
                                    ${gameState.player.totalProfit >= 0 ? '+' : ''}$${Math.abs(gameState.player.totalProfit).toFixed(2)}
                                </div>
                                <div class="profile-stat-label">Total Profit</div>
                            </div>
                            <div class="profile-stat">
                                <div class="profile-stat-value">${daysActive}</div>
                                <div class="profile-stat-label">Days Active</div>
                            </div>
                        </div>
                        
                        <h4 style="margin: 1.5rem 0 1rem 0;">✏️ Change Name</h4>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
                            <input type="text" id="new-player-name" value="${gameState.player.name}" style="flex: 1; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-color);">
                            <button id="save-name-btn" class="game-btn" style="padding: 0.75rem 1.5rem;">Save</button>
                        </div>
                        
                        <h4 style="margin: 1.5rem 0 1rem 0;">😊 Choose Avatar</h4>
                        <div class="avatar-grid">
                            ${avatars.map(avatar => `
                                <div class="avatar-option ${avatar === gameState.player.avatar ? 'selected' : ''}" data-avatar="${avatar}">
                                    ${avatar}
                                </div>
                            `).join('')}
                        </div>
                        
                        <h4 style="margin: 1.5rem 0 1rem 0;">🏆 Achievements</h4>
                        <div class="holdings-list">
                            ${gameState.player.achievements.map(achievement => `
                                <div class="holding-item" style="cursor: default;">
                                    <div class="holding-header">
                                        <strong>${achievement.name}</strong>
                                        <span>${achievement.earned ? '✅' : '🔒'}</span>
                                    </div>
                                    <div class="holding-details">
                                        <span>${achievement.description}</span>
                                        ${achievement.earned ? 
                                            `<span class="up">+${achievement.xp} XP</span>` : 
                                            `<span class="down">Locked</span>`
                                        }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); text-align: center;">
                            <button id="reset-game-btn" class="game-btn" style="background: #ef4444;">
                                🔄 Reset Game
                            </button>
                            <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">
                                Player ID: ${gameState.player.id.substring(0, 8)}...
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.profile-modal');
        const closeBtn = modal.querySelector('.close-profile-btn');
        const saveNameBtn = modal.querySelector('#save-name-btn');
        const newNameInput = modal.querySelector('#new-player-name');
        const avatarOptions = modal.querySelectorAll('.avatar-option');
        const resetBtn = modal.querySelector('#reset-game-btn');
        
        // Avatar selection
        avatarOptions.forEach(option => {
            option.addEventListener('click', () => {
                avatarOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                gameState.player.avatar = option.dataset.avatar;
                localStorage.setItem('player_avatar', gameState.player.avatar);
                document.getElementById('current-avatar').textContent = gameState.player.avatar;
                document.querySelector('.player-avatar').textContent = gameState.player.avatar;
                showNotification('Avatar updated!', 'success');
            });
        });
        
        // Save name
        saveNameBtn.addEventListener('click', () => {
            const newName = newNameInput.value.trim();
            if (newName && newName.length >= 2 && newName.length <= 20) {
                gameState.player.name = newName;
                localStorage.setItem('player_name', newName);
                showNotification('Name updated!', 'success');
                modal.querySelector('.profile-name').textContent = newName;
                document.querySelector('.player-avatar-display strong').textContent = newName;
            } else {
                showNotification('Name must be 2-20 characters', 'error');
            }
        });
        
        // Reset game
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your game? This will delete all your progress and start fresh.')) {
                localStorage.clear();
                location.reload();
            }
        });
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ========== LEADERBOARD VIEW ==========
    function showLeaderboard() {
        const topPlayers = [...gameState.leaderboard]
            .sort((a, b) => b.portfolioValue - a.portfolioValue)
            .slice(0, 10);
        
        const modalHTML = `
            <div class="leaderboard-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🏆 Trading Leaderboard</h3>
                        <button class="close-leaderboard-btn close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="leaderboard-list">
                            ${topPlayers.map((player, index) => `
                                <div class="leaderboard-item ${player.id === gameState.player.id ? 'you' : ''}">
                                    <div class="leaderboard-rank rank-${index + 1}">
                                        ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                    </div>
                                    <div class="leaderboard-name">
                                        ${player.avatar || '👤'} ${player.name} ${player.id === gameState.player.id ? '(You)' : ''}
                                    </div>
                                    <div class="leaderboard-value">
                                        $${player.portfolioValue.toFixed(2)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${!topPlayers.some(p => p.id === gameState.player.id) ? `
                            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                                <div class="leaderboard-item you">
                                    <div class="leaderboard-rank">
                                        #${gameState.player.rank}
                                    </div>
                                    <div class="leaderboard-name">
                                        ${gameState.player.avatar} ${gameState.player.name} (You)
                                    </div>
                                    <div class="leaderboard-value">
                                        $${calculatePortfolioValue().toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.leaderboard-modal');
        const closeBtn = modal.querySelector('.close-leaderboard-btn');
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ========== NOTIFICATION SYSTEM ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'xp') icon = '⭐';
        
        notification.innerHTML = `<span style="font-size: 1.5rem;">${icon}</span> <span>${message}</span>`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ========== SAVE GAME STATE ==========
    function saveGameState() {
        localStorage.setItem('player_id', gameState.player.id);
        localStorage.setItem('player_name', gameState.player.name);
        localStorage.setItem('player_avatar', gameState.player.avatar);
        localStorage.setItem('player_balance', gameState.player.balance);
        localStorage.setItem('stock_game_portfolio', JSON.stringify(gameState.player.portfolio));
        localStorage.setItem('stock_game_trades', JSON.stringify(gameState.player.trades));
        localStorage.setItem('player_history', JSON.stringify(gameState.player.history));
        localStorage.setItem('player_level', gameState.player.level);
        localStorage.setItem('player_xp', gameState.player.xp);
        localStorage.setItem('player_achievements', JSON.stringify(gameState.player.achievements));
        localStorage.setItem('player_joined', gameState.player.joinedDate);
        localStorage.setItem('game_started', gameState.gameStarted);
    }

    // ========== START THE GAME ==========
    init();
});