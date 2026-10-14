// Atualiza o DOM para ficar igual ao HTML novo, preservando elementos iguais
// (um botão não é recriado no meio de um toque; um campo em foco não perde o texto).

function sameNode(a: Node, b: Node): boolean {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== Node.ELEMENT_NODE) return true;
  const ea = a as Element;
  const eb = b as Element;
  return ea.tagName === eb.tagName && ea.getAttribute('data-key') === eb.getAttribute('data-key');
}

function syncAttributes(from: Element, to: Element): void {
  const focused = from === document.activeElement;
  for (const attr of Array.from(from.attributes)) {
    if (!to.hasAttribute(attr.name)) from.removeAttribute(attr.name);
  }
  for (const attr of Array.from(to.attributes)) {
    if (focused && attr.name === 'value') continue;
    if (from.getAttribute(attr.name) !== attr.value) from.setAttribute(attr.name, attr.value);
  }
  if (!focused && (from as HTMLInputElement).value !== undefined && to.hasAttribute('value') && from.tagName === 'INPUT') {
    const v = to.getAttribute('value') ?? '';
    if ((from as HTMLInputElement).value !== v && !from.hasAttribute('data-keep')) (from as HTMLInputElement).value = v;
  }
}

function morphChildren(from: Node, to: Node): void {
  const target = Array.from(to.childNodes);
  for (let i = 0; i < target.length; i++) {
    const want = target[i];
    const have = from.childNodes[i];
    if (!have) from.appendChild(want.cloneNode(true));
    else if (!sameNode(have, want)) from.replaceChild(want.cloneNode(true), have);
    else if (have.nodeType === Node.ELEMENT_NODE) {
      syncAttributes(have as Element, want as Element);
      morphChildren(have, want);
    } else if (have.nodeValue !== want.nodeValue) have.nodeValue = want.nodeValue;
  }
  while (from.childNodes.length > target.length) from.removeChild(from.lastChild!);
}

const template = document.createElement('template');

export function morph(container: Element, html: string): void {
  template.innerHTML = html;
  morphChildren(container, template.content);
}

export const esc = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function $(sel: string): HTMLElement {
  return document.querySelector(sel) as HTMLElement;
}
