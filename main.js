document.addEventListener("DOMContentLoaded", function () {
    const subdomainInput = document.getElementById("subdomain");
    const preview = document.getElementById("preview");
    const availability = document.getElementById("availability");
    const namespaceWidgetContainer = document.getElementById("namespace-widget-container");

    // Update the preview as the user types
    subdomainInput.addEventListener("input", function () {
        const subdomain = subdomainInput.value.trim();
        preview.textContent = subdomain ? `${subdomain}.awokecrypto.eth` : "[your-subdomain].awokecrypto.eth";
        availability.textContent = ""; // Clear availability message
    });

    // Mock availability check
    subdomainInput.addEventListener("blur", function () {
        const subdomain = subdomainInput.value.trim();
        if (subdomain) {
            const isAvailable = Math.random() > 0.5; // Simulate 50% availability
            availability.textContent = isAvailable
                ? "Subdomain is available!"
                : "Subdomain is already taken.";
            availability.style.color = isAvailable ? "green" : "red";
        }
    });

    // Wallet and Network Check for Base
    async function checkWalletAndNetwork() {
        if (typeof window.ethereum !== "undefined") {
            try {
                const chainId = await window.ethereum.request({ method: "eth_chainId" });
                const baseChainId = "0x2105"; // Base chain ID
                if (chainId !== baseChainId) {
                    alert("Please switch your wallet to the Base network.");
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: baseChainId }],
                    });
                }
            } catch (error) {
                console.error("Error checking network or switching chains:", error);
            }
        } else {
            alert("Please install a Web3 wallet like MetaMask to proceed.");
        }
    }

    // Call wallet and network check on page load
    checkWalletAndNetwork();
});