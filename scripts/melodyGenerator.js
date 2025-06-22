const selectBoxes = document.getElementsByTagName("select");
const keys = document.getElementById("piano-container").children;
const melodyDisplay = document.getElementById("melody-display");
const lowestNoteOptions = Array.from(document.getElementById("lowest-note").children);
const highestNoteOptions = Array.from(document.getElementById("highest-note").children);
const startingNoteSelector = document.getElementById("starting-note");
const startingNoteOptions = Array.from(document.getElementById("starting-note").children);
const endingNoteSelector = document.getElementById("ending-note");
const endingNoteOptions = Array.from(document.getElementById("ending-note").children);
const notesNumSelector = document.getElementById("notes-num");
const maxStepSelector = document.getElementById("max-step");
const showMelodyCheckbox = document.getElementById("show-melody");
const bpmInput = document.getElementById("bpm");
const generateButton = document.getElementById("generate-button");
const playButton = document.getElementById("play-button");
const errorModal = document.getElementById("error-modal");
const audio = document.getElementById("audio");
let selectedNotes = [];
let melodyIndices = [];
let melody = [];
let melodySounds = [];
let keyPlaying;
// let noteTimestamps = [];
let timeouts = [];
let allowPlay;
let lowKey;
let highKey;
let bpmTiming;
let fadeOutConstant;
let fadingTimeout;
let keyTimeout;
// let fadeInterval;
const sounds = {};
for (let i = 0; i < keys.length; i++) {
    sounds[keys[i].getAttribute("id")] = new Howl({
        src: `./resources/sounds/${keys[i].getAttribute("id")}.mp3`
    });
}

function randomNum(max) {
    return Math.floor(Math.random() * (max + 1));
}

/*function fadeAudio(element, startVolume, endVolume, time) {
    let increment = 5*(endVolume - startVolume)/time;
    element.volume = startVolume;
    element.volume += increment;
    if (fadeInterval != undefined) {
        clearInterval(fadeInterval);
    }
    fadeInterval = setInterval(() => {
        if ((increment > 0 && element.volume + increment > endVolume) || (increment < 0 && element.volume + increment < endVolume)) {
            element.volume = endVolume;
        } else {
            element.volume += increment;
        }
    }, 5);
    setTimeout(() => {
        clearInterval(fadeInterval);
    }, time);
}*/

