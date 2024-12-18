let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";

// Payment Check
function checkPaymentStatus() {
    if (portfolio.length >= MAX_FREE_TRACKING && !isPaidUser) {
        alert("You've reached the free limit of 10 cryptos. Upgrade for $5/month to track more.");
        // Redirect to payment page
        window.location.href = "payment.html";
        return false;
    }
    return true;
}

// Fetch Crypto Prices
async function fetchCryptoPrices() {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
        );
        return await response.json();
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
    if (!checkPaymentStatus()) return;

    const cryptoId = cryptoNameSelect.value;
    const cryptoName = cryptoNameSelect.options[cryptoNameSelect.selectedIndex].text;
    const amount = parseFloat(document.getElementById("crypto-amount").value);

    if (amount >= 0) {
        const existingCoin = portfolio.find((coin) => coin.id === cryptoId);
        if (existingCoin) {
            existingCoin.holdings = amount;
        } else {
            portfolio.push({ id: cryptoId, name: cryptoName, holdings: amount });
        }
        displayPortfolio();
    }
});

// Initialize
(async () => {
    displayPortfolio();
})();