/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var audioContext = null;
var meter = null;
var canvasContext = null;
var WIDTH=500;
var HEIGHT=50;
var rafID = null;

window.onload = function() {

    document.getElementsByTagName('button')[0].addEventListener('click', function(){
        audioContext.resume();
        console.log('resumed');
    });

    // grab our canvas
    // canvasContext = document.getElementById( "meter" ).getContext("2d");
	
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }

}


function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);

    // kick off the visual updating
    myLoop();
}

function getGradient(nb) {

	var step1 = 25; // Step 1: yellow
	var step2 = 50; // Step 2: red
	var inter = step2-step1;

	if(nb < 0) {
		return 'rgb(0,200,0)';
	}
	else if(nb < step1) {
		// var redLvl = 6*nb;
		var redLvl = Math.ceil((255/step1)*nb);
		return 'rgb('+redLvl+',200,0)';

	} else if (nb < step2) {
		// yellow to red
		// var greenLvl = 200 - 5*(nb-40);
		var greenLvl = Math.ceil(200 - ((200/inter)*(nb - inter)));
		return 'rgb(255,'+greenLvl+',0)';

	} else {
		// red
		return 'rgb(255,0,0)';
	}
}

/*function drawLoop( time ) {
	
	var divDisplay = document.getElementById('dispRom');
	var level = Math.log10(meter.volume)*20 + 40;
	
	divDisplay.innerHTML = time;
	divDisplay.style.backgroundColor = getGradient(level);
	
	
	
    // clear the background
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    // check if we're currently clipping
    if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else
        canvasContext.fillStyle = "green";

    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);

    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}*/

function addData(data, array) {

	if(!isFinite(data)) return array;
	
	if(array.length < 40) {
		array.push(data);
		return array;
	} else {
		array.shift();
		array.push(data);
		return array;
	}
	
}

function arrAvg(array) {
	var total = 0;
	var nb = array.length;
	
	for (var i = 0; i < nb; i++) {
		total += array[i];
	}
	return total/nb;
}

then = 0;
volData = [];

function myLoop(time) {
	
	var delay = 100;
	var avTime = 2000;
    var divDisplay = document.getElementById('dispRom');
	
	requestAnimationFrame(myLoop);
	
	now = time;
	elapsed = now - then;
	
	if(elapsed > delay) {
		
		then = now - (elapsed%delay);
		
		var level = Math.log10(meter.volume)*20 + 60;
		
		volData = addData(level, volData);

		// console.log(volData.toString());
		
		divDisplay.innerHTML = Math.round(level)+'<br>'+arrAvg(volData)+'<br>'+getGradient(arrAvg(volData));
		document.getElementsByTagName('body')[0].style.backgroundColor = getGradient(arrAvg(volData));
		
		
	}
	
}

