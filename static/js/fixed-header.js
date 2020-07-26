// Desktop Fixed-Header
$("document").ready(function($){
    var nav = $('.desktop-nav');

    $(window).scroll(function () {
        if ($(this).scrollTop() > 1030) {
            nav.addClass("fixed-top");
        } else {
            nav.removeClass("fixed-top");
        }
    });
});

//Mobile Fixed Header
$("document").ready(function($){
    var nav = $('.mobile-nav');

    $(window).on("load", function () {
        if ($(this).height() >= 0) {
            nav.addClass("fixed-top");
        } else {
            nav.removeClass("fixed-top");
        }
    });
});