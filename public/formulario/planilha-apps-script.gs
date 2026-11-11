/**
 * Banco de dados do formulário "Minha escola: um jardim de possibilidades".
 *
 * Cole este código em https://script.new e publique como "App da Web"
 * (passo a passo em LEIA-ME.md). As respostas vão para a planilha abaixo.
 *
 * Cada resposta vira uma linha. A versão completa e a versão com carinhas
 * ficam em abas separadas. Respostas repetidas (mesmo ID) são ignoradas,
 * então um reenvio depois de uma queda de internet não duplica nada.
 */

// Planilha "Respostas – Minha escola: um jardim de possibilidades" no Google Drive.
var ID_PLANILHA = '1XYREX8VbYhJFDUv93jLbveAzc7nKN0jmxi9tutEh2Dk';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var dados = JSON.parse(e.postData.contents);
    if (!dados || !dados.id || !dados.respostas) return resposta({ ok: false, erro: 'dados-invalidos' });

    var abaNome = String(dados.aba || dados.versao || 'Respostas').slice(0, 60);
    var planilha = SpreadsheetApp.openById(ID_PLANILHA);
    var aba = planilha.getSheetByName(abaNome) || planilha.insertSheet(abaNome);

    var chaves = Object.keys(dados.respostas);
    var cabecalho;
    if (aba.getLastRow() === 0) {
      cabecalho = ['Data e hora', 'ID'].concat(chaves);
      aba.appendRow(cabecalho);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#eaf4ea');
    } else {
      cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
      // Pergunta nova no formulário? Ganha uma coluna nova no fim.
      chaves.forEach(function (c) {
        if (cabecalho.indexOf(c) === -1) {
          cabecalho.push(c);
          aba.getRange(1, cabecalho.length).setValue(c).setFontWeight('bold').setBackground('#eaf4ea');
        }
      });
      // Já recebida? Não grava de novo.
      if (aba.getLastRow() > 1) {
        var ids = aba.getRange(2, 2, aba.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (ids[i][0] === dados.id) return resposta({ ok: true, repetida: true });
        }
      }
    }

    var quando = dados.enviadoEm ? new Date(dados.enviadoEm) : new Date();
    if (isNaN(quando.getTime())) quando = new Date();
    var linha = cabecalho.map(function (col, idx) {
      if (idx === 0) return quando;
      if (idx === 1) return dados.id;
      var v = dados.respostas[col];
      v = v === undefined || v === null ? '' : String(v).slice(0, 2000);
      // Evita que um texto começando com = + - @ vire fórmula.
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    aba.appendRow(linha);
    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return resposta({ ok: true, mensagem: 'Banco de dados do formulário funcionando.' });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
