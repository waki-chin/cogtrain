var N = 1;
const N_base = 20;
var dailyGamesPlayed = 0;
var config = {
    "visKey":'KeyD',
    "audKey":'KeyF',
    "playKey":'Space',
    "returnKey":'Escape',
    "goToSettingsKey":'KeyJ',
    "goToStatsKey":'KeyK',
    "addNKey":'ArrowUp',
    "subtractNKey":'ArrowDown',
    "stimTime":750,
    "stimDelay":2800,
    "dailyGoal":20
};
const box = document.querySelectorAll('.box');
const btnVis = document.getElementById('btnVis');
const btnSpk = document.getElementById('btnSpk');
const resultScreen = document.getElementById('resultScreen');
const initialScreen = document.getElementById('initialScreen');
const gameScreen = document.getElementById('gameScreen');
const settingScreen = document.getElementById('settingScreen');
const statsScreen = document.getElementById('statsScreen');
const popupContainer = document.getElementById('popupContainer');
var gameIsRunning = false;
var settingTargetId;

goToInitial();

document.querySelectorAll(".returnBtn").forEach(btn => {
    btn.addEventListener('click', goToInitial);
});
document.querySelectorAll(".statsBtn").forEach(btn => {
    btn.addEventListener('click', goToStats);
});
document.querySelectorAll(".btnSetting").forEach(btn => {
    btn.addEventListener('click', goToSettings);
});
document.querySelector('.playBtn').addEventListener('click', play);
document.getElementById('btnReplay').addEventListener('click', play);
document.querySelectorAll('.btnNMinus').forEach(btn => {
    btn.addEventListener('click', subtractN)
})
document.querySelectorAll('.btnNAdd').forEach(btn => {
    btn.addEventListener('click', addN)
})




popupContainer.addEventListener('click', togglePopup);

const sprites = loadSoundSprites();
const letters = ['B', 'C', 'D', 'G', 'H', 'K', 'P', 'Q', 'T', 'W'];

var visIsPressed = false;
var spkIsPressed = false;
var visResponseTime;
var audResponseTime;
var settingKeyExpected = false;

