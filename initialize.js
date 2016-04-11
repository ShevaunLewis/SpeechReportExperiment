// Make stuff pretty
$(function() {
    $("#script").buttonset();
    $("#date").datepicker();
    $("button").button();
});

// hide mainDisplay
$(document).ready(function(){
    $(".book").hide();
});

$('#bb-bookblock').bookblock( {
    speed : 700,
    shadowSides : 0.8,
    shadowFlip : 0.7,
    onEndFlip: function(page, isLimit) {
        startPage(page, isLimit);
    }
} );

var $slides = $('#bb-bookblock').children();

function next() {
    $('#bb-bookblock').bookblock( 'next' );
}

// add navigation events
$('#bb-nav-next').on('click touchstart', function() {
    next();
    return false;
} );

$('#bb-nav-prev').on('click touchstart', function() {
    $('#bb-bookblock').bookblock( 'prev' );
    return false;
} );

// add swipe events
$slides.on( {
    'swipeleft' : function( event ) {
        next();
        return false;
    },
    'swiperight' : function( event ) {
        $('#bb-bookblock').bookblock('prev');
        return false;
    }
});

// add keyboard events
$( document ).keydown( function(e) {
    var keyCode = e.keyCode || e.which,
        arrow = {
            left : 37,
            up : 38,
            right : 39,
            down : 40
        };

    switch (keyCode) {
        case arrow.left:
            $('#bb-bookblock').bookblock( 'prev' );
            break;
        case arrow.right:
            next();
            break;
    }
});
