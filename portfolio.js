let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";
const coingeckoApiUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1";

// Fetch Crypto Prices and Names
async function fetchCryptoData() {
    try {
        const response = await fetch(coingeckoApiUrl);
        return await response.json();
    } catch (error) {
        console.error("Error fetching crypto data:", error);
        return [];
    }
}

// Populate Dropdown with Crypto Names
async function populateDropdown() {
    const cryptos = await fetchCryptoData();
    cryptoNameSelect.innerHTML = ""; // Clear existing options
    cryptos.forEach((crypto) => {
        const option = document.createElement("option");
        option.value = crypto.id;
        option.textContent = crypto.name;
        cryptoNameSelect.appendChild(option);
    });
}

// Display Portfolio
async function displayPortfolio() {
    const prices = await fetchCryptoData();
    if (!prices.length) {
        totalValueElement.textContent = "Failed to load portfolio. Please try again.";
        return;
    }

    tableBody.innerHTML = "";
    let totalValue = 0;

    portfolio.forEach((coin, index) => {
        // Restrict free users to 10 cryptos
        if (index >= MAX_FREE_TRACKING && !isPaidUser) return;

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

    const existingCoin = portfolio.find((coin) => coin.id === cryptoId);

    // Check payment status if adding a new entry
    if (!existingCoin && !checkPaymentStatus()) return;

    // Remove if holdings are 0
    if (amount === 0) {
        portfolio = portfolio.filter((coin) => coin.id !== cryptoId);
        alert(`${cryptoName} has been removed from your portfolio.`);
    } else if (amount > 0) {
        // Update existing or add new
        if (existingCoin) {
            existingCoin.holdings = amount;
        } else {
            portfolio.push({ id: cryptoId, name: cryptoName, holdings: amount });
        }
    } else {
        alert("Please enter a valid amount (0 to remove or greater than 0 to update).");
    }

    displayPortfolio();
});

// Payment Check
function checkPaymentStatus() {
    if (portfolio.length >= MAX_FREE_TRACKING && !isPaidUser) {
        alert("You've reached the free limit of 10 cryptos. Upgrade for $5/month to track more.");
        window.location.href = "payment.html";
        return false;
    }
    return true;
}

// Initialize Portfolio
(async () => {
    await populateDropdown();
    displayPortfolio();
})();