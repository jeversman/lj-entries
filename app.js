var LiveJournal = require('livejournal');
var writeFile = require('write');
var fs = require('fs');

var settings = require('./settings.js');

const russianSymbols = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const englishSymbols = 'abcdefghijklmnopqrstuvwxyz';

const username = settings.username;
const password = settings.password;

const engKey = settings.engKey;
const rusKey = settings.rusKey;



main();

function main() {
  getEntries();
  // encodeEntries();
  // test();
}

function test() {
  console.log(decode('abcde abcde;'));
}

function write(fileName, name, date, text) {
  text = `${name}\r\n${date}\r\n\r\n${engKey}${rusKey}\r\n&&&&&${text}`;

  writeFile('1/' + fileName + '.rtf', text)
  .then(() => {
    console.log('success')
  })
  .catch(() => {
    console.log('fail')
  })
}

function handleEntry(entry) {
  console.log('ENTRY', entry);
  write(entry.events[0].itemid, entry.events[0].subject, entry.events[0].eventtime, encode(clear(entry.events[0].event)));
}

function getEntries() {

  let entries = []

  const ids = [91, 92]

  ids.forEach(id => {
    LiveJournal.xmlrpc.getevents({
      journal: '',
      username: username,
      auth_method: 'clear',
      password: password,
      selecttype: 'one',
      itemid: id
    }, function(err, value) {
      handleEntry(value);
    });
  });
}

function clear(text) {
  let newText = text.replace(/<p>/g, '\r\n').replace(/<\/p>/g, '')
  return newText;
}

// CRYPTO ---------------------------------------

function encodeEntries() {
  const names = []; // Имена файлов для расшифровки. Пример: [91, 92, .....]

  names.forEach(name => {
    fs.readFile(`1/${name}.rtf`, 'utf-8', (err, data) => {

      let info = data.substr(0, data.indexOf('&&&&&'));
      let text = data.substr(data.indexOf('&&&&&') + 5, data.length);
      let decodedText = decode(text);

      writeFile('decoded/' + name + '.rtf', info + decodedText)
      .then(() => {
        console.log('success')
      })
      .catch(() => {
        console.log('fail')
      })
    });
  })

}

function encode(text) {
  let encodedText = '';
  for(let i in text) {
    encodedText += encodeSymbol(text[i], i);
  }
  return encodedText;
}

function encodeSymbol(s, sI) {
  if (russianSymbols.indexOf(s) !== -1) {
    let i = russianSymbols.indexOf(s);
    let keyI = russianSymbols.indexOf(rusKey[sI % rusKey.length]);
    return russianSymbols[(i + keyI) % russianSymbols.length]
  }

  if (englishSymbols.indexOf(s) !== -1) {
    let i = englishSymbols.indexOf(s);
    let keyI = englishSymbols.indexOf(engKey[sI % engKey.length]);
    return englishSymbols[(i + keyI) % englishSymbols.length]
  }

  return s;
}

function decode(text) {
  let decodedText = '';
  for(let i in text) {
    decodedText += decodeSymbol(text[i], i);
  }
  return decodedText;
}

function decodeSymbol(s, sI) {
  if (russianSymbols.indexOf(s) !== -1) {
    let i = russianSymbols.indexOf(s);
    let keyI = russianSymbols.indexOf(rusKey[sI % rusKey.length]);
    return russianSymbols[(russianSymbols.length + i - keyI) % russianSymbols.length];
  }

  if (englishSymbols.indexOf(s) !== -1) {
    let i = englishSymbols.indexOf(s);
    let keyI = englishSymbols.indexOf(engKey[sI % engKey.length]);

    // console.log(i, keyI, englishSymbols.length + i - keyI);

    return englishSymbols[(englishSymbols.length + i - keyI) % englishSymbols.length]
  }

  return s;
}
