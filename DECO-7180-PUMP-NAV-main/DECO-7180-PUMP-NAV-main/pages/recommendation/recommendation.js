import "../../components/nav.js";
import { fetchData } from '../../components/api.js';
import { SQL, SEARCHED_DATA } from '../../components/constant.js';

// get user search history
function getUserSearchHistory() {
    return JSON.parse(localStorage.getItem(SEARCHED_DATA)) || [];
}

// get recommended stations
async function getRecommendedStations(userData) {
    const searchHistory = userData.searchHistory;
    let sql;
    
    if (searchHistory.length > 0) {
        const recentSearch = searchHistory[searchHistory.length - 1];
        sql = `SELECT * FROM "28ab00ec-00dd-4edf-b272-0543df4dcbe5" WHERE "Site_Suburb" = '${recentSearch.siteSuburb}' LIMIT 5`;
    } else {
        sql = `SELECT * FROM "28ab00ec-00dd-4edf-b272-0543df4dcbe5" ORDER BY "Price" ASC LIMIT 5`;
    }

    try {
        console.log("Executing SQL query:", sql); // add log
        const stations = await fetchData({ sql: encodeURIComponent(sql) });
        console.log("Fetched stations:", stations); // add log
        return stations.map(station => ({
            name: station.Site_Name,
            brand: station.Site_Brand,
            fuelType: station.Fuel_Type,
            location: `${station.Sites_Address_Line_1}, ${station.Site_Suburb}, ${station.Site_State} ${station.Site_Post_Code}`,
            price: parseFloat(station.Price) / 1000,
            latitude: station.Site_Latitude,
            longitude: station.Site_Longitude,
            lastUpdated: new Date(station.TransactionDateutc).toLocaleString()
        }));
    } catch (error) {
        console.error("Error fetching station data:", error);
        return [];
    }
}

function displayRecommendations(stations) {
    const container = document.querySelector('.recommendation-container');
    if (!container) {
        console.error('Recommendation container not found');
        return;
    }
    container.innerHTML = ''; // Clear existing content

    stations.forEach((station, index) => {
        const card = document.createElement('div');
        card.classList.add('recommendation-card');
        card.style.backgroundImage = `url('${getBackgroundImage(index)}')`;

        const content = document.createElement('div');
        content.classList.add('card-content');
        content.innerHTML = `
            <h3>${station.name || 'Unknown Station'}</h3>
            <p><strong>Brand:</strong> ${station.brand || 'N/A'}</p>
            <p><strong>Fuel Type:</strong> ${station.fuelType || 'N/A'}</p>
            <p><strong>Location:</strong> ${station.location || 'N/A'}</p>
            <p><strong>Price:</strong> $${(station.price || 0).toFixed(3)} per liter</p>
            <p><strong>Last Updated:</strong> ${station.lastUpdated || 'N/A'}</p>
        `;

        card.appendChild(content);
        container.appendChild(card);

        card.addEventListener('click', () => {
            document.querySelectorAll('.recommendation-card').forEach(c => {
                c.classList.remove('active');
            });
            card.classList.add('active');
        });
    });
}

function removeActiveClasses() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
}

const backgroundImages = [
    'images/station1.jpg',
    'images/station2.webp',
    'images/station3.webp',
    'images/station4.jpg',
    'images/station5.jpg'
];

function getBackgroundImage(index) {
    return backgroundImages[index % backgroundImages.length];
}

// load recommendations when the page is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userData = { searchHistory: getUserSearchHistory() };
        const recommendedStations = await getRecommendedStations(userData);
        if (recommendedStations && recommendedStations.length > 0) {
            displayRecommendations(recommendedStations);
        } else {
            displayErrorMessage("No recommendations available. Please try again later.");
        }
    } catch (error) {
        console.error("Error loading recommendations:", error);
        displayErrorMessage("Unable to load recommendations. Please try again later.");
    }
});

function displayErrorMessage(message) {
    const container = document.querySelector('.recommendation-container');
    if (container) {
        container.innerHTML = `<p class="error-message">${message}</p>`;
    } else {
        console.error('Recommendation container not found');
    }
}