function updateSelectedKeys() {
    // Check for all blue keys to update slected keys
    for (let keyToCheck of keys) {
        // If key is selected
        if (keyToCheck.style.backgroundColor == "rgb(43, 136, 212)") {
            // If key is selected but not in selected keys array yet
            if (!selectedNotes.find((element) => keyToCheck.getAttribute("number") == element)) {
                let keyNumber = Number(keyToCheck.getAttribute("number"));
                if (!Array.from(document.getElementById("starting-note").children).includes(startingNoteOptions[keyNumber])) {
                    let insertBeforeOption = Array.from(document.getElementById("starting-note").children).find((option) => Number(option.getAttribute("number")) > keyNumber || option.getAttribute("number") == 'any');
                    if (insertBeforeOption != undefined) {
                        document.getElementById("starting-note").insertBefore(startingNoteOptions[keyNumber], insertBeforeOption);
                    } else {
                        document.getElementById("starting-note").appendChild(startingNoteOptions[keyNumber]);
                    }
                }
                if (!Array.from(document.getElementById("ending-note").children).includes(endingNoteOptions[keyNumber])) {
                    let insertBeforeOption = Array.from(document.getElementById("ending-note").children).find((option) => Number(option.getAttribute("number")) > keyNumber || option.getAttribute("number") == 'any');
                    if (insertBeforeOption != undefined) {
                        document.getElementById("ending-note").insertBefore(endingNoteOptions[keyNumber], insertBeforeOption);
                    } else {
                        document.getElementById("ending-note").appendChild(endingNoteOptions[keyNumber]);
                    }
                }
                // If key to add is highest key
                if (!selectedNotes.find((element) => Number(keyToCheck.getAttribute("number")) < Number(element))) {
                    selectedNotes.push(keyToCheck.getAttribute("number"));
                } else {
                    let keyIndex = selectedNotes.findIndex((element) => Number(keyToCheck.getAttribute("number")) < Number(element));
                    selectedNotes.splice(keyIndex, 0, keyToCheck.getAttribute("number"));
                }
            }
            // If key is no longer selected update selected notes array
        } else if (selectedNotes.find((element) => Number(keyToCheck.getAttribute("number")) == Number(element))) {
            let keyIndex = selectedNotes.indexOf(keyToCheck.getAttribute("number"));
            selectedNotes.splice(keyIndex, 1);
            let keyNumber = Number(keyToCheck.getAttribute("number"));
            if (startingNoteOptions[keyNumber].value == startingNoteSelector.value) {
                let anyOption = startingNoteSelector.querySelector('[value="ANY"]');
                anyOption.setAttribute('selected', '');
                startingNoteSelector.value = 'ANY';
            }
            if (endingNoteOptions[keyNumber].value == endingNoteSelector.value) {
                let anyOption = endingNoteSelector.querySelector('[value="ANY"]');
                anyOption.setAttribute('selected', '');
                endingNoteSelector.value = 'ANY';
            }
            startingNoteOptions[keyNumber].remove();
            endingNoteOptions[keyNumber].remove();
        } else {
            let keyNumber = Number(keyToCheck.getAttribute("number"));
            startingNoteOptions[keyNumber].remove();
            endingNoteOptions[keyNumber].remove();
        }
    }
    let minStepSize = 87;
    for (let i = 1; i < selectedNotes.length; i++) {
        if (Number(selectedNotes[i]) - Number(selectedNotes[i - 1]) < minStepSize) {
            minStepSize = Number(selectedNotes[i]) - Number(selectedNotes[i - 1]);
        }
    }
    if (selectedNotes.length > 1) {
        maxStepSelector.setAttribute("min", minStepSize);
        if (Number(maxStepSelector.getAttribute("value")) < minStepSize) {
            maxStepSelector.setAttribute("value", minStepSize);
        }
        if (maxStepSelector.value == 1) {
            document.getElementById("step-range-value").innerHTML = `${maxStepSelector.value} note`;
        } else {
            document.getElementById("step-range-value").innerHTML = `${maxStepSelector.value} notes`;
        }
    }
}

