let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const cryptoChart = document.getElementById("crypto-chart");
const chartLoader = document.getElementById("chart-loader");

const MAX_FREE_TRACKING = 10;
const PAYMENT_SUCCESS_QUERY = "payment_success=true";
let isPaidUser = localStorage.getItem("isPaidUser") === "true";

const coingeckoApiUrl =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1";
const coingeckoCoinListUrl = "https://api.coingecko.com/api/v3/coins/list";

let coinList = [];

// Fetch the list of all coins from CoinGecko
async function fetchCoinList() {
    try {
        const response = await fetch(coingeckoCoinListUrl);
        coinList = await response.json();
    } catch (error) {
        console.error("Error fetching CoinGecko coin list:", error);
    }
}

// Populate Dropdown with Crypto Names
async function populateDropdown() {
    try {
        const response = await fetch(coingeckoApiUrl);
        const cryptos = await response.json();

        cryptoNameSelect.innerHTML = "";
        cryptos.forEach((crypto, index) => {
            const option = document.createElement("option");
            option.value = crypto.id;
            option.textContent = crypto.name;

            // Blur locked options for unpaid users
            if (!isPaidUser && index >= MAX_FREE_TRACKING) {
                option.style.filter = "blur(4px)";
                option.disabled = true;
            }

            cryptoNameSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating dropdown:", error);
    }
}

// Display Portfolio
async function displayPortfolio() {
    try {
        const response = await fetch(coingeckoApiUrl);
        const prices = await response.json();

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
    } catch (error) {
        console.error("Error displaying portfolio:", error);
    }
}

// Search Cryptos and Display Chart
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const matchedCoin = coinList.find(
        (coin) =>
            coin.name.toLowerCase() === searchTerm ||
            coin.symbol.toLowerCase() === searchTerm
    );

    if (!matchedCoin) {
        alert("Cryptocurrency not found. Please try again.");
        return;
    }

    try {
        chartLoader.style.display = "block"; // Show loader
        cryptoChart.style.display = "none"; // Hide chart initially

        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${matchedCoin.id}/market_chart?vs_currency=usd&days=7`
        );
        const data = await response.json();

        // Reset chart before drawing
        const existingChart = Chart.getChart(cryptoChart);
        if (existingChart) existingChart.destroy();

        const labels = data.prices.map(([timestamp]) =>
            new Date(timestamp).toLocaleDateString()
        );
        const prices = data.prices.map(([_, price]) => price);

        new Chart(cryptoChart, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: `${matchedCoin.name} Price (7 days)`,
                        data: prices,
                        borderColor: "rgba(0, 200, 255, 1)",
                        backgroundColor: "rgba(0, 200, 255, 0.1)",
                    },
                ],
            },
            options: { responsive: true },
        });

        cryptoChart.style.display = "block"; // Show chart
    } catch (error) {
        alert("Failed to fetch chart data. Please try again.");
        console.error("Error fetching chart data:", error);
    } finally {
        chartLoader.style.display = "none"; // Hide loader
    }
});

// Handle Update Holdings Form
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cryptoId = cryptoNameSelect.value;
    const cryptoName = cryptoNameSelect.options[cryptoNameSelect.selectedIndex].text;
    const amount = parseFloat(document.getElementById("crypto-amount").value);

    const existingCoin = portfolio.find((coin) => coin.id === cryptoId);

    // Check payment status if adding a new entry
    if (!existingCoin && portfolio.length >= MAX_FREE_TRACKING && !isPaidUser) {
        alert("You've reached the free limit of 10 cryptos. Upgrade for $5/month to track more.");
        return;
    }

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

// Check for Payment Confirmation in URL
function checkPaymentStatus() {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.has("payment_success")) {
        localStorage.setItem("isPaidUser", "true");
        isPaidUser = true;
        alert("Payment confirmed! All features are now unlocked.");
        queryParams.delete("payment_success");
        window.history.replaceState(null, null, window.location.pathname);
    }
}

// Initialize
(async () => {
    checkPaymentStatus();
    await fetchCoinList();
    await populateDropdown();
    await displayPortfolio();
})();

