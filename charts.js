/* ============================================================
   charts.js — fully data-driven from AGENTS (see data.js).
   You should not need to touch this file month to month:
   update data.js and these charts + the heatmap rebuild
   themselves automatically.
   ============================================================ */

const PARAM_ORDER = ['ss', 'sol', 'prob', 'tag', 'fu']; // heatmap/doughnut columns (cc shown separately in tables)

function agentsSortedByCQ() {
  return Object.entries(AGENTS)
    .map(([key, a]) => ({ key, ...a }))
    .sort((a, b) => b.cq - a.cq);
}

function scoreBarColor(cq) {
  if (cq >= 90) return '#16a34a'; // green — well above individual target
  if (cq >= 85) return '#c8a846'; // gold — at/above individual target
  return '#dc2626';               // red — below individual target
}

function initCharts() {
  const font = { family: "'Segoe UI',Arial,sans-serif" };
  const tooltip = {
    backgroundColor: '#1c2a3a',
    titleFont: { ...font, size: 12 },
    bodyFont:  { ...font, size: 11 },
    padding: 10,
    cornerRadius: 8
  };

  const sorted = agentsSortedByCQ();

  // ---- CQ Score vs Targets, sorted high to low ----
  new Chart(document.getElementById('scoreChart'), {
    type: 'bar',
    data: {
      labels: sorted.map(a => a.name),
      datasets: [
        {
          label: 'CQ Score',
          data: sorted.map(a => a.cq),
          backgroundColor: sorted.map(a => scoreBarColor(a.cq)),
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.75,
          order: 2
        },
        {
          label: 'Individual Target 85%',
          data: sorted.map(() => 85),
          type: 'line', borderColor: '#f59e0b', borderWidth: 1.5,
          borderDash: [3,3], pointRadius: 0, fill: false, order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      layout: { padding: { top: 16, bottom: 0 } },
      plugins: {
        tooltip,
        legend: {
          display: true, position: 'bottom',
          labels: { font: { ...font, size: 11 }, boxWidth: 12, padding: 12, usePointStyle: true }
        }
      },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { callback: v => v + '%', font: { ...font, size: 11 }, stepSize: 10 },
          grid: { color: 'rgba(128,128,128,.1)' }
        },
        x: { ticks: { font: { ...font, size: 10 }, maxRotation: 40, minRotation: 40 }, grid: { display: false } }
      }
    },
    plugins: [{
      id: 'barLabels',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        meta.data.forEach((bar, i) => {
          const val = chart.data.datasets[0].data[i];
          if (bar.height < 14) return;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Segoe UI,Arial,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val + '%', bar.x, bar.y + bar.height * 0.5);
        });
        ctx.restore();
      }
    }]
  });

  // ---- Error Distribution Doughnut (sum of each param across all agents) ----
  const paramTotals = {};
  PARAM_ORDER.forEach(k => paramTotals[k] = 0);
  Object.values(AGENTS).forEach(a => {
    PARAM_ORDER.forEach(k => paramTotals[k] += (a.params[k] || 0));
  });
  const paramEntries = PARAM_ORDER
    .map(k => ({ k, v: paramTotals[k] }))
    .filter(e => e.v > 0)
    .sort((a, b) => b.v - a.v);

  new Chart(document.getElementById('errorChart'), {
    type: 'doughnut',
    data: {
      labels: paramEntries.map(e => PARAM_LABELS[e.k]),
      datasets: [{
        data: paramEntries.map(e => e.v),
        backgroundColor: paramEntries.map(e => PARAM_COLORS[e.k]),
        borderWidth: 2, borderColor: '#fff', hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { animateRotate: true, animateScale: true, duration: 1200, easing: 'easeOutQuart' },
      layout: { padding: { top: 4, bottom: 0 } },
      plugins: {
        tooltip,
        legend: {
          display: true, position: 'bottom',
          labels: { font: { ...font, size: 11 }, boxWidth: 12, padding: 10, usePointStyle: true }
        }
      },
      cutout: '60%'
    },
    plugins: [{
      id: 'doughnutLabels',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const total = chart.data.datasets[0].data.reduce((a,b)=>a+b,0) || 1;
        ctx.save();
        meta.data.forEach((arc, i) => {
          const val = chart.data.datasets[0].data[i];
          const pct = Math.round((val / total) * 100);
          if (pct < 6) return;
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const r = (arc.innerRadius + arc.outerRadius) / 2;
          const x = arc.x + r * Math.cos(angle);
          const y = arc.y + r * Math.sin(angle);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Segoe UI,Arial,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pct + '%', x, y);
        });
        ctx.restore();
      }
    }]
  });

  // ---- Errors per Agent, worst to best top to bottom ----
  const byErrors = Object.entries(AGENTS)
    .map(([key, a]) => ({ key, ...a }))
    .sort((a, b) => b.totalErrors - a.totalErrors);
  const maxErr = Math.max(4, ...byErrors.map(a => a.totalErrors));
  const errAxisMax = Math.ceil((maxErr + 1) / 4) * 4;

  new Chart(document.getElementById('agentErrorChart'), {
    type: 'bar',
    data: {
      labels: byErrors.map(a => a.name),
      datasets: [{
        label: 'Total Errors',
        data: byErrors.map(a => a.totalErrors),
        backgroundColor: byErrors.map(a => a.color || '#2563eb'),
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.75
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      animation: { duration: 1200, easing: 'easeOutQuart' },
      layout: { padding: { right: 24, top: 4, bottom: 0 } },
      plugins: { tooltip, legend: { display: false } },
      scales: {
        x: {
          min: 0, max: errAxisMax,
          ticks: { font: { ...font, size: 11 }, stepSize: Math.max(1, Math.round(errAxisMax / 4)) },
          grid: { color: 'rgba(128,128,128,.1)' }
        },
        y: { ticks: { font: { ...font, size: 10 } }, grid: { display: false } }
      }
    },
    plugins: [{
      id: 'hbarLabels',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        meta.data.forEach((bar, i) => {
          const val = chart.data.datasets[0].data[i];
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Segoe UI,Arial,sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, bar.x - 6, bar.y);
        });
        ctx.restore();
      }
    }]
  });

  buildHeatmap();
}