for (let selectBox of selectBoxes) {
    selectBox.addEventListener("change", () => {
        if (selectBox.getAttribute("id") == "lowest-note") {
            if (lowKey != undefined) {
                lowKey.removeAttribute("style");
            }
            let targetKey = document.getElementById(selectBox.value);
            targetKey.style.backgroundColor = "hsl(207, 66%, 50%)";
            lowKey = targetKey;
            for (let i = 0; i < 88; i++) {
                if (i <= Number(lowKey.getAttribute("number"))) {
                    highestNoteOptions[i].remove();
                } else {
                    if (!Array.from(document.getElementById("highest-note").children).includes(highestNoteOptions[i])) {
                        console.log('needs to be added');
                        let insertBeforeOption = Array.from(document.getElementById("highest-note").children).find((option) => Number(option.getAttribute("number")) > i);
                        console.log(insertBeforeOption);
                        if (insertBeforeOption != undefined) {
                            document.getElementById("highest-note").insertBefore(highestNoteOptions[i], insertBeforeOption);
                        } else {
                            document.getElementById("highest-note").appendChild(highestNoteOptions[i]);
                        }
                    }
                }
            }
        }
        if (selectBox.getAttribute("id") == "highest-note") {
            if (highKey != undefined) {
                highKey.removeAttribute("style");
            }
            let targetKey = document.getElementById(selectBox.value);
            targetKey.style.backgroundColor = "hsl(207, 66%, 50%)";
            highKey = targetKey;
            console.log
            for (let i = 0; i < 88; i++) {
                if (i >= Number(highKey.getAttribute("number"))) {
                    lowestNoteOptions[i].remove();
                } else {
                    if (!Array.from(document.getElementById("lowest-note").children).includes(lowestNoteOptions[i])) {
                        console.log('needs to be added');
                        let insertBeforeOption = Array.from(document.getElementById("lowest-note").children).find((option) => Number(option.getAttribute("number")) > i);
                        console.log(insertBeforeOption);
                        if (insertBeforeOption != undefined) {
                            document.getElementById("lowest-note").insertBefore(lowestNoteOptions[i], insertBeforeOption);
                        } else {
                            document.getElementById("lowest-note").appendChild(lowestNoteOptions[i]);
                        }
                    }
                }
            }
        }
        if (lowKey != undefined && highKey != undefined) {
            for (let i = 0; i < 88; i++) {
                if (lowKey.getAttribute("number") <= i && i <= highKey.getAttribute("number")) {
                    keys[i].style.backgroundColor = "hsl(207, 66%, 50%)";
                    if (!Array.from(document.getElementById("starting-note").children).includes(startingNoteOptions[i])) {
                        let insertBeforeOption = Array.from(document.getElementById("starting-note").children).find((option) => Number(option.getAttribute("number")) > i || option.getAttribute("number") == 'any');
                        if (insertBeforeOption != undefined) {
                            document.getElementById("starting-note").insertBefore(startingNoteOptions[i], insertBeforeOption);
                        } else {
                            document.getElementById("starting-note").appendChild(startingNoteOptions[i]);
                        }
                    }
                    if (!Array.from(document.getElementById("ending-note").children).includes(endingNoteOptions[i])) {
                        let insertBeforeOption = Array.from(document.getElementById("ending-note").children).find((option) => Number(option.getAttribute("number")) > i || option.getAttribute("number") == 'any');
                        if (insertBeforeOption != undefined) {
                            document.getElementById("ending-note").insertBefore(endingNoteOptions[i], insertBeforeOption);
                        } else {
                            document.getElementById("ending-note").appendChild(endingNoteOptions[i]);
                        }
                    }
                } else {
                    keys[i].removeAttribute("style");
                    startingNoteOptions[i].remove();
                    endingNoteOptions[i].remove();
                }
            }
        }
        updateSelectedKeys();
        if (selectBox.getAttribute("id") == "starting-note") {
            startingNoteSelector.querySelector('[selected]').removeAttribute('selected');
            let targetOption = startingNoteSelector.querySelector(`[value="${startingNoteSelector.value}"]`);
            targetOption.setAttribute('selected', '');
        }
        if (selectBox.getAttribute("id") == "ending-note") {
            endingNoteSelector.querySelector('[selected]').removeAttribute('selected');
            let targetOption = endingNoteSelector.querySelector(`[value="${endingNoteSelector.value}"]`);
            targetOption.setAttribute('selected', '');
        }
    })
}

for (let key of keys) {
    key.addEventListener("click", () => {
        // If key is already selected
        if (key.style.backgroundColor == "rgb(43, 136, 212)") {
            key.removeAttribute("style");
            // If key is not selected yet
        } else {
            key.style.backgroundColor = "hsl(207, 66%, 50%)";
        }
        updateSelectedKeys();
        if (allowPlay != false) {
            if (keyPlaying != sounds[key.getAttribute('id')] && keyPlaying != undefined) {
                clearTimeout(keyTimeout);
                keyPlaying.fade(1, 0, 250);
                let lastKeyPlaying = keyPlaying;
                setTimeout(() => {
                    lastKeyPlaying.stop();
                }, 500);
            }
            console.log(key.getAttribute('number'));
            if (keyPlaying == sounds[key.getAttribute('id')]) {
                let keyDouble = new Howl({
                    src: `./resources/sounds/${key.getAttribute("id")}.mp3`
                });
                clearTimeout(keyTimeout);
                keyPlaying.fade(1, 0, 150);
                let lastKeyPlaying = keyPlaying;
                setTimeout(() => {
                    lastKeyPlaying.stop();
                }, 155);
                keyDouble.fade(0, 1, 150);
                keyDouble.play();
                keyPlaying = keyDouble;
                keyTimeout = setTimeout(() => {
                    keyPlaying.fade(1, 0, 150);
                }, 500);
            } else {
                sounds[key.getAttribute('id')].fade(0, 1, 150);
                sounds[key.getAttribute('id')].play();
                keyPlaying = sounds[key.getAttribute('id')];
                keyTimeout = setTimeout(() => {
                    sounds[key.getAttribute('id')].fade(1, 0, 150);
                }, 500);
            }
            
        }
    })
}

notesNumSelector.addEventListener("input", () => {
    document.getElementById("note-range-value").innerHTML = notesNumSelector.value;
})

