const textInput = document.getElementById('textInput');
const checkButton = document.getElementById('checkButton');
const resultDiv = document.getElementById('result');
const fileInput = document.getElementById('fileInput');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker зарегистрирован с областью:', registration.scope);
      })
      .catch(error => {
        console.log('Ошибка при регистрации Service Worker:', error);
      });
  });
}

// Обработка выбора файла
fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  if (file.name.endsWith('.txt')) {
    reader.onload = function (e) {
      textInput.value = e.target.result;
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.docx')) {
    reader.onload = function (e) {
      mammoth.extractRawText({ arrayBuffer: e.target.result })
        .then(function (result) {
          textInput.value = result.value;
        })
        .catch(function (err) {
          console.log(err);
          alert('Ошибка при чтении .docx файла');
        });
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Пожалуйста, выберите .txt или .docx файл');
  }
}

// Обработка клика "Проверить текст"
checkButton.addEventListener('click', () => {
  const text = textInput.value;
  if (text.trim() === '') {
    alert('Введите текст для проверки');
    return;
  }

  fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text: text,
      language: 'ru',
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.matches.length === 0) {
        resultDiv.innerHTML = '<p>Ошибок не найдено!</p>';
        return;
      }

      let correctedText = text;
      const matchesSorted = data.matches.sort((a, b) => b.offset - a.offset);

      matchesSorted.forEach(match => {
        const offset = match.offset;
        const length = match.length;
        const originalWord = correctedText.substr(offset, length);

        // Фильтруем "похожие" исправления (длина разницы не более 3 символов)
        const replacement = match.replacements.find(rep => Math.abs(rep.value.length - originalWord.length) <= 3);

        // Если не найдено разумное исправление — пропускаем замену
        if (!replacement) return;

        // Оборачиваем исправленное слово
        const highlighted = `<span class="highlight">${replacement.value}</span>`;

        // Заменяем слово на исправленное с подсветкой
        correctedText = correctedText.slice(0, offset) + highlighted + correctedText.slice(offset + length);
      });

      resultDiv.innerHTML = `<p>${correctedText}</p>`;
    })
    .catch(error => {
      resultDiv.textContent = 'Произошла ошибка при проверке.';
      console.error(error);
    });
});
