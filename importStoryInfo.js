var imageFiles = {};
var stories;

// create an associative array of image filenames
// has the form {Dora: "img/characters/Dora.png", Swiper: "...", ...}
Papa.parse("imageFiles.csv", {
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
Papa.parse("storyInfo.csv", {
    download: true,
    header: true,
    complete: function(results) {
	stories = results.data;
    }
});

// create a nested associative array of text for the stories
// first layer of keys is the storyIds ("1","2","3",...)
// second layer of keys is the story phases ("hi","scene1",...)
// each phase is associated with an ARRAY of sentences
// each sentence object includes properties like cond, order, text, etc.
// the information from the text hash then gets added to the storyArray,
// so that each story has a property "text" containing the associative array
// of the phases.
Papa.parse("storyText.csv", {
    download: true,
    header: true,
    complete: function(results) {
	var text = results.data;
	var textHash = {};
	text.forEach(function (it) {
	    if (!(it.storyId in textHash)) {
		textHash[it.storyId] = {};
	    }
	    if (it.phase in textHash[it.storyId]) {
		textHash[it.storyId][it.phase].push(it);
	    } else {
		textHash[it.storyId][it.phase] = [it];
	    }
	});
	stories.forEach(function (it) {
	    it.text = textHash[it.storyId];
	});
    }
});

// create an associative array of scripts: primary key is the StoryId,
// value is an associative array where the script name (a, b, block-d, block-i)
// is the key and the condition is the value.
Papa.parse("scripts.csv", {
    download: true,
    header: true,
    complete: function(results) {
	var scripts = results.data;
	stories.forEach(function (it) {
	    it.scriptConds = scripts[it.storyId];
	});
    }
});
	
