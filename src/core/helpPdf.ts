// src/core/helpPdf.ts

import { HELP_CONTENT, type HelpBlock, type HelpSection } from '../data/helpContent';

/**
 * Генерация HTML-инструкции Kapital Garden.
 *
 * Два варианта:
 *   1. openPrintableInstructions() — открыть окно с window.print() → PDF
 *   2. downloadInstructionsHTML() — скачать HTML-файл
 */

function buildHTML(): string {
  const styles = `
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #0c1426;
        background: #ffffff;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      .page {
        padding: 30px 40px;
        max-width: 800px;
        margin: 0 auto;
      }
      .title-page {
        text-align: center;
        padding-top: 200px;
        min-height: 90vh;
      }
      .title-page h1 {
        font-size: 48px;
        margin-bottom: 20px;
        color: #0c1426;
      }
      .title-page p {
        font-size: 18px;
        color: #64748b;
        margin-bottom: 10px;
      }
      .title-page .version {
        margin-top: 80px;
        font-size: 14px;
        color: #94a3b8;
      }
      .section { page-break-before: always; }
      .section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-bottom: 16px;
        border-bottom: 3px solid #22c55e;
        margin-bottom: 24px;
      }
      .section-icon { font-size: 40px; line-height: 1; }
      .section-titles h2 { font-size: 26px; margin: 0; color: #0c1426; }
      .section-titles p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
      .block { margin-bottom: 16px; }
      .block-paragraph { font-size: 14px; color: #334155; line-height: 1.65; }
      .block-list, .block-steps { padding-left: 24px; margin: 0; }
      .block-list li, .block-steps li { margin-bottom: 8px; color: #334155; line-height: 1.6; }
      .block-warning {
        padding: 12px 16px;
        border-left: 4px solid #ef4444;
        background: rgba(239,68,68,0.08);
        border-radius: 8px;
        color: #334155;
      }
      .block-tip {
        padding: 12px 16px;
        border-left: 4px solid #22c55e;
        background: rgba(34,197,94,0.08);
        border-radius: 8px;
        color: #334155;
      }
      .block-status {
        display: flex;
        gap: 16px;
        padding: 12px 16px;
        border-left: 4px solid #ccc;
        background: #f8fafc;
        border-radius: 8px;
      }
      .block-status-label {
        font-weight: 700;
        font-size: 14px;
        min-width: 140px;
        color: #0c1426;
      }
      .block-status-desc { font-size: 13px; color: #64748b; }
      @media print {
        .page { padding: 10mm 15mm; max-width: none; }
      }
    </style>
  `;

  const titlePage = `
    <div class="page title-page">
      <h1>🌳 Kapital Garden</h1>
      <p>Инструкция пользователя</p>
      <p>Каждая отложенная копейка — семя твоего будущего.</p>
      <div class="version">
        Версия 1.5 · ${new Date().toLocaleDateString('ru-RU')}<br/>
        ${HELP_CONTENT.length} разделов
      </div>
    </div>
  `;

  const sectionsHTML = HELP_CONTENT.map((s) => renderSection(s)).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Инструкция — Kapital Garden</title>
  ${styles}
</head>
<body>
  ${titlePage}
  ${sectionsHTML}
</body>
</html>`;
}

function renderSection(section: HelpSection): string {
  const blocksHTML = section.blocks.map((b) => renderBlock(b)).join('');

  return `
    <div class="page section">
      <div class="section-header">
        <div class="section-icon">${section.icon}</div>
        <div class="section-titles">
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.subtitle)}</p>
        </div>
      </div>
      ${blocksHTML}
    </div>
  `;
}

function renderBlock(block: HelpBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<div class="block block-paragraph">${escapeHtml(block.text)}</div>`;
    case 'list':
      return `<ul class="block block-list">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    case 'steps':
      return `<ol class="block block-steps">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
    case 'warning':
      return `<div class="block block-warning">⚠️ ${escapeHtml(block.text)}</div>`;
    case 'tip':
      return `<div class="block block-tip">💡 ${escapeHtml(block.text)}</div>`;
    case 'statusRow':
      return `
        <div class="block block-status" style="border-left-color: ${block.color}">
          <div class="block-status-label">${escapeHtml(block.label)}</div>
          <div class="block-status-desc">${escapeHtml(block.description)}</div>
        </div>
      `;
    default:
      return '';
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function openPrintableInstructions(): void {
  const html = buildHTML();
  const win = window.open('', '_blank');
  if (!win) {
    alert('Не удалось открыть окно печати. Проверь блокировку всплывающих окон.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };
}

export function downloadInstructionsHTML(): void {
  const html = buildHTML();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kapital-garden-instructions-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}