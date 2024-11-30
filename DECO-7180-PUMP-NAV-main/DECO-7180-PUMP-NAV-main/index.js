import { nav2result } from './components/filter.js';
import './components/nav.js';
import { cacheData } from './components/utils.js';
import { SEARCHED_DATA, SQL } from './components/constant.js';

const getBrandString = data => {
    const brands = cacheData(SQL.allBrand);
    const selected = data.map(index => brands[index]);
    return selected.join(",")
}
const getTypeString = data => {
    const types = cacheData(SQL.allType);
    const selected = data.map(index => types[index]);
    return selected.join(",")
}

$(document).ready(function () {
    const $searchHistory = $('#search-history');
    const $historyBox = $searchHistory.find("ul");
    const history = cacheData(SEARCHED_DATA) || [];
    if (history.length === 0) {
        return
    }

    history.forEach(data => {
        const { q, brand, type } = data;
        const brandString = brand === -1 ? "all" : getBrandString(brand);
        const $li = $(`
            <li>
                <div>
                    <i class="bi bi-search"></i>
                </div>
                <div>
                    ${q ? "<div>Keyword: " + q + "</div>" : ""}
                    <div class="detail">
                        <span title="${brandString}">Brand: ${brandString}</span>
                        <span>Type: ${type === -1 ? "all" : getTypeString(type)}</span>
                    </div>
                </div>
            </li>
        `);

        $li.on('click', () => {
            nav2result(data)
        });

        $historyBox.append($li);
    });

    $searchHistory.show();
});
