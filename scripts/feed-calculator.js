/**
 * Gewinn-Calculator — Feed Page
 * Real-time profit calculator with synchronized sliders and number inputs.
 */
(function () {
    function fmt(n) {
        return n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
    }

    function fmtPct(n) {
        return (n >= 0 ? '+' : '') + n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' %';
    }

    var WASTE = 0.20; // Anteil Budget-Fresser — fixed at 20%

    function calc() {
        var B = +document.getElementById('sl-budget').value;
        var U = +document.getElementById('sl-umsatz').value;
        var m = +document.getElementById('sl-marge').value / 100;
        var w = WASTE;

        var P_alt = U * m - B;
        var roas_core = U / (B * (1 - w));
        var U_neu = U + B * w * roas_core;
        var P_neu = U_neu * m - B;
        var wachstum = P_alt !== 0 ? ((P_neu - P_alt) / Math.abs(P_alt)) * 100 : 0;
        var hebel = P_neu - P_alt;

        document.getElementById('out-profit-alt').textContent = fmt(Math.round(P_alt));
        document.getElementById('out-profit-neu').textContent = fmt(Math.round(P_neu));
        document.getElementById('out-hebel-eur').textContent = (hebel >= 0 ? '+' : '') + fmt(Math.round(hebel)).replace(' €', '') + ' €';
        document.getElementById('out-hebel-pct').textContent = fmtPct(Math.round(wachstum));
    }

    function syncFromSlider(slId, numId, lblId, unit) {
        var sl = document.getElementById(slId);
        var num = document.getElementById(numId);
        var lbl = document.getElementById(lblId);

        function updateLbl(v) {
            if (unit === '€') {
                lbl.textContent = Number(v).toLocaleString('de-DE') + ' €';
            } else {
                lbl.textContent = v + ' %';
            }
        }

        sl.addEventListener('input', function () {
            num.value = sl.value;
            updateLbl(sl.value);
            calc();
        });

        num.addEventListener('input', function () {
            var v = Math.min(+num.max, Math.max(+num.min, +num.value || +num.min));
            sl.value = v;
            updateLbl(v);
            calc();
        });

        num.addEventListener('change', function () {
            var v = Math.min(+num.max, Math.max(+num.min, +num.value || +num.min));
            num.value = v;
            sl.value = v;
            updateLbl(v);
            calc();
        });
    }

    function init() {
        if (!document.getElementById('sl-budget')) return;

        syncFromSlider('sl-budget', 'num-budget', 'lbl-budget', '€');
        syncFromSlider('sl-umsatz', 'num-umsatz', 'lbl-umsatz', '€');
        syncFromSlider('sl-marge',  'num-marge',  'lbl-marge',  '%');

        calc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
