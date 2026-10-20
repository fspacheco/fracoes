'use strict';
/* ===================== Utilitários ===================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const SVGNS = 'http://www.w3.org/2000/svg';
const mdc = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const mmc = (a, b) => a / mdc(a, b) * b;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rand(0, arr.length - 1)];

/* ---------- Leitura de frações em português do Brasil ---------- */
const UN = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
  'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEN = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
function cardinal(n) {
  if (n < 20) return UN[n];
  if (n < 100) return DEZ[Math.floor(n / 10)] + (n % 10 ? ' e ' + UN[n % 10] : '');
  if (n === 100) return 'cem';
  if (n < 1000) return CEN[Math.floor(n / 100)] + (n % 100 ? ' e ' + cardinal(n % 100) : '');
  if (n === 1000) return 'mil';
  return String(n);
}
const ORD = { 2: 'meio', 3: 'terço', 4: 'quarto', 5: 'quinto', 6: 'sexto', 7: 'sétimo', 8: 'oitavo', 9: 'nono',
  10: 'décimo', 100: 'centésimo', 1000: 'milésimo' };
function nomeDen(d, plural) {
  if (ORD[d]) return ORD[d] + (plural ? 's' : '');
  return cardinal(d) + ' avos';
}
function lerFracao(n, d) {
  if (d === 1) return cardinal(n) + (n === 1 ? ' inteiro' : ' inteiros');
  return cardinal(n) + ' ' + nomeDen(d, n !== 1);
}
function lerMisto(w, n, d) {
  return cardinal(w) + (w === 1 ? ' inteiro' : ' inteiros') + ' e ' + lerFracao(n, d);
}

/* ---------- HTML de frações ---------- */
function fracHTML(n, d, cls = '') {
  return `<span class="frac ${cls}" role="img" aria-label="${lerFracao(n, d)}"><span class="num">${n}</span><span class="den">${d}</span></span>`;
}
function fracGrande(el, n, d, cls = '') {
  el.className = 'frac-grande ' + cls;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', lerFracao(n, d));
  el.innerHTML = `<span class="num">${n}</span><span class="den">${d}</span>`;
}
/* Mostra fração imprópria também como número misto */
function valorHTML(n, d, cls = 'r') {
  let h = fracHTML(n, d, cls);
  if (n > d && n % d !== 0) {
    const w = Math.floor(n / d), r = n % d;
    h += ` = <span class="misto ${cls}" role="img" aria-label="${lerMisto(w, r, d)}"><span class="frac ${cls}" aria-hidden="true" style="font-size:1.6em;border:0"><span>${w}</span></span>${fracHTML(r, d, cls)}</span>`;
  } else if (n % d === 0 && n > 0 && d > 1) {
    h += ` = <strong>${n / d}</strong>`;
  }
  return h;
}

/* ---------- Feedback acessível (ícone + texto, não só cor) ---------- */
function feedback(el, tipo, msg) {
  const icone = { ok: '✓', erro: '✗', quase: '!' }[tipo];
  const titulo = { ok: 'Correto!', erro: 'Ainda não.', quase: 'Quase!' }[tipo];
  el.innerHTML = `<div class="fb fb-${tipo}"><span class="fb-icone" aria-hidden="true">${icone}</span><span><strong>${titulo}</strong> ${msg}</span></div>`;
}
function lerEntrada(nEl, dEl) {
  const n = parseInt(nEl.value, 10), d = parseInt(dEl.value, 10);
  if (Number.isNaN(n) || Number.isNaN(d)) return null;
  return { n, d };
}