maxStepSelector.addEventListener("input", () => {
    if (maxStepSelector.value == 1) {
        document.getElementById("step-range-value").innerHTML = `${maxStepSelector.value} note`;
    } else {
        document.getElementById("step-range-value").innerHTML = `${maxStepSelector.value} notes`;
    }
})

showMelodyCheckbox.addEventListener("change", () => {
    if (showMelodyCheckbox.checked && melody.length > 0) {
        let melodyText = melody.join(', ');
        melodyDisplay.innerText = melodyText;
    } else {
        melodyDisplay.innerText = '';
    }
})

generateButton.addEventListener("click", () => {
    if (selectedNotes[0] != undefined) {
        generateButton.style.backgroundColor = "hsl(37, 94%, 62%)";
        generateButton.style.transform = "scale(.95,.95)";
        removeHighlight = setTimeout(() => {
            generateButton.removeAttribute("style");
        }, 200);
        if (timeouts[0] != undefined && melody[0] != undefined) {
            for (let timeout of timeouts) {
                clearTimeout(timeout);
            }
            for (let melodySound of melodySounds) {
                melodySound.stop();
            }
            clearTimeout(fadingTimeout);
            for (let note of selectedNotes) {
                keys[Number(note)].style.backgroundColor = "hsl(207, 66%, 50%)";
            }
        }
        let notesNumber = Number(notesNumSelector.value);
        let maxStepSize = Number(maxStepSelector.value);
        updateSelectedKeys();
        melody = [];
        melodyIndices = [];
        melodySounds = [];
        let index;
        let options = new Array(notesNumber);
        if (startingNoteSelector.value != 'ANY') {
            let keyNumber = startingNoteSelector.querySelector('[selected]').getAttribute('number');
            index = selectedNotes.indexOf(keyNumber);
            options[0] = [selectedNotes[index]];
        } else {
            index = randomNum(selectedNotes.length - 1);
            options[0] = selectedNotes;
        }
        melodyIndices[0] = index;
        melody[0] = keys[selectedNotes[index]].getAttribute("id");
        options.fill(selectedNotes, 1);
        console.log(options);
        for (let i = 1; i < notesNumber; i++) {
            console.log(`choosing new for note ${i}`);
            let stepSize = 0;
            if (endingNoteSelector.value != 'ANY') {
                let endKeyNumber = endingNoteSelector.querySelector('[selected]').getAttribute('number');
                //check if we are choosing the second to last note so we can choose one that can be followed by the ending note based on settings chosen
                if (i == notesNumber - 2) {
                    options[i] = options[i].filter((note) => (Math.abs(Number(note) - Number(selectedNotes[melodyIndices[i - 1]]))) <= maxStepSize);
                    console.log(`options for ${i} are ${options[i]}`);
                    options[i] = options[i].filter((note) => (Math.abs(Number(endKeyNumber) - Number(note))) <= maxStepSize);
                    console.log(`options for ${i} are ${options[i]}`);
                } else if (i == notesNumber - 1) {
                    options[i] = [endKeyNumber];
                } else {
                    options[i] = options[i].filter((note) => (Math.abs(Number(note) - Number(selectedNotes[melodyIndices[i - 1]]))) <= maxStepSize);
                    console.log(`options for ${i} are ${options[i]}`);
                }
                if (options[i].length == 0 && i > 0) {
                    while (options[i].length == 0) {
                        i--;
                        if (i == 0 && startingNoteSelector.value != 'ANY') {
                            errorModal.showModal();
                            document.getElementById("close-dialog").blur();
                            melody = [];
                            melodyIndices = [];
                            melodySounds = [];
                            playButton.removeAttribute("style");
                            return;
                        }
                        let indexToRemove = options[i].indexOf(selectedNotes[melodyIndices[i]]);
                        options[i].splice(indexToRemove, 1);
                        options[i + 1] = selectedNotes;                        
                    }
                }
                index = randomNum(options[i].length - 1); //chooses random index in selected notes.
                console.log(index);
                melodyIndices[i] = selectedNotes.indexOf(options[i][index]);
                console.log(melodyIndices[i]);
                melody[i] = keys[selectedNotes[melodyIndices[i]]].getAttribute("id");
                console.log(`${melody}`);
            } else {
                options[i] = options[i].filter((note) => (Math.abs(Number(note) - Number(selectedNotes[melodyIndices[i - 1]]))) <= maxStepSize);
                console.log(`options are ${options[i]}`);
                index = randomNum(options[i].length - 1); //chooses random index in selected notes.
                melodyIndices[i] = selectedNotes.indexOf(options[i][index]);
                console.log(melodyIndices[i]);
                melody[i] = keys[selectedNotes[melodyIndices[i]]].getAttribute("id");
                console.log(`${melody}`);
            }
        }
        if (showMelodyCheckbox.checked) {
            let melodyText = melody.join(', ');
            melodyDisplay.innerText = melodyText;
        } else {
            melodyDisplay.innerText = '';
        }
        playButton.style.backgroundColor = "hsl(120, 58%, 48%)";
        allowPlay = true;
    }
});

