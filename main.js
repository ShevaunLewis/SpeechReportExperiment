

// Module for subject info form
var SubjForm = function(){
    var init = function(){
	$("#submitForm").click(function() {
	    saveInfo();
	    updateSubjInfoBar();
	    hideForm();
	    ExpInfo.init();
	    RunInfo.init();
	    Book.init();
	    Book.startStory(0);
	});
    };

    var subjInfo = {};
    var saveInfo = function(){
	subjInfo = {
	    "subjId" : $("#subjID").val();
	    "date" : $("#date").val();
	    "script" : $("#script").val();
	}
    };

    var hideForm = function(){
	$("#subjForm").remove();
    };

    var updateSubjInfoBar = function() {
	$("#subjInfo").html("Subj: " + subjInfo.subjId +
			    "         Date: " + subjInfo.date +
			    "         Script: " + subjInfo.script);
    };

    return { init:init, subjInfo:subjInfo };
}();

var RunInfo = function() {
    var subjInfo;
    var stories;
    var images;
    var responses = [];

    var init = function() {
	subjInfo = SubjForm.subjInfo;
	stories = ExpInfo.storyArray;
	images = ExpInfo.images;
    };

    var getStory = function(storyIndex) {
	var s = stories[storyIndex];
	var cond = s.scriptConds[subjInfo.script];
	var audio = {};
	s.narration.forEach(function (it) {
	    audio[it] = ("na" in it) ? it.na.audio : it[cond].audio;
	});
	var story = {
	    title : s.title,
	    narrator : images[s.narrator],
	    bg1 : images[s.bg1],
	    c1 : images[s.c1],
	    c2 : images[s.c2],
	    giveObj1 : images[s.giveObj1],
	    giveObj2 : images[s.giveObj2],
	    bg2 : images[s.bg2],
	    takeTarget : images[s.takeTarget],
	    takeObj : images[s.takeObj],
	    audio : audio
	}

	return story;
    };	    	    
	
    var recordResponse = function(objSource, target) {
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
    };

    var writeResults = function () {
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
    };

    return { init:init, getStory:getStory, recordResponse:recordResponse, writeResults:writeResults }
}();


