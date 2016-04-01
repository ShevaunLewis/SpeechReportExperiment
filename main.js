var currentStory = 0;
var currentPhase = 0;
var phases = ["hi","scene1","give1","give2","scene2","take1","take2","end"];
var subjInfo = {};
var responses = [];

// Collect subject information from form on start page
$("#submitForm").click(saveSubjInfo);

function saveSubjInfo() {
    // Collect information from form
    subjInfo.subjId = $("#subjID").val();
    subjInfo.date = $("#date").val();
    subjInfo.script = $("#script").val();

    // get rid of form
    $("#subjForm").remove();
    
    // Update subject info at top of page
    $("#subjInfo").html("Subj: " + subjInfo.subjId +
			"         Date: " + subjInfo.date +
			"         Script: " + subjInfo.script);

    // Start display of first story
    updateDisplay();
}

function updateStatus() {
    $("#expStatus").html("Story: " + stories[currentStory].storyId + "   Phase: " + phases[currentPhase]);
}

$("#nextButton").click(function(){
    updateDisplay();
});

function updateDisplay(){
    updateStatus();

    // get current story object
    var story = stories[currentStory];

    // update text depending on the phase and condition (set by the script)
    var phaseText = story.text[phases[currentPhase]];
    var storyCond = story.scriptConds[subjInfo.script];
    var includedText = [];
    phaseText.forEach(function(it) {
	if ((it.cond == storyCond || it.cond == "na")) {
	    includedText.push(it.text);
	}
    });
    $("#storyText").html(includedText.join("<br/>"));

    // set trial info in case we need to store a response
 
    // update images depending on the phase of the story 
    switch(currentPhase) {
    case 0: //intro
	if (currentStory > 0) {
	    resetDisplay();
	}
	$(".backgroundImg").attr("src",imageFiles[story.bg1]);
	$("#narrImg").attr("src",imageFiles[story.narrator]);
	break;
    case 1: //scene1
	$("#narrImg").attr("src",imageFiles[story.narrator]);
	$("#c1Img").attr("src",imageFiles[story.c1]);
	$("#c2Img").attr("src",imageFiles[story.c2]);
	break;
    case 2: //give1
	// need to change this to add a new image to the div, rather than just
	// change the source of an existing one (since this image will move)
	$("#objImg").attr({
	    "src" : imageFiles[story.giveObj1],
	    "ondragstart" : "drag(event)"
	});
	$(".char").attr({
	    "ondrop" : "drop(event)",
	    "ondragover" : "allowDrop(event)"
	});
	break;
    case 3: //give2
	$("#objImg").attr("src",imageFiles[story.giveObj2]);
 	break;
    case 4: //scene2
	$(".backgroundImg").attr("src",imageFiles[story.bg2]);
	break;
    }


    // advance phase, looping back to 0 and starting the next story if necessary
    if (currentPhase < 7) {
	currentPhase++;
    } else if (currentStory < 7) {
	currentStory++;
	currentPhase = 0;
    }
}

function resetDisplay(){
    var displayImages = ["#backgroundImg","#narrImg","#c1Img","#c2Img"]
    displayImages.forEach(function(it) {
	$(it).removeAttr("src");
    });
    var displayContainers = ["#narrTarget","#c1Target","#c2Target","#objStart"];
    displayContainers.forEach(function(it) {
	$(it).empty();
    });
}

function allowDrop(ev) {
    // should add something here to make the border glow or something when you hover over
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var draggedItemId = ev.dataTransfer.getData("text");
    console.log(draggedItemId, ev.target.id);
    // for some reason the img is getting chosen as the target rather than the div. may need to
    // put an overlapping div on top to catch the dragged item.
    ev.target.appendChild(document.getElementById(draggedItemId));
    recordResponse(draggedItemId, ev.target.id);
    ev.dataTransfer.clearData();
}

function recordResponse(obj, target) {
    var trialInfo = [subjInfo.subjId,
		     subjInfo.date,
		     subjInfo.script,
		     stories[currentStory].storyId,
		     phases[currentPhase],
		     stories[currentStory].scriptConds[subjInfo.script],
		     obj,
		     target];
    responses.push(trialInfo.toString());
    console.log(responses);
}

// function drawScene(background, chars) {
//     $("#characterCanvas").before(background);
//     var images = new Array();
//     var loadedImages = 0;
//     for (var c in chars) {
//         images[c] = new Image();
//         images[c].src = chars[c].imgSrc;
//         images[c].onload = function() {
//             if (++loadedImages >= chars.length) {
//                 for (var i in images) {
//                     character = chars[i];
//                     characterContext.drawImage(images[i], character.x, character.y, character.width, character.height);
//                 }
//             }
//         };
//     }
// }

