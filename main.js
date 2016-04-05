var currentStory = 0;
var currentPhase = -1;
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
    // advance phase, looping back to 0 and starting the next story if necessary
    if (currentPhase < 7) {
	currentPhase++;
    } else if (currentStory < 7) {
	currentStory++;
	currentPhase = 0;
    }
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
 
    // update images depending on the phase of the story 
    switch(currentPhase) {
    case 0: //intro
	if (currentStory > 0) {
	    resetBackground();
	    resetObjs();
	}
	$(".backgroundImg").attr("src",imageFiles[story.bg1]);
	$("#narrImg").attr("src",imageFiles[story.narrator]);
	$("#main").children().fadeIn("fast");
	break;
    case 1: //scene1
	$("#narrImg").attr("src",imageFiles[story.narrator]);
	$("#c1Img").attr("src",imageFiles[story.c1]);
	$("#c2Img").attr("src",imageFiles[story.c2]);
	break;
    case 2: //give1
	addGiveObj("giveObj1",imageFiles[story.giveObj1]);
	startDragging();
	break;
    case 3: //give2
	stopDragging();
	addGiveObj("giveObj2",imageFiles[story.giveObj2]);
	startDragging();
 	break;
    case 4: //scene2
	stopDragging();
	$(".dragObj").remove();
	$(".backgroundImg").attr("src",imageFiles[story.bg2]);
	addTakeObjs(imageFiles[story.takeObj],imageFiles[story.takeTarget]);
	break;
    case 5: //take1
	startDragging();
	$(".takeObjImg").attr("draggable","true");
	break;
    case 6: //take2
	$("#takeTarget").children().attr("draggable","false");
	break;
    case 7: //end
	$("#main").children().fadeOut("slow");
    }    
}

function addGiveObj(imgId,imgSrc) {
    var obj = new Image();
    obj.id = imgId;
    $("#objStart").prepend(obj);
    $("#" + imgId).attr({
	"src" : imgSrc,
	"class" : "dragObj",
	"draggable" : "false",
	"ondragstart" : "drag(event)"
    });
    $(".char").not(":has(.dragObj)").attr({
	"ondragover" : "allowDrop(event)",
	"ondrop" : "drop(event)"
    });
}

function startDragging() {
    $(".dragObj").attr("draggable","true");
}

function stopDragging() {
    $(".dragObj").attr("draggable","false");
    $("[ondragover]").removeAttr("ondragover","ondrop");
}

function addTakeObjs(objSrc,targetSrc) {
    var obj = new Image();
    obj.className ="dragObj";
    $(".char .dropSpot").prepend(obj);
    $(".dragObj").attr({
	"src" : objSrc,
	"draggable" : "false",
	"ondragstart" : "drag(event)"
    });
    $("#goalImg").attr("src",targetSrc);
    $("#takeGoal").attr({
	"ondragover" : "allowDrop(event)",
	"ondrop" : "drop(event)"
    });
}

function resetBackground(){
    var displayImages = ["#backgroundImg","#narrImg","#c1Img","#c2Img"]
    displayImages.forEach(function(it) {
	$(it).removeAttr("src");
    });
}

function resetObjs(){
    $(".dragObj").remove();
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    //need to adjust to work for take objects coming from .dropSpots
    ev.dataTransfer.setData("text", ev.target.parentElement.id);
    $("[ondragover] img").css("border","medium dashed yellow");
}

function drop(ev) {
    ev.preventDefault();

    //collect drag information, record response
    var draggedItemSource = ev.dataTransfer.getData("text");
    ev.dataTransfer.clearData();
    var dropTarget = ev.currentTarget.id;
    recordResponse(draggedItemSource, dropTarget);
    
    //add dropped image to the .dropSpot div
    var draggedItem = $("#" + draggedItemSource).children()[0];
    $("#" + dropTarget).children(".dropSpot").prepend(draggedItem);
    
    // get rid of border around potential targets
    $("[ondragover] img").css("border","none");
}

function recordResponse(objSource, target) {
    var trialInfo = [subjInfo.subjId,
		     subjInfo.date,
		     subjInfo.script,
		     stories[currentStory].storyId,
		     phases[currentPhase],
		     stories[currentStory].scriptConds[subjInfo.script],
		     objSource,
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

