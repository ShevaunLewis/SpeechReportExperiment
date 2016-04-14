// notes:
// fix recordResponse for take actions
// add ending for experiment
// add status bar update
// fix handling of multiple drags in one response
// reset positions of dragged elements after each story
// fix display of characters relative to background/scene
// make sure audio restarts if you go back

// Module for subject info form
var SubjForm = (function () {
  var init = function () {
    initFormatting()
    $('#submitForm').click(function () {
      saveInfo()
      updateSubjInfoBar()
      hideForm()
      RunInfo.setSubjInfo(subjInfo)
      $(".book").show()
      Exp.startExp()
    })
  }
  var initFormatting = function () {
    $('#script').buttonset()
    $('#date').datepicker()
    $('button').button()
  }

  var subjInfo = {}
  var saveInfo = function () {
    subjInfo = {
      'subjId': $('#subjID').val(),
      'date': $('#date').val(),
      'script': $('input[name="script"]').val()
    }
  }

  var hideForm = function () {
    $('#subjForm').remove()
  }

  var updateSubjInfoBar = function () {
    $('#subjInfo').html('Subj: ' + subjInfo.subjId +
      '         Date: ' + subjInfo.date +
      '         Script: ' + subjInfo.script)
  }

  return { init: init, subjInfo: subjInfo }
}())

//Module for run info
var RunInfo = (function () {
  var subjInfo
  var stories
  var images
  var responses = []

  var setExpInfo = function(s, i) {
    stories = s
    images = i
  }

  var setSubjInfo = function(si) {
    subjInfo = si
  }

  var getStory = function (storyIndex) {
    var s = stories[storyIndex]
    var cond = s.scriptConds[subjInfo.script]
    var audio = {}
    for (var line in s.narration) {
      var conds = s.narration[line]
      audio[line] = ('na' in conds)
	? conds.na.audio
	: conds[cond].audio
    }
    var story = {
      title: s.title,
      narrator: images[s.narrator],
      bg1: images[s.bg1],
      c1: images[s.c1],
      c2: images[s.c2],
      giveObj1: images[s.giveObj1],
      giveObj2: images[s.giveObj2],
      bg2: images[s.bg2],
      takeTarget: images[s.takeTarget],
      takeObj: images[s.takeObj],
      audio: audio
    }

    return story
  }

  var recordResponse = function (storyIndex, step, objSource, target) {
    var trialInfo = [subjInfo.subjId,
      subjInfo.date,
      subjInfo.script,
      stories[storyIndex].storyId,
      step,
      stories[storyIndex].scriptConds[subjInfo.script],
      objSource,
      target]
    responses.push(trialInfo)
    console.log(responses)
  }

  var writeResults = function () {
    var csv = Papa.unparse({
      fields: ['subjId', 'date', 'script', 'storyId', 'phase', 'cond',
        'objSource', 'target'],
      data: responses
    })
    var encodedUri = encodeURI(csv)
    var link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    var filename = 'SR_' + subjInfo.subjId + '.csv'
    link.setAttribute('download', filename)
    link.click()
  }

  return { setExpInfo: setExpInfo, setSubjInfo: setSubjInfo,
	   getStory: getStory, recordResponse: recordResponse,
	   writeResults: writeResults }
}())

// Module for importing data from CSV files
var ExpInfo = (function () {
  var imageFiles = {}
  var storyArray = []

  var init = function() {
    getImageFiles()
    getStoryInfo()
  }

  var getImageFiles = function () {
    Papa.parse('expInfo/imageFiles.csv', {
      download: true,
      header: true,
      complete: function (results) {
	var imageArray = results.data
	imageArray.forEach(function (it) {
          imageFiles[it.name] = it.imgFile
        })
      }
    })
  }

  var getStoryInfo = function () {
    
    // Create an array of story objects
    Papa.parse('expInfo/storyInfo.csv', {
      download: true,
      header: true,
      complete: function (results) {
        storyArray = results.data
	parseStoryText()
      }
    })
  }

  var parseStoryText = function () {

    // Add story narration
    Papa.parse('expInfo/storyText.csv', {
      download: true,
      header: true,
      complete: function (results) {
        var narration = results.data
        var narrHash = {}
        narration.forEach(function (it) {
          var narrInfo = { text: it.text, audio: it.audioFile }
          if (!(it.storyId in narrHash)) {
            narrHash[it.storyId] = {}
          }
          if (!(it.phase in narrHash[it.storyId])) {
            narrHash[it.storyId][it.phase] = {}
          }
          narrHash[it.storyId][it.phase][it.cond] = narrInfo
        })
        storyArray.forEach(function (it) {
          it.narration = narrHash[it.storyId]
        })
	parseScripts()
      }
    })
  }

  var parseScripts = function () {

    // Add condition for each script
    Papa.parse('expInfo/scripts.csv', {
      download: true,
      header: true,
      complete: function (results) {
        var scripts = results.data
        storyArray.forEach(function (it) {
          it.scriptConds = scripts[it.storyId - 1]
        })

	// set RunInfo only after this has completed.
	RunInfo.setExpInfo(storyArray,imageFiles)
      }
    })
  }

  return { init: init }
}())

