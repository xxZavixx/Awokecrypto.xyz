let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const cryptoChart = document.getElementById("crypto-chart");
const chartLoader = document.getElementById("chart-loader");

const coingeckoApiUrl =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1";
const coingeckoCoinListUrl = "https://api.coingecko.com/api/v3/coins/list";

let coinList = [];

// Retry Logic for API Requests
async function fetchWithRetry(url, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
            attempt++;
            if (attempt === retries) throw error; // Throw error on last attempt
        }
    }
}

// Fetch Coin List with Local Caching
async function fetchCoinList() {
    const cacheKey = "coinList";
    const cacheDuration = 60000; // 1 minute
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    const now = new Date().getTime();

    if (cached.timestamp && now - cached.timestamp < cacheDuration) {
        coinList = cached.data;
        return;
    }

    try {
        coinList = await fetchWithRetry(coingeckoCoinListUrl);
        localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: coinList, timestamp: now })
        );
    } catch (error) {
        console.error("Error fetching CoinGecko coin list:", error.message);
    }
}

// Populate Dropdown with Retry Logic and Caching
async function populateDropdown() {
    try {
        const cryptos = await fetchWithRetry(coingeckoApiUrl);
        cryptoNameSelect.innerHTML = ""; // Clear any existing options

        cryptos.forEach((crypto) => {
            const option = document.createElement("option");
            option.value = crypto.id;
            option.textContent = crypto.name;
            cryptoNameSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating dropdown:", error.message);
        cryptoNameSelect.innerHTML = '<option>Error loading data. Refresh to try again.</option>';
    }
}

// Display Portfolio with Error Handling
async function displayPortfolio() {
    try {
        const prices = await fetchWithRetry(coingeckoApiUrl);
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
        console.error("Error displaying portfolio:", error.message);
        totalValueElement.textContent = "Failed to load portfolio. Please refresh.";
    }
}

// Search Cryptos and Display Chart with Retry Logic
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
        chartLoader.style.display = "block";
        cryptoChart.style.display = "none";

        const data = await fetchWithRetry(
            `https://api.coingecko.com/api/v3/coins/${matchedCoin.id}/market_chart?vs_currency=usd&days=7`
        );

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

        cryptoChart.style.display = "block";
    } catch (error) {
        console.error("Error fetching chart data:", error.message);
        alert("Failed to fetch chart data. Please try again.");
    } finally {
        chartLoader.style.display = "none";
    }
});

// Handle Update Holdings Form
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cryptoId = cryptoNameSelect.value;
    const cryptoName = cryptoNameSelect.options[cryptoNameSelect.selectedIndex].text;
    const amount = parseFloat(document.getElementById("crypto-amount").value);

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
        alert("Please enter a valid amount (0 to remove or greater than 0 to update).");
    }

    displayPortfolio();
});

// Initialize
(async () => {
    await fetchCoinList();
    await populateDropdown();
    await displayPortfolio();
})();
