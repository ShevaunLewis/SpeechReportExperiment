var subjInfo = {};
var responses = [];

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
    $(".book").show();
    setupStory(0);
    //playStory();
}

function setupStory(storyIndex) {
    var story = stories[storyIndex];
    $("#title h1").text(story.title);
    $("#introNarr img").attr("src",imageFiles[story.narrator]);
    $("#scene1 .backgroundImg").attr("src",imageFiles[story.bg1]);
    $(".narrator img").attr("src",imageFiles[story.narrator]);
    $(".c1 img").attr("src",imageFiles[story.c1]);
    $(".c2 img").attr("src",imageFiles[story.c2]);
    $("#scene2 .backgroundImg").attr("src",imageFiles[story.bg2]);

    $("#intro audio").attr({
	    "src" : story.narration.hi["na"].audio,
	     "onended" : "next()"
	});
	$("#scene2 audio").attr({
	    "src" : story.narration.friends["na"].audio//,
	    //"onended" : "sceneUpdate('distribute')"
	});

}

function startPage(page, isLimit) {
//     var slideSelector = "#" + $slides[page].id;
//     var audio = $(slideSelector + " .narrationAudio");
//     console.log(audio);
//     audio.play;
}
