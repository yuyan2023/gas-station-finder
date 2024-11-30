import "../../components/nav.js"
import "../../components/filter.js"
import { getUrlParams, cacheData } from "../../components/utils.js"
import { SQL } from "../../components/constant.js"

let isPriceAscending = true;
let isDistanceAscending = true;

const priceButton = document.getElementById('price-button');
const distanceButton = document.getElementById('distance-button');

const url = 'https://www.data.qld.gov.au/api/3/action/datastore_search_sql';

let currentPage = 1;
const resultsPerPage = 9;
let allRecords = [];
let originalAllRecords = [];
const searchInput = document.getElementById('search-input');
const searchButton = document.querySelector('.btn-circular-yellow');

let userLocation = null;

// Get user location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
                if (result.state === 'granted') {
                    // Permission already granted, get location
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                } else if (result.state === 'prompt') {
                    // Show prompt
                    console.log("Please allow access to your location");
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                } else if (result.state === 'denied') {
                    // Permission denied
                    console.log("Location access denied. Please enable location access in your browser settings");
                    reject(new Error("Location access denied"));
                }
            });
        } else {
            console.error("This browser doesn't support geolocation");
            reject(new Error("Geolocation not supported"));
        }
    });
}

// Calculate distance between two points (using Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

priceButton.addEventListener('click', function () {
    isPriceAscending = !isPriceAscending;

    if (isPriceAscending) {
        priceButton.textContent = 'Price ▲';
        allRecords.sort((a, b) => a.Price - b.Price);
    } else {
        priceButton.textContent = 'Price ▼';
        allRecords.sort((a, b) => b.Price - a.Price);
    }

    renderResults(currentPage);
    renderPagination();
});

distanceButton.addEventListener('click', function () {
    isDistanceAscending = !isDistanceAscending;

    if (isDistanceAscending) {
        distanceButton.textContent = 'Distance ▲';
    } else {
        distanceButton.textContent = 'Distance ▼';
    }

    handleSortByDistance();
});

let sqlQuery = `
    SELECT "Site_Name", "Site_Brand", "Sites_Address_Line_1", "Site_Suburb", "Site_State", "Site_Post_Code", "Site_Latitude", "Site_Longitude", "Fuel_Type", "Price"
    FROM "28ab00ec-00dd-4edf-b272-0543df4dcbe5" AS main
`;


const filterData = data => {
    const { brand, distance, price, q, type } = getUrlParams()
    const allBrand = cacheData(SQL.allBrand)
    const allType = cacheData(SQL.allType)

    $("#search-input").val(q)

    return data.filter(i => {
        // filter brand data
        if (brand === "-1" || !brand) { return true }
        return allBrand.includes(i.Site_Brand)
    }).filter(i => {
        // filter type data
        if (type === "-1" || !brand) { return true }
        return allType.includes(i.Site_Brand)
    }).filter(i => {
        if (!price) return true
        // filter price range
        const [min, max] = price.split("-");
        return Number(i.Price) >= Number(min) && Number(i.Price) <= Number(max)
    }).filter(i => {
        if (!q) return true
        // filter query string
        return Object.values(i).some(v => v.includes(q));
    })
}

$.ajax({
    url: url,
    data: {
        sql: sqlQuery
    },
    dataType: 'jsonp',
    success: (data) => {
        const latestRecords = {};
        const searchResultContainer = document.querySelector('.search-result');
        searchResultContainer.innerHTML = '';

        data.result.records.forEach((record) => {
            const key = `${record.Site_Name}-${record.Fuel_Type}`;
            if (!latestRecords[key] || new Date(record.TransactionDateutc) > new Date(latestRecords[key].TransactionDateutc)) {
                latestRecords[key] = record;
            }
        });
        allRecords = filterData(Object.values(latestRecords));
        originalAllRecords = [...allRecords];

        renderPagination();
        renderResults(currentPage);
    },
    error: (error) => {
        console.error('Error fetching data:', error);
    }
});

