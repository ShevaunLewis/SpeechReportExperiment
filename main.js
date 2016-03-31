var currentStory = 0;
var currentPhase = 0;
var phases = ["hi","scene1","give1","give2","scene2","take1","take2","end"];
var subjInfo = {};

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
	$("#objImg").attr("src",imageFiles[story.giveObj1]);
	break;
    case 3: //give2
	$("#objImg").attr("src",imageFiles[story.giveObj2]);
 	break;
    case 4: //scene2
	$(".backgroundImg").attr("src",imageFiles[story.bg2]);
	break;
    }

    // update text depending on the phase and condition (set by the script)
    var phaseText = story.text[phases[currentPhase]];
    console.log(phaseText);
    var storyCond = story.scriptConds[subjInfo.script];
    console.log(storyCond);
    var includedText = [];
    phaseText.forEach(function(it) {
	if ((it.cond == "na") || (it.cond == storyCond)) {
	    includedText.push(it.text);
	}
    });
    console.log(includedText)
    $("#storyText").html(includedText.join("<br/>"));

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

