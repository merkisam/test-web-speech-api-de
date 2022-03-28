let isStarted = false;
let speechRecognitionSrc = undefined;
let stream = null;
let recorder = null;
let fullTextResult = '';
let fullTextResultFinal = '';
let isWithGrammar = 0;

var text = [
  'Lokalisation: Haut des Kopfes',
  'Seitenangabe zum Präparat: Links',
  'Gewebe: Frisch',
  'Operationsverfahren:  Exzision',
  'Mitentferne Strukturen: Lymphknoten',
  'Grösse: 30x20x10 Millimeter',
  'Orientierung des Präparats: Fadenmarkierung, Medial/Lateral',
  'Einbettung: Kranial nach kaudal',
  'Veränderung: Schnittfläche auffällig',
  'Schnittfläche: Derb-Weiss',
  'Makroskopische Resektionsränder: Kein Befall',
  'Komplette Einbettung: Ja'
];

text.forEach(line => {
  let lineParts = line.split(': ');
  var elemLine = document.createElement('p');
  elemLine.className = 'mb-1';

  var elemStrong = document.createElement('strong');
  elemStrong.innerHTML = lineParts[0] + ': ';
  elemLine.appendChild(elemStrong);

  var elemSpan = document.createElement('span');
  elemSpan.innerHTML = lineParts[1];
  elemLine.appendChild(elemSpan);

  document.getElementById('textContent').appendChild(elemLine)
});

document.getElementById('startRec').onclick = (ev) => {
  let isChromium = !!window.chrome;
  if (!isChromium) { 
    alert('Bitte auf Chrome wechseln, sonst kann die Aufnahme nicht gestartet werden. Vielen Dank');
    return;
  }

  navigator.mediaDevices.getUserMedia({
    audio: true
  }).then(mediaStream => {
    stream = mediaStream;
    iniVoiceRec();
    initRecorder();
  });

  //startRecognitionAndRecording();
  document.getElementById('startRec').classList.remove("list-group-item-primary");
  document.getElementById('stopRec').classList.add("list-group-item-primary");
  document.getElementById('recInfo').classList.remove("hidden");
  document.getElementById('recCompleted').classList.add("hidden");
};

document.getElementById('stopRec').onclick = (ev) =>  {
  isStarted = false;
  if (speechRecognitionSrc) {
    isStarted = false;         
    speechRecognitionSrc.stop();
    console.log(fullTextResult);
    //TODO save content to backend
    saveText(fullTextResult, false);
    saveText(fullTextResultFinal, true);
  }
  if(recorder) {
    recorder.stop();
  }
  stream.getTracks().forEach(function(track) {
    track.stop();
  });
  document.getElementById('recInfo').classList.add("hidden");
  document.getElementById('stopRec').classList.remove("list-group-item-primary");
  document.getElementById('recCompleted').classList.remove("hidden");
};

saveText = (text, isFinal) => {
  text += '\\nisWithGrammar := ' + String(isWithGrammar);

  let requestURL = isFinal ? 'saveTextFinal.php' : 'saveText.php';
  fetch(requestURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(text)
  })
  .then(response => response.text())
  .then(data => console.log(data));
}

iniVoiceRec = () => {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error('SpeechRecognition not supported');
      alert('SpeechRecognition not supported (use Chrome)');
      return;
  }
  const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;

  /* Create class and set settings */
  speechRecognitionSrc = new SpeechRecognition();
  speechRecognitionSrc.continuous = true;
  speechRecognitionSrc.interimResults = true;
  speechRecognitionSrc.lang = 'de-CH';

  //add grammar
  isWithGrammar = Math.round(Math.random());
  if(isWithGrammar === 1) {
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList ;
    let grammar = text.join(' | ') + ';';
    var speechGrammarListObj = new SpeechGrammarList();
    speechGrammarListObj.addFromString(grammar, 1);
    speechRecognitionSrc.grammars = speechGrammarListObj;
  }

  speechRecognitionSrc.addEventListener('result', (event) => {
    console.log(event.results);
    fullTextResultFinal = '';
    Object.keys(event.results).sort().forEach(function(resultNr) {
      let result = event.results[resultNr];
      if(result.isFinal) {
        let recognicedText = result[0].transcript;
        fullTextResultFinal += recognicedText + '\\n';
      }
    });
    fullTextResult += event.results[event.results.length - 1][0].transcript + '\\n';
  });

  speechRecognitionSrc.addEventListener('end', (obj) => {
      if (isStarted) {
          speechRecognitionSrc.start();
      }
  });

  speechRecognitionSrc.start();
  isStarted = true;
}

function initRecorder() {
  const chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = (e) => pushNewRecordings(chunks);
  recorder.start();
  console.info('recorder started');
}

function pushNewRecordings(chunks) {
  console.info('saving audio');
  let blob = new Blob(chunks);

  //save blob to backend
  var xhr = new XMLHttpRequest();
  xhr.onload=  function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ", e.target.responseText);
      }
  };
  var fd = new FormData();
  fd.append("audio_data", blob, "filename.wav");
  xhr.open("POST", "saveAudio.php", true);
  xhr.send(fd);
  
  //console.info('adding recording');
  //const audioBlob = new Audio(URL.createObjectURL(blob));
  //audioBlob.controls = true;
  //document.getElementById('textToRead').appendChild(audioBlob);
}