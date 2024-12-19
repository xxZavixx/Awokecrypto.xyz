let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
const tableBody = document.getElementById("portfolio-table-body");
const totalValueElement = document.getElementById("total-value");
const form = document.getElementById("update-portfolio-form");
const cryptoSearch = document.getElementById("crypto-search");
const cryptoNameSelect = document.getElementById("crypto-name");
const searchButton = document.getElementById("search-button");

const MAX_FREE_TRACKING = 10;
let isPaidUser = localStorage.getItem("isPaidUser") === "true";

// Fetch Crypto Prices
async function fetchCryptoPrices(perPage = 100) {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1`
        );
        return await response.json();
    } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
    }
}

// Populate Dropdown with Top 100 Cryptos
async function populateDropdown() {
    const prices = await fetchCryptoPrices();
    if (!prices) return;

    cryptoNameSelect.innerHTML = ""; // Clear previous options
    prices.forEach((crypto) => {
        const option = document.createElement("option");
        option.value = crypto.id;
        option.textContent = crypto.name;
        cryptoNameSelect.appendChild(option);
    });
}

// Display Portfolio
async function displayPortfolio() {
    const prices = await fetchCryptoPrices(isPaidUser ? 5000 : 100); // Show more cryptos for paid users
    if (!prices) {
        totalValueElement.textContent = "Failed to load portfolio. Please try again.";
        return;
    }

    tableBody.innerHTML = "";
    let totalValue = 0;

    portfolio.forEach((coin, index) => {
        if (index >= MAX_FREE_TRACKING && !isPaidUser) return; // Restrict to 10 cryptos for free users

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
        return;
    }

    const existingCoin = portfolio.find((coin) => coin.id === cryptoId);

    if (amount === 0) {
        portfolio = portfolio.filter((coin) => coin.id !== cryptoId);
        alert(`${cryptoName} removed from your portfolio.`);
    } else if (amount > 0) {
        if (existingCoin) {
            existingCoin.holdings = amount;
        } else {
            portfolio.push({ id: cryptoId, name: cryptoName, holdings: amount });
        }
    }

    displayPortfolio();
});

// Search Button Functionality
searchButton.addEventListener("click", async () => {
    const searchTerm = cryptoSearch.value.toLowerCase();
    const allCryptos = await fetchCryptoPrices(isPaidUser ? 5000 : 100);
    const results = allCryptos.filter((crypto) => crypto.name.toLowerCase().includes(searchTerm));
    
    if (results.length > 0) {
        alert(`Results: ${results.map((crypto) => crypto.name).join(", ")}`);
    } else {
        alert("No results found. Please try another search term.");
    }
});

// Initialize App
(async () => {
    await populateDropdown();
    await displayPortfolio();
})();