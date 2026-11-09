/*
 * Our own jQuery plug-in: $(el).statBars(stats)
 * Draws animated horizontal bars inside the element.
 * stats = [{ name: 'hp', value: 45 }, ...]
 */
(function ($) {
  $.fn.statBars = function (stats) {
    return this.each(function () {
      var $box = $(this).empty();

      $.each(stats, function (i, s) {
        var $row = $('<div class="stat"><span class="stat-name"></span>' +
                     '<div class="bar"><div class="fill"></div></div>' +
                     '<span class="stat-val"></span></div>');
        $row.find('.stat-name').text(s.name);
        $row.find('.stat-val').text(s.value);
        $box.append($row);

        // Animate bar width (max base stat is ~255), staggered per row
        var pct = Math.min(100, s.value / 255 * 100);
        $row.find('.fill').delay(i * 80).animate({ width: pct + '%' }, 600);
      });
    });
  };
})(jQuery);
