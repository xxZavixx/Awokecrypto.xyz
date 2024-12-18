document.getElementById("send-email").addEventListener("click", () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (name && email && message) {
        const subject = encodeURIComponent(`Message from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        window.location.href = `mailto:your-email@example.com?subject=${subject}&body=${body}`;
    } else {
        alert("Please fill in all fields before sending.");
    }
});

document.getElementById("copy-message").addEventListener("click", () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (name && email && message) {
        const fullMessage = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
        navigator.clipboard.writeText(fullMessage).then(() => {
            document.getElementById("copy-success").classList.remove("d-none");
            setTimeout(() => {
                document.getElementById("copy-success").classList.add("d-none");
            }, 2000);
        });
    } else {
        alert("Please fill in all fields before copying.");
    }
});
