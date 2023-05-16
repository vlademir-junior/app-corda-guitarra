document.addEventListener('DOMContentLoaded', function () {
  var entryData = document.getElementById('entryData');
  var gtrStringOutput = document.getElementById('gtrString');
  var darkModeButton = document.getElementById('darkModeButton');
  var rootElement = document.documentElement;
  
  entryData.addEventListener('input', function () {
    var gtrString;
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
