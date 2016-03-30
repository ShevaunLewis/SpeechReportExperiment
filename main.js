//samples

var path = "img/backgrounds/path.png";
var dora = "img/characters/Dora.png";
var swiper = "img/characters/Swiper.png";
var boots = "img/characters/Boots.png";
var basket = "img/objects/basket.png";
var blanket = "img/objects/blanket.png";
var sandwich = "img/objects/sandwich.png";
var story1 = new Story(dora, swiper, boots, path, path, basket, blanket, sandwich)


function updateText() {
    $("#status").html("SubjID: " + subjID + "<br/>");
}

// Collect subject information from form on start page
$("#submitForm").click(saveSubjInfo);

var subjID = "not set yet";
var date, script;

function saveSubjInfo() {
    subjID = $("#subjID").val();
    date = $("#date").val();
    script = $("#script").val();
    updateText();
    $("#subjForm").remove(); // get rid of form
    showIntro(story1);
}




function showScene1(story) {
    $(".backgroundImg").attr("src",story.mainBg);
    $("#narrImg").attr("src",story.narr);
    $("#c1Img").attr("src",story.c1);
    $("#c2Img").attr("src",story.c2);
    $("#nextButton").click(function(){
	showGiveTrial(story,1);
    });
}

function showIntro(story) {
    $(".backgroundImg").attr("src",story.introBg);
    $("#narrImg").attr("src",story.narr);
    $("#nextButton").click(function(){
        showScene1(story);
    });
}

function showGiveTrial(story,trialnum) {
    if (trialnum == 1) {
	$("#objImg").attr("src",story.giveObj1);
	$("#nextButton").click(function(){
	    showGiveTrial(story,2);
	});
    } else if (trialnum == 2) {
	$("#objImg").attr("src",story.giveObj2);
	$("#nextButton").click(function(){
	    showScene2(story);
	});
    }
}

function showScene2(story) {
}

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

