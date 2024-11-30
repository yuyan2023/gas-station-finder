// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Leaflet map, setting the view to Brisbane coordinates with a zoom level of 10
    var map = L.map('map').setView([-27.4698, 153.0251], 10);

    // Add the OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, // Maximum zoom level
        attribution: '© OpenStreetMap contributors' // Map attribution
    }).addTo(map);

    // Function to filter stations to the latest record for each unique brand
    function getLatestUniqueBrandStations(data) {
        const brandMap = new Map(); // Create a map to store stations by brand
        
        // Iterate over each station in the data
        data.forEach(station => {
            const brand = station.Site_Brand || 'Unknown'; // Get station brand, or 'Unknown' if not available
            const currentStation = brandMap.get(brand); // Get the current station for the brand from the map
            
            // If there's no current station or if the current station's data is older, update the map
            if (!currentStation || new Date(station.Last_Updated) > new Date(currentStation.Last_Updated)) {
                brandMap.set(brand, station); // Set the latest station for the brand
            }
        });

        // Return the values (stations) of the brandMap as an array
        return Array.from(brandMap.values());
    }

    // Function to add markers to the map and update the station list
    function addMarkersAndUpdateList(data) {
        // Clear existing markers on the map
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) { // Remove only marker layers
                map.removeLayer(layer);
            }
        });

        // Clear the station details list in the DOM
        const stationList = document.getElementById('station-details');
        stationList.innerHTML = '';

        // Get the latest station for each brand
        const uniqueStations = getLatestUniqueBrandStations(data);

        // Iterate over each unique station and create a marker and station card
        uniqueStations.forEach(station => {
            const popupContent = `
                <strong>${station.Site_Name}</strong><br/>
                Address: ${station.Sites_Address_Line_1}<br/>
                Suburb: ${station.Site_Suburb}<br/>
                Brand: ${station.Site_Brand || 'Unknown'}<br/>
                Fuel Type: ${station.Fuel_Type || 'N/A'}<br/>
                Price: $${(station.Price / 100).toFixed(2)} AUD<br/>
            `;

            // Add a marker to the map for the station with a popup
            L.marker([station.Site_Latitude, station.Site_Longitude])
                .bindPopup(popupContent)
                .addTo(map);

            // Create a station card in the station list
            const card = document.createElement('div');
            card.className = 'station-card';
            card.innerHTML = `
                <h3>${station.Site_Name}</h3>
                <p><strong>Address:</strong> ${station.Sites_Address_Line_1}, ${station.Site_Suburb}</p>
                <p><strong>Brand:</strong> ${station.Site_Brand || 'Unknown'}</p>
                <p><strong>Fuel Type:</strong> ${station.Fuel_Type || 'N/A'}</p>
                <p class="price">Price: $${(station.Price / 100).toFixed(2)} AUD</p>  
            `;
            // Append the station card to the station list
            stationList.appendChild(card);
        });
    }

    // Function to fetch stations for a selected suburb
    function fetchStations(suburb) {
        // Build the SQL query to fetch station data for the selected suburb
        var sql = encodeURIComponent(`SELECT * FROM "28ab00ec-00dd-4edf-b272-0543df4dcbe5" WHERE "Site_Suburb" = '${suburb}'`);
        
        // Fetch the data from the API using the SQL query
        fetch(`https://www.data.qld.gov.au/api/3/action/datastore_search_sql?sql=${sql}`)
            .then(response => response.json())
            .then(json => {
                if (json.result && json.result.records) {
                    const firstRecord = json.result.records[0];
                    // Set the map view to the coordinates of the first station in the suburb
                    if (firstRecord && firstRecord.Site_Latitude && firstRecord.Site_Longitude) {
                        map.setView([firstRecord.Site_Latitude, firstRecord.Site_Longitude], 15);
                    }
                    // Add markers and update the station list
                    addMarkersAndUpdateList(json.result.records);
                } else {
                    console.error('No records found or error in response:', json);
                }
            })
            .catch(error => console.error('Error loading the data:', error));
    }

    // Function to populate the suburb selector with options
    function populateSuburbs() {
        // Build the SQL query to get the distinct suburb names
        var sql = encodeURIComponent(`SELECT DISTINCT "Site_Suburb" FROM "28ab00ec-00dd-4edf-b272-0543df4dcbe5"`);
        
        // Fetch the data from the API using the SQL query
        fetch('https://www.data.qld.gov.au/api/3/action/datastore_search_sql?sql=' + sql)
            .then(response => response.json())
            .then(json => {
                if (json.result && json.result.records) {
                    // Populate the suburb selector dropdown with options
                    var suburbSelector = document.getElementById('suburbSelector');
                    json.result.records.forEach(record => {
                        var option = new Option(record.Site_Suburb, record.Site_Suburb);
                        suburbSelector.add(option);
                    });
                } else {
                    console.error('No suburbs found or error in response:', json);
                }
            })
            .catch(error => console.error('Error loading suburbs:', error));
    }

    // Event listener for suburb selection change
    document.getElementById('suburbSelector').addEventListener('change', function() {
        fetchStations(this.value); // Fetch stations for the selected suburb
    });

    // Populate the suburb selector dropdown on page load
    populateSuburbs();
});
