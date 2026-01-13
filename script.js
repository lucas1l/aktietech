// script.js - COMPLETE STOCK TRADING GAME WITH TABBED INTERFACE
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
        playerBalance: document.getElementById('player-balance'),
        portfolioValue: document.getElementById('portfolio-value'),
        playerRank: document.getElementById('player-rank'),
        playerLevel: document.getElementById('player-level'),
        profileBtn: document.getElementById('profile-btn')
    };

    // ========== INITIALIZATION ==========
    function init() {
        console.log('Initializing game...');
        
        // Add CSS animations if they don't exist
        addMissingCSS();
        
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
        
        // Initialize tabs
        initTabs();
        
        // Start price updates
        startPriceUpdates();
        
        console.log('Game initialized successfully!');
    }

    // ========== TAB MANAGEMENT ==========
    function initTabs() {
        const tabs = document.querySelectorAll('.game-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                        
                        // Load content for the tab
                        switch(tabId) {
                            case 'portfolio':
                                loadPortfolioTab();
                                break;
                            case 'leaderboard':
                                loadLeaderboardTab();
                                break;
                            case 'achievements':
                                loadAchievementsTab();
                                break;
                            case 'trading':
                                updateTradingTab();
                                break;
                        }
                    }
                });
            });
        });
    }

    // ========== PORTFOLIO TAB ==========
    function loadPortfolioTab() {
        const portfolioValue = calculatePortfolioValue();
        const totalProfit = gameState.player.totalProfit;
        const dailyChange = calculateDailyChange();
        
        // Update summary
        document.getElementById('portfolio-total').textContent = `$${portfolioValue.toFixed(2)}`;
        document.getElementById('portfolio-daily').textContent = `${dailyChange >= 0 ? '+' : ''}$${Math.abs(dailyChange).toFixed(2)}`;
        document.getElementById('portfolio-daily').className = dailyChange >= 0 ? 'summary-value up' : 'summary-value down';
        document.getElementById('portfolio-profit').textContent = `$${totalProfit.toFixed(2)}`;
        document.getElementById('portfolio-profit').className = totalProfit >= 0 ? 'summary-value up' : 'summary-value down';
        document.getElementById('portfolio-trades').textContent = gameState.player.trades.length;
        
        // Load holdings
        loadHoldingsList();
        
        // Load recent trades
        loadRecentTrades();
    }

    function loadHoldingsList() {
        const holdingsList = document.getElementById('holdings-list');
        const portfolio = gameState.player.portfolio;
        
        if (Object.keys(portfolio).length === 0) {
            holdingsList.innerHTML = `
                <div class="empty-portfolio">
                    <i class="fas fa-chart-pie fa-3x"></i>
                    <p>No holdings yet</p>
                    <p class="small">Buy stocks to build your portfolio!</p>
                </div>
            `;
            return;
        }
        
        let holdingsHTML = '';
        
        for (const [symbol, holding] of Object.entries(portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                const currentValue = holding.shares * stock.price;
                const costBasis = holding.avgPrice * holding.shares;
                const profit = currentValue - costBasis;
                const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
                const profitClass = profit >= 0 ? 'up' : 'down';
                
                holdingsHTML += `
                    <div class="holding-card" onclick="handleHoldingClick('${symbol}')">
                        <div class="holding-header">
                            <div class="holding-symbol">${symbol}</div>
                            <div class="holding-price">$${stock.price.toFixed(2)}</div>
                        </div>
                        <div class="holding-details">
                            <span class="holding-shares">${holding.shares} shares</span>
                            <span class="holding-change ${profitClass}">
                                ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%)
                            </span>
                        </div>
                        <div class="holding-value">Value: $${currentValue.toFixed(2)}</div>
                    </div>
                `;
            }
        }
        
        holdingsList.innerHTML = holdingsHTML;
    }

    function handleHoldingClick(symbol) {
        // Switch to market tab and select the stock
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (stock) {
            gameState.currentStock = stock;
            
            // Activate market tab
            document.querySelectorAll('.game-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector('.game-tab[data-tab="market"]').classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById('market-tab').classList.add('active');
            
            // Highlight the stock row
            document.querySelectorAll('.stock-row').forEach(row => row.classList.remove('selected'));
            const stockRow = document.querySelector(`.stock-row[data-symbol="${symbol}"]`);
            if (stockRow) {
                stockRow.classList.add('selected');
                stockRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Switch to trading tab automatically
            setTimeout(() => {
                document.querySelector('.game-tab[data-tab="trading"]').click();
            }, 500);
        }
    }

    function loadRecentTrades() {
        const recentTradesList = document.getElementById('recent-trades');
        const trades = gameState.player.trades;
        
        if (trades.length === 0) {
            recentTradesList.innerHTML = `
                <div class="empty-trades">
                    <i class="fas fa-exchange-alt fa-2x"></i>
                    <p>No trades yet</p>
                </div>
            `;
            return;
        }
        
        // Get last 5 trades
        const recentTrades = trades.slice(-5).reverse();
        let tradesHTML = '';
        
        recentTrades.forEach(trade => {
            const actionClass = trade.action === 'buy' ? 'buy' : 'sell';
            const actionIcon = trade.action === 'buy' ? 'fa-shopping-cart' : 'fa-money-bill-wave';
            
            tradesHTML += `
                <div class="trade-item">
                    <div class="trade-info">
                        <div class="trade-action ${actionClass}">
                            <i class="fas ${actionIcon}"></i>
                        </div>
                        <div>
                            <div class="trade-symbol">${trade.symbol}</div>
                            <div class="trade-quantity">${trade.quantity} shares @ $${trade.price.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="trade-details">
                        <div class="trade-total">$${trade.total.toFixed(2)}</div>
                        <div class="trade-time">${formatTimeAgo(trade.timestamp)}</div>
                    </div>
                </div>
            `;
        });
        
        recentTradesList.innerHTML = tradesHTML;
    }

    function formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // ========== TRADING TAB ==========
    function updateTradingTab() {
        const stock = gameState.currentStock;
        const selectedStockDisplay = document.getElementById('selected-stock-display');
        
        if (!stock) {
            selectedStockDisplay.innerHTML = `
                <div class="no-stock-selected">
                    <i class="fas fa-search fa-3x"></i>
                    <p>No stock selected</p>
                    <p class="small">Click on a stock in the Market tab to select it</p>
                </div>
            `;
            document.getElementById('execute-trade').disabled = true;
            updateTradeSummary();
            return;
        }
        
        const changeClass = stock.change >= 0 ? 'up' : 'down';
        const changeSign = stock.change >= 0 ? '+' : '';
        const holding = gameState.player.portfolio[stock.symbol];
        
        selectedStockDisplay.innerHTML = `
            <div class="stock-selected-display">
                <div class="stock-selected-header">
                    <div class="stock-selected-symbol">${stock.symbol}</div>
                    <div class="stock-selected-price">$${stock.price.toFixed(2)}</div>
                </div>
                <div class="stock-selected-change ${changeClass}">
                    ${changeSign}$${Math.abs(stock.change).toFixed(2)} (${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%)
                </div>
                
                <div class="stock-selected-details">
                    <div class="stock-detail-item">
                        <span>Day High:</span>
                        <span>$${stock.dayHigh.toFixed(2)}</span>
                    </div>
                    <div class="stock-detail-item">
                        <span>Day Low:</span>
                        <span>$${stock.dayLow.toFixed(2)}</span>
                    </div>
                    <div class="stock-detail-item">
                        <span>Volume:</span>
                        <span>${stock.volume.toLocaleString()}</span>
                    </div>
                    <div class="stock-detail-item">
                        <span>Open:</span>
                        <span>$${stock.open.toFixed(2)}</span>
                    </div>
                </div>
                
                ${holding ? `
                    <div class="holding-info">
                        <h4>Your Holdings</h4>
                        <div class="holding-details">
                            <span>Shares Owned:</span>
                            <span>${holding.shares}</span>
                        </div>
                        <div class="holding-details">
                            <span>Avg Price:</span>
                            <span>$${holding.avgPrice.toFixed(2)}</span>
                        </div>
                        <div class="holding-details">
                            <span>Current Value:</span>
                            <span>$${(holding.shares * stock.price).toFixed(2)}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        updateTradeSummary();
    }

    function updateTradeSummary() {
        const stock = gameState.currentStock;
        if (!stock) {
            document.getElementById('trade-price').textContent = '$0.00';
            document.getElementById('trade-subtotal').textContent = '$0.00';
            document.getElementById('trade-total').textContent = '$0.00';
            return;
        }
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const tradeType = document.querySelector('.trade-type-btn.active').dataset.type;
        const price = stock.price;
        const subtotal = quantity * price;
        const fee = GAME_CONFIG.transactionFee;
        const total = tradeType === 'buy' ? subtotal + fee : Math.max(0, subtotal - fee);
        
        document.getElementById('trade-price').textContent = `$${price.toFixed(2)}`;
        document.getElementById('trade-qty-display').textContent = quantity;
        document.getElementById('trade-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('trade-total').textContent = `$${total.toFixed(2)}`;
        
        // Validate trade
        const executeBtn = document.getElementById('execute-trade');
        if (tradeType === 'buy') {
            executeBtn.disabled = total > gameState.player.balance;
            executeBtn.textContent = executeBtn.disabled ? 'Insufficient Funds' : 'Execute Buy Order';
            executeBtn.style.background = executeBtn.disabled ? 'var(--down-color)' : '';
        } else {
            const holding = gameState.player.portfolio[stock.symbol];
            executeBtn.disabled = !holding || holding.shares < quantity;
            executeBtn.textContent = executeBtn.disabled ? 'Insufficient Shares' : 'Execute Sell Order';
            executeBtn.style.background = executeBtn.disabled ? 'var(--down-color)' : '';
        }
    }

    // ========== LEADERBOARD TAB ==========
    function loadLeaderboardTab() {
        // Update your position
        document.getElementById('your-rank').textContent = gameState.player.rank;
        document.getElementById('your-value').textContent = calculatePortfolioValue().toFixed(0);
        
        // Load leaderboard table
        const leaderboardTable = document.getElementById('leaderboard-table');
        let leaderboardHTML = '';
        
        gameState.leaderboard.forEach((player, index) => {
            const isYou = player.id === gameState.player.id;
            const rowClass = isYou ? 'leaderboard-item you' : 'leaderboard-item';
            
            leaderboardHTML += `
                <div class="${rowClass}">
                    <div class="leaderboard-rank">${index + 1}</div>
                    <div class="leaderboard-name">
                        ${isYou ? '<i class="fas fa-user"></i>' : ''}
                        ${player.name}
                    </div>
                    <div class="leaderboard-value">$${player.portfolioValue.toFixed(2)}</div>
                </div>
            `;
        });
        
        leaderboardTable.innerHTML = leaderboardHTML;
    }

    // ========== ACHIEVEMENTS TAB ==========
    function loadAchievementsTab() {
        const achievements = gameState.player.achievements;
        const unlocked = achievements.filter(a => a.earned).length;
        
        // Update summary
        document.getElementById('achievements-unlocked').textContent = `${unlocked}/${achievements.length}`;
        document.getElementById('total-xp').textContent = gameState.player.xp;
        document.getElementById('achievements-level').textContent = gameState.player.level;
        
        // Update XP progress
        const xpForNextLevel = calculateXPForLevel(gameState.player.level + 1);
        const xpPercent = Math.min((gameState.player.xp / xpForNextLevel) * 100, 100);
        document.getElementById('xp-fill').style.width = `${xpPercent}%`;
        document.getElementById('current-xp').textContent = gameState.player.xp;
        document.getElementById('next-level-xp').textContent = xpForNextLevel;
        
        // Load achievements list
        const achievementsList = document.getElementById('achievements-list');
        let achievementsHTML = '';
        
        achievements.forEach(achievement => {
            const statusClass = achievement.earned ? 'unlocked' : 'locked';
            const statusIcon = achievement.earned ? 'fa-check-circle' : 'fa-lock';
            const icon = getAchievementIcon(achievement.id);
            
            achievementsHTML += `
                <div class="achievement-card ${statusClass}">
                    <div class="achievement-status">
                        <i class="fas ${statusIcon}"></i>
                    </div>
                    <div class="achievement-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-xp">
                        <i class="fas fa-star"></i>
                        ${achievement.xp} XP
                    </div>
                </div>
            `;
        });
        
        achievementsList.innerHTML = achievementsHTML;
    }

    function getAchievementIcon(achievementId) {
        const icons = {
            'first_trade': 'fa-handshake',
            'profit_500': 'fa-money-bill-wave',
            'balance_15000': 'fa-piggy-bank',
            'trader_10': 'fa-chart-line',
            'diversify_5': 'fa-layer-group',
            'top_3': 'fa-trophy'
        };
        return icons[achievementId] || 'fa-medal';
    }

    // ========== PROFILE MODAL ==========
    function showProfileModal() {
        const modal = document.getElementById('profile-modal');
        const joinedDate = new Date(gameState.player.joinedDate);
        const daysActive = Math.floor((new Date() - joinedDate) / (1000 * 60 * 60 * 24));
        
        const profileHTML = `
            <div class="profile-content">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${gameState.player.avatar}
                    </div>
                    <div class="profile-info">
                        <div class="profile-name">${gameState.player.name}</div>
                        <div class="profile-level">Level ${gameState.player.level}</div>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-label">Player ID</div>
                        <div class="profile-stat-value">${gameState.player.id.substring(0, 12)}...</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-label">Days Active</div>
                        <div class="profile-stat-value">${daysActive}</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-label">Total Trades</div>
                        <div class="profile-stat-value">${gameState.player.trades.length}</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-label">Portfolio Value</div>
                        <div class="profile-stat-value">$${calculatePortfolioValue().toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="action-btn" onclick="changeAvatar()">
                        <i class="fas fa-user-edit"></i> Change Avatar
                    </button>
                    <button class="action-btn" onclick="changePlayerName()">
                        <i class="fas fa-edit"></i> Change Name
                    </button>
                    <button class="action-btn danger" onclick="resetGame()">
                        <i class="fas fa-redo"></i> Reset Game
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('profile-content').innerHTML = profileHTML;
        modal.classList.add('show');
    }

    // ========== ADD MISSING CSS ==========
    function addMissingCSS() {
        if (!document.getElementById('game-styles')) {
            const style = document.createElement('style');
            style.id = 'game-styles';
            style.textContent = `
                /* Tab styles already in main style.css */
            `;
            document.head.appendChild(style);
        }
    }

    // ========== THEME MANAGEMENT ==========
    function initTheme() {
        document.documentElement.setAttribute('data-theme', gameState.currentTheme);
        if (elements.themeToggle) {
            elements.themeToggle.innerHTML = gameState.currentTheme === 'dark' 
                ? '<i class="fas fa-sun"></i> Light Mode' 
                : '<i class="fas fa-moon"></i> Dark Mode';
        }
    }

    // ========== STOCK HISTORY SYSTEM ==========
    function initStockHistory() {
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
        
        for (let i = GAME_CONFIG.chartDays; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
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
            lastEntry.close = currentPrice;
            lastEntry.volume = volume;
            if (currentPrice > lastEntry.high) lastEntry.high = currentPrice;
            if (currentPrice < lastEntry.low) lastEntry.low = currentPrice;
        } else {
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
            
            if (gameState.stockHistory[symbol].length > GAME_CONFIG.chartDays) {
                gameState.stockHistory[symbol] = gameState.stockHistory[symbol].slice(-GAME_CONFIG.chartDays);
            }
        }
        
        saveStockHistory();
    }

    function saveStockHistory() {
        localStorage.setItem('stock_history', JSON.stringify(gameState.stockHistory));
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
            updateLastUpdated();
            
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
                    <button class="fav-star" data-symbol="${stock.symbol}">
                        <i class="far fa-star"></i>
                    </button>
                </td>
            `;
            
            elements.stockTable.appendChild(row);
        });
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
        // Update quick stats
        if (elements.playerBalance) {
            elements.playerBalance.textContent = `$${gameState.player.balance.toFixed(2)}`;
        }
        
        const portfolioValue = calculatePortfolioValue();
        if (elements.portfolioValue) {
            elements.portfolioValue.textContent = `$${portfolioValue.toFixed(2)}`;
        }
        
        if (elements.playerRank) {
            elements.playerRank.textContent = `#${gameState.player.rank}`;
        }
        
        if (elements.playerLevel) {
            elements.playerLevel.textContent = gameState.player.level;
        }
        
        // Save game state
        saveGameState();
    }

    function calculatePortfolioValue() {
        let total = gameState.player.balance;
        
        for (const [symbol, holding] of Object.entries(gameState.player.portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                total += holding.shares * stock.price;
            }
        }
        
        gameState.player.totalProfit = total - GAME_CONFIG.startingBalance;
        
        return total;
    }

    function calculateDailyChange() {
        let totalChange = 0;
        
        for (const [symbol, holding] of Object.entries(gameState.player.portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                totalChange += holding.shares * stock.change;
            }
        }
        
        return totalChange;
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
        updateGameUI();
    }

    function calculateXPForLevel(level) {
        return level * 100;
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
        
        showNotification('Stock prices updated!', 'info');
    }

    // ========== TRADE SYSTEM ==========
    function executeTrade(action, quantity) {
        const stock = gameState.currentStock;
        if (!stock) {
            showNotification('Please select a stock first', 'error');
            return;
        }
        
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
        updateTradingTab();
        loadPortfolioTab();
        checkAchievements();
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
            });
        }
        
        // Profile button
        if (elements.profileBtn) {
            elements.profileBtn.addEventListener('click', showProfileModal);
        }
        
        // Close modal
        document.querySelector('.close-modal-btn').addEventListener('click', () => {
            document.getElementById('profile-modal').classList.remove('show');
        });
        
        // Overlay click
        document.getElementById('overlay').addEventListener('click', () => {
            document.getElementById('profile-modal').classList.remove('show');
        });
        
        // Trade type buttons
        document.querySelectorAll('.trade-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateTradeSummary();
            });
        });
        
        // Quantity controls
        document.querySelector('.qty-btn.minus').addEventListener('click', () => {
            const input = document.getElementById('trade-quantity');
            let value = parseInt(input.value) || 1;
            if (value > 1) {
                input.value = value - 1;
                updateTradeSummary();
            }
        });
        
        document.querySelector('.qty-btn.plus').addEventListener('click', () => {
            const input = document.getElementById('trade-quantity');
            let value = parseInt(input.value) || 1;
            input.value = value + 1;
            updateTradeSummary();
        });
        
        document.getElementById('trade-quantity').addEventListener('input', updateTradeSummary);
        
        // Execute trade button
        document.getElementById('execute-trade').addEventListener('click', () => {
            const tradeType = document.querySelector('.trade-type-btn.active').dataset.type;
            const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
            executeTrade(tradeType, quantity);
        });
        
        // Stock row clicks
        document.addEventListener('click', (e) => {
            const stockRow = e.target.closest('.stock-row');
            if (stockRow && !e.target.closest('.fav-star')) {
                handleStockSelect(stockRow);
                updateTradingTab(); // Update trading tab when stock is selected
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
        }
    }

    function toggleFavorite(symbol, starElement) {
        const icon = starElement.querySelector('i');
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            showNotification(`${symbol} added to favorites`, 'success');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            showNotification(`${symbol} removed from favorites`, 'info');
        }
    }

    // ========== DETAILED STOCK VIEW ==========
    function showStockDetails(symbol) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (!stock) return;
        
        const changeClass = stock.change >= 0 ? 'up' : 'down';
        const changeSign = stock.change >= 0 ? '+' : '';
        
        const modalHTML = `
            <div class="stock-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${symbol} - ${stock.name}</h3>
                        <button class="close-details-btn close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="price-display">
                            <div class="price-large">$${stock.price.toFixed(2)}</div>
                            <div class="price-change ${changeClass}">
                                ${changeSign}$${Math.abs(stock.change).toFixed(2)} (${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%)
                            </div>
                        </div>
                        
                        <div class="stock-details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Day High</span>
                                <span class="detail-value">$${stock.dayHigh.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Day Low</span>
                                <span class="detail-value">$${stock.dayLow.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Open</span>
                                <span class="detail-value">$${stock.open.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Previous Close</span>
                                <span class="detail-value">$${stock.previousClose.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Volume</span>
                                <span class="detail-value">${stock.volume.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="action-btn" onclick="
                                document.querySelector('.stock-details-modal')?.remove();
                                gameState.currentStock = stock;
                                document.querySelector('.game-tab[data-tab=\"trading\"]').click();
                            ">
                                <i class="fas fa-exchange-alt"></i> Trade this stock
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.stock-details-modal');
        const closeBtn = modal.querySelector('.close-details-btn');
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ========== UTILITY FUNCTIONS ==========
    function generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
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

    // ========== PROFILE FUNCTIONS ==========
    window.changeAvatar = function() {
        const avatars = ['👤', '🦸', '👨‍💼', '👩‍💼', '🧑‍🚀', '🧙', '🦹', '🧛', '🧟', '🧞'];
        const currentIndex = avatars.indexOf(gameState.player.avatar);
        const nextIndex = (currentIndex + 1) % avatars.length;
        gameState.player.avatar = avatars[nextIndex];
        localStorage.setItem('player_avatar', gameState.player.avatar);
        showNotification('Avatar updated!', 'success');
        showProfileModal(); // Refresh modal
    };

    window.changePlayerName = function() {
        const newName = prompt('Enter your new name (2-20 characters):', gameState.player.name);
        if (newName && newName.length >= 2 && newName.length <= 20) {
            gameState.player.name = newName;
            localStorage.setItem('player_name', newName);
            showNotification('Name updated!', 'success');
            updateGameUI();
            showProfileModal(); // Refresh modal
        } else {
            showNotification('Name must be 2-20 characters', 'error');
        }
    };

    window.resetGame = function() {
        if (confirm('Are you sure you want to reset your game? This will delete all your progress and start fresh.')) {
            localStorage.clear();
            location.reload();
        }
    };

    // ========== START THE GAME ==========
    init();
});