/* ---------- Desenho: barra de fração ---------- */
/* fills: array de classes por célula ('a','b','r','x',''); d = partes por inteiro */
function barraSVG(d, fills, rotulo) {
  const inteiros = Math.max(1, Math.ceil(fills.length / d));
  const W = 300, H = 34, gap = 8, totalW = inteiros * W + (inteiros - 1) * gap;
  const cw = W / d;
  const svg = [`<svg viewBox="-3 -3 ${totalW + 6} ${H + 6}" role="img" aria-label="${rotulo}" preserveAspectRatio="xMinYMid meet">`];
  for (let k = 0; k < inteiros; k++) {
    const ox = k * (W + gap);
    for (let i = 0; i < d; i++) {
      const f = fills[k * d + i] || '';
      const fill = f ? `url(#pat-${f})` : '#ffffff';
      svg.push(`<rect x="${ox + i * cw}" y="0" width="${cw}" height="${H}" fill="${fill}" stroke="#1b1f2a" stroke-width="${f && f !== 'x' ? 2.5 : 1.5}"/>`);
      if (f === 'x') svg.push(`<path d="M${ox + i * cw + 4} 4L${ox + (i + 1) * cw - 4} ${H - 4}M${ox + (i + 1) * cw - 4} 4L${ox + i * cw + 4} ${H - 4}" stroke="#1b1f2a" stroke-width="2.5"/>`);
    }
    svg.push(`<rect x="${ox}" y="0" width="${W}" height="${H}" fill="none" stroke="#1b1f2a" stroke-width="3.5" rx="2"/>`);
  }
  svg.push('</svg>');
  return svg.join('');
}
function linhaBarra(n, d, fills, cls, desc) {
  return `<div class="barra-linha">${fracHTML(n, d, cls)}${barraSVG(d, fills, desc || lerFracao(n, d))}</div>`;
}
const cheio = (qtd, cls) => Array(Math.max(0, qtd)).fill(cls);