function buildHeatmap() {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  const sorted = agentsSortedByCQ(); // high to low by CQ
  const agents = sorted.map(a => a.name);
  const params = PARAM_ORDER.map(k => PARAM_LABELS[k]);
  const errors = sorted.map(a => PARAM_ORDER.map(k => a.params[k] || 0));

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  function cell(v) {
    if (v === 0) return isDark ? { bg:'#052e16', bd:'#166534', tx:'#4ade80' } : { bg:'#f0fdf4', bd:'#bbf7d0', tx:'#166534' };
    if (v <= 2)  return isDark ? { bg:'#422006', bd:'#a16207', tx:'#fde68a' } : { bg:'#fef9c3', bd:'#fde047', tx:'#713f12' };
    if (v <= 3)  return isDark ? { bg:'#431407', bd:'#c2410c', tx:'#fed7aa' } : { bg:'#fed7aa', bd:'#fb923c', tx:'#7c2d12' };
    if (v <= 4)  return isDark ? { bg:'#450a0a', bd:'#991b1b', tx:'#fca5a5' } : { bg:'#fca5a5', bd:'#ef4444', tx:'#7f1d1d' };
    return isDark ? { bg:'#7f1d1d', bd:'#dc2626', tx:'#fff' } : { bg:'#dc2626', bd:'#dc2626', tx:'#fff' };
  }

  const txP = isDark ? '#e8e4f0' : '#1c2a3a';
  const txS = isDark ? '#9c8a70' : '#8a7a60';
  const txH = isDark ? '#6a5a50' : '#b8a888';

  let h = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:separate;border-spacing:4px;min-width:420px;"><thead><tr>
    <th style="font-size:11px;font-weight:600;color:${txS};text-align:left;padding:2px 8px;white-space:nowrap;">Agent</th>`;
  params.forEach(p => {
    h += `<th style="font-size:10px;font-weight:600;color:${txS};text-align:center;padding:2px 4px;white-space:nowrap;">${p}</th>`;
  });
  h += `</tr></thead><tbody>`;
  agents.forEach((a, i) => {
    h += `<tr><td style="font-size:12px;font-weight:600;padding:3px 8px;white-space:nowrap;color:${txP};">${a}</td>`;
    errors[i].forEach(v => {
      const c = cell(v);
      h += `<td style="padding:3px;"><div style="background:${c.bg};border:1px solid ${c.bd};border-radius:8px;padding:8px 2px;text-align:center;font-size:14px;font-weight:700;color:${c.tx};min-width:32px;">${v === 0 ? '✓' : v}</div></td>`;
    });
    h += `</tr>`;
  });
  h += `</tbody></table></div>`;

  const lbg = isDark ? ['#052e16','#422006','#431407','#450a0a','#7f1d1d'] : ['#f0fdf4','#fef9c3','#fed7aa','#fca5a5','#dc2626'];
  const lbd = isDark ? ['#166534','#a16207','#c2410c','#991b1b','#dc2626'] : ['#bbf7d0','#fde047','#fb923c','#ef4444','#dc2626'];
  h += `<div style="display:flex;align-items:center;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap;">
    <span style="font-size:11px;color:${txS};">0</span>
    <div style="display:flex;gap:3px;">${lbg.map((bg,i)=>`<div style="width:16px;height:16px;border-radius:3px;background:${bg};border:1px solid ${lbd[i]};"></div>`).join('')}</div>
    <span style="font-size:11px;color:${txS};">5+</span>
    <span style="font-size:10px;color:${txH};margin-left:4px;">check mark means zero errors, lower is better</span>
  </div>`;

  container.innerHTML = h;
}

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  new MutationObserver(() => buildHeatmap())
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
