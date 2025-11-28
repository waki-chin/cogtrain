var N = 1;
var N_base = 20;
var config = {
    "visKey":"d",
    "spkKey":"f",
    "stimTime":750,
    "stimDelay":2000
};
const box = document.querySelectorAll('.box');
const btnVis = document.getElementById('btnVis');
const btnSpk = document.getElementById('btnSpk');

const sprites = loadSoundSprites();
const letters = ['B', 'C', 'D', 'G', 'H', 'K', 'P', 'Q', 'T', 'W']
document.getElementById("btnSpk").addEventListener('click', spkClick);

var visIsPressed = false;
var spkIsPressed = false;


function game(){


    // add event listeners

    document.addEventListener('keydown', onKeyPress);
    document.getElementById("btnVis").addEventListener('click', visClick);
    document.getElementById("btnSpk").addEventListener('click', spkClick);

    const [visual_stack, auditory_stack] = buildGameSequence();
    console.log(visual_stack, auditory_stack)


    setTimeout(showStimuli, config.stimDelay);
    let i = 0;
    let n_vis_matches = 0;
    let n_aud_matches = 0;
    let vis_misses = 0;
    let aud_misses = 0;
    let vis_falses = 0;
    let aud_falses = 0;

    function showStimuli(){
        const current_vis = visual_stack[i];
        box[current_vis].style.fill = '#56a1df';
        setTimeout(() => {
            box[current_vis].style.fill = '#a8d2dc';
        }, config.stimTime);
        sprites.play(letters[auditory_stack[i]]);
        if (i < N+N_base){
            setTimeout(sequenceMatchController, config.stimDelay);
        }
    }
    
    function sequenceMatchController(){
        if (i >= N){
            if (visual_stack[i] === visual_stack[i-N]){
                if (visIsPressed){
                    n_vis_matches++;
                }
                else{
                    vis_misses++;
                }
            }
            else if (visIsPressed){
                vis_falses++;
            }

            if (auditory_stack[i] === auditory_stack[i-N]){
                if (spkIsPressed){
                    n_aud_matches++;
                }
                else{
                    aud_misses++;
                }
            }
            else if (spkIsPressed){
                aud_falses++;
            }
        }
        else{
            if (visIsPressed){
                vis_falses++;
            }
            if (spkIsPressed){
                aud_falses++;
            }
        }

        visIsPressed = false;
        btnVis.style.backgroundColor = '#d3ceda';
        spkIsPressed = false;
        btnSpk.style.backgroundColor = '#d3ceda';

        i++;
        if (i < N+N_base){
            showStimuli();
        }
        else{
            finishGame();
        }
    }

    function finishGame(){
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('resultScreen').style.display = 'none';
        const visResult = document.getElementById('visResultSet');
        const audResult = document.getElementById('audResultSet');
        document.getElementById('visMatches').innerHTML   =   n_vis_matches;
        document.getElementById('visMisses').innerHTML    =   vis_misses;
        document.getElementById('visFalses').innerHTML    =   vis_falses;
        document.getElementById('audMatches').innerHTML   =   n_aud_matches;
        document.getElementById('audMisses').innerHTML    =   aud_misses;
        document.getElementById('audFalses').innerHTML    =   aud_falses;
    }
}

function loadSoundSprites() {
    const sprites = new Howl({
        src: ['/audios/audio_sprites.mp3', '/audios/audio_sprites.wav'],
        html5: false,
        sprite: {
            B: [900, 850],
            C: [1900, 850],
            D: [2900, 850],
            G: [3900, 850],
            H: [4900, 850],
            K: [5900, 850],
            P: [6900, 850],
            Q: [7900, 850],
            T: [8900, 850],
            W: [9900, 850],
        },
    });
    return sprites
}


function onKeyPress(e){
    if (e.key === config.visKey) {
        visClick();
    }
    if (e.key === config.spkKey) {
        spkClick();
    }
}

function visClick(){
    console.log("vis pressed");
    if (!visIsPressed){
        visIsPressed = true;
        btnVis.style.backgroundColor = '#b9a3d8'
    }
    else{
        visIsPressed = false;
        btnVis.style.backgroundColor = '#d3ceda'
    }
}

function spkClick(){
    console.log("spk pressed")
    game();
    if (!spkIsPressed){
        spkIsPressed = true;
        btnSpk.style.backgroundColor = '#b9a3d8'
    }
    else{
        spkIsPressed = false;
        btnSpk.style.backgroundColor = '#d3ceda'
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
    let visual_stack = getRandomNumbers(0, 8, N);
    let auditory_stack = getRandomNumbers(0, 10, N);

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