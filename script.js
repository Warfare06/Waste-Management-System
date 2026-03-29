// Global Variables
let chart;
let map;

// 1. Initialize Leaflet Map
function initMap() {
    map = L.map('map').setView([12.8406, 80.1534], 15); // Default Coordinates (VIT Chennai area)
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add a default truck marker
    L.marker([12.8406, 80.1534]).addTo(map)
        .bindPopup('<b>Garbage Truck 1</b><br>Currently near Street 1.')
        .openPopup();
}

// 2. Load Street Data (Simulation for the 5 Bins)
function loadStreetData(streetId) {
    document.getElementById("streetTitle").innerText = "STREET " + streetId;

    // Simulate getting data for 5 bins. 
    // In the future, this is where you fetch from Firebase!
    let simulatedData = {
        bin1: { level: Math.floor(Math.random() * 40) + 60, waste_type: "wet" }, // Usually high (Red)
        bin2: { level: Math.floor(Math.random() * 40) + 30, waste_type: "wet" }, // Med (Green)
        bin3: { level: Math.floor(Math.random() * 10), waste_type: "dry" },      // Empty
        bin4: { level: Math.floor(Math.random() * 40) + 40, waste_type: "dry" }, // Med (Blue)
        bin5: { level: Math.floor(Math.random() * 20), waste_type: "wet" }       // Low (Green)
    };

    updateUI(simulatedData);
}

// 3. Update the HTML UI with the data
function updateUI(data) {
    let levels = [];
    let wetCount = 0;
    let dryCount = 0;

    // Loop through all 5 bins
    for (let i = 1; i <= 5; i++) {
        let bin = data[`bin${i}`];
        if (bin) {
            levels.push(bin.level);
            
            // Update the physical bin height and text on the screen
            document.getElementById(`fill${i}`).style.height = bin.level + "%";
            document.getElementById(`level${i}`).innerText = bin.level.toFixed(1) + "%";

            // Count waste types for the dashboard
            if (bin.waste_type === "wet") wetCount++;
            if (bin.waste_type === "dry") dryCount++;
        }
    }

    // Calculate Average
    let avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    let fullCount = levels.filter(l => l >= 80).length;

    // Update Dashboard Cards
    document.getElementById("avgLevel").innerText = avg.toFixed(1) + "%";
    document.getElementById("fullBins").innerText = fullCount;
    document.getElementById("prediction").innerText = (avg + 5 > 100 ? 100 : avg + 5).toFixed(1) + "%";
    document.getElementById("dryBins").innerText = dryCount;
    document.getElementById("wetBins").innerText = wetCount;

    // Update the Chart and AI
    updateChart(avg);
    runAIPrediction(avg);
}

// 4. Update the Chart.js Graph (Red Neon Theme)
function updateChart(avgLevel) {
    const ctx = document.getElementById('wasteChart').getContext('2d');
    const now = new Date();

    if (!chart) {
        // Generate historical fake points on initial load
        let initialLabels = [];
        let initialData = [];
        for (let i = 5; i > 0; i--) {
            let pastTime = new Date(now.getTime() - i * 60000); 
            initialLabels.push(pastTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            let variation = avgLevel + (Math.random() * 20 - 10); 
            initialData.push(Math.max(0, Math.min(100, variation)).toFixed(1)); 
        }
        initialLabels.push(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        initialData.push(avgLevel);

        // Dark Red Fading Gradient to match image
        let gradient = ctx.createLinearGradient(0, 0, 0, 350);
        gradient.addColorStop(0, 'rgba(255, 51, 51, 0.6)'); 
        gradient.addColorStop(1, 'rgba(255, 51, 51, 0.0)'); 

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    label: 'Avg Street Load (%)',
                    data: initialData,
                    borderColor: '#ff3333', // Bright Red line
                    backgroundColor: gradient, 
                    fill: true,
                    tension: 0.3, // Slight curve, mostly sharp
                    borderWidth: 3, 
                    pointBackgroundColor: '#ffffff', 
                    pointBorderColor: '#ff3333', 
                    pointBorderWidth: 2,
                    pointRadius: 4, 
                    pointHoverRadius: 7 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, // Forces it to fill the height
                scales: { 
                    y: { 
                        min: 0, 
                        max: 100, 
                        ticks: { color: '#aaaaaa' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                    },
                    x: { 
                        ticks: { color: '#aaaaaa' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                    }
                },
                plugins: {
                    legend: { labels: { color: '#ffffff', font: { size: 14 } } } 
                }
            }
        });
    } else {
        // Update with live data dynamically
        chart.data.labels.push(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        chart.data.datasets[0].data.push(avgLevel);
        
        if (chart.data.labels.length > 8) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update();
    }
}

// 5. AI Predictive Algorithm
function runAIPrediction(currentAvg) {
    const forecastDiv = document.getElementById("aiForecast");
    forecastDiv.innerHTML = ""; 

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay(); 

    const dayWeights = { 0: 1.5, 1: 0.8, 2: 0.9, 3: 0.9, 4: 1.1, 5: 1.3, 6: 1.6 };

    for (let i = 1; i <= 7; i++) {
        let targetDayIndex = (today + i) % 7;
        let dayName = days[targetDayIndex];

        let basePrediction = currentAvg * dayWeights[targetDayIndex];
        let randomNoise = (Math.random() * 8) - 4; 
        let finalPrediction = Math.min(100, Math.max(0, basePrediction + randomNoise)).toFixed(1);

        let statusClass = "status-low";
        let statusText = "NORMAL";
        if (finalPrediction >= 80) { statusClass = "status-high"; statusText = "CRITICAL"; } 
        else if (finalPrediction >= 50) { statusClass = "status-med"; statusText = "ELEVATED"; }

        forecastDiv.innerHTML += `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-value">${finalPrediction}%</div>
                <div class="forecast-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }
}

// 6. Start the App when the page loads
window.onload = function() {
    initMap();
    loadStreetData(1); // Load Street 1 by default
};
