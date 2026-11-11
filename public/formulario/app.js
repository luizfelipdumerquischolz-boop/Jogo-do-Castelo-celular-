// Monta o formulário a partir de perguntas.js e envia as respostas para a planilha.
// Se a internet cair, a resposta fica numa fila no aparelho e é reenviada depois.
(function () {
  'use strict';

  const CHAVE_FILA = 'jardim-formulario-fila';
  const config = window.FORMULARIO_CONFIG || {};
  const urlPlanilha = (config.urlPlanilha || '').trim();
  const versao = document.body.dataset.versao;
  const form = window.FORMULARIOS[versao];
  const raiz = document.getElementById('formulario');

  // ---------- fila local (respostas ainda não enviadas) ----------
  function lerFila() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_FILA) || '[]');
    } catch {
      return [];
    }
  }
  function gravarFila(fila) {
    try {
      localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
      return true;
    } catch {
      return false;
    }
  }

  async function enviar(registro) {
    if (!urlPlanilha) throw new Error('sem-endereco');
    // text/plain evita a verificação prévia (CORS) e é aceito pelo Apps Script.
    const resp = await fetch(urlPlanilha, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(registro),
    });
    if (!resp.ok) throw new Error('http-' + resp.status);
    const json = await resp.json().catch(() => ({}));
    if (!json.ok) throw new Error(json.erro || 'resposta-invalida');
  }

  let esvaziando = false;
  async function esvaziarFila() {
    if (esvaziando || !urlPlanilha) return;
    esvaziando = true;
    try {
      let fila = lerFila();
      while (fila.length) {
        try {
          await enviar(fila[0]);
        } catch {
          break;
        }
        fila = lerFila().filter((r) => r.id !== fila[0].id);
        gravarFila(fila);
      }
    } finally {
      esvaziando = false;
      mostrarPendentes();
    }
  }

  function mostrarPendentes() {
    const el = document.getElementById('pendentes');
    if (!el) return;
    const n = lerFila().length;
    if (!urlPlanilha) {
      el.hidden = false;
      el.textContent =
        'Modo de teste: a planilha ainda não foi ligada (veja LEIA-ME.md). ' +
        (n ? `${n} resposta(s) guardada(s) neste aparelho.` : 'As respostas ficam guardadas neste aparelho.');
    } else if (n) {
      el.hidden = false;
      el.textContent = `${n} resposta(s) esperando internet para ir para a planilha. Não limpe os dados do navegador.`;
    } else {
      el.hidden = true;
    }
  }

  // ---------- montagem do formulário ----------
  function el(tag, attrs, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    for (const f of filhos) if (f) e.append(f);
    return e;
  }

  const CARAS = {
    feliz: '<path d="M14 28 Q24 38 34 28" />',
    neutra: '<line x1="15" y1="31" x2="33" y2="31" />',
    triste: '<path d="M15 34 Q24 25 33 34" />',
  };
  function carinha(i, total) {
    const tipo = i === 0 ? 'feliz' : i === total - 1 ? 'triste' : 'neutra';
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" />' +
      '<circle class="olho" cx="17" cy="18" r="2.2" /><circle class="olho" cx="31" cy="18" r="2.2" />' +
      CARAS[tipo] +
      '</svg>'
    );
  }

  let numero = 0;
  function montarPergunta(p) {
    const caixa = el('fieldset', { class: 'pergunta tipo-' + p.tipo, 'data-id': p.id });
    const legenda = el('legend');
    if (p.tipo !== 'texto') numero += 1;
    const num = p.tipo === 'texto' ? '' : numero + '. ';
    legenda.append(el('span', { class: 'enunciado', text: num + p.texto }));
    if (p.tipo === 'uma') legenda.append(el('span', { class: 'dica', text: 'Marque só uma bolinha' }));
    if (p.tipo === 'varias') legenda.append(el('span', { class: 'dica', text: 'Pode marcar mais de um quadradinho' }));
    caixa.append(legenda);

    if (p.tipo === 'texto') {
      const ta = el('textarea', { name: p.id, rows: '3', maxlength: '1000', 'aria-label': p.texto });
      caixa.append(ta);
      return caixa;
    }

    const lista = el('div', { class: 'opcoes' });
    p.opcoes.forEach((op, i) => {
      const inputId = `${p.id}_${i}`;
      const input = el('input', {
        type: p.tipo === 'varias' ? 'checkbox' : 'radio',
        name: p.id,
        value: op,
        id: inputId,
      });
      const rotulo = el('label', { for: inputId, class: 'opcao' });
      rotulo.append(input);
      if (p.tipo === 'carinha') {
        const face = el('span', { class: 'face' });
        face.innerHTML = carinha(i, p.opcoes.length);
        rotulo.append(face);
      } else {
        rotulo.append(el('span', { class: 'marca', 'aria-hidden': 'true' }));
      }
      rotulo.append(el('span', { class: 'rotulo', text: op }));
      lista.append(rotulo);
    });

    if (p.exclusiva) {
      lista.addEventListener('change', (ev) => {
        const alvo = ev.target;
        if (!alvo.checked) return;
        lista.querySelectorAll('input').forEach((inp) => {
          if (inp === alvo) return;
          if (alvo.value === p.exclusiva || inp.value === p.exclusiva) inp.checked = false;
        });
      });
    }
    caixa.append(lista);
    return caixa;
  }

  function montar() {
    document.title = form.titulo + (versao === 'carinhas' ? ' (carinhas)' : '');
    document.getElementById('titulo').textContent = form.titulo;
    document.getElementById('subtitulo').textContent = form.subtitulo;
    document.getElementById('intro').textContent = form.intro;
    document.getElementById('agradecimento').textContent = form.fim;

    const corpo = document.getElementById('perguntas');
    for (const parte of form.partes) {
      const sec = el('section', { class: 'parte' });
      if (parte.titulo) sec.append(el('h2', { text: parte.titulo }));
      if (parte.nota) sec.append(el('p', { class: 'nota', text: parte.nota }));
      for (const p of parte.perguntas) sec.append(montarPergunta(p));
      corpo.append(sec);
    }
  }

  function todasPerguntas() {
    return form.partes.flatMap((pt) => pt.perguntas);
  }

  function coletar() {
    const dados = new FormData(raiz);
    const respostas = {};
    for (const p of todasPerguntas()) {
      if (p.tipo === 'varias') respostas[p.id] = dados.getAll(p.id).join('; ');
      else respostas[p.id] = String(dados.get(p.id) || '').trim();
    }
    return respostas;
  }

  function semResposta(respostas) {
    return todasPerguntas().filter((p) => !p.opcional && !respostas[p.id]);
  }

  // ---------- envio ----------
  let avisouFaltando = false;
  raiz.addEventListener('change', () => {
    raiz.querySelectorAll('.faltando').forEach((f) => {
      const id = f.dataset.id;
      if (raiz.querySelector(`[name="${id}"]:checked`)) f.classList.remove('faltando');
    });
  });

  raiz.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const respostas = coletar();
    const faltando = semResposta(respostas);
    const aviso = document.getElementById('aviso');

    raiz.querySelectorAll('.faltando').forEach((f) => f.classList.remove('faltando'));
    if (faltando.length && !avisouFaltando) {
      faltando.forEach((p) => raiz.querySelector(`[data-id="${p.id}"]`).classList.add('faltando'));
      aviso.hidden = false;
      aviso.textContent =
        faltando.length === 1
          ? 'Ficou uma pergunta sem resposta (marcada em amarelo). Se quiser, responda. Ou toque em “Enviar” de novo para mandar assim mesmo.'
          : `Ficaram ${faltando.length} perguntas sem resposta (marcadas em amarelo). Se quiser, responda. Ou toque em “Enviar” de novo para mandar assim mesmo.`;
      avisouFaltando = true;
      raiz.querySelector(`[data-id="${faltando[0].id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const botao = document.getElementById('enviar');
    botao.disabled = true;
    botao.textContent = 'Enviando...';

    const registro = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2),
      versao,
      aba: form.aba,
      enviadoEm: new Date().toISOString(),
      respostas,
    };

    let enviado = false;
    try {
      await enviar(registro);
      enviado = true;
    } catch {
      const fila = lerFila();
      fila.push(registro);
      if (!gravarFila(fila)) {
        botao.disabled = false;
        botao.textContent = 'Enviar respostas';
        aviso.hidden = false;
        aviso.textContent = 'Não foi possível enviar agora. Verifique a internet e toque em “Enviar” de novo.';
        return;
      }
    }

    document.getElementById('obs-envio').textContent = enviado
      ? ''
      : urlPlanilha
        ? 'Sem internet agora: a resposta ficou guardada neste aparelho e vai ser enviada sozinha depois.'
        : '';
    raiz.hidden = true;
    document.getElementById('pronto').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mostrarPendentes();
  });

  document.getElementById('de-novo').addEventListener('click', () => {
    raiz.reset();
    raiz.querySelectorAll('.faltando').forEach((f) => f.classList.remove('faltando'));
    avisouFaltando = false;
    document.getElementById('aviso').hidden = true;
    const botao = document.getElementById('enviar');
    botao.disabled = false;
    botao.textContent = 'Enviar respostas';
    document.getElementById('pronto').hidden = true;
    raiz.hidden = false;
    window.scrollTo({ top: 0 });
    esvaziarFila();
  });

  montar();
  mostrarPendentes();
  esvaziarFila();
  window.addEventListener('online', esvaziarFila);
  setInterval(esvaziarFila, 60000);
})();