/* ---------- Desenho: pizza ---------- */
function setorPath(cx, cy, r, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  return `M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}
function pizzaEstatica(d, k, cls = 'a') {
  let s = `<svg viewBox="0 0 200 200" role="img" aria-label="Pizza dividida em ${d} partes, ${k} destacadas">`;
  for (let i = 0; i < d; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
    s += `<path d="${setorPath(100, 100, 90, a0, a1)}" fill="${i < k ? `url(#pat-${cls})` : '#F0E442'}" stroke="#1b1f2a" stroke-width="${i < k ? 4 : 2}"/>`;
  }
  return s + '</svg>';
}

/* ===================== Menu, contraste, seção ativa ===================== */
(function navegacao() {
  const btn = $('#btnMenu'), nav = $('#indice');
  btn.addEventListener('click', () => {
    const ab = nav.classList.toggle('aberto');
    btn.setAttribute('aria-expanded', ab);
  });
  $$('#indice a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth < 1000) { nav.classList.remove('aberto'); btn.setAttribute('aria-expanded', 'false'); }
  }));
  const bc = $('#btnContraste');
  const aplicar = on => { document.body.classList.toggle('hc', on); bc.setAttribute('aria-pressed', on); };
  try { aplicar(localStorage.getItem('fr-hc') === '1'); } catch (e) { /* sem storage */ }
  bc.addEventListener('click', () => {
    const on = !document.body.classList.contains('hc');
    aplicar(on);
    try { localStorage.setItem('fr-hc', on ? '1' : '0'); } catch (e) { /* ignora */ }
  });
  if ('IntersectionObserver' in window) {
    const links = new Map($$('#indice a').map(a => [a.getAttribute('href').slice(1), a]));
    const obs = new IntersectionObserver(ents => ents.forEach(e => {
      if (e.isIntersecting) { links.forEach(l => l.classList.remove('ativo')); links.get(e.target.id)?.classList.add('ativo'); }
    }), { rootMargin: '-30% 0px -60% 0px' });
    $$('main section[id]').forEach(s => obs.observe(s));
  }
})();

/* ===================== 1. Pizza interativa ===================== */
(function pizza() {
  const OPC = [2, 3, 4, 6, 8, 10, 12];
  let d = 8;
  let sel = new Set([0]);
  const caixa = $('#pizzaPartes'), alvo = $('#pizzaSvg');

  OPC.forEach(n => {
    const b = document.createElement('button');
    b.textContent = n; b.setAttribute('aria-pressed', n === d);
    b.setAttribute('aria-label', `Dividir em ${n} fatias`);
    b.addEventListener('click', () => { d = n; sel = new Set(); $$('button', caixa).forEach(x => x.setAttribute('aria-pressed', x === b)); desenhar(); });
    caixa.appendChild(b);
  });

  function alternar(i) { sel.has(i) ? sel.delete(i) : sel.add(i); desenhar(i); }

  function desenhar(foco) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '-14 -14 228 228');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', `Pizza dividida em ${d} fatias. Toque em uma fatia para pegá-la ou devolvê-la.`);
    // borda (massa)
    const borda = document.createElementNS(SVGNS, 'circle');
    Object.entries({ cx: 100, cy: 100, r: 96, fill: '#E69F00', stroke: '#1b1f2a', 'stroke-width': 3, opacity: .35 }).forEach(([k, v]) => borda.setAttribute(k, v));
    svg.appendChild(borda);
    for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d, am = (a0 + a1) / 2;
      const g = document.createElementNS(SVGNS, 'g');
      const s = sel.has(i);
      g.setAttribute('class', 'fatia' + (s ? ' sel' : ''));
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-pressed', s);
      g.setAttribute('aria-label', `Fatia ${i + 1} de ${d}${s ? ', pega' : ''}`);
      if (s) g.setAttribute('transform', `translate(${(10 * Math.cos(am)).toFixed(2)} ${(10 * Math.sin(am)).toFixed(2)})`);
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', setorPath(100, 100, 88, a0, a1));
      p.setAttribute('fill', s ? 'url(#pat-a)' : '#F0E442');
      g.appendChild(p);
      // "calabresas" decorativas nas fatias não pegas
      if (!s) {
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', 100 + 55 * Math.cos(am)); c.setAttribute('cy', 100 + 55 * Math.sin(am));
        c.setAttribute('r', Math.max(4, 22 / Math.sqrt(d))); c.setAttribute('fill', '#D55E00'); c.setAttribute('stroke', '#1b1f2a');
        c.setAttribute('pointer-events', 'none');
        g.appendChild(c);
      } else {
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', 100 + 58 * Math.cos(am)); t.setAttribute('y', 100 + 58 * Math.sin(am) + 6);
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', d > 8 ? 14 : 18); t.setAttribute('font-weight', 800);
        t.setAttribute('fill', '#fff'); t.setAttribute('stroke', '#1b1f2a'); t.setAttribute('stroke-width', 3); t.setAttribute('paint-order', 'stroke');
        t.setAttribute('pointer-events', 'none'); t.textContent = '✓';
        g.appendChild(t);
      }
      g.addEventListener('click', () => alternar(i));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(i); } });
      svg.appendChild(g);
    }
    alvo.replaceChildren(svg);
    if (foco !== undefined) svg.querySelectorAll('.fatia')[foco]?.focus();

    const k = sel.size;
    fracGrande($('#pizzaFracao'), k, d, 'a');
    $('#pizzaLeitura').textContent = `“${lerFracao(k, d)}” da pizza`;
    let ex;
    if (k === 0) ex = 'Toque em uma fatia para pegá-la.';
    else if (k === d) ex = `Você pegou todas as ${d} fatias: ${d}/${d} é a pizza inteira (vale 1).`;
    else ex = `A pizza tem ${d} fatias (número de baixo) e você pegou ${k} (número de cima). Sobraram ${d - k}/${d}.`;
    $('#pizzaExplica').textContent = ex;
  }
  $('#pizzaLimpar').addEventListener('click', () => { sel = new Set(); desenhar(); });
  desenhar();
})();

/* ===================== 1b. Jarra de café ===================== */
(function jarra() {
  let xic = 4;
  const TOT = 4;
  function desenhar() {
    const topo = 40, alt = 200, base = topo + alt, h = alt / TOT;
    let s = `<svg viewBox="0 0 200 270" role="img" aria-label="Jarra de café com ${xic} de ${TOT} xícaras">`;
    // alça e bico
    s += `<path d="M150 70 q45 10 40 70 q-5 50 -40 60" fill="none" stroke="#1b1f2a" stroke-width="12" stroke-linecap="round"/>`;
    s += `<path d="M30 ${topo} l-18 -18 h30 z" fill="#fff" stroke="#1b1f2a" stroke-width="3"/>`;
    for (let i = 0; i < TOT; i++) {
      const y = base - (i + 1) * h, cheiaN = i < xic;
      s += `<rect x="30" y="${y}" width="120" height="${h}" fill="${cheiaN ? '#4a2c12' : '#ffffff'}" stroke="#1b1f2a" stroke-width="1.5" stroke-dasharray="${cheiaN ? '0' : '6 4'}"/>`;
      s += `<text x="90" y="${y + h / 2 + 7}" text-anchor="middle" font-size="18" font-weight="800" fill="${cheiaN ? '#fff' : '#3d4454'}">${cheiaN ? '☕ ' + (i + 1) : 'vazio'}</text>`;
    }
    s += `<rect x="30" y="${topo}" width="120" height="${alt}" fill="none" stroke="#1b1f2a" stroke-width="5" rx="6"/>`;
    s += `<rect x="20" y="${base}" width="140" height="16" rx="6" fill="#56B4E9" stroke="#1b1f2a" stroke-width="3"/>`;
    s += '</svg>';
    $('#jarraSvg').innerHTML = s;
    fracGrande($('#jarraFracao'), xic, TOT, 'a');
    const txt = {
      4: 'A jarra está cheia: 4 xícaras de 4. Escrevemos 4/4.',
      3: 'Sobraram 3 xícaras: a jarra está com 3/4 (três quartos).',
      2: 'Agora está com 2/4 (dois quartos).',
      1: 'Agora 1/4 (um quarto). Temos menos de uma jarra, mas mais que zero: uma fração da jarra.',
      0: 'A jarra está vazia: 0/4. Toque em “Encher a jarra”.'
    };
    $('#jarraTexto').textContent = txt[xic];
    const cup = '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M6 12h26v14a10 10 0 0 1-10 10h-6A10 10 0 0 1 6 26z" fill="#4a2c12" stroke="#1b1f2a" stroke-width="2.5"/><path d="M32 16h4a5 5 0 0 1 0 10h-4" fill="none" stroke="#1b1f2a" stroke-width="3"/></svg>';
    const serv = TOT - xic;
    $('#xicaras').innerHTML = cup.repeat(serv);
    $('#xicaras').setAttribute('aria-label', `${serv} xícara(s) servida(s)`);
    $('#jarraServir').disabled = xic === 0;
  }
  $('#jarraServir').addEventListener('click', () => { if (xic > 0) { xic--; desenhar(); } });
  $('#jarraEncher').addEventListener('click', () => { xic = TOT; desenhar(); });
  desenhar();
})();

/* ===================== 2. Exercício: escrever a fração ===================== */
(function exEscrever() {
  let atual;
  function novo() {
    const d = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const k = rand(1, d - 1);
    const tipo = Math.random() < .5 ? 'pizza' : 'barra';
    atual = { k, d };
    $('#exEscFig').innerHTML = tipo === 'pizza' ? pizzaEstatica(d, k) : barraSVG(d, cheio(k, 'a'), `Barra dividida em ${d} partes, ${k} destacadas`);
    $('#exEscN').value = ''; $('#exEscD').value = ''; $('#exEscFb').innerHTML = '';
  }
  $('#exEscVer').addEventListener('click', () => {
    const r = lerEntrada($('#exEscN'), $('#exEscD')), fb = $('#exEscFb');
    if (!r) return feedback(fb, 'quase', 'Preencha o número de cima e o de baixo.');
    if (r.n === atual.k && r.d === atual.d) feedback(fb, 'ok', `${atual.k}/${atual.d} — “${lerFracao(atual.k, atual.d)}”.`);
    else if (r.n === atual.d && r.d === atual.k) feedback(fb, 'erro', 'Os números estão trocados: o total de partes vai embaixo.');
    else if (r.d !== atual.d) feedback(fb, 'erro', 'Conte em quantas partes iguais a figura está dividida: esse é o denominador (embaixo).');
    else feedback(fb, 'erro', 'O denominador está certo! Agora conte só as partes destacadas (com listras).');
  });
  $('#exEscNovo').addEventListener('click', novo);
  novo();
})();

/* ===================== 3. Tabela, leitor e exercício de leitura ===================== */
(function leitura() {
  const linhas = [[1, 2, ' (ou metade)'], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 20], [1, 100], [1, 1000]];
  $('#tabelaLeitura').innerHTML = linhas.map(([n, d, extra]) => `<tr><td>${fracHTML(n, d)}</td><td>${lerFracao(n, d)}${extra || ''}</td></tr>`).join('');

  const leN = $('#leN'), leD = $('#leD'), saida = $('#leSaida');
  function atualizar() {
    const r = lerEntrada(leN, leD);
    if (!r || r.n < 0 || r.d < 1 || r.n > 1000 || r.d > 1000) { saida.textContent = 'Digite números de 0 a 1000 (denominador a partir de 1).'; return; }
    let t = `“${lerFracao(r.n, r.d)}”`;
    if (r.n > r.d && r.d > 1 && r.n % r.d) t += ` — ou “${lerMisto(Math.floor(r.n / r.d), r.n % r.d, r.d)}”`;
    if (r.n === r.d) t += ' — vale um inteiro!';
    saida.textContent = t;
  }
  leN.addEventListener('input', atualizar); leD.addEventListener('input', atualizar);
  atualizar();

  let atual;
  function novo() {
    const d = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 100]);
    const n = rand(1, Math.min(d - 1, 19));
    atual = { n, d };
    $('#exLerTexto').textContent = `“${lerFracao(n, d)}”`;
    $('#exLerN').value = ''; $('#exLerD').value = ''; $('#exLerFb').innerHTML = '';
  }
  $('#exLerVer').addEventListener('click', () => {
    const r = lerEntrada($('#exLerN'), $('#exLerD')), fb = $('#exLerFb');
    if (!r) return feedback(fb, 'quase', 'Preencha os dois números.');
    if (r.n === atual.n && r.d === atual.d) feedback(fb, 'ok', `“${lerFracao(atual.n, atual.d)}” se escreve ${atual.n}/${atual.d}.`);
    else if (r.n === atual.d && r.d === atual.n) feedback(fb, 'erro', 'Números trocados: o nome da parte (terço, quarto, avos…) é o denominador, embaixo.');
    else feedback(fb, 'erro', 'Dica: a primeira palavra é o numerador (em cima); a segunda diz em quantas partes o inteiro foi dividido.');
  });
  $('#exLerNovo').addEventListener('click', novo);
  novo();
})();

/* ===================== 9. Montando a conta (estático) ===================== */
$('#montarConta').innerHTML = `${fracHTML(3, 5, 'a')}<span class="op" aria-label="mais">+</span>${fracHTML(1, 5, 'b')}<span class="op">=</span>${fracHTML(4, 5, 'r')}`;

/* ===================== 10–11. Passo a passo de soma/subtração ===================== */
/* Gera a lista de passos (título + HTML) para A op B */
function gerarPassos(an, ad, bn, bd, op) {
  const P = [];
  const sinal = op === '+' ? '+' : '−';
  const verbo = op === '+' ? 'somar' : 'subtrair';
  P.push({
    t: 'Montar a conta',
    h: `<div class="eq">${fracHTML(an, ad, 'a')} ${sinal} ${fracHTML(bn, bd, 'b')}</div>
        <div class="barras">${linhaBarra(an, ad, cheio(an, 'a'), 'a')}${linhaBarra(bn, bd, cheio(bn, 'b'), 'b')}</div>`
  });
  if (op === '-' && an * bd < bn * ad) {
    P.push({ t: 'Atenção', h: `<p class="aviso">✗ A fração B é maior que A, então o resultado seria negativo. Nesta lição só tiramos uma parte menor de uma maior: troque as frações ou diminua B.</p>` });
    return P;
  }
  let L = ad, n1 = an, n2 = bn;
  if (ad !== bd) {
    L = mmc(ad, bd);
    const mult = (d) => { const m = []; for (let k = d; k <= L; k += d) m.push(k); return m; };
    const fmt = (arr) => arr.map(v => v === L ? `<span class="mmc">${v}</span>` : v).join(', ');
    P.push({
      t: 'Encontrar o menor denominador comum (MMC)',
      h: `<p>Os denominadores são diferentes (${ad} e ${bd}). Não dá para ${verbo} ainda! Procuramos o menor número que pode ser dividido por ${ad} e por ${bd}:</p>
          <p class="multiplos"><strong>Múltiplos de ${ad}:</strong> ${fmt(mult(ad))}${L === ad ? '' : ''}</p>
          <p class="multiplos"><strong>Múltiplos de ${bd}:</strong> ${fmt(mult(bd))}</p>
          <p>O MMC é <strong>${L}</strong> (marcado com caixa). Ele será o novo denominador.</p>`
    });
    const fa = L / ad, fb = L / bd;
    n1 = an * fa; n2 = bn * fb;
    P.push({
      t: 'Transformar as frações',
      h: `<p>Multiplicamos o numerador pelo mesmo número que usamos no denominador (assim o valor não muda):</p>
          <div class="eq">${fracHTML(an, ad, 'a')} <span>→ ×${fa} →</span> ${fracHTML(n1, L, 'a')}</div>
          <p class="nota">${ad} × ${fa} = ${L} &nbsp;e&nbsp; ${an} × ${fa} = ${n1}</p>
          <div class="eq">${fracHTML(bn, bd, 'b')} <span>→ ×${fb} →</span> ${fracHTML(n2, L, 'b')}</div>
          <p class="nota">${bd} × ${fb} = ${L} &nbsp;e&nbsp; ${bn} × ${fb} = ${n2}</p>
          <div class="barras">
            ${linhaBarra(an, ad, cheio(an, 'a'), 'a')}${linhaBarra(n1, L, cheio(n1, 'a'), 'a', `${lerFracao(n1, L)}, mesmo tamanho que ${lerFracao(an, ad)}`)}
            ${linhaBarra(bn, bd, cheio(bn, 'b'), 'b')}${linhaBarra(n2, L, cheio(n2, 'b'), 'b', `${lerFracao(n2, L)}, mesmo tamanho que ${lerFracao(bn, bd)}`)}
          </div>
          <p>As barras têm o mesmo tamanho: só foram cortadas em mais pedaços.</p>`
    });
  }
  const rn = op === '+' ? n1 + n2 : n1 - n2;
  const fillsRes = op === '+' ? [...cheio(n1, 'a'), ...cheio(n2, 'b')] : [...cheio(rn, 'r'), ...cheio(n2, 'x')];
  P.push({
    t: op === '+' ? 'Somar os numeradores' : 'Subtrair os numeradores',
    h: `<p>${op === '+' ? 'Somamos' : 'Subtraímos'} só os números de cima: ${n1} ${sinal} ${n2} = <strong>${rn}</strong>. O denominador <strong>continua ${L}</strong>, porque o inteiro continua dividido em ${L} partes.</p>
        <div class="eq">${fracHTML(n1, L, 'a')} ${sinal} ${fracHTML(n2, L, 'b')} = ${valorHTML(rn, L)}</div>
        <div class="barras">${linhaBarra(rn, L, fillsRes, 'r', op === '+' ? `${n1} partes listradas mais ${n2} partes pontilhadas, total ${rn} de ${L}` : `${n1} partes, das quais ${n2} foram retiradas (marcadas com X); sobram ${rn}`)}</div>
        ${op === '-' ? '<p class="nota">As partes marcadas com ╳ foram retiradas.</p>' : ''}`
  });
  const g = mdc(rn, L);
  if (rn === 0) {
    P.push({ t: 'Resultado', h: `<p>Resultado: <strong>0</strong> — não sobrou nada.</p>` });
  } else if (g > 1) {
    const sn = rn / g, sd = L / g;
    P.push({
      t: 'Simplificar o resultado',
      h: `<p>${rn} e ${L} podem ser divididos por <strong>${g}</strong> (o MDC). Dividimos os dois:</p>
          <div class="eq">${fracHTML(rn, L, 'r')} <span>→ ÷${g} →</span> ${valorHTML(sn, sd)}</div>
          <div class="barras">${linhaBarra(rn, L, cheio(rn, 'r'), 'r')}${linhaBarra(sn, sd, cheio(sn, 'r'), 'r')}</div>
          <p><strong>Resposta:</strong> ${fracHTML(an, ad, 'a')} ${sinal} ${fracHTML(bn, bd, 'b')} = ${valorHTML(sn, sd)}</p>`
    });
  } else {
    P.push({
      t: 'Resposta',
      h: `<p>${rn} e ${L} não têm divisor comum além de 1: a fração já está na forma mais simples (irredutível).</p>
          <p><strong>Resposta:</strong> ${fracHTML(an, ad, 'a')} ${sinal} ${fracHTML(bn, bd, 'b')} = ${valorHTML(rn, L)}</p>`
    });
  }
  return P;
}
function passosHTML(P, ate) {
  return P.slice(0, ate).map((p, i) => `<div class="passo"><h4><span class="passo-n">${i + 1}</span>${p.t}</h4>${p.h}</div>`).join('');
}

(function calculadora() {
  const st = { an: 1, ad: 4, bn: 1, bd: 3, op: '+' };
  let passos = [], mostrados = 1;
  const LIM = { n: [0, 12], d: [1, 12] };
  const EXEMPLOS = [
    ['🎂 Óleo: 3/5 + 1/5', 3, 5, 1, 5, '+'], ['7/10 + 2/10', 7, 10, 2, 10, '+'],
    ['⛽ Gasolina: 3/4 − 1/4', 3, 4, 1, 4, '-'], ['5/6 − 3/6', 5, 6, 3, 6, '-'],
    ['1/4 + 1/4', 1, 4, 1, 4, '+'], ['🥛 Leite: 1/4 + 1/3', 1, 4, 1, 3, '+'], ['3/5 − 1/3', 3, 5, 1, 3, '-']
  ];
  const caixa = $('#exemplosBtns');
  EXEMPLOS.forEach(([rot, an, ad, bn, bd, op]) => {
    const b = document.createElement('button'); b.textContent = rot;
    b.addEventListener('click', () => { Object.assign(st, { an, ad, bn, bd, op }); atualizar(true); $('#calcPassos').scrollIntoView({ block: 'nearest' }); });
    caixa.appendChild(b);
  });
  $$('.stepper button', $('#calc')).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.alvo, lim = LIM[k[1]];
    st[k] = Math.min(lim[1], Math.max(lim[0], st[k] + Number(b.dataset.d)));
    atualizar(false);
  }));
  const setOp = op => { st.op = op; atualizar(false); };
  $('#opMais').addEventListener('click', () => setOp('+'));
  $('#opMenos').addEventListener('click', () => setOp('-'));

  function render() {
    $('#calcPassos').innerHTML = passosHTML(passos, mostrados);
    $('#passoProx').disabled = mostrados >= passos.length;
    $('#passoTudo').disabled = mostrados >= passos.length;
  }
  function atualizar(tudo) {
    ['an', 'ad', 'bn', 'bd'].forEach(k => { $('#' + k).textContent = st[k]; });
    $('#opMais').setAttribute('aria-checked', st.op === '+');
    $('#opMenos').setAttribute('aria-checked', st.op === '-');
    passos = gerarPassos(st.an, st.ad, st.bn, st.bd, st.op);
    mostrados = tudo ? passos.length : 1;
    render();
  }
  $('#passoProx').addEventListener('click', () => { mostrados++; render(); $$('.passo').at(-1)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  $('#passoTudo').addEventListener('click', () => { mostrados = passos.length; render(); });
  $('#passoReini').addEventListener('click', () => { mostrados = 1; render(); });
  atualizar(false);
})();

/* ===================== 12. Exercício de soma e subtração ===================== */
(function exSoma() {
  let nivel = 1, atual, ok = 0, tot = 0, respondido = false;
  const DENS = [2, 3, 4, 5, 6, 8, 10, 12];
  function gerar() {
    const nv = nivel === 3 ? rand(1, 2) : nivel;
    const op = Math.random() < .5 ? '+' : '-';
    let ad, bd;
    if (nv === 1) { ad = bd = rand(3, 12); }
    else { do { ad = pick(DENS); bd = pick(DENS); } while (ad === bd || mmc(ad, bd) > 24); }
    let an, bn;
    do { an = rand(1, ad - 1); bn = rand(1, bd - 1); }
    while (op === '-' && an * bd <= bn * ad);  // na subtração, A precisa ser maior que B
    return { an, ad, bn, bd, op };
  }
  function novo() {
    atual = gerar(); respondido = false;
    const s = atual.op === '+' ? '+' : '−';
    $('#exSomaConta').innerHTML = `${fracHTML(atual.an, atual.ad, 'a')}<span class="op" aria-label="${atual.op === '+' ? 'mais' : 'menos'}">${s}</span>${fracHTML(atual.bn, atual.bd, 'b')}<span class="op">=</span><span class="op" aria-label="quanto?">?</span>`;
    $('#exSomaN').value = ''; $('#exSomaD').value = '';
    $('#exSomaFb').innerHTML = ''; $('#exSomaSol').hidden = true; $('#exSomaSol').innerHTML = '';
  }
  function resposta() {
    const { an, ad, bn, bd, op } = atual;
    const L = mmc(ad, bd), n = op === '+' ? an * (L / ad) + bn * (L / bd) : an * (L / ad) - bn * (L / bd);
    const g = mdc(n, L);
    return { n, d: L, sn: n / g, sd: L / g };
  }
  function placar() { $('#placarOk').textContent = ok; $('#placarTot').textContent = tot; }
  $('#exSomaVer').addEventListener('click', () => {
    const r = lerEntrada($('#exSomaN'), $('#exSomaD')), fb = $('#exSomaFb');
    if (!r || r.d <= 0) return feedback(fb, 'quase', 'Preencha o numerador e o denominador (o denominador não pode ser zero).');
    const c = resposta(), { an, ad, bn, bd, op } = atual;
    const igual = r.n * c.sd === c.sn * r.d;
    const primeira = !respondido; respondido = true;
    if (igual && r.n === c.sn && r.d === c.sd) {
      if (primeira) { ok++; tot++; } placar();
      feedback(fb, 'ok', `${fracHTML(an, ad, 'a')} ${op === '+' ? '+' : '−'} ${fracHTML(bn, bd, 'b')} = ${valorHTML(c.sn, c.sd)}. Muito bem!`);
    } else if (igual) {
      respondido = primeira ? false : respondido;
      feedback(fb, 'quase', `O valor está certo, mas dá para simplificar ${fracHTML(r.n, r.d)}. Divida em cima e embaixo por ${mdc(r.n, r.d)}.`);
    } else {
      if (primeira) tot++; placar();
      let dica = 'Confira a conta ou toque em “Ver solução”.';
      if (op === '+' && r.n === an + bn && r.d === ad + bd) dica = 'Atenção: <strong>não somamos os denominadores</strong>! Eles mostram em quantas partes o inteiro está dividido.';
      else if (op === '-' && r.n === an - bn && r.d === ad - bd) dica = 'Atenção: <strong>não subtraímos os denominadores</strong>!';
      else if (ad !== bd && (r.n === (op === '+' ? an + bn : an - bn))) dica = 'Os denominadores são diferentes: primeiro encontre o MMC e transforme as frações.';
      feedback(fb, 'erro', dica);
    }
  });
  $('#exSomaDica').addEventListener('click', () => {
    const sol = $('#exSomaSol'), { an, ad, bn, bd, op } = atual;
    const P = gerarPassos(an, ad, bn, bd, op);
    sol.innerHTML = `<div class="passos">${passosHTML(P, P.length)}</div>`;
    sol.hidden = false;
    if (!respondido) { respondido = true; tot++; placar(); }
  });
  $('#exSomaNovo').addEventListener('click', novo);
  $$('.niveis button').forEach(b => b.addEventListener('click', () => {
    nivel = Number(b.dataset.nivel);
    $$('.niveis button').forEach(x => x.setAttribute('aria-checked', x === b));
    novo();
  }));
  [$('#exSomaN'), $('#exSomaD')].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') $('#exSomaVer').click(); }));
  novo();
})();

// Enter nos campos dos outros exercícios
[['#exEscN', '#exEscVer'], ['#exEscD', '#exEscVer'], ['#exLerN', '#exLerVer'], ['#exLerD', '#exLerVer']].forEach(([i, b]) =>
  $(i).addEventListener('keydown', e => { if (e.key === 'Enter') $(b).click(); }));
