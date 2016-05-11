// notes:
// add ending for experiment
// add status bar update
// fix handling of multiple drags in one response
// fix display of characters relative to background/scene
// add button to mark when experimenter is fixing child's response

// Module for subject info form
var SubjForm = (function () {
  var subjInfo = {}

  function init() {
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
  function initFormatting() {
    $('#script').buttonset()
    $('#date').datepicker()
    $('button').button()
  }

  function saveInfo() {
    subjInfo = {
      'subjId': $('#subjID').val(),
      'date': $('#date').val(),
      'script': $('input[name="script"]').val()
    }
  }

  function hideForm() {
    $('#subjForm').remove()
  }

  function updateSubjInfoBar() {
    $('#subjInfo').html('Subj: ' + subjInfo.subjId +
                        '         Date: ' + subjInfo.date +
                        '         Script: ' + subjInfo.script)
  }

  return { init: init }
}())

//Module for run info
var RunInfo = (function () {
  var subjInfo,
      stories,
      images,
      responses = []

  function setExpInfo(s, i) {
    stories = s
    images = i
  }

  function setSubjInfo(si) {
    subjInfo = si
  }

  function getStory(storyIndex) {
    var s = stories[storyIndex],
        cond = s.scriptConds[subjInfo.script],
        line,
        conds,
        audio = {},
        story

    for (line in s.narration) {
      conds = s.narration[line]
      audio[line] = ('na' in conds)
        ? conds.na.audio
        : conds[cond].audio
    }

    story = {
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

  function recordResponse(storyIndex, step, object, target) {
    var trialInfo = [subjInfo.subjId,
      subjInfo.date,
      subjInfo.script,
      stories[storyIndex].storyId,
      step,
      stories[storyIndex].scriptConds[subjInfo.script],
      object,
      target]
    responses.push(trialInfo)
    console.log(responses)
  }

  function writeResults() {
    var csv,
        encodedUri,
        link,
        filename = 'SR_' + subjInfo.subjId + '.csv'

    csv = Papa.unparse({
      fields: ['subjId', 'date', 'script', 'storyId', 'phase', 'cond',
        'objSource', 'target'],
      data: responses
    })
    encodedUri = encodeURI(csv)

    link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    link.click()
  }

  return { setExpInfo: setExpInfo, setSubjInfo: setSubjInfo,
           getStory: getStory, recordResponse: recordResponse,
           writeResults: writeResults }
}())

// Module for importing data from CSV files
var ExpInfo = (function () {
  var imageFiles = {},
      storyArray = []

  function init() {
    getImageFiles()
    getStoryInfo()
  }

  function getImageFiles() {
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

  function getStoryInfo() {

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

  function parseStoryText() {

    // Add story narration
    Papa.parse('expInfo/storyText.csv', {
      download: true,
      header: true,
      complete: function (results) {
        var narration = results.data,
            narrHash = {}

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

  function parseScripts() {

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
        RunInfo.setExpInfo(storyArray, imageFiles)
      }
    })
  }

  return { init: init }
}())

// Module for running experiment
var Exp = (function () {
  var storyIndex = 0,
      stepIndex = 0,
      pageIndex = 0,
      $scene,
      $storyAudio,
      $pages = [$('#intro'), $('#scene1'), $('#scene2'), $('#end')],
      pageList = [['hi'],
                  ['friends', 'decide1', 'give1', 'give2'],
                  ['distribute', 'decide2', 'take1', 'still', 'take2'],
                  ['end']]

  function init() {
    $('img').attr('draggable', 'false')
    setTransitions()
    $('#book').hide()
    $('.page').hide()
    initNav()
  }

  /********** Story navigation ************/
  function initNav() {
    // Keyboard navigation
    $(document).keydown(function (e) {
      var keyCode = e.keyCode || e.which,
          arrow = {
            left: 37,
            up: 38,
            right: 39,
            down: 40
          }

      switch (keyCode) {
      case arrow.left:
        prevPage()
        break
      case arrow.right:
        next()
        break
      case arrow.down:
        nextStory()
        break
      case arrow.up:
        prevStory()
      }
    })
  }

  function next() {
    // stop any playing audio
    stopAudio()

    if (stepIndex === (pageList[pageIndex].length - 1)) {
      nextPage()
    } else {
      nextStep()
    }
  }

  function prevPage() {
    // hide current page
    $pages[pageIndex].hide()

    // stop any playing audio
    stopAudio()

    if (pageIndex === 0) {
      prevStory()
    } else {
      pageIndex--
    }
    startPage()
  }

  function nextPage() {
    // hide current page
    $pages[pageIndex].hide()

    if (pageIndex === 3) {
      nextStory()
    } else {
      pageIndex++
    }
    startPage()
  }

  function nextStory() {
    // hide current page
    $pages[pageIndex].hide()

    if (storyIndex < 7) {
      storyIndex++
      setStory()
      pageIndex = 0
    } else {
      endExperiment()
    }
  }

  function prevStory() {
    // hide current page
    $pages[pageIndex].hide()

    if (storyIndex > 0) {
      storyIndex--
    }
    setStory()
    pageIndex = 0
  }

  function swipeNav(turnOn) {
    if (turnOn) {
      console.log("swipe navigation on")
      $(window).on({
        'swipeleft': function (event) {
          next()
        },
        'swiperight': function (event) {
          prevPage()
        }
      })
    } else {
      console.log("swipe navigation off")
      $(window).off('swipeleft swiperight')
    }
  }

  function stopAudio() {
    // stop any playing audio
    $('audio').each(function () {
      this.pause()
      this.currentTime = 0
    })
  }

  /************ Playing story *************/
  // Start Experiment (public)
  function startExp() {
    $('#book').show()
    setStory()
    swipeNav(true)
    startPage()
  }

  // Set story visuals and audio
  function setStory() {
    var story = RunInfo.getStory(storyIndex)

    //Remove dragged objects from targets, return to original positions
    $('.dragObj').css({
      'left': '',
      'top': ''
    })

    setScene(story)
    setAudio(story)
  }

  // Start audio for page
  function startPage() {
    // Reset undo button
    $('.undoButton').hide()
    $('.undoButton').unbind('click')

    stepIndex = 0

    $pages[pageIndex].fadeIn(800, "linear", function () {
      // start page narration
      playNarration(step())
    })

  }

  // Within-page progress
  function step() {
    return pageList[pageIndex][stepIndex]
  }

  function setTransitions() {
    $storyAudio.goAfterAudio.on('ended', function () {
      nextStep()
    })
    $storyAudio.dragAfterAudio.on('ended', function () {
      startDragging()
    })
  }

  function nextStep() {
    stepIndex++

    // Add visuals if necessary
    switch (step()) {
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

    // Reset undo button
    $('.undoButton').hide()
    $('.undoButton').unbind('click')

    // Play audio
    playNarration(step())
  }

  // ******** Story Visuals *********//
  $scene = {
    title: $('#title h1'),
    introNarr: $('.introNarr > img'),
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

  function setScene(story) {
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
    addDropTargets('.char, #takeGoal, .charObj')
    $('.charObj').droppable('disable')
    $('#scene1 .char').droppable('enable')
    $('#scene2 .char').droppable('disable')
    $scene.takeObjs.attr('src', story.takeObj)
    $('#scene1 .dragObj').hide()
    $scene.takeGoal.hide()
    $('.undoButton').hide()
  }

  // Drag and drop functionality //
  function addDropTargets(targetSelector) {
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

  function drop(ev, ui) {
    var dragged = ui.draggable[0],
        $dragged = $('#' + dragged.id),
        targetId = ev.target.id,
        $target = $('#' + targetId)

    // Don't allow the dragged item to be moved again
    $dragged.draggable('disable')

    // Disable dropping on the current target if it's a character
    $target.css('border', 'none')
    if ($target.hasClass('char')) {
      $target.droppable('disable')
    }

    // Record response and allow "undo" if the target
    // is one of the intended targets
    RunInfo.recordResponse(storyIndex, step(), dragged.id, targetId)
    $('.undoButton').show()
    $('.undoButton').click(function () {
        undoDrag($dragged, $target)
    })

    swipeNav(true)
  }

  function undoDrag($draggedItem, $target) {
    $draggedItem.css({
      'left': '',
      'top': ''
    })
    $draggedItem.draggable('enable')
    $target.droppable('enable')
  }

  function startDragging() {
    $('.dragObj').draggable({
      containment: 'document',
      revert: 'invalid'
    })

    //Disable swipe navigation
    swipeNav(false)
  }

  // ********* Story Narration ***********//
  $storyAudio = {
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

  function setAudio(story) {
    var key
    for (key in $storyAudio) {
      $storyAudio[key].attr('src', story.audio[key])
    }
  }

  function playNarration(step) {
    $storyAudio[step][0].play()
    console.log(pageIndex, stepIndex)
  }

  function endExperiment() {
    // $('#expStatus').html('Done')
    // $('#storyText').remove()
    $('body').html("<button id='resultsButton'>Get results!</button>")
    $('#resultsButton').click(function () {
      RunInfo.writeResults()
    })
  }

  return { init: init, startExp: startExp }
}())

ExpInfo.init()
Exp.init()
SubjForm.init()
