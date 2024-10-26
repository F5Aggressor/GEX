document.addEventListener("DOMContentLoaded", function () {
    let currentChart = null;
    let optionsDataCache = {};
    let currentPrice = null;

    async function getOptionsData() {
        const ticker = document.getElementById('stockTicker').value;
        if (!ticker) {
            alert('Please enter a stock ticker symbol!');
            return;
        }

        const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10'; // Finnhub API key

        try {
            if (currentChart) {
                currentChart.destroy();
            }

            const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
            const priceData = await priceResponse.json();
            currentPrice = priceData.c;
            document.getElementById('priceValue').innerText = currentPrice.toFixed(2);
            document.getElementById('tickerSymbol').innerText = ticker.toUpperCase();

            const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
            const optionsData = await optionsResponse.json();
            optionsDataCache = optionsData.data.reduce((acc, option) => {
                acc[option.expirationDate] = option;
                return acc;
            }, {});

            const expirationDropdown = document.getElementById('expirationDates');
            expirationDropdown.innerHTML = '';
            optionsData.data.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.expirationDate;
                optionElement.text = option.expirationDate;
                expirationDropdown.appendChild(optionElement);
            });

            updateOptionsData();
            document.getElementById('stockTicker').value = '';
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    }

    function updateOptionsData() {
        const selectedExpiration = document.getElementById('expirationDates').value;
        const selectedOptionData = optionsDataCache[selectedExpiration];

        const callOptions = selectedOptionData.options.CALL;
        const putOptions = selectedOptionData.options.PUT;

        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        document.getElementById('totalCallInterest').innerText = callsOI.reduce((sum, oi) => sum + oi, 0);
        document.getElementById('totalPutInterest').innerText = putsOI.reduce((sum, oi) => sum + oi, 0);
        
        calculateGEX(callOptions, putOptions);
    }

    function calculateGEX(callOptions, putOptions) {
        const contractSize = 100;
        const gexData = [...callOptions, ...putOptions].map(option => ({
            strike: option.strike,
            gex: option.gamma * option.delta * option.openInterest * contractSize
        }));

        const closestGEX = gexData
            .sort((a, b) => Math.abs(a.strike - currentPrice) - Math.abs(b.strike - currentPrice))
            .slice(0, 3);

        const gexTableBody = document.getElementById("gexLevelsTable");
        gexTableBody.innerHTML = "";

        closestGEX.forEach(item => {
            const row = document.createElement

