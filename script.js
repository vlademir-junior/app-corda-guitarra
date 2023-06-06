document.addEventListener('DOMContentLoaded', function () {
  const entryData = document.getElementById('entryData');
  const gtrStringOutput = document.getElementById('gtrString');
  const darkModeButton = document.getElementById('darkModeButton');
  const rootElement = document.documentElement;

  entryData.addEventListener('input', function () {
    let gtrString;

    switch (entryData.value) {
      case 'e':
        gtrString = '1ª corda';
        break;
      case 'b':
        gtrString = '2ª corda';
        break;
      case 'g':
        gtrString = '3ª corda';
        break;
      case 'd':
        gtrString = '4ª corda';
        break;
      case 'a':
        gtrString = '5ª corda';
        break;
      case 'E':
        gtrString = '6ª corda';
        break;
      case '':
        gtrString = '__________';
        break;
      default:
        gtrString = 'Esta corda não existe/não é da afinação padrão de guitarra!';
    }

    gtrStringOutput.textContent = gtrString;
  });

  darkModeButton.addEventListener('click', function () {
    rootElement.classList.toggle('dark-mode');
  });
});
