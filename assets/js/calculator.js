// --- 계산기 로직 ---
let phoneData = [];
let highlightedIndex = -1;

fetch('products.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        phoneData = data.list;
        loadState();
        updateAndSave();
    })
    .catch(error => {
        console.error('제품 데이터를 불러오는데 실패했습니다:', error);
        // 데이터 로딩 실패 시에도 UI 초기화는 진행
        loadState();
        updateAndSave();
    });

const allInputs = document.querySelectorAll('input, select');
const deviceSearchInput = document.getElementById('device-search');
const devicePriceInput = document.getElementById('device-price');
const autocompleteResults = document.getElementById('autocomplete-results');
const carrierSupportInput = document.getElementById('carrier-support');
const storeSupportInput = document.getElementById('store-support');
const contractMonthsSelect = document.getElementById('contract-months');
const highPlanFeeInput = document.getElementById('high-plan-fee');
const highPlanMonthsSelect = document.getElementById('high-plan-months');
const realPlanFeeInput = document.getElementById('real-plan-fee');
const vasFeeInput = document.getElementById('vas-fee');
const buyLink = document.getElementById('buy-link');
const resetBtn = document.getElementById('reset-settings');
const resetModal = document.getElementById('reset-modal');
const cancelResetBtn = document.getElementById('cancel-reset');
const confirmResetBtn = document.getElementById('confirm-reset');
const yakjeongDetailsToggleBtn = document.getElementById('yakjeong-details-toggle-btn');
const yakjeongDetailsToggleIcon = document.getElementById('yakjeong-details-toggle-icon');
const yakjeongDetails = document.getElementById('yakjeong-details');
const jageupjeDetailsToggleBtn = document.getElementById('jageupje-details-toggle-btn');
const jageupjeDetailsToggleIcon = document.getElementById('jageupje-details-toggle-icon');
const jageupjeDetails = document.getElementById('jageupje-details');
const paymentMethodContainer = document.getElementById('payment-method-container');
const jageupjePlanFeeInput = document.getElementById('jageupje-plan-fee');
const jageupjeSeonyakCheckbox = document.getElementById('jageupje-seonyak-checkbox');

const formatWithCommas = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const parseNumber = (str) => parseFloat(String(str).replace(/,/g, '')) || 0;

