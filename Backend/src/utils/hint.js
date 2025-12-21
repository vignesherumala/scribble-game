// reveal next letter(s) progressively
function initHint(word) {
  return word.split('').map(_ => '_').join('');
}

function revealNext(hintState, word) {
  const hintArr = hintState.split('');
  // reveal a random unrevealed character (or left-to-right)
  for (let i=0;i<hintArr.length;i++){
    if (hintArr[i] === '_') {
      hintArr[i] = word[i];
      break;
    }
  }
  return hintArr.join('');
}

module.exports = { initHint, revealNext };
