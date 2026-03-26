const PARAM_ORDER = ['ss','prob','sol','fu','tag'];
const PARAM_LABEL = {ss:'Soft Skills',prob:'Probing',sol:'Solution & Rec.',fu:'Follow Up',tag:'Tagging'};
const PARAM_COLOR = {ss:'#c8a846',prob:'#ea580c',sol:'#2563eb',fu:'#16a34a',tag:'#7c3aed'};
const AOI_COLORS = ['#c8a846','#ea580c','#2563eb'];

function openModal(agentKey, highlightParam) {
  const agent = AGENTS[agentKey];
  if (!agent) return;

  // Header metrics
  document.getElementById('m-name').textContent = agent.name;
  document.getElementById('m-role').textContent = 'INTL · March 2026 · Quality Report';

  const cqClass = agent.cq >= 90 ? 'gold' : agent.cq >= 80 ? 'gold' : 'orange';
  const ncfClass = agent.ncf === 0 ? 'green' : 'red';
  const errClass = agent.totalErrors <= 10 ? 'green' : agent.totalErrors <= 25 ? 'orange' : 'red';
  document.getElementById('m-metrics').innerHTML = `
    <div class="mm"><div class="mm-val ${cqClass}">${agent.cq}%</div><div class="mm-lbl">CQ Score</div></div>
    <div class="mm"><div class="mm-val white">${agent.audits}</div><div class="mm-lbl">Audits</div></div>
    <div class="mm"><div class="mm-val ${ncfClass}">${agent.ncf}</div><div class="mm-lbl">NCF</div></div>
    <div class="mm"><div class="mm-val ${errClass}">${agent.totalErrors}</div><div class="mm-lbl">Errors</div></div>
  `;

  const target = 95;
  const gap = target - agent.cq;
  const gapTxt = gap > 0 ? `${gap}% below target` : gap === 0 ? 'At target ✓' : `${Math.abs(gap)}% above target`;
  const gapCol = gap > 10 ? '#f87171' : gap > 0 ? '#e8c86a' : '#4ade80';
  const barW = Math.min(100, agent.cq);
  const targetPct = target;

  // Param mini-grid
  const miniGrid = PARAM_ORDER.map(p => {
    const v = agent.params[p];
    const isHl = highlightParam === p;
    const col = v === 0 ? '#4ade80' : v <= 3 ? '#e8c86a' : '#f87171';
    return `<div class="pmg-item${isHl ? ' pmg-hl' : ''}">
      <div class="pmg-val" style="color:${col}">${v}</div>
      <div class="pmg-lbl">${PARAM_LABEL[p]}</div>
    </div>`;
  }).join('');

  // AOIs
  const aoisHtml = agent.aois.map((aoi, i) => `
    <div class="aoi-item" style="border-left-color:${AOI_COLORS[i]}">
      <div class="aoi-cat" style="color:${AOI_COLORS[i]}">${aoi.cat}</div>
      <div class="aoi-text"><strong>${aoi.label}</strong> — ${aoi.text}</div>
    </div>`).join('');

  // Cases
  const hlCases = highlightParam ? (agent.paramCaseMap[highlightParam] || []) : [];
  const casesHtml = agent.cases.map((c, i) => {
    const isHl = hlCases.includes(i);
    const badgeCls = c.score >= 90 ? 'csb-high' : c.score >= 80 ? 'csb-mid' : 'csb-low';
    const isNcf = c.ncf > 0;
    return `<div class="case-card${isHl ? ' case-hl' : ''}">
      <div class="case-hd">
        <span class="case-query">#${i+1} — ${c.query}${isNcf ? '<span class="case-flag"> ⚑ NCF</span>' : ''}${isHl ? '<span class="case-flag"> ★ highlighted</span>' : ''}</span>
        <span class="case-badge ${badgeCls}">${c.score}%</span>
      </div>
      <div class="case-text">${c.comment || '—'}</div>
    </div>`;
  }).join('');

  // Focus area
  const worstP = PARAM_ORDER.reduce((best, p) => agent.params[p] > agent.params[best] ? p : best, 'ss');
  const worstCount = agent.params[worstP];

  document.getElementById('m-body').innerHTML = `
    <div class="modal-sec-lbl">CQ Score vs Target</div>
    <div class="gauge-wrap" style="flex-direction:column;gap:8px;">
      <div style="width:100%">
        <div class="gauge-track" style="width:100%;position:relative;">
          <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,#c8a846,#e8c86a);border-radius:6px;transition:width 1s ease;"></div>
          <div class="gauge-target" style="left:${targetPct}%;background:#dc2626;"></div>
        </div>
        <div class="gauge-labels"><span>0%</span><span style="color:#dc2626;">🎯 95% target</span><span>100%</span></div>
      </div>
      <div style="font-size:13px;color:var(--txt2);text-align:center;">
        <strong style="color:${gapCol}">${gapTxt}</strong>
      </div>
    </div>

    <div class="modal-sec-lbl">Parameter Breakdown</div>
    <div class="param-mini-grid">${miniGrid}</div>

    <div class="modal-sec-lbl">Areas of Improvement</div>
    <div class="aoi-list">${aoisHtml}</div>

    <div class="modal-sec-lbl">
      Audit Cases${highlightParam ? ` — ${PARAM_LABEL[highlightParam]} highlighted` : ''} (${agent.cases.length} total)
    </div>
    ${casesHtml}

    <div class="modal-sec-lbl">What to Focus On</div>
    <div class="better-box">
      <div class="better-item"><span class="better-arrow">›</span> Primary focus: <strong>${PARAM_LABEL[worstP]}</strong> — ${worstCount} error(s) this month. ${worstCount > 10 ? 'Needs immediate attention and targeted coaching.' : worstCount > 5 ? 'Consistent improvement sessions recommended.' : 'Keep working on this area for steady progress.'}</div>
      <div class="better-item"><span class="better-arrow">›</span> CQ is ${gap > 0 ? `${gap}% below the 95% target` : 'at or above target'}. ${gap > 10 ? 'Significant focused effort needed.' : gap > 0 ? 'Achievable with consistent effort.' : 'Maintain this standard.'}</div>
      <div class="better-item"><span class="better-arrow">›</span> ${agent.ncf === 0 ? 'Zero NCF — excellent discipline in maintaining CaratLane-friendly interactions.' : `${agent.ncf} NCF case(s) — review flagged interactions urgently.`}</div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
