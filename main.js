var config = {
    $bookBlock : $( '#bb-bookblock' ),
    $navNext : $( '#bb-nav-next' ),
    $navPrev : $( '#bb-nav-prev' ),
}

config.$bookBlock.bookblock( {
    speed : 700,
    shadowSides : 0.8,
    shadowFlip : 0.7
} );



var $slides = config.$bookBlock.children();

// add navigation events
config.$navNext.on( 'click touchstart', function() {
    config.$bookBlock.bookblock( 'next' );
    return false;
} );

config.$navPrev.on( 'click touchstart', function() {
    config.$bookBlock.bookblock( 'prev' );
    return false;
} );

// add swipe events
$slides.on( {
    'swipeleft' : function( event ) {
        config.$bookBlock.bookblock( 'next' );
        return false;
    },
    'swiperight' : function( event ) {
        config.$bookBlock.bookblock( 'prev' );
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
            config.$bookBlock.bookblock( 'prev' );
            break;
        case arrow.right:
            config.$bookBlock.bookblock( 'next' );
            break;
    }
});

$(document).ready(function(){
    var story = stories[0];
    $("#title h1").text(story.title);
    $("#introNarr img").attr("src",imageFiles[story.narrator]);
    $("#scene1 .backgroundImg").attr("src",imageFiles[story.bg1]);
    $(".narrator img").attr("src",imageFiles[story.narrator]);
    $(".c1 img").attr("src",imageFiles[story.c1]);
    $(".c2 img").attr("src",imageFiles[story.c2]);
    $("#scene2 .backgroundImg").attr("src",imageFiles[story.bg2]);
});
