document.addEventListener("DOMContentLoaded", async () => {
    const baseChainId = "0x2105"; // Base Chain ID
    const subdomainInput = document.getElementById("subdomain");
    const preview = document.getElementById("preview");

    // Update the subdomain preview dynamically
    subdomainInput?.addEventListener("input", () => {
        const subdomain = subdomainInput.value.trim();
        preview.textContent = subdomain
            ? `${subdomain}.awokecrypto.eth`
            : "[your-subdomain].awokecrypto.eth";
    });

    // Wallet Detection and Network Check Function
    async function checkWalletAndNetwork() {
        if (typeof window.ethereum === "undefined") {
            alert(
                "No wallet detected. Please use MetaMask on desktop or open this page in Coinbase Wallet's browser."
            );
            return;
        }

        try {
            // Request wallet connection
            await window.ethereum.request({ method: "eth_requestAccounts" });

            // Check if the wallet is connected to the Base network
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== baseChainId) {
                alert("Switching to the Base network...");
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: baseChainId }],
                });
                alert("Switched to the Base network. You can now mint your subdomain.");
            }
        } catch (error) {
            console.error("Error connecting wallet or switching networks:", error);
            alert(
                "There was an issue connecting your wallet or switching networks. Please ensure you are using the Base network."
            );
        }
    }

    // Call the function to check wallet and network on page load
    await checkWalletAndNetwork();
});
// Theme Toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
});

// Import Ethers.js (add this script tag in index.html if not already included)
const ethersScript = document.createElement("script");
ethersScript.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js";
document.head.appendChild(ethersScript);

// ENS Profile Viewer Logic
document.getElementById("lookup-btn").addEventListener("click", async () => {
    const input = document.getElementById("ens-input").value;
    const resultDiv = document.getElementById("ens-result");

    if (!input) {
        resultDiv.textContent = "Please enter an ENS name or wallet address.";
        return;
    }

    resultDiv.textContent = "Looking up ENS details...";

    try {
        // Connect to Ethereum mainnet provider
        const provider = new ethers.providers.InfuraProvider("homestead", "0a35e75170c9460a8c66563b57913d81");

        // Resolve ENS details
        const address = await provider.resolveName(input);
        const avatar = await provider.getAvatar(input);

        if (address) {
            resultDiv.innerHTML = `
                <p><strong>ENS Name:</strong> ${input}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Avatar:</strong> ${avatar ? `<img src="${avatar}" alt="Avatar" style="max-width:100px;">` : "Not set"}</p>
            `;
        } else {
            resultDiv.textContent = "No ENS details found for this input.";
        }
    } catch (error) {
        console.error("Error fetching ENS details:", error);
        resultDiv.textContent = "Failed to fetch ENS details. Please try again.";
    }
});

