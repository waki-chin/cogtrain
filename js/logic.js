var N = 1;
var N_base = 20;

function startGame(){
    document.addEventListener('keydown', onKeyPress);
    document.getElementById("btnVis").addEventListener('click', visClick);
    document.getElementById("btnSpk").addEventListener('click', spkClick)
}

function onKeyPress(e){
    if (e.key === 'a') {
    console.log('a pressed');
  }
}


function buildGameSequence (){
    
    let visual_matches = [];
    let auditory_matches = [];
    let next = -1;

    // get 4 visual matches
    while (visual_matches.length < 4) {
    next = Math.floor(Math.random()*(N_base));
    if (visual_matches.indexOf(next+N) == -1)
        visual_matches.push(next+N);
    }

    // get 4 auditory matches
    while (auditory_matches.length < 4) {
    next = Math.floor(Math.random()*(N_base));
    if (auditory_matches.indexOf(next+N) == -1 && visual_matches.indexOf(next+N) == -1)
        auditory_matches.push(next+N);
    }

    // get 2 mutual matches
    while (auditory_matches.length < 6) {
        next = Math.floor(Math.random()*(N_base));
        if (auditory_matches.indexOf(next+N) == -1 && visual_matches.indexOf(next+N) == -1) {
            auditory_matches.push(next+N);
            visual_matches.push(next+N);
        }
    }

    // build actual sequence

    // randomly assign the first n ones
    visual_stack = getRandomNumbers(0, 8, N);
    auditory_stack = getRandomNumbers(0, 10, N);

    // make sure no other matches occur and assign random values to the rest of it
    while (visual_stack.length < N_base+N) {
        if (visual_matches.indexOf(visual_stack.length) != -1) {
            visual_stack.push(visual_stack[visual_stack.length-N]);
        }
        else {
            next = Math.floor(Math.random()*(7));
            if (next >= visual_stack[visual_stack.length-N]){
                next += 1;
            }
            visual_stack.push(next);
        }
    }

    while (auditory_stack.length < N_base+N) {
        if (auditory_matches.indexOf(auditory_stack.length) != -1) {
            auditory_stack.push(auditory_stack[auditory_stack.length-N]);
        } else {
            next = Math.floor(Math.random()*(9));
            if (next >= auditory_stack[auditory_stack.length-N])
                next += 1;
            auditory_stack.push(next);
        }
    }

    return [visual_stack, auditory_stack]
}



function getRandomNumbers(min, max, count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(Math.floor(Math.random() * (max - min)) + min);
  }
  return arr;
}