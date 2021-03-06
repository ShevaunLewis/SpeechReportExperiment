// Module for subject info form
var SubjForm = (function () {
  var subjInfo = {}
  var script = ''

  function init() {
    $(document).on("pageshow", "[data-role='page']", function () {
      $('div.ui-loader').remove();
    });
    initFormatting()
    $('input[type="radio"]').change(function () {
      script = this.value
    })
    $('#submitForm').click(function () {
      saveInfo()
      hideForm()
      RunInfo.setSubjInfo(subjInfo)
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
      'script': script
    }
  }

  function hideForm() {
    $('#subjForm').remove()
  }

  return { init: init }
}())

//Module for run info
var RunInfo = (function () {
  var subjInfo,
      stories,
      images,
      responses =[]

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
      audio: audio,
      takeTargetPos: [s.takeTargetLeft, s.takeTargetBottom],
      c1Pos: [s.c1Left, s.c1Bottom],
      c2Pos: [s.c2Left, s.c2Bottom],
      narrPos: [s.narrLeft, s.narrBottom]
    }

    return story
  }

  function recordResponse(storyIndex, step, object, target) {
    var trialInfo = [subjInfo.subjId,
                     subjInfo.date,
                     subjInfo.script,
                     responses.length + 1,
                     stories[storyIndex].storyId,
                     step,
                     stories[storyIndex].scriptConds[subjInfo.script],
                     object,
                     target,
                     $('#expButton').prop('checked') ? 1 : 0
                    ],
        line = trialInfo.join(',') + '\n'
		console.log(line)

		$.post('writeResults.php', {results: line})
  }

  function writeResults() {
    var csv//,
//        encodedUri,
//       link,
//        filename = 'SR_' + subjInfo.subjId + '.csv'

    csv = Papa.unparse({
      fields: ['subjId', 'date', 'script', 'respIndex', 'storyId', 'phase', 'cond',
               'objSource', 'target', 'expMove'],
      data: responses
    },
    {
      newline: "\n"
    })

    $.post('writeResults.php')

//     encodedUri = encodeURI(csv)
//     link = document.createElement('a')
//     link.setAttribute('href', 'data:text/csv;charset=utf-8, ' + encodedUri)
//     link.setAttribute('download', filename)
//     link.click()
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
          it.scriptConds = scripts[it.storyId]
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
      $storyAudio = $('#storyAudio'),
      storyAudioFiles,
      $pages = [$('#title'), $('#intro'), $('#scene1'), $('#scene2'), $('#end')],
      pageList = [['title'],
                  ['hi'],
                  ['friends', 'decide1', 'give1', 'give2'],
                  ['distribute', 'decide2', 'take1', 'still', 'take2'],
                  ['end']]

  function init() {
    $('img').attr('draggable', 'false')
    initDragDrop()
    $storyAudio.on('ended', function () {
      afterAudio()
    })
    $('#playAudio').click(function () {
      $storyAudio[0].play()
    })
    $('#replayButton').click(function () {
      $storyAudio[0].play()
    })
    $('#book').hide()
    $('#characterCheck').hide()
    $('.page').hide()
    $('.charButton').click(function () {
      $('#title').toggle()
      $('#characterCheck').toggle()
    })
    enableKeyNav()
    enableButtonNav()
    $('#expButton').button()

    $('#confirmEnd').dialog({
      autoOpen: false,
      resizable: false,
      height: 'auto',
      width: 400,
      modal: true,
      buttons: {
        "End experiment": function() {
          $(this).dialog('close')
          endExperiment()
        },
        Cancel: function() {
          $(this).dialog('close')
        }
      }
    })

    // Warning for page refresh
    window.onbeforeunload = function() {
      return "Are you sure you want to refresh? Data will be lost."
    }
  }

  /********** Story navigation ************/
  function enableKeyNav() {
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
        prev()
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

  function enableButtonNav() {
    $('#prevStory').click(function () {
      prevStory()
    })
    $('#back').click(function () {
      prev()
    })
    $('#forward').click(function () {
      next()
    })
    $('#nextStory').click(function () {
      nextStory()
    })
  }

  function leavePage() {
    // stop any playing audio
    stopAudio()

    // hide the character check page if it's visible
    if ($('#characterCheck').is(':visible')) {
      $('#characterCheck').toggle()
    }

    // hide current page
    $pages[pageIndex].hide()

    // For pages where dragging may have happened
    if ((pageIndex === 2) || (pageIndex === 3)) {
      undoDrag($('.dragObj'), $('#scene1 .char, #takeGoal'), false)

      // Rehide scene1 drag objects
      $('#scene1 .dragObj').hide()
    }
  }

  function stopAudio() {
    $('audio').each(function () {
      this.pause()
      this.currentTime = 0
    })
  }

  function next() {
    if (pageIndex === (pageList.length - 1)) {
      nextStory()
    } else if (stepIndex === (pageList[pageIndex].length - 1)) {
      nextPage()
    } else {
      nextStep()
    }
  }

  function nextPage() {
    leavePage()
    pageIndex++
    startPage()

    // Hide replay button
    $('#replayButton').hide()

  }

  function nextStory() {
    leavePage()
    if (storyIndex < 8) {
      storyIndex++
      setStory()
      pageIndex = 0
      startPage()
    } else {
      $('#confirmEnd').dialog('open')
    }
  }

  function prev() {
    if (pageIndex === 0) {
      prevStory()
    } else {
      prevPage()
    }
  }

  function prevPage() {
    leavePage()

    // If you're already on the first step of the page,
    // go back to the previous page. Otherwise just
    // restart the page.
    if (stepIndex === 0) {
      pageIndex--
    }
    startPage()
  }

  function prevStory() {
    leavePage()

    if (storyIndex > 0) {
      storyIndex--
    }
    setStory()
    pageIndex = 0
    startPage()
  }

  /************ Playing story *************/
  // Start Experiment (public)
  function startExp() {
    $('#book').show()
    setStory()
    startPage()
  }

  // Set story visuals and audio
  function setStory() {
    var story = RunInfo.getStory(storyIndex)

    setScene(story)
    storyAudioFiles = story.audio
  }

  // Start audio for page
  function startPage() {
    stepIndex = 0

    setAudio(step())

    $pages[pageIndex].fadeIn(800, "linear", function () {
      // start page narration after fade in is complete
      $storyAudio[0].play()
    })
  }

  // Within-page progress
  function step() {
    return pageList[pageIndex][stepIndex]
  }

  function afterAudio() {
    var step = pageList[pageIndex][stepIndex]
    if (['friends', 'decide1', 'distribute', 'decide2', 'still'].indexOf(step) >  -1) {
      nextStep()
    } else if (['give1', 'give2', 'take1', 'take2'].indexOf(step) > -1) {
      startDragging()
    }
  }

  function nextStep() {
    stopAudio()
    stepIndex++

    // Update audio
    setAudio(step())

    // Add visuals if necessary
    if (step() in $scene) {
      $scene[step()].show()
    }

    // Reset undo button
    $('#undoButton').hide()
    $('#undoButton').unbind('click')

    // Hide replay button
    $('#replayButton').hide()

    // Play audio
    $storyAudio[0].play()
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
    takeObjs: $('#scene2 .dragObj'),

    // access visuals by their step name
    give1: $('#giveObj1'),
    give2: $('#giveObj2'),
    decide2: $('#takeGoal img, #scene2 .dragObj')
  }

  function setScene(story) {
    $scene.title.text(story.title)
    $scene.introNarr.attr('src', story.narrator)
    $scene.scene1Bg.attr('src', story.bg1)
    $scene.narr.attr('src', story.narrator)
    $scene.c1.attr('src', story.c1)
    $scene.c2.attr('src', story.c2)
    $('#giveObj1, #giveObj2').removeAttr('style')
    $scene.giveObj1.attr('src', story.giveObj1)
    $scene.giveObj2.attr('src', story.giveObj2)
    $scene.scene2Bg.attr('src', story.bg2)
    $scene.takeGoal.attr('src', story.takeTarget)
    setPos('#takeGoal', story.takeTargetPos)
    setPos('.char.narrator', story.narrPos)
    setPos('.char.c1', story.c1Pos)
    setPos('.char.c2', story.c2Pos)
    setPos('.objStart', [story.c1Pos[0], '5%'])
    $scene.takeObjs.attr('src', story.takeObj)
    $('#scene1 .dragObj').hide()
    $scene.takeGoal.hide()
    $('#undoButton').hide()
    $('#replayButton').hide()
    $('#expButtonDiv').hide()
  }

  function setPos(itemSelector, itemPos) {
    $(itemSelector).css({
      'left': itemPos[0],
      'bottom': itemPos[1]
    })
  }

  // Drag and drop functionality //
  function initDragDrop() {
    $('#scene1 .char, #takeGoal').droppable({
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

    // Initialize all draggable objects
    initDraggables($('.dragObj'))

    // // Hide undo button
    // $('#undoButton').hide()
    // $('#replayButton').hide()
  }

  function initDraggables($draggables) {
    $draggables.draggable({
      containment: 'document',
      revert: 'invalid',
      disabled: true
    })
  }

  function drop(ev, ui) {
    var dragged = ui.draggable[0],
        $dragged = $('#' + dragged.id),
        targetId = ev.target.id,
        $target = $('#' + targetId)

    // Add "dragged" class to dragged item, destroy draggability
    $dragged.addClass('dragged').draggable('destroy')

    // Destroy droppability if on scene1 (pageIndex 2)
    if (pageIndex == 2) {
      $target.droppable('disable')
      $target.css('border', 'none')
    }

    // Disable all the undragged draggable objects
    $('.dragObj:not(.dragged)').draggable('disable')

    // Record response
    RunInfo.recordResponse(storyIndex, step(), dragged.id, targetId)

    // Show undo button
    $('#undoButton').show()
    $('#undoButton').click(function () {
      undoDrag($dragged, $target, true)
    })

    // Hide experimenter move button
    $('#expButton').prop('checked', false)
    $('#expButtonDiv').hide()
  }

  function undoDrag($draggedItems, $dropTargets, restart) {
    $draggedItems.css({
      'left': '',
      'top': ''
    })
    $draggedItems.removeClass('dragged')
    initDraggables($draggedItems)
    $dropTargets.droppable('enable')

    // Reset undo button
    $('#undoButton').hide()
    $('#undoButton').unbind('click')

    if (restart) {
      startDragging()
    }
  }

  function startDragging() {
    // Enable dragging for any draggables that haven't been destroyed
    $('.dragObj:not(.dragged)').draggable('enable')
    $('#expButtonDiv').show()

    // Show replay button
    $('#replayButton').show()
  }

  // ********* Story Narration ***********//
  function setAudio(step) {
    if (step in storyAudioFiles) {
      $storyAudio.attr('src', storyAudioFiles[step])
    } else {
      $storyAudio.attr('src', 'audio/empty.wav')
    }
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