function game(){

    if (gameIsRunning){
        return;
    }

    gameIsRunning = true;

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
    let visStimTimes = new Array(N+N_base);
    let audStimTimes = new Array(N+N_base);
    let visDelays = [];
    let audDelays = [];

    function showStimuli(){
        if (!gameIsRunning){
            return
        }
        const current_vis = visual_stack[i];
        const now = performance.now();
        visStimTimes[i] = now;
        audStimTimes[i] = now;
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
        if (!gameIsRunning){
            return
        }
        if (i >= N){
            if (visual_stack[i] === visual_stack[i-N]){
                if (visIsPressed){
                    n_vis_matches++;
                    const visDelay = visResponseTime - visStimTimes[i];
                    if (visDelay > 0){
                        visDelays.push(visDelay);
                    }
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
                    const audDelay = audResponseTime - audStimTimes[i];
                    if (audDelay > 0){
                        audDelays.push(audDelay);
                    }
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
        gameIsRunning = false;
        const [gen_accuracy, vis_accuracy, aud_accuracy] = calcAccuracy(n_vis_matches, vis_misses, vis_falses, n_aud_matches, aud_misses, aud_falses);
        const genAccuracyTxt = document.getElementById('genAccuracyTxt');
        const visAccuracyTxt = document.getElementById('visAccuracyTxt');
        const audAccuracyTxt = document.getElementById('audAccuracyTxt');

        if (gen_accuracy > 0.8){
            genAccuracyTxt.style.color = '#7aed7a';
        }
        else if (gen_accuracy > 0.6){
            genAccuracyTxt.style.color = '#fdea6cff';
        }
        else {
            genAccuracyTxt.style.color = '#fd4c4c'
        }

        if (vis_accuracy > 0.8){
            visAccuracyTxt.style.color = '#7aed7a';
        }
        else if (vis_accuracy > 0.6){
            visAccuracyTxt.style.color = '#fdea6cff';
        }
        else {
            visAccuracyTxt.style.color = '#fd4c4c'
        }

        if (aud_accuracy > 0.8){
            audAccuracyTxt.style.color = '#7aed7a';
        }
        else if (gen_accuracy > 0.6){
            audAccuracyTxt.style.color = '#fdea6cff';
        }
        else {
            audAccuracyTxt.style.color = '#fd4c4c'
        }

        genAccuracyTxt.innerHTML = `${Math.floor(gen_accuracy*100)}%`;
        visAccuracyTxt.innerHTML = `${Math.floor(aud_accuracy*100)}%`;
        audAccuracyTxt.innerHTML = `${Math.floor(aud_accuracy*100)}%`;
        document.getElementById('visMatches').innerHTML     =   n_vis_matches;
        document.getElementById('visMisses').innerHTML      =   vis_misses;
        document.getElementById('visFalses').innerHTML      =   vis_falses;
        document.getElementById('audMatches').innerHTML     =   n_aud_matches;
        document.getElementById('audMisses').innerHTML      =   aud_misses;
        document.getElementById('audFalses').innerHTML      =   aud_falses;
        dailyGamesPlayed++;
        goToResult();
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


function gameOnKeyPress(e){
    if (e.code === config.visKey) {
        visClick();
    }
    else if (e.code === config.audKey) {
        spkClick();
    }
    else if (e.code === config.returnKey){
        goToInitial();
    }
}

function initialOnKeyPress(e){
    switch(e.code){
        case config.playKey:
            play();
            break;
        case config.goToSettingsKey:
            goToSettings();
            break;
        case config.goToStatsKey:
            goToStats();
            break;
        case config.addNKey:
            addN();
            break;
        case config.subtractNKey:
            subtractN();
            break;
    }
}

function resultOnKeyPress(e){
    switch(e.code){
        case config.playKey:
            play();
            break;
        case config.addNKey:
            addN();
            break;
        case config.subtractNKey:
            subtractN();
            break;
    }
}

function settingOnKeyPress(e){
    if (settingKeyExpected){
        switch(settingTargetId){
            case 'visKeyBtn':
                config.visKey = e.code;
                break;
            case 'audKeyBtn':
                config.audKey = e.code;
                break;
            case 'returnKeyBtn':
                config.returnKey = e.code;
                break;
            case 'playKeyBtn':
                config.playKey = e.code;
                break;
            case 'openSettingsKeyBtn':
                config.goToSettingsKey = e.code;
                break;
            case 'openStatsKeyBtn':
                config.goToStatsKey = e.code;
                break;
            case 'addNKeyBtn':
                config.addNKey = e.code;
                break;
            case 'subtractNKeyBtn':
                config.subtractNKey = e.code;
        }
        loadSettings();
        togglePopup();
        settingKeyExpected = false;
    }
    else if (e.code === config.returnKey){
        goToInitial();
    }
}

function statsOnKeyPress(e){
    switch(e.code){
        case config.returnKey:
            goToInitial();
    }
}

function visClick(){
    if (!visIsPressed){
        visIsPressed = true;
        btnVis.style.backgroundColor = '#b9a3d8'
        visResponseTime = performance.now();
    }
    else{
        visIsPressed = false;
        btnVis.style.backgroundColor = '#d3ceda'
    }
}

function spkClick(){
    if (!spkIsPressed){
        spkIsPressed = true;
        btnSpk.style.backgroundColor = '#b9a3d8'
        audResponseTime = performance.now();
    }
    else{
        spkIsPressed = false;
        btnSpk.style.backgroundColor = '#d3ceda'
    }
}

function settingBtnClick(e){
    settingTargetId = e.target.id;
    if ([
        "visKeyBtn",
        "audKeyBtn",
        "returnKeyBtn",
        "playKeyBtn",
        "openSettingsKeyBtn",
        "openStatsKeyBtn",
        "addNKeyBtn",
        "subtractNKeyBtn"
        ].includes(settingTargetId)) {
        e.target.blur();
        settingKeyExpected = true;
        togglePopup();
    }
    else if(settingTargetId === 'popupContainer'){
        settingKeyExpected = false;
        togglePopup();
    }
};

function addN(){
    N++;
    document.querySelectorAll('.NDisplayer').forEach(displayer => {
        displayer.innerHTML = `N = ${N}`;
    });
};

function subtractN(){
    if (N > 1){
        N--;
        document.querySelectorAll('.NDisplayer').forEach(displayer => {
            displayer.innerHTML = `N = ${N}`;
        });
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
    };

    // get 4 auditory matches
    while (auditory_matches.length < 4) {
    next = Math.floor(Math.random()*(N_base));
    if (auditory_matches.indexOf(next+N) == -1 && visual_matches.indexOf(next+N) == -1)
        auditory_matches.push(next+N);
    };

    // get 2 mutual matches
    while (auditory_matches.length < 6) {
        next = Math.floor(Math.random()*(N_base));
        if (auditory_matches.indexOf(next+N) == -1 && visual_matches.indexOf(next+N) == -1) {
            auditory_matches.push(next+N);
            visual_matches.push(next+N);
        }
    };

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
    };

    while (auditory_stack.length < N_base+N) {
        if (auditory_matches.indexOf(auditory_stack.length) != -1) {
            auditory_stack.push(auditory_stack[auditory_stack.length-N]);
        } else {
            next = Math.floor(Math.random()*(9));
            if (next >= auditory_stack[auditory_stack.length-N])
                next += 1;
            auditory_stack.push(next);
        }
    };

    return [visual_stack, auditory_stack];
};



function getRandomNumbers(min, max, count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(Math.floor(Math.random() * (max - min)) + min);
  }
  return arr;
};

function calcAccuracy(vis_matches, vis_misses, vis_falses, aud_matches, aud_misses, aud_falses){
    const gen_accuracy = (vis_matches+aud_matches)/(vis_matches+vis_falses+vis_misses+aud_matches+aud_misses+aud_falses);
    const vis_accuracy = (vis_matches)/(vis_matches+vis_misses+vis_falses);
    const aud_accuracy = (aud_matches)/(aud_matches+aud_misses+aud_falses);
    return [gen_accuracy, vis_accuracy, aud_accuracy];
}

function play(){
    document.querySelectorAll('.screens').forEach((screen) =>{
        screen.style.display = 'none'
    });
    document.addEventListener('keydown', gameOnKeyPress);
    btnVis.addEventListener('click', visClick);
    btnSpk.addEventListener('click', spkClick);
    document.removeEventListener('keydown', initialOnKeyPress);
    document.removeEventListener('keydown', resultOnKeyPress)
    document.querySelectorAll('.gameNDisplayer').forEach(displayer => {
        displayer.innerHTML = `N = ${N}`
    });
    gameScreen.style.display = 'block';
    game();
};

function goToSettings(){
    document.querySelectorAll('.keySettingBtn').forEach(btn => {
        btn.addEventListener('click', settingBtnClick);
    });
    document.querySelectorAll('.screens').forEach(screen =>{
        screen.style.display = 'none'
    });
    loadSettings();
    document.removeEventListener('keydown', initialOnKeyPress);
    document.addEventListener('keydown', settingOnKeyPress);
    settingScreen.style.display = 'block';
};

function loadSettings(){
    document.getElementById('visKeyBtn').innerHTML = config.visKey;
    document.getElementById('audKeyBtn').innerHTML = config.audKey;
    document.getElementById('returnKeyBtn').innerHTML = config.returnKey;
    document.getElementById('playKeyBtn').innerHTML = config.playKey;
    document.getElementById('openSettingsKeyBtn').innerHTML = config.goToSettingsKey;
    document.getElementById('openStatsKeyBtn').innerHTML = config.goToStatsKey;
    document.getElementById('addNKeyBtn').innerHTML = config.addNKey;
    document.getElementById('subtractNKeyBtn').innerHTML = config.subtractNKey;
}

function goToInitial(){
    gameIsRunning = false;
    document.addEventListener('keydown', initialOnKeyPress);
    document.removeEventListener('keydown', resultOnKeyPress);
    document.removeEventListener('keydown', gameOnKeyPress);
    document.removeEventListener('keydown', settingOnKeyPress);
    document.querySelectorAll('.screens').forEach((screen) =>{
        screen.style.display = 'none'
    });
    document.querySelector('.initialNDisplayerText').innerHTML = `N = ${N}`;
    document.querySelectorAll('.dailyNumber').forEach(displayer => {
        displayer.innerHTML = `${dailyGamesPlayed}/${config.dailyGoal}`
    });
    initialScreen.style.display = 'block';
};

function goToStats(){
    document.querySelectorAll('.screens').forEach((screen) =>{
        screen.style.display = 'none'
    });
    document.addEventListener('keydown', statsOnKeyPress);
    document.removeEventListener('keydown', initialOnKeyPress);
    statsScreen.style.display = 'block';
};

function goToResult(){
    document.querySelectorAll('.screens').forEach((screen) =>{
        screen.style.display = 'none'
    });
    btnVis.removeEventListener('click', visClick);
    btnSpk.removeEventListener('click', spkClick);
    document.removeEventListener('keydown', gameOnKeyPress);
    document.addEventListener('keydown', resultOnKeyPress);
    document.querySelectorAll('.dailyNumber').forEach(displayer => {
        displayer.innerHTML = `${dailyGamesPlayed}/${config.dailyGoal}`
    });
    document.querySelector('.resultNDisplayerText').innerHTML = `N = ${N}`
    resultScreen.style.display = 'block';
};

function togglePopup(){
    if (window.getComputedStyle(popupContainer).display === 'none'){
        popupContainer.style.display = 'block';
    }
    else{
        popupContainer.style.display = 'none';
        settingKeyExpected = false; 
    }
}