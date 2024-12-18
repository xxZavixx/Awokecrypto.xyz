let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";

// Fetch Crypto Prices (Top 500 Cryptos)
async function fetchCryptoPrices() {
    try {
        const urls = [
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1",
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2",
        ];

        const responses = await Promise.all(urls.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));
        return data.flat();
    } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
    }
}

// Display Portfolio
async function displayPortfolio() {
    const prices = await fetchCryptoPrices();
    if (!prices) {
        totalValueElement.textContent = "Failed to load portfolio. Please try again.";
        return;
    }

    tableBody.innerHTML = "";
    let totalValue = 0;

    portfolio.forEach((coin) => {
        const priceData = prices.find((crypto) => crypto.id === coin.id);
        const price = priceData ? priceData.current_price : 0;
        const total = price * coin.holdings;
        totalValue += total;

        const row = `
            <tr>
                <td>${coin.name}</td>
                <td>${coin.holdings}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${total.toFixed(2)}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    totalValueElement.textContent = `Total Portfolio Value: $${totalValue.toFixed(2)}`;
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
}

// Update Holdings
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cryptoId = cryptoNameSelect.value;
    const cryptoName = cryptoNameSelect.options[cryptoNameSelect.selectedIndex].text;
    const amount = parseFloat(document.getElementById("crypto-amount").value);

    if (!isPaidUser && portfolio.length >= MAX_FREE_TRACKING) {
        alert("You've reached the free limit of 10 cryptos. Please upgrade to track more.");
        window.open("https://commerce.coinbase.com/checkout/a8ec3794-d2e1-4f0b-800e-0622922bb725", "_blank");
        return;
    }

    const existingCoin = portfolio.find((coin) => coin.id === cryptoId);
    if (amount === 0) {
        portfolio = portfolio.filter((coin) => coin.id !== cryptoId);
        alert(`${cryptoName} has been removed from your portfolio.`);
    } else if (amount > 0) {
        if (existingCoin) {
            existingCoin.holdings = amount;
        } else {
            portfolio.push({ id: cryptoId, name: cryptoName, holdings: amount });
        }
    } else {
        alert("Please enter a valid amount.");
    }

    displayPortfolio();
});

// Search Crypto
async function searchCrypto() {
    const query = document.getElementById("crypto-search").value.trim();
    if (!query) return alert("Please enter a cryptocurrency name.");
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    const data = await response.json();
    if (data.coins.length) {
        alert(`Results: ${data.coins.map(coin => coin.name).join(", ")}`);
    } else {
        alert("No results found.");
    }
}

// Initialize Portfolio
(async () => {
    const prices = await fetchCryptoPrices();
    if (prices) {
        cryptoNameSelect.innerHTML = prices.map(crypto => 
            `<option value="${crypto.id}">${crypto.name}</option>`
        ).join("");
    }
    displayPortfolio();
})();