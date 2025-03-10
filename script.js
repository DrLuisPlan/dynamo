// Wait until the page is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Create a new H1 element
    let newHeading = document.createElement("h1");
    newHeading.innerText = "Hello from GitHub Pages!";
    newHeading.style.color = "darkgreen"; // Make it visible
    newHeading.style.textAlign = "center";

    // Select the target div (Make sure your Wix page has a div with id "targetDiv")
    let targetDiv = document.getElementById("targetDiv");

    // If the div exists, insert the heading
    if (targetDiv) {
        targetDiv.appendChild(newHeading);
    } else {
        console.warn("Div with ID 'targetDiv' not found!");
    }
});