function updateAndSave() {
    const devicePrice = parseNumber(devicePriceInput.value);
    const discountType = document.querySelector('input[name="discount-type"]:checked').value;
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    let carrierSupport = parseNumber(carrierSupportInput.value);
    let storeSupport = parseNumber(storeSupportInput.value);
    const highPlanFee = parseNumber(highPlanFeeInput.value);
    const highPlanMonths = parseInt(highPlanMonthsSelect.value) || 0;
    const realPlanFee = parseNumber(realPlanFeeInput.value);
    const vasFee = parseNumber(vasFeeInput.value);
    const contractMonths = parseInt(contractMonthsSelect.value);
    let jageupjePlanFee = parseNumber(jageupjePlanFeeInput.value);

    const isPlanDiscount = discountType === 'plan';
    [carrierSupportInput, storeSupportInput].forEach(input => {
        input.disabled = isPlanDiscount;
        input.classList.toggle('bg-slate-200', isPlanDiscount);
        input.classList.toggle('dark:bg-slate-900', isPlanDiscount);
        input.classList.toggle('opacity-60', isPlanDiscount);
    });

    if (isPlanDiscount) {
        carrierSupport = 0;
        storeSupport = 0;
    }
    
    const finalDevicePrice = devicePrice - carrierSupport - storeSupport;
    document.getElementById('final-device-price').innerText = `${formatWithCommas(Math.round(finalDevicePrice))} 원`;

    let yakjeongTotalCost = 0;
    let monthlyDeviceCost = 0;
    let monthlyPrincipal = 0;
    let monthlyInterest = 0;
    let monthlyPlanFee1 = highPlanFee;
    let monthlyPlanFee2 = realPlanFee;

    if (isPlanDiscount) {
        monthlyPlanFee1 *= 0.75;
        monthlyPlanFee2 *= 0.75;
    }
    
    const principalForInstallment = isPlanDiscount ? devicePrice : finalDevicePrice;

    if (paymentMethod === 'installments' && principalForInstallment > 0) {
        const monthlyInterestRate = 0.059 / 12;
        const n = contractMonths;
        monthlyDeviceCost = principalForInstallment * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, n)) / (Math.pow(1 + monthlyInterestRate, n) - 1);
        const totalInterest = (monthlyDeviceCost * n) - principalForInstallment;
        monthlyInterest = totalInterest / n;
        monthlyPrincipal = monthlyDeviceCost - monthlyInterest;
        yakjeongTotalCost = principalForInstallment + totalInterest + (highPlanFee * highPlanMonths) + (realPlanFee * (contractMonths - highPlanMonths)) + (vasFee * highPlanMonths);
    } else {
        yakjeongTotalCost = principalForInstallment + (highPlanFee * highPlanMonths) + (realPlanFee * (contractMonths - highPlanMonths)) + (vasFee * highPlanMonths);
    }
    
    if (jageupjeSeonyakCheckbox.checked) {
        jageupjePlanFee *= 0.75;
    }
    const jageupjeTotalCost = devicePrice + (jageupjePlanFee * contractMonths);
    
    document.getElementById('total-cost-period').innerText = contractMonths;
    document.getElementById('yakjeong-result').innerText = `${formatWithCommas(Math.round(yakjeongTotalCost))} 원`;
    document.getElementById('jageupje-result').innerText = `${formatWithCommas(Math.round(jageupjeTotalCost))} 원`;
    const savings = Math.abs(yakjeongTotalCost - jageupjeTotalCost);
    document.getElementById('winner-text').innerText = yakjeongTotalCost > jageupjeTotalCost ? '자급제가 ' : '약정 구매가 ';
    document.getElementById('savings-amount').innerText = `${formatWithCommas(Math.round(savings))} 원`;

    const installmentContainer1 = document.getElementById('details-installment-container1');
    const installmentContainer2 = document.getElementById('details-installment-container2');
    
    installmentContainer1.classList.toggle('hidden', paymentMethod !== 'installments' || monthlyDeviceCost <= 0);
    installmentContainer2.classList.toggle('hidden', paymentMethod !== 'installments' || monthlyDeviceCost <= 0);

    document.getElementById('details-high-months').innerText = highPlanMonths;
    document.getElementById('details-monthly-principal1').innerText = formatWithCommas(Math.round(monthlyPrincipal));
    document.getElementById('details-monthly-interest1').innerText = formatWithCommas(Math.round(monthlyInterest));
    document.getElementById('details-monthly-plan-cost1').innerText = formatWithCommas(Math.round(monthlyPlanFee1));
    document.getElementById('details-monthly-vas-cost').innerText = formatWithCommas(Math.round(vasFee));
    document.getElementById('details-total-monthly1').innerText = formatWithCommas(Math.round(monthlyDeviceCost + monthlyPlanFee1 + vasFee));
    
    document.getElementById('details-monthly-principal2').innerText = formatWithCommas(Math.round(monthlyPrincipal));
    document.getElementById('details-monthly-interest2').innerText = formatWithCommas(Math.round(monthlyInterest));
    document.getElementById('details-monthly-plan-cost2').innerText = formatWithCommas(Math.round(monthlyPlanFee2));
    document.getElementById('details-total-monthly2').innerText = formatWithCommas(Math.round(monthlyDeviceCost + monthlyPlanFee2));

    document.getElementById('details-jageupje-plan-cost').innerText = formatWithCommas(Math.round(jageupjePlanFee));
    document.getElementById('details-jageupje-total-monthly').innerText = formatWithCommas(Math.round(jageupjePlanFee));

    const state = {
        discountType: document.querySelector('input[name="discount-type"]:checked').value,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        contractMonths: contractMonthsSelect.value,
        deviceSearch: deviceSearchInput.value,
        devicePrice: devicePriceInput.value,
        carrierSupport: carrierSupportInput.value,
        storeSupport: storeSupportInput.value,
        highPlanFee: highPlanFeeInput.value,
        highPlanMonths: highPlanMonthsSelect.value,
        realPlanFee: realPlanFeeInput.value,
        vasFee: vasFeeInput.value,
        jageupjePlanFee: jageupjePlanFeeInput.value,
        jageupjeSeonyak: jageupjeSeonyakCheckbox.checked
    };
    localStorage.setItem('calculatorState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('calculatorState');
    if (savedState) {
        const state = JSON.parse(savedState);
        document.querySelector(`input[name="discount-type"][value="${state.discountType}"]`).checked = true;
        if(state.paymentMethod) document.querySelector(`input[name="payment-method"][value="${state.paymentMethod}"]`).checked = true;
        contractMonthsSelect.value = state.contractMonths;
        deviceSearchInput.value = state.deviceSearch;
        devicePriceInput.value = formatWithCommas(parseNumber(state.devicePrice));
        carrierSupportInput.value = formatWithCommas(parseNumber(state.carrierSupport));
        storeSupportInput.value = formatWithCommas(parseNumber(state.storeSupport));
        highPlanFeeInput.value = formatWithCommas(parseNumber(state.highPlanFee));
        highPlanMonthsSelect.value = state.highPlanMonths;
        realPlanFeeInput.value = formatWithCommas(parseNumber(state.realPlanFee));
        vasFeeInput.value = formatWithCommas(parseNumber(state.vasFee));
        jageupjePlanFeeInput.value = formatWithCommas(parseNumber(state.jageupjePlanFee));
        jageupjeSeonyakCheckbox.checked = state.jageupjeSeonyak;
        
        const savedPhone = phoneData.find(p => p.name === state.deviceSearch);
        if (savedPhone) { buyLink.href = savedPhone.link; }
    } else {
        selectPhone(phoneData[0]);
    }
}

