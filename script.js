// script.js - STOCK TRADING GAME WITH SIDEBAR NAVIGATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('Stock Trading Game loading...');

    // ========== GAME CONFIGURATION ==========
    const GAME_CONFIG = {
        defaultStocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'],
        startingBalance: 10000,
        transactionFee: 4.99,
        updateInterval: 30000
    };

    // ========== GAME STATE ==========
    let gameState = {
        player: {
            balance: parseFloat(localStorage.getItem('player_balance')) || GAME_CONFIG.startingBalance,
            portfolio: JSON.parse(localStorage.getItem('stock_game_portfolio')) || {},
            trades: JSON.parse(localStorage.getItem('stock_game_trades')) || [],
            rank: 1,
            level: parseInt(localStorage.getItem('player_level')) || 1,
            xp: parseInt(localStorage.getItem('player_xp')) || 0,
            achievements: JSON.parse(localStorage.getItem('player_achievements')) || []
        },
        stocks: [],
        currentStock: null,
        currentTheme: localStorage.getItem('stock_theme') || 'dark',
        updateInterval: null
    };

    // ========== INITIALIZATION ==========
    function init() {
        console.log('Initializing game...');
        
        // Set up theme
        initTheme();
        
        // Initialize achievements
        initAchievements();
        
        // Load initial data
        loadInitialData();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize sidebar navigation
        initSidebarNavigation();
        
        // Start price updates
        startPriceUpdates();
        
        console.log('Game initialized successfully!');
    }

    // ========== SIDEBAR NAVIGATION ==========
    function initSidebarNavigation() {
        // Menu toggle for mobile
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
        
        // Page navigation
        const navItems = document.querySelectorAll('.nav-item');
        const pageContents = document.querySelectorAll('.page-content');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Show corresponding page
                pageContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${page}-page`).classList.add('active');
                
                // Update page title
                updatePageTitle(page);
                
                // Load page content
                switch(page) {
                    case 'portfolio':
                        loadPortfolioPage();
                        break;
                    case 'trading':
                        loadTradingPage();
                        break;
                    case 'leaderboard':
                        loadLeaderboardPage();
                        break;
                    case 'achievements':
                        loadAchievementsPage();
                        break;
                    case 'news':
                        loadNewsPage();
                        break;
                }
                
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                }
            });
        });
    }

    function updatePageTitle(page) {
        const titles = {
            'market': 'Stock Market',
            'portfolio': 'Your Portfolio',
            'trading': 'Trade Stocks',
            'leaderboard': 'Leaderboard',
            'achievements': 'Achievements',
            'news': 'Market News'
        };
        
        const titleElement = document.querySelector('.header-title h1');
        const icon = document.querySelector(`.nav-item[data-page="${page}"] i`).className;
        
        titleElement.innerHTML = `<i class="${icon}"></i> ${titles[page] || 'Stock Market'}`;
    }

    // ========== THEME MANAGEMENT ==========
    function initTheme() {
        document.documentElement.setAttribute('data-theme', gameState.currentTheme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = gameState.currentTheme === 'dark' 
                ? '<i class="fas fa-sun"></i><span>Light Mode</span>' 
                : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        }
    }

    // ========== DATA LOADING ==========
    function loadInitialData() {
        console.log('Loading initial data...');
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
        
        setTimeout(() => {
            gameState.stocks = GAME_CONFIG.defaultStocks.map(symbol => generateMockStock(symbol));
            
            if (loading) {
                loading.style.display = 'none';
            }
            
            renderStockTable();
            updateGameUI();
            updateLastUpdated();
            
            // Load initial page content
            loadPortfolioPage();
            loadTradingPage();
            
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
    function renderStockTable() {
        const stockTable = document.getElementById('stock-table');
        if (!stockTable) return;
        
        stockTable.innerHTML = '';
        
        gameState.stocks.forEach(stock => {
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
            
            stockTable.appendChild(row);
        });
        
        // Update stock count
        document.getElementById('stock-count').textContent = gameState.stocks.length;
    }

    // ========== GAME UI UPDATES ==========
    function updateGameUI() {
        // Update sidebar stats
        document.getElementById('player-balance').textContent = `$${gameState.player.balance.toFixed(2)}`;
        document.getElementById('portfolio-value').textContent = `$${calculatePortfolioValue().toFixed(2)}`;
        document.getElementById('player-rank').textContent = `#${gameState.player.rank}`;
        document.getElementById('player-level').textContent = gameState.player.level;
        
        // Update quick stats on market page
        updateQuickStats();
    }

    function calculatePortfolioValue() {
        let total = gameState.player.balance;
        
        for (const [symbol, holding] of Object.entries(gameState.player.portfolio)) {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            if (stock) {
                total += holding.shares * stock.price;
            }
        }
        
        return total;
    }

    function updateQuickStats() {
        if (gameState.stocks.length === 0) return;
        
        // Find best performer
        const best = [...gameState.stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
        const worst = [...gameState.stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
        const mostActive = [...gameState.stocks].sort((a, b) => b.volume - a.volume)[0];
        
        document.getElementById('best-performer').textContent = 
            `${best.symbol} (${best.changePercent >= 0 ? '+' : ''}${best.changePercent.toFixed(2)}%)`;
        
        document.getElementById('worst-performer').textContent = 
            `${worst.symbol} (${worst.changePercent >= 0 ? '+' : ''}${worst.changePercent.toFixed(2)}%)`;
        
        document.getElementById('most-active').textContent = mostActive.symbol;
    }

    // ========== PORTFOLIO PAGE ==========
    function loadPortfolioPage() {
        const portfolioValue = calculatePortfolioValue();
        const profit = portfolioValue - GAME_CONFIG.startingBalance;
        const profitPercent = (profit / GAME_CONFIG.startingBalance) * 100;
        const dailyChange = calculateDailyChange();
        
        // Update summary cards
        document.getElementById('portfolio-total').textContent = `$${portfolioValue.toFixed(2)}`;
        document.getElementById('portfolio-cash').textContent = `$${gameState.player.balance.toFixed(2)}`;
        document.getElementById('portfolio-profit').textContent = `$${profit.toFixed(2)}`;
        document.getElementById('portfolio-profit-percent').textContent = `${profit >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`;
        document.getElementById('portfolio-profit-percent').className = profit >= 0 ? 'summary-change up' : 'summary-change down';
        document.getElementById('portfolio-trades').textContent = gameState.player.trades.length;
        document.getElementById('portfolio-daily-change').textContent = 
            `${dailyChange >= 0 ? '+' : ''}$${Math.abs(dailyChange).toFixed(2)} (${dailyChange >= 0 ? '+' : ''}${calculateDailyChangePercent().toFixed(2)}%) today`;
        document.getElementById('portfolio-daily-change').className = dailyChange >= 0 ? 'summary-change up' : 'summary-change down';
        
        // Update holdings count
        const holdingsCount = Object.keys(gameState.player.portfolio).length;
        document.getElementById('holdings-count').textContent = `${holdingsCount} stock${holdingsCount !== 1 ? 's' : ''}`;
        
        // Load holdings list
        loadHoldingsList();
        
        // Load recent trades
        loadRecentTrades();
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

    function calculateDailyChangePercent() {
        const portfolioValue = calculatePortfolioValue();
        const invested = portfolioValue - calculateDailyChange();
        return invested > 0 ? (calculateDailyChange() / invested) * 100 : 0;
    }

    function loadHoldingsList() {
        const holdingsList = document.getElementById('holdings-list');
        const portfolio = gameState.player.portfolio;
        
        if (Object.keys(portfolio).length === 0) {
            holdingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie fa-3x"></i>
                    <h4>No holdings yet</h4>
                    <p>Buy stocks to build your portfolio!</p>
                    <button class="action-btn" onclick="switchToMarket()">
                        <i class="fas fa-shopping-cart"></i> Browse Market
                    </button>
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
                    <div class="holding-item" onclick="selectStockForTrading('${symbol}')">
                        <div class="holding-symbol">${symbol}</div>
                        <div class="holding-details">
                            <div class="holding-quantity">${holding.shares} shares</div>
                            <div class="holding-value ${profitClass}">
                                $${currentValue.toFixed(2)} • ${profit >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        holdingsList.innerHTML = holdingsHTML;
    }

    function loadRecentTrades() {
        const recentTrades = document.getElementById('recent-trades');
        const trades = gameState.player.trades;
        
        if (trades.length === 0) {
            recentTrades.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt fa-2x"></i>
                    <h4>No trades yet</h4>
                    <p>Make your first trade to get started!</p>
                </div>
            `;
            return;
        }
        
        // Get last 5 trades
        const recent = trades.slice(-5).reverse();
        let tradesHTML = '';
        
        recent.forEach(trade => {
            const actionClass = trade.action === 'buy' ? 'buy' : 'sell';
            const actionIcon = trade.action === 'buy' ? 'fa-shopping-cart' : 'fa-money-bill-wave';
            
            tradesHTML += `
                <div class="trade-item">
                    <div class="trade-action ${actionClass}">
                        <i class="fas ${actionIcon}"></i>
                    </div>
                    <div class="trade-info">
                        <div class="trade-symbol">${trade.symbol}</div>
                        <div class="trade-time">${formatTimeAgo(trade.timestamp)}</div>
                    </div>
                    <div class="trade-amount">$${trade.total.toFixed(2)}</div>
                </div>
            `;
        });
        
        recentTrades.innerHTML = tradesHTML;
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

    // ========== TRADING PAGE ==========
    function loadTradingPage() {
        updateTradingDisplay();
        setupTradingControls();
    }

    function updateTradingDisplay() {
        const stock = gameState.currentStock;
        const display = document.getElementById('selected-stock-display');
        
        if (!stock) {
            display.innerHTML = `
                <div class="no-stock-selected">
                    <i class="fas fa-search fa-3x"></i>
                    <h4>No stock selected</h4>
                    <p>Select a stock from the market to start trading</p>
                    <button class="action-btn" onclick="switchToMarket()">
                        <i class="fas fa-chart-line"></i> View Market
                    </button>
                </div>
            `;
            return;
        }
        
        const changeClass = stock.change >= 0 ? 'up' : 'down';
        const changeSign = stock.change >= 0 ? '+' : '';
        const holding = gameState.player.portfolio[stock.symbol];
        
        display.innerHTML = `
            <div class="stock-selected-display">
                <div class="stock-selected-header">
                    <div class="stock-selected-symbol">${stock.symbol}</div>
                    <div class="stock-selected-price">$${stock.price.toFixed(2)}</div>
                </div>
                <div class="stock-selected-change ${changeClass}">
                    ${changeSign}$${Math.abs(stock.change).toFixed(2)} (${changeSign}${Math.abs(stock.changePercent).toFixed(2)}%)
                </div>
                
                <div class="stock-details">
                    <div class="detail-item">
                        <span>Day High:</span>
                        <span>$${stock.dayHigh.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Day Low:</span>
                        <span>$${stock.dayLow.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Volume:</span>
                        <span>${stock.volume.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span>Open:</span>
                        <span>$${stock.open.toFixed(2)}</span>
                    </div>
                </div>
                
                ${holding ? `
                    <div class="holding-info">
                        <h5>Your Holdings</h5>
                        <div class="holding-stats">
                            <span>${holding.shares} shares</span>
                            <span>Avg: $${holding.avgPrice.toFixed(2)}</span>
                            <span>Value: $${(holding.shares * stock.price).toFixed(2)}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Update trade form
        document.getElementById('trade-symbol').value = stock.symbol;
        updateTradeSummary();
    }

    function setupTradingControls() {
        // Trade type buttons
        document.querySelectorAll('.trade-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateTradeSummary();
            });
        });
        
        // Quantity controls
        const minusBtn = document.querySelector('.qty-btn.minus');
        const plusBtn = document.querySelector('.qty-btn.plus');
        const quantityInput = document.getElementById('trade-quantity');
        
        minusBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value) || 1;
            if (value > 1) {
                quantityInput.value = value - 1;
                updateTradeSummary();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value) || 1;
            quantityInput.value = value + 1;
            updateTradeSummary();
        });
        
        quantityInput.addEventListener('input', updateTradeSummary);
        
        // Execute trade button
        const executeBtn = document.getElementById('execute-trade');
        executeBtn.addEventListener('click', executeTrade);
    }

    function updateTradeSummary() {
        const stock = gameState.currentStock;
        if (!stock) return;
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const tradeType = document.querySelector('.trade-type-btn.active').dataset.type;
        const price = stock.price;
        const subtotal = quantity * price;
        const fee = GAME_CONFIG.transactionFee;
        const total = tradeType === 'buy' ? subtotal + fee : Math.max(0, subtotal - fee);
        
        document.getElementById('trade-price').textContent = `$${price.toFixed(2)}`;
        document.getElementById('trade-price-per-share').textContent = `$${price.toFixed(2)}`;
        document.getElementById('trade-shares').textContent = quantity;
        document.getElementById('trade-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('trade-fee').textContent = `$${fee.toFixed(2)}`;
        document.getElementById('trade-total').textContent = `$${total.toFixed(2)}`;
        document.getElementById('trade-estimate').textContent = `$${total.toFixed(2)}`;
        
        // Validate trade
        const executeBtn = document.getElementById('execute-trade');
        if (tradeType === 'buy') {
            executeBtn.disabled = total > gameState.player.balance;
            executeBtn.innerHTML = executeBtn.disabled 
                ? '<i class="fas fa-exclamation-circle"></i><span>Insufficient Funds</span>'
                : '<i class="fas fa-play-circle"></i><span>Execute Buy Order</span>';
        } else {
            const holding = gameState.player.portfolio[stock.symbol];
            executeBtn.disabled = !holding || holding.shares < quantity;
            executeBtn.innerHTML = executeBtn.disabled 
                ? '<i class="fas fa-exclamation-circle"></i><span>Insufficient Shares</span>'
                : '<i class="fas fa-play-circle"></i><span>Execute Sell Order</span>';
        }
    }

    function executeTrade() {
        const stock = gameState.currentStock;
        if (!stock) {
            showNotification('Please select a stock first', 'error');
            return;
        }
        
        const quantity = parseInt(document.getElementById('trade-quantity').value) || 1;
        const tradeType = document.querySelector('.trade-type-btn.active').dataset.type;
        
        if (tradeType === 'buy') {
            buyStock(stock, quantity);
        } else {
            sellStock(stock, quantity);
        }
    }

    function buyStock(stock, quantity) {
        const totalCost = quantity * stock.price;
        const totalWithFee = totalCost + GAME_CONFIG.transactionFee;
        
        if (gameState.player.balance < totalWithFee) {
            showNotification('❌ Insufficient funds for this trade', 'error');
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
            fee: GAME_CONFIG.transactionFee,
            timestamp: new Date().toISOString()
        };
        
        gameState.player.trades.push(trade);
        
        showNotification(`✅ Bought ${quantity} shares of ${stock.symbol} for $${totalCost.toFixed(2)}`, 'success');
        updateGameUI();
        updateTradingDisplay();
        loadPortfolioPage();
        saveGameState();
    }

    function sellStock(stock, quantity) {
        const holding = gameState.player.portfolio[stock.symbol];
        
        if (!holding || holding.shares < quantity) {
            showNotification('❌ Not enough shares to sell', 'error');
            return;
        }
        
        const totalRevenue = quantity * stock.price;
        const netRevenue = Math.max(0, totalRevenue - GAME_CONFIG.transactionFee);
        const costBasis = holding.avgPrice * quantity;
        const profit = totalRevenue - costBasis;
        
        // Update balance
        gameState.player.balance += netRevenue;
        
        // Update portfolio
        const newShares = holding.shares - quantity;
        
        if (newShares === 0) {
            delete gameState.player.portfolio[stock.symbol];
        } else {
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
            total: totalRevenue,
            fee: GAME_CONFIG.transactionFee,
            profit: profit,
            timestamp: new Date().toISOString()
        };
        
        gameState.player.trades.push(trade);
        
        showNotification(`✅ Sold ${quantity} shares of ${stock.symbol} for $${totalRevenue.toFixed(2)} (Profit: $${profit.toFixed(2)})`, 'success');
        updateGameUI();
        updateTradingDisplay();
        loadPortfolioPage();
        saveGameState();
    }

    // ========== LEADERBOARD PAGE ==========
    function loadLeaderboardPage() {
        // For now, just update your position
        document.getElementById('your-rank').textContent = gameState.player.rank;
        document.getElementById('your-value').textContent = calculatePortfolioValue().toFixed(0);
        document.getElementById('your-change').textContent = `+0.0%`;
    }

    // ========== ACHIEVEMENTS PAGE ==========
    function loadAchievementsPage() {
        const achievements = gameState.player.achievements;
        const unlocked = achievements.filter(a => a.earned).length;
        
        // Update summary
        document.getElementById('total-xp').textContent = gameState.player.xp;
        document.getElementById('achievements-level').textContent = gameState.player.level;
        document.getElementById('achievements-unlocked').textContent = `${unlocked}/${achievements.length}`;
        
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

    function calculateXPForLevel(level) {
        return level * 100;
    }

    // ========== NEWS PAGE ==========
    function loadNewsPage() {
        // Simple mock news for now
        const newsList = document.getElementById('news-list');
        const news = [
            {
                title: 'Stock Market Hits Record High',
                content: 'The stock market reached new heights today as investor confidence grows. Major tech stocks led the rally with gains across the board.',
                category: 'Market Trends',
                time: '2 hours ago'
            },
            {
                title: 'Tech Stocks Continue to Rally',
                content: 'Technology companies reported strong earnings, driving stock prices higher. Analysts remain bullish on the tech sector.',
                category: 'Technology',
                time: '4 hours ago'
            },
            {
                title: 'Federal Reserve Holds Interest Rates Steady',
                content: 'The Federal Reserve announced it will maintain current interest rates, citing stable economic growth and controlled inflation.',
                category: 'Finance',
                time: '6 hours ago'
            }
        ];
        
        let newsHTML = '';
        news.forEach(item => {
            newsHTML += `
                <div class="news-item">
                    <div class="news-image">
                        <i class="fas fa-newspaper fa-2x"></i>
                    </div>
                    <div class="news-content">
                        <h4>${item.title}</h4>
                        <p>${item.content}</p>
                        <div class="news-meta">
                            <span class="news-category">${item.category}</span>
                            <span class="news-time">${item.time}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        newsList.innerHTML = newsHTML;
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
        });
        
        renderStockTable();
        updateGameUI();
        updateLastUpdated();
        
        showNotification('Stock prices updated!', 'info');
    }

    function updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('last-updated').textContent = timeString;
        document.getElementById('footer-updated').textContent = timeString;
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                gameState.currentTheme = gameState.currentTheme === 'light' ? 'dark' : 'light';
                localStorage.setItem('stock_theme', gameState.currentTheme);
                initTheme();
                showNotification(`${gameState.currentTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
            });
        }
        
        // Profile button
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', showProfileModal);
        }
        
        // Search
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const term = this.value.toLowerCase().trim();
                const rows = document.querySelectorAll('.stock-row');
                
                rows.forEach(row => {
                    const symbol = row.dataset.symbol.toLowerCase();
                    const text = row.textContent.toLowerCase();
                    row.style.display = term === '' || symbol.includes(term) || text.includes(term) ? '' : 'none';
                });
            });
        }
        
        // Stock row clicks
        document.addEventListener('click', (e) => {
            const stockRow = e.target.closest('.stock-row');
            if (stockRow) {
                const symbol = stockRow.dataset.symbol;
                const stock = gameState.stocks.find(s => s.symbol === symbol);
                if (stock) {
                    // Remove selection from all rows
                    document.querySelectorAll('.stock-row').forEach(row => {
                        row.classList.remove('selected');
                    });
                    
                    // Add selection to clicked row
                    stockRow.classList.add('selected');
                    
                    // Set as current stock
                    gameState.currentStock = stock;
                    
                    // Update trading display if on trading page
                    if (document.getElementById('trading-page').classList.contains('active')) {
                        updateTradingDisplay();
                    }
                }
            }
            
            // Favorite star clicks
            const favStar = e.target.closest('.fav-star');
            if (favStar) {
                const icon = favStar.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    showNotification(`${favStar.dataset.symbol} added to favorites`, 'success');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    showNotification(`${favStar.dataset.symbol} removed from favorites`, 'info');
                }
            }
        });
        
        // Quick trade buttons
        document.querySelectorAll('.quick-trade-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const text = this.querySelector('span').textContent;
                const match = text.match(/(Buy|Sell) (\d+) (\w+)/);
                if (match) {
                    const action = match[1].toLowerCase();
                    const quantity = parseInt(match[2]);
                    const symbol = match[3];
                    
                    const stock = gameState.stocks.find(s => s.symbol === symbol);
                    if (stock) {
                        gameState.currentStock = stock;
                        document.getElementById('trade-quantity').value = quantity;
                        
                        // Set trade type
                        document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
                        document.querySelector(`.trade-type-btn[data-type="${action}"]`).classList.add('active');
                        
                        updateTradingDisplay();
                        
                        // Switch to trading page
                        document.querySelector('.nav-item[data-page="trading"]').click();
                    }
                }
            });
        });
        
        // Close modal
        const closeModalBtn = document.querySelector('.close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.getElementById('profile-modal').classList.remove('show');
                document.getElementById('overlay').classList.remove('show');
            });
        }
    }

    // ========== UTILITY FUNCTIONS ==========
    window.switchToMarket = function() {
        document.querySelector('.nav-item[data-page="market"]').click();
    };

    window.selectStockForTrading = function(symbol) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (stock) {
            gameState.currentStock = stock;
            document.querySelector('.nav-item[data-page="trading"]').click();
        }
    };

    window.quickTrade = function(symbol, action, quantity) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        if (stock) {
            gameState.currentStock = stock;
            document.getElementById('trade-quantity').value = quantity;
            
            // Set trade type
            document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.trade-type-btn[data-type="${action}"]`).classList.add('active');
            
            updateTradingDisplay();
            
            // Switch to trading page
            document.querySelector('.nav-item[data-page="trading"]').click();
        }
    };

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

    // ========== PROFILE MODAL ==========
    function showProfileModal() {
        const modal = document.getElementById('profile-modal');
        const modalContent = document.getElementById('profile-content');
        
        modalContent.innerHTML = `
            <div class="profile-info">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user fa-3x"></i>
                    </div>
                    <div class="profile-details">
                        <h4>Trader</h4>
                        <p>Level ${gameState.player.level}</p>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span>Total Value</span>
                        <span>$${calculatePortfolioValue().toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Cash Balance</span>
                        <span>$${gameState.player.balance.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span>Total Trades</span>
                        <span>${gameState.player.trades.length}</span>
                    </div>
                    <div class="stat-item">
                        <span>Achievements</span>
                        <span>${gameState.player.achievements.filter(a => a.earned).length}/${gameState.player.achievements.length}</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="action-btn" onclick="resetGame()">
                        <i class="fas fa-redo"></i> Reset Game
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    window.resetGame = function() {
        if (confirm('Are you sure you want to reset your game? This will delete all your progress and start fresh.')) {
            localStorage.clear();
            location.reload();
        }
    };

    // ========== SAVE GAME STATE ==========
    function saveGameState() {
        localStorage.setItem('player_balance', gameState.player.balance);
        localStorage.setItem('stock_game_portfolio', JSON.stringify(gameState.player.portfolio));
        localStorage.setItem('stock_game_trades', JSON.stringify(gameState.player.trades));
        localStorage.setItem('player_level', gameState.player.level);
        localStorage.setItem('player_xp', gameState.player.xp);
        localStorage.setItem('player_achievements', JSON.stringify(gameState.player.achievements));
    }

    // ========== START THE GAME ==========
    init();
});