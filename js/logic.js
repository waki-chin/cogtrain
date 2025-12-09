import {app, analytics, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
    getFirestore, doc, collection, getDocs, query, where, limit,
    setDoc, updateDoc, addDoc, getDoc, runTransaction, increment, db
} from '/js/firebase.js'


// essential declaration
getDate()
let N = 1;
const N_base = 20;
let dailyGamesPlayed = 0;
let stimTime = 750;
let stimDelay = 2800;
let config = {
    "visKey":'KeyD',
    "audKey":'KeyF',
    "playKey":'Space',
    "returnKey":'Escape',
    "goToSettingsKey":'KeyJ',
    "goToStatsKey":'KeyK',
    "addNKey":'ArrowUp',
    "subtractNKey":'ArrowDown',
    "dailyGoal":20
};
const enumScreens = {
    "initial":0,
    "game":1,
    "result":2,
    "settings":3,
    "stats":4
};
const enumPopups = {
    "changeKey":0,
    "login":1
}
const sprites = loadSoundSprites();
const letters = ['B', 'C', 'D', 'G', 'H', 'K', 'P', 'Q', 'T', 'W'];
let currentScreen = 0;
let currentPopup;
let gameIsRunning = false;
let gameSequenceTimeout;
let settingTargetId = "";
let visIsPressed = false;
let spkIsPressed = false;
let visResponseTime;
let audResponseTime;
let settingKeyExpected = false;
let userIsLogged = false;
let user;
let settingsChanged = false;
let playedToday;


// declare html elements

const box = document.querySelectorAll('.box');
const btnVis = document.getElementById('btnVis');
const btnAud = document.getElementById('btnSpk');
const resultScreen = document.getElementById('resultScreen');
const initialScreen = document.getElementById('initialScreen');
const gameScreen = document.getElementById('gameScreen');
const settingScreen = document.getElementById('settingScreen');
const statsScreen = document.getElementById('statsScreen');
const popupContainer = document.getElementById('popupContainer');
const popupChangeKey = document.getElementById('changeKeyPopup');
const popupLogin = document.getElementById('loginPopup');
const logBtn = document.querySelector('.logBtn');
const screens = [
    initialScreen,
    gameScreen,
    resultScreen,
    settingScreen,
    statsScreen
]
const popups = [
    popupChangeKey,
    popupLogin
]


// add event listeners

document.querySelectorAll(".returnBtn").forEach(btn => {
    btn.addEventListener('click', () => goToScreen(enumScreens.initial));
});
document.querySelectorAll(".statsBtn").forEach(btn => {
    btn.addEventListener('click', () => goToScreen(enumScreens.stats));
});
document.querySelectorAll(".btnSetting").forEach(btn => {
    btn.addEventListener('click', () => goToScreen(enumScreens.settings));
});
document.querySelector('.playBtn').addEventListener('click', play);
document.getElementById('btnReplay').addEventListener('click', play);
document.querySelectorAll('.btnNMinus').forEach(btn => {
    btn.addEventListener('click', subtractN)
})
document.querySelectorAll('.btnNAdd').forEach(btn => {
    btn.addEventListener('click', addN)
})
document.addEventListener('click', onClick)
document.addEventListener('keydown', onKeyPress);
document.querySelectorAll('.intField').forEach(intField => {
    intField.addEventListener('beforeinput', e => {
        if (e.inputType.includes('delete')) {
            return; 
        }
        if (typeof e.data === 'string' && /[^0-9]/.test(e.data)) {
            e.preventDefault();
        }
    });
    intField.addEventListener('input', e =>{
        let v = e.target.value;
        let min = 1;
        let max = 64;
        if (v !== '') {
            let num = Number(v);
            if (num < min) num = min;
            if (num > max) num = max;
            v = String(num);
        }
        e.target.value = v;
    })
});
document.querySelector('.dailyGoalField').addEventListener('change', e =>{
    const v = e.target.value;
    config.dailyGoal = v;
    updateSettings(user.uid, config);
});
document.getElementById('loginBtn').addEventListener('click', () => {doLogin();})



// load initial screen

goToScreen(enumScreens.initial);





// ---------------------------------------------------
//               FUNCTIONS ALL BELOW
// ---------------------------------------------------



// ---------------------------------------------------
//               GAME-RELATED FUNCTIONS
// ---------------------------------------------------


// starts and loads the game

function play(){
    if (gameIsRunning){
        return;
    }
    document.querySelectorAll('.gameNDisplayer').forEach(displayer => {
        displayer.innerHTML = `N = ${N}`
    });
    goToScreen(enumScreens.game);
    game();
};


// game function, controls everything about a running game

