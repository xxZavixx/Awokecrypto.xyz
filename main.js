document.addEventListener("DOMContentLoaded", async () => {
    const baseChainId = "0x2105"; // Base Chain ID
    const subdomainInput = document.getElementById("subdomain");
    const preview = document.getElementById("preview");

    // Update the preview as the user types
    subdomainInput?.addEventListener("input", () => {
        const subdomain = subdomainInput.value.trim();
        preview.textContent = subdomain
            ? `${subdomain}.awokecrypto.eth`
            : "[your-subdomain].awokecrypto.eth";
    });

    // Wallet Detection and Base Network Check
    async function checkWalletAndNetwork() {
        if (typeof window.ethereum === "undefined") {
            alert(
                "No wallet detected. Use MetaMask on desktop or open this page in Coinbase Wallet's browser."
            );
            return;
        }

        try {
            // Request wallet accounts
            const accounts = await window.ethereum.request({ method: "eth_accounts" });

            if (accounts.length === 0) {
                alert("No wallet connected. Please connect your wallet to proceed.");
                return;
            }

            // Check for Base network
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== baseChainId) {
                alert("Switching to the Base network...");
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: baseChainId }],
                });
                alert("Network switched to Base. You can now mint your subdomain.");
            }
        } catch (error) {
            console.error("Wallet connection or network error:", error);
            alert(
                "There was an issue connecting your wallet or switching networks. Please ensure your wallet supports the Base network."
            );
        }
    }

    // Call wallet and network check on page load
    await checkWalletAndNetwork();
});

document.addEventListener("DOMContentLoaded", () => {
    const disconnectBtn = document.getElementById("disconnectWallet");

    disconnectBtn?.addEventListener("click", () => {
        if (typeof window.ethereum !== "undefined") {
            // Manually reset wallet connection
            window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }]
            }).then(() => {
                console.log("Wallet permissions reset.");
                alert("Wallet disconnected. Reload the page to reconnect.");
                location.reload();
            }).catch((err) => {
                console.error("Disconnect failed:", err);
                alert("Unable to disconnect wallet. Try refreshing the page.");
            });
        } else {
            alert("No wallet detected to disconnect.");
        }
    });
});

