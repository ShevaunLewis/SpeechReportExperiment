var imageFiles = {};
var stories;

// create an associative array of image filenames
// has the form {Dora: "img/characters/Dora.png", Swiper: "...", ...}
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

// create an array of story objects
Papa.parse("expInfo/storyInfo.csv", {
    download: true,
    header: true,
    complete: function(results) {
	stories = results.data;
    }
});


// create a nested associative array of text for the stories
// first layer of keys is the storyIds ("1","2","3",...)
// second layer of keys is the story phases ("hi","scene1",...)
// third layer of keys is the cond
// add info to stories array
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
	stories.forEach(function (it) {
	    it.narration = narrHash[it.storyId];
	});
    }
});

// create an associative array of scripts: primary key is the StoryId,
// value is an associative array where the script name (a, b, block-d, block-i)
// is the key and the condition is the value.
Papa.parse("expInfo/scripts.csv", {
    download: true,
    header: true,
    complete: function(results) {
	var scripts = results.data;
	stories.forEach(function (it) {
	    it.scriptConds = scripts[it.storyId-1];
	});
    }
});

