const selectBoxes = document.getElementsByTagName("select");
const keys = document.getElementById("piano-container").children;
const notesNumSelector =  document.getElementById("notes-num");
const maxStepSelector = document.getElementById("max-step");
const bpmInput = document.getElementById("bpm");
const generateButton = document.getElementById("generate-button");
const playButton = document.getElementById("play-button");
const audio = document.getElementById("audio");
let selectedNotes = [];
let melodyIndices = [];
let melody = [];
let melodySounds = [];
// let noteTimestamps = [];
let timeouts = [];
let allowPlay;
let lowKey;
let highKey;
let bpmTiming;
let fadeOutConstant;
let fadingTimeout;
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
        }
    }
    let minStepSize = 87;
    for (let i = 1; i < selectedNotes.length; i++) {
        if (Number(selectedNotes[i]) - Number(selectedNotes[i-1]) < minStepSize) {
            minStepSize = Number(selectedNotes[i]) - Number(selectedNotes[i-1]);
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
    selectBox.addEventListener("input", () => {
        if (selectBox.getAttribute("id") == "lowest-note") {
            if (lowKey != undefined) {
                lowKey.removeAttribute("style");
            }
            let targetKey = document.getElementById(selectBox.value);
            targetKey.style.backgroundColor = "hsl(207, 66%, 50%)";
            lowKey = targetKey;
            for (let i = 0; i < 88; i++) {
                if (i <= lowKey.getAttribute("number")) {
                    document.getElementById("highest-note")[i].style.display = "none";
                } else {
                    document.getElementById("highest-note")[i].removeAttribute("style");
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
            for (let i = 0; i < 88; i++) {
                if (i >= highKey.getAttribute("number")) {
                    document.getElementById("lowest-note")[i].style.display = "none";
                } else {
                    document.getElementById("lowest-note")[i].removeAttribute("style");
                }
            }
        }
        if (lowKey != undefined && highKey != undefined) {
            for (let i = 0; i < 88; i++) {
                if (lowKey.getAttribute("number") <= i && i <= highKey.getAttribute("number")) {
                    keys[i].style.backgroundColor = "hsl(207, 66%, 50%)";
                } else {
                    keys[i].removeAttribute("style");
                }
            }
        }
        updateSelectedKeys();
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
            clearTimeout(fadingTimeout);
        }
        let notesNumber = notesNumSelector.value;
        let maxStepSize = maxStepSelector.value;
        updateSelectedKeys();
        melody = [];
        melodyIndices = [];
        melodySounds = [];
        let index = randomNum(selectedNotes.length - 1);
        melodyIndices[0] = index;
        melody[0] = keys[selectedNotes[index]].getAttribute("id");
        for (let i = 1; i < notesNumber; i++) {
            let stepSize = 0;
            do {
                index = randomNum(selectedNotes.length - 1);
                stepSize = Math.abs(Number(selectedNotes[index]) - Number(selectedNotes[melodyIndices[i-1]]));
                if (stepSize <= maxStepSize) {
                    melodyIndices[i] = index;
                    melody[i] = keys[selectedNotes[index]].getAttribute("id");
                }
            } while (stepSize > maxStepSize);
        }
        playButton.style.backgroundColor = "hsl(120, 58%, 48%)";
        allowPlay = true;
    }
});

playButton.addEventListener("click", () => {
    playButton.removeAttribute("style");
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
        bpmTiming = (1/bpmInput.value) * 60 * 1000;
        if (bpmInput.value >= 300) {
            fadeOutConstant = Math.floor(bpmTiming/1);
        } else {
            fadeOutConstant = Math.floor(bpmTiming/4);
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
                if(i > 0) {
                    melodySounds[i-1].stop();
                }
                melodySounds[i].fade(0,1,(bpmTiming/10));
                melodySounds[i].play();
                fadingTimeout = setTimeout(() => {
                    if (i == melodySounds.length - 1) {
                        melodySounds[i].fade(1,0, 2000-bpmTiming+fadeOutConstant);
                    } else {
                        melodySounds[i].fade(1,0,fadeOutConstant);
                    }
                }, bpmTiming - fadeOutConstant);
                if(i == melodySounds.length - 1) {
                    timeouts[i+1] = setTimeout(() => {
                        for (let melodySound of melodySounds) {
                            melodySound.stop();
                        }
                        allowPlay = true;
                        playButton.style.backgroundColor = "hsl(120, 58%, 48%)";
                    }, 2000);
                }
            }, bpmTiming*i);
        }
    }
});

// COSMETIC (changes select box size when screen size is small)
window.addEventListener("resize", () => {
    let mediaQueryInfo = window.matchMedia("(max-width: 510px)");
    // check if media query condition is met
    if (mediaQueryInfo.matches) {
        for ( let selectBox of selectBoxes) {
            selectBox.setAttribute("size","3");
        }
    } else {
        for ( let selectBox of selectBoxes) {
            selectBox.setAttribute("size","7");
        }
    }
});