var currentStory = 0;
var currentPhase = 0;
var phases = ["hi","friends","decide1","give1","give2",
	      "distribute","decide2","take1","still","take2","end"];
var subjInfo = {};
var responses = [];

$(function() {
	$('#bb-bookblock').bookblock(// {
// 	    onEndFlip: function(page, isLimit) {
// 	        startPage(page, isLimit);
// 	    }
// 	}
);
});


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
    } // else if (key == 32) {//spacebar
// 	var $audio = $(".narrationAudio");
// 	if (audio.paused) {
// 	    audio.play();
// 	} else {
// 	    audio.pause();
// 	}
//     }
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


    // Update subject info at top of page
    $("#subjInfo").html("Subj: " + subjInfo.subjId +
			"         Date: " + subjInfo.date +
			"         Script: " + subjInfo.script);

    // Start display of first story
    setupStory(stories[0]);
    $("#mainDisplay").show();

    //playStory();
}

function updateStatus() {
    $("#expStatus").html("       Story: " + stories[currentStory].storyId +
			 "   Phase: " + phases[currentPhase]);
}

$("#nextButton").click(advanceStory);

// ***** navigation ******
function next() {
    $(".bb-bookblock").bookblock("next");
}

function previous() {
    $(".bb-bookblock").bookblock("prev");
}

// button navigation
$("#bb-nav-next").on("click touchstart", function() {
    next();
});

$("#bb-nav-prev").on("click touchstart", function() {
    previous();
});

// swipe navigation
var $slides = $(".bb-bookblock").children();

$slides.on( {
    "swipeleft" : function(event) {
	next();
    },
    "swiperight" : function(event) {
	previous();
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


function setupStory(story) {
    $("#title h1").text(story.title);
    $("#introNarr img").attr("src",imageFiles[story.narrator]);
    $("#scene1 .backgroundImg").attr("src",imageFiles[story.bg1]);
    $(".narrator img").attr("src",imageFiles[story.narrator]);
    $(".c1 img").attr("src",imageFiles[story.c1]);
	$(".c2 img").attr("src",imageFiles[story.c2]);
	$("#scene2 .backgroundImg").attr("src",imageFiles[story.bg2]);
	$(".doneButton").hide();

// 	$("#intro audio").attr({
// 	    "src" : story.narration.hi["na"].audio,
// 	     "onended" : "next()"
// 	});
// 	$("#scene2 audio").attr({
// 	    "src" : story.narration.friends["na"].audio,
// 	    "onended" : "sceneUpdate('distribute')"
// 	});

}

function startPage(page, isLimit) {
    var slideSelector = "#" + $slides[page].id;
    $(slideSelector + " .narrationAudio").play();
}


function sceneUpdate(updateID) {
    switch (updateID) {

    case "distribute":
        $("#scene2 audio").attr({
	        "src" : story.narration.distribute["na"].audio,
	        "onended" : "sceneUpdate('give1')"
	    });

    case "give1":
        addGiveObj("giveObj1",imageFiles[story.giveObj1]);
	    addDropTargets(".char");
	    $(".doneButton").click(doneDragging("give2"));
	    $("#scene2 audio").attr({
	        "src" : story.narration.give1[story.scriptConds[subjInfo.script]].audio,
	        "onended" : "startDragging()"
	    });

    case "give2":
	    addGiveObj("giveObj2",imageFiles[story.giveObj2]);
	    $(".doneButton").click(next());
	    $("#scene2 audio").attr({
	        "src" : story.narration.give2[story.scriptConds[subjInfo.script]].audio,
	        "onended" : "startDragging()"
	    });
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

    $("#" + target).css("border","none");

    $(".doneButton").show();
}

function doneDragging(nextScene) {
    $(".dragObj").draggable("destroy");
    $("#" + ev.target.id).droppable("disable");
    sceneUpdate(nextScene);
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