playButton.addEventListener("click", () => {
    playButton.removeAttribute("style");
    clearTimeout(keyTimeout);
    if (keyPlaying != undefined) {
        keyPlaying.stop();
    }
    if (timeouts[0] != undefined && allowPlay) {
        for (let timeout of timeouts) {
            clearTimeout(timeout);
        }
    }
    if (bpmInput.value < 40) {
        bpmInput.value = 40;
    } else if (bpmInput.value > 400) {
        bpmInput.value = 400;
    }
    if (melody[0] != undefined && allowPlay) {
        allowPlay = false;
        bpmTiming = (1 / bpmInput.value) * 60 * 1000;
        if (bpmInput.value >= 300) {
            fadeOutConstant = Math.floor(bpmTiming / 1);
        } else {
            fadeOutConstant = Math.floor(bpmTiming / 4);
        }

        /*for (let i = 0; i < melody.length; i++) {
            timeouts[i] = setTimeout(() => {
                audio.currentTime = noteTimestamps[i];
                fadeAudio(audio, 0, 1, bpmTiming/10);
                if (audio.paused) {
                    audio.play();
                }
                fadingTimeout = setTimeout(() => {
                    fadeAudio(audio, 1, 0, fadeOutConstant);
                }, bpmTiming - fadeOutConstant);
                if(i == melody.length - 1) {
                    timeouts[i+1] = setTimeout(() => {
                        allowPlay = true;
                        audio.pause();
                        playButton.style.backgroundColor = "hsl(120, 58%, 48%)";
                    }, 1000);
                }
            },bpmTiming*i);
        }*/
        for (let i = 0; i < melody.length; i++) {
            melodySounds[i] = sounds[melody[i]];
        }
        for (let i = 0; i < melodySounds.length; i++) {
            timeouts[i] = setTimeout(() => {
                if (i > 0) {
                    melodySounds[i - 1].stop();
                    keys[melody[i - 1]].style.backgroundColor = "hsl(207, 66%, 50%)";

                }
                melodySounds[i].fade(0, 1, (bpmTiming / 10));
                melodySounds[i].play();
                keys[melody[i]].style.backgroundColor = "hsl(37, 80%, 50%)";
                fadingTimeout = setTimeout(() => {
                    if (i == melodySounds.length - 1) {
                        melodySounds[i].fade(1, 0, 2000 - bpmTiming + fadeOutConstant);
                    } else {
                        melodySounds[i].fade(1, 0, fadeOutConstant);
                    }
                }, bpmTiming - fadeOutConstant);
                if (i == melodySounds.length - 1) {
                    timeouts[i + 1] = setTimeout(() => {
                        for (let melodySound of melodySounds) {
                            melodySound.stop();
                        }
                        keys[melody[melody.length - 1]].style.backgroundColor = "hsl(207, 66%, 50%)";
                        allowPlay = true;
                        playButton.style.backgroundColor = "hsl(120, 58%, 48%)";
                    }, 2000);
                }
            }, bpmTiming * i);
        }
    }
});

document.getElementById("close-dialog").addEventListener('click', () => {
    errorModal.close();
});

// COSMETIC (changes select box size when screen size is small)
window.addEventListener("resize", () => {
    let mediaQueryInfo = window.matchMedia("(max-width: 510px)");
    // check if media query condition is met
    if (mediaQueryInfo.matches) {
        for (let selectBox of selectBoxes) {
            selectBox.setAttribute("size", "3");
        }
    } else {
        for (let selectBox of selectBoxes) {
            selectBox.setAttribute("size", "7");
        }
    }
});