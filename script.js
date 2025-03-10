document.addEventListener("DOMContentLoaded", function() {
    // Find the body of the current iframe
    let iframeBody = document.body;

    // Create a new H1 element
    let newHeading = document.createElement("h1");
    newHeading.innerText = "Hello from GitHub Pages!";
    newHeading.style.color = "darkgreen";
    newHeading.style.textAlign = "center";
    newHeading.style.padding = "20px";

    // Append the heading inside the iframe's body
    iframeBody.appendChild(newHeading);
});
