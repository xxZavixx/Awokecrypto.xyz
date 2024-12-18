document.addEventListener("DOMContentLoaded", async () => {
    const baseChainId = "0x2105"; // Base Chain ID
    const subdomainInput = document.getElementById("subdomain");
    const preview = document.getElementById("preview");

    // Update the preview as the user types
    subdomainInput?.addEventListener("input", function () {
        const subdomain = subdomainInput.value.trim();
        preview.textContent = subdomain
            ? `${subdomain}.awokecrypto.eth`
            : "[your-subdomain].awokecrypto.eth";
    });

    // Wallet Detection and Network Switch
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length === 0) {
                alert("No wallet detected. Connect your wallet to proceed.");
            } else {
                const chainId = await window.ethereum.request({ method: "eth_chainId" });
                if (chainId !== baseChainId) {
                    alert("Please switch to the Base network for minting.");
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: baseChainId }],
                    });
                }
            }
        } catch (error) {
            console.error("Error with wallet connection:", error);
            alert("Please use a supported wallet and connect to the Base network.");
        }
    } else {
        alert(
            "No wallet detected. Use MetaMask on desktop or open this page in Coinbase Wallet's browser."
        );
    }
});