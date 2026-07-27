function getScoreBadgeClass(s) {
  if (s >= 90) return 'csb-high';
  if (s >= 75) return 'csb-mid';
  return 'csb-low';
}

function buildMetricsHTML(a) {
  const sc = a.cq >= 90 ? 'gold' : a.cq >= 80 ? 'green' : 'orange';
  return `
    <div class="mm"><div class="mm-val ${sc}">${a.cq}%</div><div class="mm-lbl">CQ Score</div></div>
    <div class="mm"><div class="mm-val white">${a.audits}</div><div class="mm-lbl">Audits</div></div>
    <div class="mm"><div class="mm-val ${a.ncf > 0 ? 'red' : 'green'}">${a.ncf}</div><div class="mm-lbl">NCF</div></div>
    <div class="mm"><div class="mm-val orange">${a.totalErrors}</div><div class="mm-lbl">Total Errors</div></div>
    <div class="mm"><div class="mm-val red">${Math.max(0, 85 - a.cq)}%</div><div class="mm-lbl">Gap to Target</div></div>`;
}

function buildModalBody(agentKey, highlightParam) {
  const a = AGENTS[agentKey];
  if (!a) return '';
  let html = '';

  const indivTarget = 85;
  const gap = indivTarget - a.cq;
  const gc = a.cq >= 90 ? 'bar-gold' : a.cq >= 85 ? 'bar-green' : 'bar-orange';
  const gapText = gap > 0
    ? `${gap}% below individual target (85%)`
    : `✓ Individual target met!`;
  const pctColor = a.cq >= 90 ? '#b8860b' : a.cq >= 85 ? '#16a34a' : '#ea580c';

  // Optional per agent note
  if (a.note) {
    html += `<div style="background:var(--blue-pale);border:1px solid var(--blue);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--blue);"><strong>ℹ Note:</strong> ${a.note}</div>`;
  }

  html += `
    <div class="modal-sec-lbl">CQ Score</div>
    <div class="gauge-wrap">
      <div style="flex:1;">
        <div class="gauge-track">
          <div class="bar-fill ${gc}" style="width:${a.cq}%;height:100%;border-radius:6px;transition:width 1.2s cubic-bezier(.4,0,.2,1);"></div>
          <div class="gauge-target" style="left:85%;background:#f59e0b;" title="Individual Target 85%"></div>
        </div>
        <div class="gauge-labels">
          <span>0%</span>
          <span style="color:#f59e0b;font-weight:700;">Indiv. 85%</span>
          <span>100%</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:70px;">
        <div style="font-family:Georgia,serif;font-size:30px;font-weight:800;color:${pctColor};line-height:1;">${a.cq}%</div>
        <div style="font-size:10px;color:#8a7a60;margin-top:2px;">${gapText}</div>
      </div>
    </div>`;

  html += `<div class="modal-sec-lbl">Errors by Parameter</div><div class="param-mini-grid">`;
  Object.entries(a.params).forEach(([k, v]) => {
    const hl = k === highlightParam;
    const color = PARAM_COLORS[k];
    html += `<div class="pmg-item${hl ? ' pmg-hl' : ''}">
      <div class="pmg-val" style="color:${v === 0 ? '#16a34a' : color};">${v === 0 ? '✓' : v}</div>
      <div class="pmg-lbl">${PARAM_LABELS[k]}</div>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="modal-sec-lbl">Areas of Improvement</div><div class="aoi-list">`;
  a.aois.forEach(aoi => {
    const c = PARAM_COLORS[aoi.cat];
    html += `<div class="aoi-item" style="border-left-color:${c};">
      <div class="aoi-cat" style="color:${c};">${aoi.label}</div>
      <div class="aoi-text">${aoi.text}</div>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="modal-sec-lbl">Audit Cases, ${a.audits} total${a.note ? ' (see note above)' : ''}</div>`;
  a.cases.forEach((c, i) => {
    const hl = highlightParam && a.paramCaseMap[highlightParam] && a.paramCaseMap[highlightParam].includes(i);
    const sbClass = getScoreBadgeClass(c.score);
    html += `<div class="case-card${hl ? ' case-hl' : ''}" id="case-${agentKey}-${i}">
      <div class="case-hd">
        <div class="case-query">${c.query}${hl ? ' <span class="case-flag">▶ Flagged</span>' : ''}</div>
        <span class="case-badge ${sbClass}">${c.score}%</span>
      </div>
      <div class="case-text">${c.comment}</div>
    </div>`;
  });

  html += `<div class="modal-sec-lbl">What To Do Better</div>
    <div class="better-box">`;
  a.aois.forEach(aoi => {
    html += `<div class="better-item"><span class="better-arrow">▸</span>${aoi.text}</div>`;
  });
  html += `</div>`;

  return html;
}

function openModal(agentKey, highlightParam) {
  const a = AGENTS[agentKey];
  if (!a) return;
  document.getElementById('m-name').textContent = a.name;
  document.getElementById('m-role').textContent = 'International Team · July 2026';
  document.getElementById('m-metrics').innerHTML = buildMetricsHTML(a);
  document.getElementById('m-body').innerHTML = buildModalBody(agentKey, highlightParam || null);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (highlightParam) {
    setTimeout(() => {
      const first = document.querySelector('.case-hl');
      if (first) first.scrollIntoView({behavior:'smooth', block:'center'});
    }, 300);
  } else {
    document.getElementById('m-body').scrollTop = 0;
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
