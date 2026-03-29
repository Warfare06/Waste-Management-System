let chart;
let map;

let bins = [20, 50, 80, 30];

function selectStreet(street) {
    document.getElementById("streetTitle").innerText = "Street " + street;
    updateBins();
}

function updateBins() {
    let total = 0;
    let full = 0;

    for (let i = 1; i <= 4; i++) {
        let level = Math.floor(Math.random() * 100);
        bins[i - 1] = level;

        document.getElementById("fill" + i).style.height = level + "%";
        document.getElementById("level" + i).innerText = level + "%";

        total += level;
        if (level > 80) full++;
    }

    let avg = total / 4;
    document.getElementById("avg").innerText = avg.toFixed(1) + "%";
    document.getElementById("full").innerText = full;

    let prediction = avg + 5;
    document.getElementById("prediction").innerText = prediction.toFixed(1) + "%";

    updateChart(avg);
    drawRoute();
}

function updateChart(level) {
    const ctx = document.getElementById('wasteChart').getContext('2d');

    if (!chart) {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Waste Level %',
                    data: [],
                    borderColor: 'red',
                    backgroundColor: 'rgba(255,0,0,0.2)',
                    borderWidth: 3,
                    fill: true
                }]
            }
        });
    }

    let time = new Date().toLocaleTimeString();
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(level);
    chart.update();
}

function initMap() {
    map = L.map('map').setView([12.8406, 80.1533], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap'
    }).addTo(map);
}

function drawRoute() {
    if (!map) return;

    let coords = [
        [12.8406, 80.1533],
        [12.8425, 80.1500],
        [12.8380, 80.1565],
        [12.8365, 80.1520]
    ];

    L.polyline(coords, {color: 'red'}).addTo(map);
}

window.onload = function() {
    initMap();
    updateBins();
};
