export async function handler(event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { symbol } = event.queryStringParameters;
    if (!symbol) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Symbol parameter is required' }) };
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'API key not configured' }) 
        };
    }

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
            { headers: { 'User-Agent': 'StockView/1.0' } }
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Check for invalid symbol (Finnhub returns {c: 0, ...})
        if (!data || data.c === 0) {
            return { 
                statusCode: 404, 
                body: JSON.stringify({ error: 'Stock not found', symbol: symbol }) 
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch stock data', message: error.message })
        };
    }
}