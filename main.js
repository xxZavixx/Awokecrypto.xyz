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