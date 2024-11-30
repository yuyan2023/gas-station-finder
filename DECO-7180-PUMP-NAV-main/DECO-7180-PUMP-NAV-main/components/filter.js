import './modal.js';
import { fetchAllBrand, fetchAllType, fetchPriceRange } from './api.js';
import { getPathSegment, cacheData, convert2indices, getUrlParams } from './utils.js';
import { SQL, SEARCHED_DATA } from './constant.js';

// Setup modal functionality for filter popup
const setupModal = () => {
    const $modal = $('#filter-popup');
    const $btn = $('#open-filter-btn');

    // Show modal when filter button is clicked
    $btn.click(function () {
        $modal.show();
    });
}

// Fetch and cache all brand data, returning from cache if available
const getAllBrandData = async () => {
    let result = [];
    const cachedData = cacheData(SQL.allBrand);
    if (cachedData) {
        result = cachedData;
    } else {
        const data = await fetchAllBrand();
        result = data.map(i => i.Site_Brand).filter(i => i !== "Unknown");
        cacheData(SQL.allBrand, result);
    }
    return result;
}

// Fetch and cache all type data, returning from cache if available
const getAllTypeData = async () => {
    let result = [];
    const cachedData = cacheData(SQL.allType);
    if (cachedData) {
        result = cachedData;
    } else {
        const data = await fetchAllType();
        result = data.map(i => i.Fuel_Type).filter(i => i !== "Unknown");
        cacheData(SQL.allType, result);
    }
    return result;
}

// Generate filter options from backend data
const generateFilters = async () => {
    const { brand, distance, price, type } = getUrlParams();
    const priceRangeData = await fetchPriceRange();
    const allBrandData = await getAllBrandData();
    const allTypesData = await getAllTypeData();

    setupPriceRangeInput(priceRangeData, price);
    setupDistanceRangeInput(distance);
    generateBrands(allBrandData, brand);
    generateTypes(allTypesData, type);
}

// Setup price range input field based on data
const setupPriceRangeInput = (priceRangeData, priceRangeURL="") => {
    const { max, min } = priceRangeData[0];
    const [minURL=min, maxURL=max] = priceRangeURL.split("-");

    $('input[name="min-price"]').val(min);
    const $input = $('#price-range');
    $input.next().text(`AUD $${min} - AUD $${maxURL || max}`);

    $input.attr({ min, max, value: maxURL || max }).bind('input', () => {
        const value = $input.val();
        $input.next().text(`AUD $${min} - AUD $${value}`);
    });
}

// Setup distance range input field
const setupDistanceRangeInput = (distanceRange="") => {
    const [min, max=10] = distanceRange.split("-");
    const $input = $('#distance-range');
    $input.val(max)
    $input.bind('input', () => {
        const value = $input.val();
        $input.next().text(`0km - ${value}km`);
    });
}

// Generate brand filter options
const generateBrands = (data, checked) => {
    const checkedArray = checked === "-1" || !checked ? [] : checked.split(",");
    const $all = $("#brand-all");
    $all.click(() => {
        if ($all.is(':checked')) {
            $('input[name="brand"]').prop('checked', true);
        } else {
            $('input[name="brand"]').prop('checked', false);
        }
    });

    if (checkedArray.length >0) $all.prop('checked', false);

    const clickHandler = () => {
        if ($('input[name="brand"]:checked').length == 8) {
            $all.prop('checked', true);
        } else {
            $all.prop('checked', false);
        }
    };
    const $container = $("#form-petrol-brand");
    data.splice(0, 8).forEach((brand, index) => {
        const isChecked = checkedArray.includes(index + "") || checkedArray.length === 0 ? 'checked' : '';
        const $span = $(`<span><input type="checkbox" name="brand" ${isChecked} value="${brand}" id="brand-${brand}"></span>`);
        $span.click(clickHandler);
        $span.append(`<label for="brand-${brand}" class="filter-button">${brand}</label>`);
        $container.append($span);
    });
}

// Generate fuel type filter options
const generateTypes = (data, checked) => {
    const checkedArray = checked === "-1" || !checked ? [] : checked.split(",");
    const $all = $("#type-all");
    $all.click(() => {
        if ($all.is(':checked')) {
            $('input[name="type"]').prop('checked', true);
        } else {
            $('input[name="type"]').prop('checked', false);
        }
    });

    if (checkedArray.length > 0) $all.prop('checked', false);

    const clickHandler = () => {
        if ($('input[name="type"]:checked').length == data.length) {
            $all.prop('checked', true);
        } else {
            $all.prop('checked', false);
        }
    };

    const $container = $("#form-petrol-type");
    data.forEach((type, index) => {
        const isChecked = checkedArray.includes(index + "") || checkedArray.length === 0 ? 'checked' : '';
        const $span = $(`<span><input type="checkbox" name="type" ${isChecked} value="${type}" id="type-${type}"></span>`);
        $span.click(clickHandler);
        $span.append(`<label for="type-${type}" class="filter-button">${type}</label>`);
        $container.append($span);
    });
}

// Cache searched data to session storage
const cacheSearchedData = newData => {
    const cachedData = cacheData(SEARCHED_DATA) || [];
    cachedData.unshift(newData);
    if (cachedData.length >= 4) {
        cachedData.pop();
    }
    cacheData(SEARCHED_DATA, cachedData);
};

// Handle search button click and prepare search data
const bindSearch = () => {
    $("#search-btn, #modal-search-btn").click(async e => {
        e.preventDefault();
        e.stopPropagation();

        const allBrandData = await getAllBrandData();
        const allTypeData = await getAllTypeData();
        const checkedBrand = $('input[name="brand"]:checked').map((index, item) => item.value).get();
        const checkedType = $('input[name="type"]:checked').map((index, item) => item.value).get();

        const q = $('#search-input').val();
        const minPrice = $('input[name="min-price"]').val();
        const maxPrice = $('#price-range').val();
        const brand = $('#brand-all').prop('checked') ? -1 : convert2indices(checkedBrand, allBrandData);
        const type = $('#type-all').prop('checked') ? -1 : convert2indices(checkedType, allTypeData);
        const maxDistance = $('#distance-range').val();

        const searchData = {
            q,
            brand,
            type,
            price: `${minPrice}-${maxPrice}`,
            distance: `0-${maxDistance}`
        };
        cacheSearchedData(searchData);
        nav2result(searchData);
    });
}

// Navigate to result page with search parameters
const nav2result = searchData => {
    const params = new URLSearchParams(searchData);
    const origin = window.location.origin;
    const targetUrl = '/pages/result/result.html?' + params.toString();
    if (window.location.pathname.includes('/result.html')) {
        window.location.replace(targetUrl)
    } else {
        window.location.href = origin + getPathSegment() + targetUrl;
    }
}

// Bind reset functionality to reset filter values
const bindReset = () => {
    $("#reset-btn").click(() => {
        const $price = $('#price-range');
        $price.val($price.attr("max"));
        $price.trigger('input');

        const $distance = $('#distance-range');
        $distance.val($distance.attr("max"));
        $distance.trigger('input');

        const $brand = $('#brand-all');
        $brand.prop('checked', false);
        $brand.trigger('click');

        const $type = $('#type-all');
        $type.prop('checked', false);
        $type.trigger('click');
    });
}

// Initialize filter functionality on document ready
$(document).ready(() => {
    setupModal();
    generateFilters();
    bindSearch();
    bindReset();
});

export { nav2result };
