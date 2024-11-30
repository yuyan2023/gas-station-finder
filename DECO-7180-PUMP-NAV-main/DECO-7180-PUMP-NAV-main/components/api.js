import { SQL } from "./constant.js";

// Base URL for fetching data using SQL queries
const FUEL_DATA_API_SQL = "https://www.data.qld.gov.au/api/3/action/datastore_search_sql"

// Fetch data from the API using the provided SQL query
const fetchData = async data => {
    try {
        const response = await fetch(`${FUEL_DATA_API_SQL}?sql=${data.sql}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (jsonData.success) {
            return jsonData.result.records;
        } else {
            throw new Error(jsonData.error.message);
        }
    } catch (error) {
        console.error("Error in fetchData:", error);
        throw error;
    }
}

// Fetch all distinct brands from the data
const fetchAllBrand = async () => {
    return await fetchData({ sql: SQL.allBrand });
}

// Fetch all distinct fuel types from the data
const fetchAllType = async () => {
    return await fetchData({ sql: SQL.allType });
}

// Fetch the price range from the data
const fetchPriceRange = async () => {
    return await fetchData({ sql: SQL.priceRange });
}

export { fetchData, fetchAllBrand, fetchAllType, fetchPriceRange };
