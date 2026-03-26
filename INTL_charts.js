Chart.register(ChartDataLabels);

function renderCharts() {
  const agentList = Object.values(AGENTS).sort((a, b) => b.cq - a.cq);
  const names = agentList.map(a => a.name.replace('_', ' '));
  const cqs = agentList.map(a => a.cq);
  const AV_COLORS = ['#b8860b','#16a34a','#2563eb','#7c3aed','#ea580c','#dc2626','#0891b2','#be185d','#6d28d9'];

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const txtColor = () => isDark() ? '#b8b0cc' : '#4a3f2f';

  // ── CHART 1: CQ Score vs Target ──
  const ctx1 = document.getElementById('scoreChart');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          {
            label: 'CQ Score',
            data: cqs,
            backgroundColor: agentList.map((_, i) => AV_COLORS[i % AV_COLORS.length] + 'CC'),
            borderColor: agentList.map((_, i) => AV_COLORS[i % AV_COLORS.length]),
            borderWidth: 1.5,
            borderRadius: 5,
            datalabels: {
              anchor: 'end', align: 'end',
              color: () => isDark() ? '#e8e4f0' : '#1a1208',
              font: { weight: '700', size: 11 },
              formatter: v => v + '%'
            }
          },
          {
            label: 'Target (95%)',
            data: agentList.map(() => 95),
            type: 'line',
            borderColor: '#dc2626',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            fill: false,
            datalabels: { display: false }
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { color: txtColor, font: { size: 11 }, boxWidth: 12 } },
          datalabels: {}
        },
        scales: {
          x: { ticks: { color: txtColor, font: { size: 10 } }, grid: { display: false } },
          y: { min: 60, max: 108, ticks: { color: txtColor, callback: v => v + '%', font: { size: 10 } }, grid: { color: isDark() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ── CHART 2: Error Distribution Doughnut ──
  const ctx2 = document.getElementById('errorChart');
  if (ctx2) {
    const paramTotals = { ss: 0, prob: 0, sol: 0, fu: 0, tag: 0 };
    Object.values(AGENTS).forEach(a => Object.keys(paramTotals).forEach(p => paramTotals[p] += a.params[p]));
    const labels = ['Soft Skills', 'Probing', 'Solution', 'Follow Up', 'Tagging'];
    const vals = Object.values(paramTotals);
    const total = vals.reduce((s, v) => s + v, 0);
    const colors = ['#c8a846','#ea580c','#2563eb','#16a34a','#7c3aed'];
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: vals, backgroundColor: colors.map(c => c + 'CC'), borderColor: colors, borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: txtColor, font: { size: 11 }, boxWidth: 12 } },
          datalabels: {
            color: '#fff',
            font: { weight: '700', size: 11 },
            textShadowBlur: 4, textShadowColor: 'rgba(0,0,0,0.5)',
            formatter: (v) => v > 0 ? `${v}\n(${Math.round(v/total*100)}%)` : '',
            display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ── CHART 3: Errors per JC Stacked ──
  const ctx3 = document.getElementById('agentErrorChart');
  if (ctx3) {
    const paramKeys = ['ss','prob','sol','fu','tag'];
    const paramColors = { ss:'#c8a846', prob:'#ea580c', sol:'#2563eb', fu:'#16a34a', tag:'#7c3aed' };
    const paramLabels = { ss:'Soft Skills', prob:'Probing', sol:'Solution', fu:'Follow Up', tag:'Tagging' };
    new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: names,
        datasets: paramKeys.map(p => ({
          label: paramLabels[p],
          data: agentList.map(a => a.params[p]),
          backgroundColor: paramColors[p] + 'CC',
          borderColor: paramColors[p],
          borderWidth: 1,
          datalabels: {
            display: ctx => ctx.dataset.data[ctx.dataIndex] > 0,
            anchor: 'center', align: 'center',
            color: '#fff',
            font: { weight: '700', size: 10 },
            textShadowBlur: 3, textShadowColor: 'rgba(0,0,0,0.6)',
            formatter: v => v > 0 ? v : null
          }
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: txtColor, font: { size: 11 }, boxWidth: 12 } },
          datalabels: {}
        },
        scales: {
          x: { stacked: true, ticks: { color: txtColor, font: { size: 10 } }, grid: { display: false } },
          y: { stacked: true, ticks: { color: txtColor, stepSize: 5, font: { size: 10 } }, grid: { color: isDark() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ── CHART 4: JC Wise Error Count Table ──
  const heatmapDiv = document.getElementById('heatmapContainer');
  if (heatmapDiv) {
    const params = ['ss','prob','sol','fu','tag'];
    const pLabels = ['Soft Skills','Probing','Solution','Follow Up','Tagging'];
    const maxVal = Math.max(...Object.values(AGENTS).flatMap(a => params.map(p => a.params[p])), 1);
    const dark = isDark();
    let html = `<table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:#0f1c2a;">
        <th style="padding:8px 12px;text-align:left;font-weight:700;color:rgba(255,255,255,.6);font-size:10px;letter-spacing:1px;text-transform:uppercase;">JC Name</th>
        ${pLabels.map(l => `<th style="padding:8px;text-align:center;font-weight:700;color:rgba(255,255,255,.6);font-size:10px;letter-spacing:1px;text-transform:uppercase;">${l}</th>`).join('')}
        <th style="padding:8px;text-align:center;font-weight:700;color:rgba(255,255,255,.6);font-size:10px;letter-spacing:1px;text-transform:uppercase;">Total</th>
      </tr></thead><tbody>`;

    const sortedAgents = Object.values(AGENTS).sort((a, b) => b.cq - a.cq);
    sortedAgents.forEach((agent, i) => {
      const rowBg = dark ? (i % 2 === 0 ? '#1a1a2e' : '#242438') : (i % 2 === 0 ? '#ffffff' : '#faf8f4');
      html += `<tr style="background:${rowBg};border-bottom:1px solid ${dark ? '#2a2a3e' : '#e5e0d8'};">
        <td style="padding:9px 12px;font-weight:600;color:${dark ? '#e8e4f0' : '#1a1208'};font-size:13px;">${agent.name}</td>`;
      params.forEach(p => {
        const val = agent.params[p];
        const intensity = val / maxVal;
        const bg = val === 0 ? (dark ? '#0a1f10' : '#f0fdf4') : `rgba(200,168,70,${0.12 + intensity * 0.75})`;
        const col = val === 0 ? '#16a34a' : intensity > 0.55 ? '#fff' : (dark ? '#e8e4f0' : '#1a1208');
        html += `<td style="padding:9px 8px;text-align:center;background:${bg};color:${col};font-family:Georgia,serif;font-size:16px;font-weight:700;">${val}</td>`;
      });
      const total = params.reduce((s, p) => s + agent.params[p], 0);
      html += `<td style="padding:9px 8px;text-align:center;font-family:Georgia,serif;font-size:16px;font-weight:800;color:#c8a846;">${total}</td></tr>`;
    });

    // Total row
    html += `<tr style="background:#0f1c2a;border-top:2px solid #c8a846;">
      <td style="padding:9px 12px;font-weight:800;color:rgba(255,255,255,.8);font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Team Total</td>`;
    params.forEach(p => {
      const t = sortedAgents.reduce((s, a) => s + a.params[p], 0);
      html += `<td style="padding:9px 8px;text-align:center;font-family:Georgia,serif;font-size:16px;font-weight:800;color:#c8a846;">${t}</td>`;
    });
    const grand = sortedAgents.reduce((s, a) => s + a.totalErrors, 0);
    html += `<td style="padding:9px 8px;text-align:center;font-family:Georgia,serif;font-size:16px;font-weight:800;color:#c8a846;">${grand}</td></tr>`;
    html += `</tbody></table>`;
    heatmapDiv.innerHTML = html;
  }
}

// Re-render on theme change
const _origToggleDark = window.toggleDark;