function game(){

    if (gameIsRunning){
        return;
    }

    gameIsRunning = true;

    const [visual_stack, auditory_stack] = buildGameSequence();
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

    gameSequenceTimeout = setTimeout(showStimuli, stimDelay);


    // shows the current stimuli
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
        }, stimTime);
        sprites.play(letters[auditory_stack[i]]);
        if (i < N+N_base){
            gameSequenceTimeout = setTimeout(sequenceMatchController, stimDelay);
        }
    }
    

    // controls the flow of the game
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
        btnAud.style.backgroundColor = '#d3ceda';

        i++;
        if (i < N+N_base){
            showStimuli();
        }
        else{
            finishGame();
        }
    }
    

    // finishes the game
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
        visAccuracyTxt.innerHTML = `${Math.floor(vis_accuracy*100)}%`;
        audAccuracyTxt.innerHTML = `${Math.floor(aud_accuracy*100)}%`;
        document.getElementById('visMatches').innerHTML     =   n_vis_matches;
        document.getElementById('visMisses').innerHTML      =   vis_misses;
        document.getElementById('visFalses').innerHTML      =   vis_falses;
        document.getElementById('audMatches').innerHTML     =   n_aud_matches;
        document.getElementById('audMisses').innerHTML      =   aud_misses;
        document.getElementById('audFalses').innerHTML      =   aud_falses;
        dailyGamesPlayed++;
        goToScreen(enumScreens.result);
        if (userIsLogged){
            const gameDate = getDate();
            const [avgVisDelay, avgAudDelay] = calcDelays(visDelays, audDelays);
            const gameStats = {
                "n":N,
                "genAccuracy":gen_accuracy,
                "visAccuracy":vis_accuracy,
                "audAccuracy":aud_accuracy,
                "avgVisDelay":avgVisDelay,
                "avgAudDelay":avgAudDelay,
                "date":gameDate
            };
            updateDailyGamesPlayed(user.uid);
            saveGame(user.uid, gameStats);
        }
    }
}


// builds the game sequence (visual and auditory stacks)

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

function calcDelays(visDelays, audDelays){
    let avgVisDelay = null;
    let avgAudDelay = null;
    if (visDelays.length !== 0){
        avgVisDelay = Math.floor(visDelays.reduce((sum, x) => sum + x, 0) / visDelays.length);
    }
    if (audDelays.length !== 0){
        avgAudDelay = Math.floor(audDelays.reduce((sum, x) => sum + x, 0) / audDelays.length);
    }
    return [avgVisDelay, avgAudDelay];
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


function audClick(){
    if (!spkIsPressed){
        spkIsPressed = true;
        btnAud.style.backgroundColor = '#b9a3d8'
        audResponseTime = performance.now();
    }
    else{
        spkIsPressed = false;
        btnAud.style.backgroundColor = '#d3ceda'
    }
}

// get sound sprites
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


// ---------------------------------------------------
//               EVENT LISTENERS
// ---------------------------------------------------


function onKeyPress(e){
    const typing =
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.isContentEditable;
    if (typing){
        return;
    }
    if (e.code === config.returnKey && !settingKeyExpected){
        goToScreen(enumScreens.initial)
    }
    else{
        switch(currentScreen){
            case enumScreens.initial:
                switch(e.code){
                    case config.playKey:
                        play();
                        break;
                    case config.goToSettingsKey:
                        goToScreen(enumScreens.settings);
                        break;
                    case config.goToStatsKey:
                        goToScreen(enumScreens.stats);
                        break;
                    case config.addNKey:
                        addN();
                        break;
                    case config.subtractNKey:
                        subtractN();
                        break;
                }
                break;
            
            case enumScreens.game:
                if (e.code === config.visKey) {
                    visClick();
                }
                else if (e.code === config.audKey) {
                    audClick();
                }
                break;
            
            case enumScreens.result:
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
                break;
            
            case enumScreens.settings:
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
                    closePopup();
                    settingKeyExpected = false;
                    settingsChanged = true;
                }
                break;

            case enumScreens.stats:
                break;
        }
    }  
}


function onClick(e){
    if (gameIsRunning){
        switch (e.target){
            case btnVis:
                visClick();
                break;
            case btnAud:
                audClick();
        }
    }
    else if([
        "visKeyBtn",
        "audKeyBtn",
        "returnKeyBtn",
        "playKeyBtn",
        "openSettingsKeyBtn",
        "openStatsKeyBtn",
        "addNKeyBtn",
        "subtractNKeyBtn"
        ].includes(e.target.id)){
        e.target.blur();
        settingTargetId = e.target.id;
        settingKeyExpected = true;
        showPopup(enumPopups.changeKey);
    }
    else if(e.target.id === 'popupContainer'){
        closePopup();
    }
    else if(e.target === logBtn){
        if (userIsLogged){
            try {
                signOut(auth);
                userIsLogged = false;
            }
            catch(error){
                console.log("logout error");
            }
            loadInitial();
        }
        else{
            showPopup(enumPopups.login);

        }
    }
}

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

function logChange(){
    if (userIsLogged){
        signOut(auth);
        userIsLogged = false;
        loadInitial();
    }
    else{
        
    }
}