function selectPhone(phone) {
    if (!phone) return;
    deviceSearchInput.value = phone.name;
    devicePriceInput.value = formatWithCommas(phone.price);
    buyLink.href = phone.link;
    autocompleteResults.innerHTML = '';
    autocompleteResults.classList.add('hidden');
    updateAndSave();
}

function updateHighlight() {
    const items = autocompleteResults.querySelectorAll('div');
    items.forEach((item, index) => {
        const isHighlighted = index === highlightedIndex;
        item.classList.toggle('bg-indigo-600', isHighlighted);
        item.classList.toggle('text-white', isHighlighted);
        if (isHighlighted) { item.scrollIntoView({ block: 'nearest' }); }
    });
}

deviceSearchInput.addEventListener('input', () => {
    const query = deviceSearchInput.value.toLowerCase();
    if (!query) { autocompleteResults.classList.add('hidden'); return; }
    const filteredPhones = phoneData.filter(phone => phone.name.toLowerCase().includes(query));
    if (filteredPhones.length > 0) {
        autocompleteResults.innerHTML = filteredPhones.map(phone => 
            `<div class="p-3 hover:bg-indigo-600 hover:text-white cursor-pointer" data-name="${phone.name}" data-price="${phone.price}" data-link="${phone.link}">
                ${phone.name} <span class="text-sm text-slate-400 dark:text-slate-400">${formatWithCommas(phone.price)}원</span>
            </div>`
        ).join('');
        autocompleteResults.classList.remove('hidden');
        highlightedIndex = -1;
    } else { autocompleteResults.classList.add('hidden'); }
});

deviceSearchInput.addEventListener('keydown', (e) => {
    const items = autocompleteResults.querySelectorAll('div');
    if (items.length === 0 || autocompleteResults.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightedIndex = (highlightedIndex + 1) % items.length; } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlightedIndex = (highlightedIndex - 1 + items.length) % items.length; } 
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex > -1) {
            const selectedItem = items[highlightedIndex];
            selectPhone({ name: selectedItem.dataset.name, price: parseFloat(selectedItem.dataset.price), link: selectedItem.dataset.link });
        }
    }
    updateHighlight();
});

autocompleteResults.addEventListener('click', (e) => {
    const target = e.target.closest('div');
    if (target && target.dataset.name) {
        selectPhone({ name: target.dataset.name, price: parseFloat(target.dataset.price), link: target.dataset.link });
    }
});

document.addEventListener('click', (e) => {
    if (deviceSearchInput && !deviceSearchInput.contains(e.target) && !autocompleteResults.contains(e.target)) {
        autocompleteResults.classList.add('hidden');
    }
});

allInputs.forEach(input => {
    if (input.tagName.toLowerCase() === 'input' && input.classList.contains('numeric-input')) {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            const parsedValue = parseNumber(value);
            if (document.activeElement === e.target) {
              e.target.value = formatWithCommas(parsedValue);
            }
        });
    }
    const eventType = (input.type === 'radio' || input.tagName.toLowerCase() === 'select' || input.type === 'checkbox') ? 'change' : 'input';
    input.addEventListener(eventType, updateAndSave);
});

resetBtn.addEventListener('click', () => {
    resetModal.classList.remove('hidden');
});
cancelResetBtn.addEventListener('click', () => {
    resetModal.classList.add('hidden');
});
confirmResetBtn.addEventListener('click', () => {
    localStorage.removeItem('calculatorState');
    window.location.href = window.location.pathname;
});

yakjeongDetailsToggleBtn.addEventListener('click', () => {
    yakjeongDetails.classList.toggle('hidden');
    yakjeongDetailsToggleIcon.classList.toggle('rotate-180');
});
jageupjeDetailsToggleBtn.addEventListener('click', () => {
    jageupjeDetails.classList.toggle('hidden');
    jageupjeDetailsToggleIcon.classList.toggle('rotate-180');
}); 