function renderPagination() {
    const totalPages = Math.ceil(allRecords.length / resultsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    const createPageButton = (label, pageNumber, isDisabled = false) => {
        const pageButton = document.createElement('button');
        pageButton.textContent = label;
        pageButton.classList.add('page-button');
        if (isDisabled) {
            pageButton.disabled = true;
        }
        pageButton.addEventListener('click', () => {
            currentPage = pageNumber;
            renderResults(currentPage);
            renderPagination();
        });
        return pageButton;
    };

    paginationContainer.appendChild(createPageButton('First', 1, currentPage === 1));
    paginationContainer.appendChild(createPageButton('Prev', currentPage - 1, currentPage === 1));
    paginationContainer.appendChild(createPageButton('Next', currentPage + 1, currentPage === totalPages));
    paginationContainer.appendChild(createPageButton('Last', totalPages, currentPage === totalPages));

    const inputContainer = document.createElement('div');
    inputContainer.classList.add('page-input-container');
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = '1';
    pageInput.max = totalPages;
    pageInput.placeholder = 'Page';
    pageInput.value = currentPage;
    pageInput.classList.add('page-input');

    const goButton = document.createElement('button');
    goButton.textContent = 'Go';
    goButton.classList.add('go-button');
    goButton.addEventListener('click', () => {
        const goToPage = parseInt(pageInput.value);
        if (goToPage >= 1 && goToPage <= totalPages) {
            currentPage = goToPage;
            renderResults(currentPage);
            renderPagination();
        }
    });

    inputContainer.appendChild(pageInput);
    inputContainer.appendChild(goButton);
    paginationContainer.appendChild(inputContainer);
}

function renderResults(page) {
    const searchResultContainer = document.querySelector('.search-result');
    searchResultContainer.innerHTML = '';
    const start = (page - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const recordsToDisplay = allRecords.slice(start, end);

    recordsToDisplay.forEach((record) => {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('result');
        const targetUrl = '../detail/detail.html';

        resultDiv.addEventListener('click', function () {
            const params = new URLSearchParams(record).toString();
            window.location.href = `${targetUrl}?${params}`;
        });

        let distanceDisplay = '';
        if (record.distance !== undefined) {
            distanceDisplay = `<p class="site-distance">${record.distance.toFixed(2)} km</p>`;
        }

        resultDiv.innerHTML = `
            <div class="site-logo">
                <img src="${getLogoBasedOnSiteName(record.Site_Name)}" alt="${record.Site_Name} Logo">
            </div>
            <div class="site-info">
                <p class="site-name">${record.Site_Name}</p>
                <p class="site-address">${record.Sites_Address_Line_1}, ${record.Site_Suburb}, ${record.Site_Post_Code}</p>
            </div>
            <p class="fuel-type">${record.Fuel_Type}</p>
            <p class="site-price">AUD ${(record.Price / 1000).toFixed(3)} / L</p>
            ${distanceDisplay}
        `;

        searchResultContainer.appendChild(resultDiv);
    });
}

function sortResultsByPrice(ascending) {
    allRecords.sort((a, b) => {
        const priceA = parseFloat(a.Price);
        const priceB = parseFloat(b.Price);

        if (ascending) {
            return priceA - priceB;
        } else {
            return priceB - priceA;
        }
    });

    renderResults(currentPage);
}

function sortResultsByDistance(ascending) {
    if (!userLocation) {
        alert("Unable to get your location. Please allow location access and refresh the page.");
        return;
    }

    allRecords.forEach(record => {
        record.distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            parseFloat(record.Site_Latitude), parseFloat(record.Site_Longitude)
        );
    });

    allRecords.sort((a, b) => {
        if (ascending) {
            return a.distance - b.distance;
        } else {
            return b.distance - a.distance;
        }
    });

    renderResults(currentPage);
    renderPagination();
}

const getLogoBasedOnSiteName = (siteName) => {
    const keywordLogoMapping = [
        { keyword: 'Coles', logo: '../../assets/images/logo/colesexpress-logo.jpg' },
        { keyword: 'Reddy', logo: '../../assets/images/logo/colesexpress-logo.jpg' },
        { keyword: 'Eleven', logo: '../../assets/images/logo/711-logo.svg' },
        { keyword: 'BP', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'United', logo: '../../assets/images/logo/united-logo.png' },
        { keyword: 'NightOwl', logo: '../../assets/images/logo/nightowl-logo.png' },
        { keyword: 'Ampol', logo: '../../assets/images/logo/ampol-logo.svg' },
        { keyword: 'Caltex', logo: '../../assets/images/logo/caltex-logo.png' },
        { keyword: 'Metro', logo: '../../assets/images/logo/metro-logo.png' },
        { keyword: 'Pearl', logo: '../../assets/images/logo/pearl-logo.png' },
        { keyword: 'Freedom', logo: '../../assets/images/logo/freedom-logo.jpg' },
        { keyword: 'S24', logo: '../../assets/images/logo/caltex-logo.png' },
        { keyword: 'Lowes', logo: '../../assets/images/logo/lowes-logo.png' },
        { keyword: 'Shell', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Brians', logo: '../../assets/images/logo/brians.webp' },
        { keyword: 'Liberty', logo: '../../assets/images/logo/liberty-logo.png' },
        { keyword: 'Puma', logo: '../../assets/images/logo/puma-logo.png' },
        { keyword: 'U-Go', logo: '../../assets/images/logo/ugo-logo.svg' },
        { keyword: 'Red Dog', logo: '../../assets/images/logo/reddog-logo.jpg' },
        { keyword: 'Pacific', logo: '../../assets/images/logo/pacific-logo.png' },
        { keyword: 'Mobil', logo: '../../assets/images/logo/mobil-logo.png' },
        { keyword: 'Metco', logo: '../../assets/images/logo/metro-logo.png' },
        { keyword: 'OOM', logo: '../../assets/images/logo/oom-logo.jpg' },
        { keyword: 'Raceview', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Tyre', logo: '../../assets/images/logo/tyreplus-logo.png' },
        { keyword: 'Mega', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Moorooka', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Rain', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Elimbah', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Jio', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Aussie', logo: '../../assets/images/logo/aussie-logo.png' },
        { keyword: 'South East', logo: '../../assets/images/logo/seq-logo.png' },
        { keyword: 'Fraser', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Billabong', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Independent', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'JIO', logo: '../../assets/images/logo/jio-logo.png' },
        { keyword: 'Kepnock', logo: '../../assets/images/logo/colesexpress-logo.jpg' },
        { keyword: 'Parkhurst', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Boost', logo: '../../assets/images/logo/boost-logo.jpg' },
        { keyword: 'Van Ansem', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'IOR', logo: '../../assets/images/logo/ior-logo.png' },
        { keyword: 'Neds', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Hope', logo: '../../assets/images/logo/hope-logo.svg' },
        { keyword: 'Marano', logo: '../../assets/images/logo/maranos-logo.jpg' },
        { keyword: 'Roadhouse', logo: '../../assets/images/logo/roadhouse-logo.png' },
        { keyword: 'Wandoan', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Explorer', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Widgee', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Goomeri', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Wondai', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Spring', logo: '../../assets/images/logo/spring-logo.webp' },
        { keyword: 'Tilstons', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Wondai', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Zenna', logo: '../../assets/images/logo/roadhouse-logo.png' },
        { keyword: 'Astron', logo: '../../assets/images/logo/astron-logo.jpg' },
        { keyword: 'Wessel', logo: '../../assets/images/logo/wessel-logo.webp' },
        { keyword: 'Walkerston', logo: '../../assets/images/logo/walkerston-logo.png' },
        { keyword: 'Calen', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Crows', logo: '../../assets/images/logo/roadhouse-logo.png' },
        { keyword: 'T & H', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Taroom', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Jones Hill', logo: '../../assets/images/logo/roadhouse-logo.png' },
        { keyword: 'Stargazers', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Stanwell Store', logo: '../../assets/images/logo/bp-logo.svg' },
        { keyword: 'Midway', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Yungaburra', logo: '../../assets/images/logo/yps-logo.png' },
        { keyword: 'Central Servo', logo: '../../assets/images/logo/centralservo-logo.png' },
        { keyword: 'Cam', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Gowrie One', logo: '../../assets/images/logo/shell-logo.png' },
        { keyword: 'Meringandan', logo: '../../assets/images/logo/bp-logo.svg' }
    ];

    for (let i = 0; i < keywordLogoMapping.length; i++) {
        if (siteName.includes(keywordLogoMapping[i].keyword)) {
            return keywordLogoMapping[i].logo;
        }
    }

    return '';
};

// Get user location when the page loads
window.addEventListener('load', () => {
    getUserLocation().then(() => {
        console.log("User location acquired");
    }).catch(error => {
        console.error("Failed to get user location:", error);
    });
});

// Call this function when user interacts
function handleSortByDistance() {
    getUserLocation().then(position => {
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        sortResultsByDistance(isDistanceAscending);
    }).catch(error => {
        console.error("Failed to get user location:", error);
        alert("Unable to get your location. Please allow location access and try again.");
    });
}

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm === '') {
        allRecords = [...originalAllRecords];
    } else {
        allRecords = originalAllRecords.filter(record =>
            record.Site_Name.toLowerCase().includes(searchTerm) ||
            record.Sites_Address_Line_1.toLowerCase().includes(searchTerm) ||
            record.Site_Suburb.toLowerCase().includes(searchTerm) ||
            record.Site_Post_Code.includes(searchTerm)
        );
    }
    currentPage = 1;
    renderResults(currentPage);
    renderPagination();
}

searchButton.addEventListener('click', function (e) {
    e.preventDefault();
    performSearch();
});

searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});
