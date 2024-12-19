let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoNameSelect = document.getElementById("crypto-name");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const cryptoChart = document.getElementById("crypto-chart");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";
const coingeckoApiUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1";
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
    const response = await fetch(coingeckoApiUrl);
    const cryptos = await response.json();

    cryptoNameSelect.innerHTML = "";
    cryptos.forEach((crypto, index) => {
        const option = document.createElement("option");
        option.value = crypto.id;
        option.textContent = crypto.name;

        if (!isPaidUser && index >= MAX_FREE_TRACKING) {
            option.style.filter = "blur(4px)";
            option.disabled = true;
        }

        cryptoNameSelect.appendChild(option);
    });
}

// Display Portfolio
async function displayPortfolio() {
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
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${matchedCoin.id}/market_chart?vs_currency=usd&days=7`
        );
        const data = await response.json();

        // Reset chart before drawing
        const chart = Chart.getChart(cryptoChart);
        if (chart) chart.destroy();

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
        });

        cryptoChart.style.display = "block";
    } catch (error) {
        alert("Failed to fetch chart data. Please try again.");
    }
});

// Initialize
(async () => {
    await fetchCoinList();
    await populateDropdown();
    await displayPortfolio();
})();