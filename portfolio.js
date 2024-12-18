const portfolio = JSON.parse(localStorage.getItem("portfolio")) || [
    { name: "Bitcoin", symbol: "bitcoin", holdings: 0.5 },
    { name: "Ethereum", symbol: "ethereum", holdings: 2 },
    { name: "Cardano", symbol: "cardano", holdings: 1000 },
    { name: "XRP", symbol: "ripple", holdings: 1500 }
];

async function fetchCryptoPrices() {
    try {
        const symbols = portfolio.map(coin => coin.symbol).join(",");
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
    }
}

async function displayPortfolio() {
    const tableBody = document.getElementById("portfolio-table-body");
    const totalValueElement = document.getElementById("total-value");
    let totalPortfolioValue = 0;

    const prices = await fetchCryptoPrices();
    if (!prices) {
        totalValueElement.textContent = "Failed to load portfolio. Please try again later.";
        return;
    }

    tableBody.innerHTML = ""; // Clear table body

    portfolio.forEach(coin => {
        const price = prices[coin.symbol]?.usd || 0;
        const totalValue = price * coin.holdings;
        totalPortfolioValue += totalValue;

        const row = `
            <tr>
                <td>${coin.name}</td>
                <td>${coin.holdings}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${totalValue.toFixed(2)}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    totalValueElement.textContent = `Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}`;
}

document.getElementById("update-portfolio-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const cryptoName = document.getElementById("crypto-name").value;
    const cryptoAmount = parseFloat(document.getElementById("crypto-amount").value);

    if (cryptoAmount >= 0) {
        const coin = portfolio.find(c => c.symbol === cryptoName);
        if (coin) {
            coin.holdings = cryptoAmount;
            localStorage.setItem("portfolio", JSON.stringify(portfolio));
            displayPortfolio();
        }
    }
});

displayPortfolio();