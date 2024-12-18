let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");
const searchInput = document.getElementById("crypto-search");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";
let availableCryptos = []; // All fetched cryptos

// Fetch Top 10 Cryptos for Free Users
const TOP_10_CRYPTO_IDS = [
    "bitcoin", "ethereum", "cardano", "ripple", "litecoin", 
    "dogecoin", "polkadot", "binancecoin", "solana", "tron"
];

// Fetch Crypto Prices from CoinGecko
async function fetchCryptoPrices() {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
        );
        const data = await response.json();
        availableCryptos = data;
        return data;
    } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
    }
}

// Filter Cryptos for Free Users
function getAllowedCryptos() {
    if (isPaidUser) return availableCryptos;
    return availableCryptos.filter(crypto => TOP_10_CRYPTO_IDS.includes(crypto.id));
}

// Populate Search Suggestions
function populateSearchResults(searchValue) {
    const allowedCryptos = getAllowedCryptos();
    const results = allowedCryptos
        .filter(crypto => crypto.name.toLowerCase().includes(searchValue.toLowerCase()))
        .map(crypto => crypto.name);

    alert(`Results: ${results.length ? results.join(", ") : "No results found"}`);
}

// Display Portfolio Table
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

// Check Payment Status
function checkPaymentStatus() {
    if (portfolio.length >= MAX_FREE_TRACKING && !isPaidUser) {
        alert("You've reached the free limit of 10 cryptos. Upgrade for $5/month to track more.");
        window.open("https://commerce.coinbase.com/checkout/a8ec3794-d2e1-4f0b-800e-0622922bb725", "_blank");
        return false;
    }
    return true;
}

// Handle Form Submission
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cryptoId = cryptoNameSelect.value.toLowerCase();
    const cryptoName = cryptoNameSelect.options[cryptoNameSelect.selectedIndex].text;
    const amount = parseFloat(document.getElementById("crypto-amount").value);

    const allowedCryptos = getAllowedCryptos();
    if (!allowedCryptos.find(c => c.id === cryptoId)) {
        alert("This cryptocurrency is not available for free users.");
        return;
    }

    if (!checkPaymentStatus()) return;

    // Update or Remove Entry
    const existingCoin = portfolio.find((coin) => coin.id === cryptoId);
    if (amount === 0) {
        portfolio = portfolio.filter((coin) => coin.id !== cryptoId);
        alert(`${cryptoName} has been removed from your portfolio.`);
    } else if (amount > 0) {
        if (existingCoin) existingCoin.holdings = amount;
        else portfolio.push({ id: cryptoId, name: cryptoName, holdings: amount });
    }

    displayPortfolio();
});

// Search Input Listener
searchInput.addEventListener("input", (e) => {
    populateSearchResults(e.target.value);
});

// Manual Payment Confirmation Simulation
function setPaidUserStatus() {
    localStorage.setItem("isPaidUser", "true");
    alert("Payment successful! You can now track unlimited cryptos.");
    displayPortfolio();
}

// Initialize Portfolio
(async () => {
    await fetchCryptoPrices();
    displayPortfolio();
})();