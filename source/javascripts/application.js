resize = function() {
  $('article').each(function(i){
    article = $(this)

    article.find('.highlight').css('width', article.width());
  })
}

$(resize); $(window).resize(resize);