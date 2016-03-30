var currentStory = 0;
var currentPhase = 0;
var phases = ["intro","scene1","give1","give2","scene2","take1","take2","end"];
var subjInfo = {};

// Collect subject information from form on start page
$("#submitForm").click(saveSubjInfo);

function saveSubjInfo() {
    //Collect information from form
    subjInfo.subjId = $("#subjID").val();
    subjInfo.date = $("#date").val();
    subjInfo.script = $("#script").val();
    //Update subject info at bottom of page
    $("#subjInfo").html("Subj: " + subjInfo.subjId + "   Date: " + subjInfo.date + "   Script: " + subjInfo.script);
    $("#subjForm").remove(); // get rid of form
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
    var story = stories[currentStory];
    console.log("Story: ", currentStory, "Phase: ", currentPhase);
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
    case 7:
	if (currentStory < 7) {
	    currentStory++;
	}
    }
    if (currentPhase < 7) {
	currentPhase++;
    } else {
	currentPhase = 0;
    }
    console.log("Story: ", currentStory, "Phase: ", currentPhase);
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

// function showIntro() {
//     var story = stories[currentStory];
//     $(".backgroundImg").attr("src",imageFiles[story.bg1]);
//     $("#narrImg").attr("src",imageFiles[story.narrator]);
//     $("#nextButton").click(function(){
//         showScene1(story);
//     });
//     updateStatus();
// }

// function showScene1() {
//     var story = stories[currentStory];
//     currentPhase = "scene1";
//     $("#narrImg").attr("src",imageFiles[story.narrator]);
//     $("#c1Img").attr("src",imageFiles[story.c1]);
//     $("#c2Img").attr("src",imageFiles[story.c2]);
//     $("#nextButton").click(function(){
// 	showGiveTrial(1);
//     });
//     updateStatus();
// }

// function showGiveTrial(trialnum) {
//     var story = stories[currentStory];
//     if (trialnum == 1) {
// 	currentPhase = "give1";
// 	$("#objImg").attr("src",imageFiles[story.giveObj1]);
// 	$("#nextButton").click(function(){
// 	    showGiveTrial(2);
// 	});
//     } else if (trialnum == 2) {
// 	currentPhase = "give2";
// 	$("#objImg").attr("src",story.giveObj2);
// 	$("#nextButton").click(function(){
// 	    showScene2();
// 	});
//     }
//     updateStatus();
// }

// function showScene2() {
//     var story = stories[currentStory];
//     currentPhase = "scene2"
//     $("#nextButton").click(function(){
// 	showTakeTrial(1);
//     });
//     updateStatus();
// }

// function showTakeTrial(trialnum) {
//     var story = stories[currentStory];
//     if (trialnum == 1) {
// 	currentPhase = "take1";
// 	$("#nextButton").click(function() {
// 	    showTakeTrial(2);
// 	});
//     } else if (trialnum == 2) {
// 	currentPhase = "take2";
// 	$("#nextButton").click(function() {
// 	    showEnd();
// 	});
//     }
//     updateStatus();
// }

// function showEnd() {
//     var story = stories[currentStory];
//     currentPhase = "end";
//     updateStatus();
//     $("#nextButton").click(function() {
// 	if (currentStory < 8) {
// 	    currentStory++;
// 	    showIntro();
// 	} else {
// 	    endExperiment();
// 	}
//     });
// }

// function endExperiment() {
    
    
// function showIntro(storyId) {
//     $(".backgroundImg").attr("src",storyId.introBg);
//     $("#narrImg").attr("src",storyId.narr);
// }
//
// function showScene1(story) {
//     $(".backgroundImg").attr("src",storyId.mainBg);
//     $("#narrImg").attr("src",storyId.narr);
//     $("#c1Img").attr("src",storyId.c1);
//     $("#c2Img").attr("src",storyId.c2);
// }
//
// function giveTrial(obj, objStartLoc, objTargetLocs, sentence) {
//     this.obj = obj;
//     this.sentence = sentence;
// }

// function takeTrial(obj, objStartLocs, objTargetLoc, sentence) {
//     this.obj = obj;
//     this.objStartLoc = objStartLoc;
//     this.objTargetLocs = objTargetLocs;
//     this.sentence = sentence;
//
// function sentence(sentType, directText, directAudio, indirectText, indirectAudio



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

