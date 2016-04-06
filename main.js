var currentStory = 0;
var currentPhase = -1;
var phases = ["hi","scene1","give1","give2","scene2","take1","take2","end"];
var subjInfo = {};
var responses = [];

// keyboard shortcuts
$(document).keydown(function(event) {
    keyboardAction(event.which)
});

function keyboardAction(key) {
    if (key == 78) { //n
	advanceStory();
    } else if ((key >= 49 && key <= 56)) { //1-8
	goToStory(key-49);
    } else if (key == 69) { //e
	endExperiment();
    }
}

function goToStory(storyIndex) {
    currentStory = storyIndex;
    currentPhase = 0;
    updateDisplay();
}	   

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
    advanceStory();
}

function updateStatus() {
    $("#expStatus").html("Story: " + stories[currentStory].storyId + "   Phase: " + phases[currentPhase]);
}

$("#nextButton").click(advanceStory);

function advanceStory(){
    // advance phase, looping back to 0 and starting the next story if necessary
    if (currentPhase < 7) {
	currentPhase++;
	updateDisplay();
    } else if (currentStory < 7) {
	currentStory++;
	currentPhase = 0;
	updateDisplay();
    }
    else {
	endExperiment();
    }
}

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
 
    // update images depending on the phase of the story 
    switch(currentPhase) {
    case 0: //intro
	if (currentStory > 0) {
	    resetBackground();
	    resetObjs();
	}
	$("#backgroundImg").attr("src",imageFiles[story.bg1]);
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
	addGiveObj("giveObj2",imageFiles[story.giveObj2]);
	startDragging();
 	break;
    case 4: //scene2
	$(".dragObj").remove();
	$("#backgroundImg").attr("src",imageFiles[story.bg2]);
	addTakeObjs(imageFiles[story.takeObj],imageFiles[story.takeTarget]);
	break;
    case 5: //take1
	startDragging();
	$(".takeObjImg").attr("draggable","true");
	break;
    case 6: //take2
	startDragging();
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
    
    $("[ondragover]").removeAttr("ondragover","ondrop");
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
    $("[ondragover]").removeAttr("ondragover","ondrop");
    $("#takeGoal").attr({
	"ondragover" : "allowDrop(event)",
	"ondrop" : "drop(event)"
    });
}

function resetBackground(){
    var displayImages = ["#backgroundImg","#narrImg","#c1Img","#c2Img","#goalImg"]
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
    // source is the first ancestor that has an id (parent for give drags,
    // grandparent for take drags
    var source = ev.target.parentElement.id;
    if (source == "") {
	source = ev.target.parentElement.parentElement.id;
    }	
    ev.dataTransfer.setData("text", source);
    
    // highlight potential targets with yellow dashed border
    $("[ondragover]>img").css("border","medium dashed yellow");
}

function drop(ev) {
    ev.preventDefault();

    //collect drag information, record response
    var draggedItemSource = ev.dataTransfer.getData("text");
    ev.dataTransfer.clearData();
    var dropTarget = ev.currentTarget.id;
    recordResponse(draggedItemSource, dropTarget);
    
    //add dropped image to the .dropSpot div
    var draggedItem = $("#" + draggedItemSource + " .dragObj");
    $("#" + dropTarget + " .dropSpot").prepend(draggedItem);
    
    // get rid of border around potential targets
    $("[ondragover] img").css("border","none");

    // prevent additional dragging
    stopDragging();
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
    responses.push(trialInfo);
    console.log(responses);
}

function endExperiment() {
    $("#expStatus").html("Done");
    $("#storyText").remove();
    $("#main").html("<button id='resultsButton'>Get results!</button>");
    $("#resultsButton").click(writeResults);
}

function writeResults() {
    var csv = Papa.unparse({
	fields: ["subjId","date","script","storyId","phase","cond","objSource","target"],
	data: responses
    });
    var encodedUri = encodeURI(csv);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    var filename = "SR_" + subjInfo.subjId + ".csv";
    link.setAttribute("download", filename);
    link.click();
}