// Module for running experiment
var Exp = (function () {
  var storyIndex = 0

  var init = function () {
    $('img').attr('draggable', 'false')
    setTransitions()
    $('#bb-bookblock').bookblock({
      speed: 700,
      shadowSides: 0.8,
      shadowFlip: 0.7,
      onBeforeFlip: function (page) {
	$(".bb-item audio").each(function () {
	  this.pause()
	})
      }
    })
    $('.book').hide()
    initNav()
  }

  /********** Story navigation ************/
  initNav = function () {
    // Add navigation buttons
    $('#nextPage').on('click touchstart', function () {
      go('next')
    })

    $('#prevPage').on('click touchstart', function () {
      go('prev')
    })

    $('#nextStory').on('click touchstart', function() {
      nextStory()
    })

    // Add keyboard navigation
    $(document).keydown(function (e) {
      var keyCode = e.keyCode || e.which,
        arrow = {
          left: 37,
          up: 38,
          right: 39,
          down: 40
      }

      switch ( keyCode ) {
      case arrow.left:
        go('prev')
        break
      case arrow.right:
        go('next')
        break
      case arrow.down:
	nextStory()
	break
      case arrow.up:
	prevStory()
      }
    })
  }
  
  var go = function(direction) {
    //Determine next page before flipping starts
    var p = newPage(direction)

    //Turn to appropriate page
    $('#bb-bookblock').bookblock(direction)

    //Start story
    startPage(p)

  }

  var nextStory = function() {
    if (storyIndex < 7) {
      storyIndex++
      setStory()
      go('first')
    } else {
      endExperiment()
    }
  }

  var prevStory = function() {
    if (storyIndex > 0) {
      storyIndex--
    }
    setStory()
    go('first')
  }
    
  var newPage = function (direction) {
    var pages = ['intro','scene1','scene2','end']
    var currentPage = $(".bb-item[style='display: block;']").attr('id')
    switch (direction) {
    case 'next':
      return pages[pages.indexOf(currentPage) + 1]
      break
    case 'prev':
      return pages[pages.indexOf(currentPage) - 1]
      break
    case 'first':
      return 'intro'
    }
  }
    
  var swipeNav = function (turnOn) {
    if (turnOn) {
      $('.bb-item').on({
	'swipeleft': function (event) {
	  go('next')
	},
	'swiperight': function (event) {
	  go('prev')
	}
      })
    } else {
      $('.bb-item').off('swipeleft swiperight')
    }
  }

  var setNav = function (p) {
    switch (p) {
    case 'intro':
      $('#prevPage').attr('disabled',true)
      $('#nextPage').removeAttr('disabled')
      $('#nextStory').hide()
      break
    case 'end':
      $('#nextPage').attr('disabled',true)
      $('#nextStory').show()
      break
    default:
      $('#nextPage').removeAttr('disabled')
      $('#prevPage').removeAttr('disabled')
    }
  }

  /************ Playing story *************/
  // Start Experiment (public)
  var startExp = function () {
    setStory()
    startPage('intro')
  }

  // Set story visuals and audio
  var setStory = function () {
    //Remove positioning of .dragObj in case they were dragged before
    $('.dragObj').removeAttr('style')
    
    var story = RunInfo.getStory(storyIndex)
    setScene(story)
    setAudio(story)
  }

  // Start audio for page
  var startPage = function (pageName) {
    swipeNav(true)
    setNav(pageName)
    
    stepIndex = 0

    //add status bar update

    playNarration(step(pageName))      
  }		

  // Within-page progress
  var stepIndex = 0 

  var step = function (pageName) {
    var pages = {intro: ['hi'],
		 scene1: ['friends', 'decide1', 'give1', 'give2'],
		 scene2: ['distribute', 'decide2', 'take1', 'still', 'take2'],
		 end: ['end']}
    return pages[pageName][stepIndex]
  }

  var currentPage = function() {
    return $(".bb-item[style='display: block;']").attr('id')
  }
  
  var setTransitions = function () {
    $storyAudio.goAfterAudio.on('ended', function() {
      nextStep()
    })
    $storyAudio.dragAfterAudio.on('ended', function() {
      startDragging()
    })
  }

  var nextStep = function () {
    stepIndex++
    var s = step(currentPage())

    // Add visuals if necessary
    switch (s) {
    case 'give1':
      $('#giveObj1').show()
      break
    case 'give2':
      $('#giveObj2').show()
      break
    case 'decide2':
      $scene.takeGoal.show()
      $scene.takeObjs.show()
      break
    }

    // Play audio
    playNarration(s)
  }

  // ******** Story Visuals *********//
  var $scene = {
    title: $('#title h1'),
    introNarr: $('#introNarr img'),
    scene1Bg: $('#scene1 .backgroundImg'),
    narr: $('.narrator img'),
    c1: $('.c1 img'),
    c2: $('.c2 img'),
    giveObj1: $('#giveObj1'),
    giveObj2: $('#giveObj2'),
    scene2Bg: $('#scene2 .backgroundImg'),
    takeGoal: $('#takeGoal img'),
    takeObjs: $('#scene2 .dragObj')
  }

  var setScene = function (story) {
    $scene.title.text(story.title)
    $scene.introNarr.attr('src', story.narrator)

    $scene.scene1Bg.attr('src', story.bg1)
    $scene.narr.attr('src', story.narrator)
    $scene.c1.attr('src', story.c1)
    $scene.c2.attr('src', story.c2)
    $scene.giveObj1.attr('src', story.giveObj1)
    $scene.giveObj2.attr('src', story.giveObj2)

    $scene.scene2Bg.attr('src', story.bg2)
    $scene.takeGoal.attr('src', story.takeTarget)
    addDropTargets('#scene1 .char, #takeGoal, .charObj')
    $('.charObj').droppable('disable')
    $scene.takeObjs.attr('src', story.takeObj)
    $('#scene1 .dragObj').hide()
    $scene.takeGoal.hide()
    $('.doneButton').hide()
  }

  // Drag and drop functionality //
  var addDropTargets = function (targetSelector) {
    $(targetSelector).droppable({
      accept: '.dragObj',
      activate: function (event, ui) {
        event.target.style.border = 'medium dashed yellow'
      },
      deactivate: function (event, ui) {
        event.target.style.border = 'none'
      },
      drop: function (event, ui) {
        drop(event, ui)
      },
      tolerance: 'touch'
    })
  }

  var drop = function (ev, ui) {
    var dragged = ui.draggable[0]
    var sourceId = dragged.parentElement.id
    var $source = $('#' + sourceId)
    var targetId = ev.target.id
    var $target = $('#' + targetId)

    // add to drop target
    $target.append(dragged)
    //dragged.style.height = '40%'
    //dragged.style.marginLeft = '-10%'
    dragged.style.top = '0'
    dragged.style.left = '0'

    //disable dropping on the current target
    $target.css('border', 'none')
    $target.droppable('disable')

    //enable dropping on the source of the current drag
    // (for "undoing")
    if ($source.hasClass('ui-droppable')) {
      $source.droppable('enable')
    }

    // Record response and allow "done" if the target
    // is one of the intended targets
    if (!(ev.target.classList.contains('charObj'))) {
      RunInfo.recordResponse(storyIndex, step(currentPage()), sourceId, targetId)
      $('.doneButton').show()
      $('.doneButton').click(function () {
	doneDragging($target)
      })
    }
  }

  var doneDragging = function ($droppedTarget) {
    $('.doneButton').hide()

    var s = step(currentPage())
    if (s === 'give1') {
      $('.dragObj').draggable('destroy')
      $droppedTarget.droppable('destroy')
      nextStep()
    } else if (s === 'take1') {
      nextStep()
    } else {
      go('next')
    }
  }

  var startDragging = function () {
    $('.dragObj').draggable({
      containment: 'document',
      revert: 'invalid'
    })

    //Disable swipe navigation
    swipeNav(false)
  }

  // ********* Story Narration ***********//
  var $storyAudio = {
    hi: $('#introAudio'),
    friends: $('#friendsAudio'),
    decide1: $('#decide1Audio'),
    give1: $('#give1Audio'),
    give2: $('#give2Audio'),
    distribute: $('#distributeAudio'),
    decide2: $('#decide2Audio'),
    take1: $('#take1Audio'),
    still: $('#stillAudio'),
    take2: $('#take2Audio'),
    end: $('#endAudio'),

    goAfterAudio: $('#friendsAudio, #decide1Audio, #distributeAudio, #decide2Audio, #stillAudio'),
    dragAfterAudio: $('#give1Audio, #give2Audio, #take1Audio, #take2Audio')
  }

  var setAudio = function (story) {
    for (var key in $storyAudio) {
      $storyAudio[key].attr('src', story.audio[key])
    }
  }

  var playNarration = function (step) {
    $storyAudio[step][0].play()
  }

  var endExperiment = function () {
//    $('#expStatus').html('Done')
//    $('#storyText').remove()
    $('body').html("<button id='resultsButton'>Get results!</button>")
    $('#resultsButton').click(function() {
      RunInfo.writeResults()
    })
  }

  return { init: init, startExp: startExp }
}())

ExpInfo.init()
Exp.init()
SubjForm.init()
