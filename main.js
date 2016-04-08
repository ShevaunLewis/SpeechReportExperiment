var currentStory = 0;
var currentPhase = 0;
var phases = ["hi","friends","decide1","give1","give2",
	      "distribute","decide2","take1","still","take2","end"];
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
    } else if (key == 32) {//spacebar
	var audio = document.getElementById("narrationAudio");
	if (audio.paused) {
	    audio.play();
	} else {
	    audio.pause();
	}
    }
}

function goToStory(storyIndex) {
    currentStory = storyIndex;
    currentPhase = 0;
    playStory();
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

    $("#mainDisplay").show();
    
    // Update subject info at top of page
    $("#subjInfo").html("Subj: " + subjInfo.subjId +
			"         Date: " + subjInfo.date +
			"         Script: " + subjInfo.script);

    // Start display of first story
    playStory();
}

function updateStatus() {
    $("#expStatus").html("       Story: " + stories[currentStory].storyId +
			 "   Phase: " + phases[currentPhase]);
}

$("#nextButton").click(advanceStory);

// button navigation
$("#bb-nav-next").on("click touchstart", function() {
    $(".bb-bookblock").bookblock("next");
});

$("#bb-nav-prev").on("click touchstart", function() {
    $(".bb-bookblock").bookblock("prev");
});

// swipe navigation
var $slides = $(".bb-bookblock").children();

$slides.on( {
    "swipeleft" : function(event) {
	$(".bb-bookblock").bookblock("next");
    },
    "swiperight" : function(event) {
	$(".bb-bookblock").bookblock("prev");
    }
});

function advanceStory(){
    // advance phase, looping back to 0 and starting the next story if necessary
    if (currentPhase < 10) {
	currentPhase++;
	playStory();
    } else if (currentStory < 7) {
	currentStory++;
	currentPhase = 0;
	playStory();
    }
    else {
	endExperiment();
    }
}

function playStory() {
    var story = stories[currentStory];
    var phase = phases[currentPhase];
    var cond = story.scriptConds[subjInfo.script];

    if (["give1","give2","take1","take2"].indexOf(phase) > -1) {
	$("#narrationAudio").attr("onended", "startDragging()");
    } else {
	$("#narrationAudio").attr("onended", "advanceStory()");
    }
    updateVisuals(story, phase);
    updateNarration(story, phase, cond);
}

function updateNarration(story, phase, cond) {
    var narrArray = story.narration[phase];
    var narr;
    if (cond in narrArray) {
	narr = narrArray[cond];
    } else {
	narr = narrArray["na"];
    }
		
    $("#storyText").html(narr.text);
    $("#narrationAudio").attr("src", narr.audio);
}

function setVisuals(story) {
    $("#title h1").text(story.title);
    $("#backgroundImg").attr("src",imageFiles[story.bg1]);
    $("#narrImg").attr("src",imageFiles[story.narrator]);

    

function updateVisuals(story, phase) {
    updateStatus();
    
    switch(phase) {

    case "hi":
	//make sure the slate is clean
	resetBackground();
	resetObjs();

	//show narrator
	$("#backgroundImg").attr("src",imageFiles[story.bg1]);
	$("#narrImg").attr("src",imageFiles[story.narrator]);
	$("#page").children().fadeIn("fast");
	break;

    case "friends":
	//add c1 and c2
	$("#c1Img").attr("src",imageFiles[story.c1]);
	$("#c2Img").attr("src",imageFiles[story.c2]);
	break;

    case "give1":
	//show give1Obj
	addGiveObj("giveObj1",imageFiles[story.giveObj1]);
	addDropTargets(".char");
	break;
	
    case "give2":
	addGiveObj("giveObj2",imageFiles[story.giveObj2]);
	break;

    case "distribute":
	// get rid of give objects, change background, add take objects
	$(".dragObj").remove();
	$("#backgroundImg").attr("src",imageFiles[story.bg2]);
	addTakeObjs(imageFiles[story.takeObj]);
	break;

    case "decide2":
	// add goal object
	$("#goalImg").attr("src",imageFiles[story.takeTarget]);
	addDropTargets("#goalImg");
	break;

    case "take1":
	$(".char").droppable("destroy");
	break;

    case "take2":
	$("#goalImg").droppable("enable");
	break;

    case "end":
	$("#main").fadeOut("slow");
    }
}  

function addGiveObj(imgId,imgSrc) {
    var obj = new Image();
    obj.id = imgId;
    $("#objStart").prepend(obj);
    $("#" + imgId).attr({
	"src" : imgSrc,
	"class" : "dragObj"
    });
}

function addTakeObjs(objSrc) {
    var obj = new Image();
    obj.className ="dragObj";
    $(".char .dropSpot").prepend(obj);
    $(".dragObj").attr("src", objSrc);
}

function addDropTargets(targetSelector) {
    $(targetSelector).droppable({
	accept: ".dragObj",
	activate: function (event, ui) {
	    $("#" + event.target.id).css("border","medium dashed yellow");
	},
	deactivate: function ( event, ui) {
	    $("#" + event.target.id).css("border","none");
	},
	drop: function(event, ui) {
	    drop(event, ui);
	}
    });
}
	
function drop(ev, ui) {
    var source = ui.draggable[0].parentElement.id;
    if (source == "") {
	source = ui.draggable[0].parentElement.parentElement.id;
    }
    var target = ev.target.id;
    recordResponse(source, target);
    
    $(".dragObj").draggable("destroy");
    $("#" + ev.target.id).css("border","none");
    $("#" + ev.target.id).droppable("disable");
}

    
function startDragging() {
    $(".dragObj").draggable({
	containment: "document",
	revert: "invalid"
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
