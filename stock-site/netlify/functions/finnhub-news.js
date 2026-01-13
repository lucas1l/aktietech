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
        // Get date range (last 30 days)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
        
        const to = toDate.toISOString().split('T')[0];
        const from = fromDate.toISOString().split('T')[0];

        const response = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`,
            { headers: { 'User-Agent': 'StockView/1.0' } }
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter and limit news
        const filteredNews = Array.isArray(data) 
            ? data
                .filter(item => item.headline && item.summary && item.url)
                .slice(0, 5)
            : [];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
            body: JSON.stringify(filteredNews)
        };

    } catch (error) {
        console.error('Error fetching news:', error);
        return {
            statusCode: 200, // Return 200 with empty array for better UX
            body: JSON.stringify([])
        };
    }
}