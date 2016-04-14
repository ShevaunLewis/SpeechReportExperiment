// notes for 4/13:
// deactivate navigation at appropriate points (prob get rid of buttons, just use keyboard and swipe)
// fix recordResponse for take actions
// add ending for experiment
// allow backwards navigation (fix onEndFlip function)

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
      Exp.startPage(0, true)
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
    for (var step in s.narration) {
      var conds = s.narration[step]
      audio[step] = ('na' in conds)
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

var Book = (function () {
  var $slides = $('#bb-bookblock').children()

  init = function () {
    $('#bb-bookblock').bookblock({
      speed: 700,
      shadowSides: 0.8,
      shadowFlip: 0.7,
      onBeforeFlip: function (page) {
	$("#" + $slides[page].id + " audio").each(function () {
	  this.pause()
	})
      },
      onEndFlip: function (page, isLimit) {
        //updateStatus()
	if (page === 3) {
	  Exp.startPage(0)
	} else {
          Exp.startPage(page + 1)
	}
      },
      circular: true
    })
    $('.book').hide()
    initNav()
  }
  initNav = function () {

    // Add navigation events
    $('#bb-nav-next').on('click touchstart', function () {
      $('#bb-bookblock').bookblock('next')
      return false
    })

    $('#bb-nav-prev').on('click touchstart', function () {
      $('#bb-bookblock').bookblock('prev')
      return false
    })

    // Add swipe events
    // need to disable these during times when we expect drag and drop
    // $slides.on({
    //   'swipeleft': function (event) {
    //     //$('#bb-bookblock').bookblock('next')
    // 	Exp.nextPage()
    //     return false
    //   },
    //   'swiperight': function (event) {
    //     //$('#bb-bookblock').bookblock('prev')
    // 	Exp.nextPage()
    //     return false
    //   }
    // })

    // Add keyboard events
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
        $('#bb-bookblock').bookblock('prev')
        break
      case arrow.right:
        $('#bb-bookblock').bookblock('next')
        break
      }
    })
  }
  return { init: init }
}())

var Exp = (function () {
  var storyIndex = -1

  var init = function () {
    $('img').attr('draggable', 'false')
    setTransitions()
  }
  var stepIndex = 0
  var pageIndex = 0

  var page1 = ['friends', 'decide1', 'give1', 'give2']
  var page2 = ['distribute', 'decide2', 'take1', 'still', 'take2']
  var pages = [['hi'], page1, page2, ['end']]

  var startPage = function(page) {
    stepIndex = 0
    
    if (page === 0) {
      storyIndex++
      var story = RunInfo.getStory(storyIndex)
      setScene(story)
      setAudio(story)
      pageIndex = 0
      //add status bar update for storyID
    } else {
      pageIndex = page
    }
    
    var step = pages[pageIndex][stepIndex]

    //add status bar update for page (#/4) and step

    playNarration(step)      
  }		

  // ***** Story progression *****//
  // (determined by transitions after narration audio segments)
  var setTransitions = function () {
    $storyAudio.goAfterAudio.attr('onended', 'Exp.nextStep()')
    $storyAudio.dragAfterAudio.attr('onended', 'Exp.startDragging()')
  }

  var nextStep = function () {
    stepIndex++
    var step = pages[pageIndex][stepIndex]

    // Add visuals if necessary
    switch ( step ) {
    case 'give1':
      $scene.giveObj1.show()
      break
    case 'give2':
      $scene.giveObj2.show()
      break
    case 'decide2':
      $scene.takeGoal.show()
      $scene.takeObjs.show()
      break
    }

    // Play audio
    playNarration(step)
  }

  // ***** Visuals *****//
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
    addDropTargets('#scene1 .char')

    $scene.scene2Bg.attr('src', story.bg2)
    $scene.takeGoal.attr('src', story.takeTarget)
    addDropTargets('#takeGoal')
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
      }
    })
  }

  var drop = function (ev, ui) {
    var source = ui.draggable[0].parentElement.id
    if (source === '') {
      source = ui.draggable[0].parentElement.parentElement.id
    }
    var target = ev.target.id || ev.target.classList[1]

    var step = pages[pageIndex][stepIndex]
    RunInfo.recordResponse(storyIndex, step, source, target)

    event.target.style.border = 'none'

    $('.doneButton').show()
    $('.doneButton').click(function () {
      doneDragging(target)
    })
  }

  var doneDragging = function (droppedTarget) {
    $('.doneButton').hide()

    var step = pages[pageIndex][stepIndex]
    if (step === 'give1') {
      $('.dragObj').draggable('destroy')
      $('#' + droppedTarget).droppable('disable')
      nextStep()
    } else if (step === 'take1') {
      nextStep()
    } else {
      $('#bb-nav-next').click()
    }
  }

  var startDragging = function () {
    $('.dragObj').draggable({
      containment: 'document',
      revert: 'invalid'
    })
  }

  // ***** Narration audio *****//
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


  return { init: init, startPage: startPage, nextStep: nextStep,
	   startDragging: startDragging }
}())

function endExperiment () {
  $('#expStatus').html('Done')
  $('#storyText').remove()
  $('body').html("<button id='resultsButton'>Get results!</button>")
  $('#resultsButton').click(writeResults)
}

ExpInfo.init()
Book.init()
Exp.init()
SubjForm.init()