// ---------------------------------------------------
//                    LOADING HTML
// ---------------------------------------------------


// loads all screens
function goToScreen(screenEnum){
    document.activeElement.blur();
    switch(screenEnum){
        case enumScreens.initial:
            loadInitial();
            break;
        case enumScreens.game:
            break;
        case enumScreens.result:
            loadResult();
            break;
        case enumScreens.settings:
            loadSettings();
            break;
        case enumScreens.stats:
            break;
    }
    const oldScreen = screens[currentScreen];
    const newScreen = screens[screenEnum];
    oldScreen.style.display = 'none';
    newScreen.style.display = 'block';
    if (currentScreen = enumScreens.settings){
        if (settingsChanged){
            updateSettings(user.uid, config);
        }
    }
    currentScreen = screenEnum;
}


function loadSettings(){
    document.querySelector('.dailyGoalField').value = config.dailyGoal;
    document.getElementById('visKeyBtn').innerHTML = config.visKey;
    document.getElementById('audKeyBtn').innerHTML = config.audKey;
    document.getElementById('returnKeyBtn').innerHTML = config.returnKey;
    document.getElementById('playKeyBtn').innerHTML = config.playKey;
    document.getElementById('openSettingsKeyBtn').innerHTML = config.goToSettingsKey;
    document.getElementById('openStatsKeyBtn').innerHTML = config.goToStatsKey;
    document.getElementById('addNKeyBtn').innerHTML = config.addNKey;
    document.getElementById('subtractNKeyBtn').innerHTML = config.subtractNKey;
}

function loadInitial(){
    if (gameIsRunning){
        gameIsRunning = false;
        clearTimeout(gameSequenceTimeout);
    }
    if (userIsLogged){
        document.querySelector('.logBtn').innerHTML = "log out";
    }
    else{
        document.querySelector('.logBtn').innerHTML = "log in";
    }
    document.querySelector('.initialNDisplayerText').innerHTML = `N = ${N}`;
    document.querySelectorAll('.dailyNumber').forEach(displayer => {
        displayer.innerHTML = `${dailyGamesPlayed}/${config.dailyGoal}`
    });
};


function loadResult(){
    document.querySelectorAll('.dailyNumber').forEach(displayer => {
        displayer.innerHTML = `${dailyGamesPlayed}/${config.dailyGoal}`
    });
    document.querySelector('.resultNDisplayerText').innerHTML = `N = ${N}`
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

function showPopup(popupEnum){
    popupContainer.style.display = 'block';
    popups[popupEnum].style.display = 'block';
    currentPopup = popupEnum;
}

function closePopup(){
    popupContainer.style.display = 'none';
    popups[currentPopup].style.display = 'none';
    if (settingKeyExpected){
        settingKeyExpected = false;
    }
}



// ---------------------------------------------------
//                   AUTH CONTROL
// ---------------------------------------------------

onAuthStateChanged(auth, async (usr) =>{
    if (usr){
        console.log("user is logged");
        user = usr;
        userIsLogged = true;
        loadInitial();
        const dateString = getDate();
        playedToday = await hasPlayedToday(user.uid, dateString)
        console.log(playedToday)
        if (!playedToday){
            resetDailyGamesPlayed(user.uid)
        }
    }
    else{
        console.log("user isn't logged");
    }
})

async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    }
    catch (err) {
        return false;
    }
}


async function signUp(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return true;
    }
    catch (err) {
        return false;
    }
}

async function doLogin(){
    closePopup(enumPopups.login);
    const loginUser = document.getElementById('loginUser');
    const loginPassword = document.getElementById('loginPassword');
    const result = await signIn(loginUser.value, loginPassword.value);
    loginUser.value = '';
    loginPassword.value = '';
    if (result){
        userIsLogged = true;
    }
}


// ---------------------------------------------------
//                   DB RELATED
// ---------------------------------------------------


function getDate(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    return localDate;
}

const updateDailyGamesPlayed = async (uid, i = 1) => {
  const userDocRef = doc(db, "infouser", uid);
  await updateDoc(userDocRef, { dailyGamesPlayed: increment(i) });
};

const updateSettings = async (uid, newSettings) => {
  const userDocRef = doc(db, "infouser", uid);
  await updateDoc(userDocRef, {
    settings: newSettings
  });
};

const saveGame = async (uid, gameData) => {
  const gamesColRef = collection(db, "infouser", uid, "games");
  const newDocRef = await addDoc(gamesColRef, gameData);
};

const hasPlayedToday = async (uid, currentDateString) => {
  const gamesColRef = collection(db, "infouser", uid, "games");
  const q = query(gamesColRef, where("date", "==", currentDateString), limit(1));
  const qSnap = await getDocs(q);
  return !qSnap.empty;
};

const resetDailyGamesPlayed = async (uid) => {
  const userDocRef = doc(db, "infouser", uid);
  await updateDoc(userDocRef, { dailyGamesPlayed: 0 });
};