var ExpInfo = function() {
    var imageFiles; //associative array of image names and filenames
    var storyArray; //array of story objects

    var init = function() {
	getImageFiles();
	getStoryInfo();
    };

    var getImageFiles = function(){
	Papa.parse("expInfo/imageFiles.csv", {
	    download: true,
	    header: true,
	    complete: function(results) {
		var imageArray = results.data;
		imageArray.forEach(function (it) {
		    imageFiles[it.name] = it.imgFile;
		});
	    }
	});
    };

    var getStoryInfo = function(){
	// create an array of story objects
	Papa.parse("expInfo/storyInfo.csv", {
	    download: true,
	    header: true,
	    complete: function(results) {
		storyArray = results.data;
	    }
	});

	// add story narration
	Papa.parse("expInfo/storyText.csv", {
	    download: true,
	    header: true,
	    complete: function(results) {
		var narration = results.data;
		var narrHash = {};
		narration.forEach(function (it) {
		    var narrInfo = {text: it.text, audio: it.audioFile};
		    if (!(it.storyId in narrHash)) {
			narrHash[it.storyId] = {};
		    }
		    if (!(it.phase in narrHash[it.storyId])) {
			narrHash[it.storyId][it.phase] = {};
		    }
		    narrHash[it.storyId][it.phase][it.cond] = narrInfo;
		});
		storyArray.forEach(function (it) {
		    it.narration = narrHash[it.storyId];
		});
	    }
	});

	// add condition for each script
	Papa.parse("expInfo/scripts.csv", {
	    download: true,
	    header: true,
	    complete: function(results) {
		var scripts = results.data;
		storyArray.forEach(function (it) {
		    it.scriptConds = scripts[it.storyId-1];
		});
	    }
	});
    };

    return { init:init, imageFiles:imageFiles, storyArray:storyArray, subjInfo:subjInfo }
}();
	
    
var Book = function() {
    var story;
    var storyIndex = 0;
    
    var init = function(storyIndex) {
	setTransitions();
    };

    var startStory = function() {
	story = RunInfo.getStory(storyIndex);
	setScene();
	setAudio();
	$storyAudio.hi.play();
    };

    //***** Story progression *****//
    // (determined by transitions after narration audio segments)
    var setTransitions = function() {
	$storyAudio.waitAfterAudio.attr("onended", "wait()");
	$storyAudio.goAfterAudio.attr("onended", "nextStep()");
	$storyAudio.dragAfterAudio.attr("onended", "startDragging()");
    };

    var steps = ["hi","friends","decide1","give1","give2",
		 "distribute","decide2","take1","still","take2",
		 "end"];
    var stepIndex = 0;

    var startStep = function() {
	var step = steps[stepIndex];

	//add visuals if necessary
	switch (step) {
	case "give1":
	    $scene.giveObj1.show();
	    break;
	case "give2":
	    $scene.giveObj2.show();
	    break;
	case "decide2":
	    $scene.takeObjs.show();
	    break;
	}

	//play audio
	$storyAudio[step].play();
    };
	    
    var nextStep = function() {
	if (stepIndex < steps.length) {
	    stepIndex++;
	    startStep();
	}
    };

    var wait = function() {
	if (stepIndex < steps.length) {
	    stepIndex++;
	} else {
	    stepIndex = 0;
	    storyIndex++;
	}
    };

    var nextPage = function() {
	if (stepIndex < steps.length) {
	    stepIndex++;
	    $("bb-bookblock").bookblock("next");
	    startStep();
	} 
    };


    //***** Visuals *****//
    
    var $scene = {
	title : $("#title h1"),
	introNarr : $("#introNarr img"),
	scene1Bg : $("#scene1 .backgroundImg"),
	narr : $(".narrator img"),
	c1 : $(".c1 img"),
	c2 : $(".c1 img"),
	giveObj1 : $("#giveObj1"),
	giveObj2 : $("#giveObj2"),
	scene2Bg : $("#scene2 .backgroundImg"),
	takeGoal : $("#takeGoal img"),
	takeObjs : $("scene2 .dragObj")
    };

    var setScene = function () {	
	$scene.title.text(story.title);
	$scene.introNarr.attr("src",story.narrator);

	$scene.scene1Bg.attr("src",story.bg1);
	$scene.narr.attr("src",story.narrator);
	$scene.c1.attr("src",story.c1);
	$scene.c2.attr("src",story.c2);
	$scene.giveObj1.attr("src", story.giveObj1);
	$scene.giveObj2.attr("src",story.giveObj2);
	addDropTargets("#scene1 .char");

	$scene.scene2Bg.attr("src",story.bg2);
	$scene.takeGoal.attr("src",story.takeTarget);
	addDropTargets("#takeGoal");
	$scene.takeObjs.attr("src",story.takeObj);
	$(".dragObj").hide();
	$("#takeGoal").hide();
	$(".doneButton").hide();
    };

    // Drag and drop functionality //    
    var addDropTargets = function(targetSelector) {
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
    };

    var drop = function(ev, ui) {
	var source = ui.draggable[0].parentElement.id;
	if (source == "") {
	    source = ui.draggable[0].parentElement.parentElement.id;
	}
	var target = ev.target.id;
	recordResponse(source, target);

	$("#" + target).css("border","none");

	$(".doneButton").show();
	$(".doneButton").click(function(){
	    doneDragging(target)
	});
    };
    
    var doneDragging = function(droppedTarget) {
	var step = steps[stepIndex];
	$(".dragObj").draggable("destroy");
	$("#" + droppedTarget).droppable("disable");
	if ((step == "give1") || (step == "take1")) {
	    nextStep();
	} else {
	    nextPage();
	}
    };

    var startDragging = function() {
	$(".dragObj").draggable({
	    containment: "document",
	    revert: "invalid"
	});
    }

    //***** Narration audio *****//
    
    var $storyAudio = {
	hi : $("#introAudio"),
	friends : $("#friendsAudio"),
	decide1 : $("#decide1Audio"),
	give1 : $("#give1Audio"),
	give2 : $("#give2Audio"),
	distribute : $("#distributeAudio"),
	decide2 : $("#decide2Audio"),
	take1 : $("#take1Audio"),
	still : $("#stillAudio"),
	take2 : $("#take2Audio"),
	end : $("#endAudio"),

	waitAfterAudio: $("#introAudio, #end")
	goAfterAudio : $("#friendsAudio, #decide1Audio, #distributeAudio, #decide2Audio, #stillAudio"),
	dragAfterAudio: $("#give1, #give2, #take1, #take2")
    }; 

    var setAudio () {
	$storyAudio.forEach(function (it) {
	    it.attr("src", story.audio[it]);
	});
    };


    // var updateStatus = function(step) {
    // 	$("#expStatus").html("       Story: " + stories[storyIndex].storyId +
    // 			    "       Phase: " + step);
    // }

    return {init:init, startStory:startStory};
}();





function endExperiment() {
    $("#expStatus").html("Done");
    $("#storyText").remove();
    $("body").html("<button id='resultsButton'>Get results!</button>");
    $("#resultsButton").click(writeResults);
}

