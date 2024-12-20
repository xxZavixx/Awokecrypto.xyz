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

// Fetch the list of all coins from CoinGecko
async function fetchCoinList() {
    try {
        const response = await fetch(coingeckoCoinListUrl);
        coinList = await response.json();
    } catch (error) {
        console.error("Error fetching CoinGecko coin list:", error);
    }
}

// Populate Dropdown with retry logic
async function populateDropdown() {
    const maxRetries = 3;
    let attempt = 0;

    cryptoNameSelect.innerHTML = '<option>Loading...</option>'; // Display loading message

    while (attempt < maxRetries) {
        try {
            const response = await fetch(coingeckoApiUrl);
            if (!response.ok) throw new Error("Failed to fetch data from CoinGecko.");

            const cryptos = await response.json();
            cryptoNameSelect.innerHTML = ""; // Clear loading message

            cryptos.forEach((crypto) => {
                const option = document.createElement("option");
                option.value = crypto.id;
                option.textContent = crypto.name;
                cryptoNameSelect.appendChild(option);
            });

            return; // Exit loop if successful
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            attempt++;
        }
    }

    cryptoNameSelect.innerHTML = '<option>Error loading data. Refresh to try again.</option>';
}

// Fetch Prices with Retry Logic
async function fetchPricesWithRetry(maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(coingeckoApiUrl);
            if (!response.ok) throw new Error("Failed to fetch prices from CoinGecko.");
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt + 1} to fetch prices failed.`, error);
            attempt++;
        }
    }
    throw new Error("Failed to fetch prices after multiple attempts.");
}

// Display Portfolio
async function displayPortfolio() {
    try {
        const prices = await fetchPricesWithRetry();

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
    } catch (error) {
        console.error("Error displaying portfolio:", error);
        tableBody.innerHTML = portfolio.map(coin => `
            <tr>
                <td>${coin.name}</td>
                <td>${coin.holdings}</td>
                <td>N/A</td>
                <td>N/A</td>
            </tr>
        `).join('');
        totalValueElement.textContent = "Unable to fetch prices. Portfolio data may be outdated.";
    }
}

// Search Cryptos and Display Chart
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchTerm = searchInput.value.trim().toLowerCase();
    searchInput.value = ""; // Clear input after submission

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
        if (Chart.getChart(cryptoChart)) {
            Chart.getChart(cryptoChart).destroy();
        }

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

    localStorage.setItem("portfolio", JSON.stringify(portfolio)); // Save updated portfolio
    displayPortfolio(); // Refresh the table
});

// Initialize
(async () => {
    await fetchCoinList();
    await populateDropdown();
    displayPortfolio(); // Display portfolio on page load
})();