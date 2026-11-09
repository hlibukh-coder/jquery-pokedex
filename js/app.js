$(function () {

  var API = 'https://pokeapi.co/api/v2/';
  var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  var PAGE = 24;                       // cards per "page"

  var all = [];                        // every pokémon: {id, name}
  var typeCache = {};                  // type name -> array of ids (so we only fetch once)
  var current = [];                    // list after filters
  var shown = 0;                       // how many cards are on screen
  var favs = JSON.parse(localStorage.getItem('favs') || '[]');
  var filter = { type: '', q: '', favOnly: false };

  toastr.options = { positionClass: 'toast-bottom-right', timeOut: 2000 };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function idFromUrl(url) { return +url.split('/').filter(Boolean).pop(); }
  function fail() { toastr.error('Could not reach the web service'); }

  /* ---------- CORE DATA (loaded at start via AJAX) ---------- */

  // 1) all pokémon names (first 1025 have official artwork)
  var loadAll = $.getJSON(API + 'pokemon?limit=1025').done(function (data) {
    all = data.results.map(function (p) {
      return { id: idFromUrl(p.url), name: p.name };
    });
  });

  // 2) all types -> filter chips
  var loadTypes = $.getJSON(API + 'type').done(function (data) {
    $.each(data.results, function (i, t) {
      if (t.name === 'unknown' || t.name === 'stellar') return;
      $('#types').append($('<button class="chip type"></button>').text(cap(t.name)).data('type', t.name));
    });
  });

  $.when(loadAll, loadTypes).done(applyFilters).fail(fail);

  /* ---------- LIST / FILTERING ---------- */

  function applyFilters() {
    // Start from the whole list, or the ids of the selected type
    var base = all;
    if (filter.type) {
      var ids = typeCache[filter.type];
      base = all.filter(function (p) { return ids.indexOf(p.id) > -1; });
    }
    current = base.filter(function (p) {
      return p.name.indexOf(filter.q) > -1 && (!filter.favOnly || favs.indexOf(p.id) > -1);
    });

    $('#grid').empty();
    shown = 0;
    $('#status').text(current.length ? current.length + ' pokémon' : 'Nothing found 😢');
    showMore();
  }

  // Append the next PAGE cards with a staggered fade-in animation
  function showMore() {
    var $cards = $();
    $.each(current.slice(shown, shown + PAGE), function (i, p) {
      var heart = favs.indexOf(p.id) > -1 ? ' on' : '';
      var $c = $('<div class="card" data-id="' + p.id + '">' +
                   '<button class="heart' + heart + '">♥</button>' +
                   '<img class="lazy" data-src="' + ART + p.id + '.png" alt="">' +
                   '<small>#' + p.id + '</small><h3>' + cap(p.name) + '</h3></div>');
      $c.hide().appendTo('#grid').delay(i * 40).fadeIn(300);
      $cards = $cards.add($c.find('.lazy'));
    });
    $cards.Lazy({ effect: 'fadeIn', effectTime: 300 });   // PLUGIN 1: jquery.lazy

    shown += PAGE;
    $('#more').toggle(shown < current.length);
  }

  /* ---------- EVENTS ---------- */

  $('#more').on('click', showMore);

  $('#search').on('input', function () {
    filter.q = $.trim($(this).val().toLowerCase());
    applyFilters();
  });

  $('#favs-btn').on('click', function () {
    filter.favOnly = !filter.favOnly;
    $(this).toggleClass('active', filter.favOnly);
    applyFilters();
  });

  // Type chip: fetch the type's pokémon on demand (cached afterwards)
  $('#types').on('click', '.type', function () {
    var $b = $(this), t = $b.data('type');
    if (filter.type === t) {            // click again = clear filter
      filter.type = '';
      $b.removeClass('active');
      return applyFilters();
    }
    $('.type').removeClass('active');
    $b.addClass('active');

    if (typeCache[t]) { filter.type = t; return applyFilters(); }
    $.getJSON(API + 'type/' + t).done(function (data) {
      typeCache[t] = data.pokemon.map(function (x) { return idFromUrl(x.pokemon.url); });
      filter.type = t;
      applyFilters();
    }).fail(fail);
  });

  // Heart button (stop click so it doesn't open the modal)
  $('#grid').on('click', '.heart', function (e) {
    e.stopPropagation();
    toggleFav($(this).closest('.card').data('id'));
  });

  // Click a card -> load details on demand
  $('#grid').on('click', '.card', function () {
    openDetails($(this).data('id'));
  });

  // Heart inside the modal
  $(document).on('click', '.modal .fav-btn', function () {
    toggleFav($(this).data('id'));
  });

  function toggleFav(id) {
    var i = favs.indexOf(id);
    if (i > -1) { favs.splice(i, 1); toastr.info('Removed from favorites'); }
    else        { favs.push(id);     toastr.success('Added to favorites'); }
    localStorage.setItem('favs', JSON.stringify(favs));

    var on = favs.indexOf(id) > -1;
    $('.card[data-id=' + id + '] .heart').toggleClass('on', on);   // update card
    $('.modal .fav-btn').text(on ? '♥ In favorites' : '♡ Add to favorites');
    if (filter.favOnly) applyFilters();
  }

  /* ---------- ON-DEMAND DATA (details modal) ---------- */

  function openDetails(id) {
    // Two requests at once: stats/types and the description text
    $.when($.getJSON(API + 'pokemon/' + id), $.getJSON(API + 'pokemon-species/' + id))
      .done(function (a, b) {
        var p = a[0], species = b[0];

        // First English flavor text
        var entry = species.flavor_text_entries.filter(function (f) { return f.language.name === 'en'; })[0];
        var text = entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '';

        var types = p.types.map(function (t) {
          return '<span class="badge ' + t.type.name + '">' + t.type.name + '</span>';
        }).join('');
        var abilities = p.abilities.map(function (x) { return x.ability.name; }).join(', ');
        var on = favs.indexOf(id) > -1;

        var $html = $('<div class="modal">' +
          '<img src="' + ART + id + '.png" alt="">' +
          '<h2>' + cap(p.name) + ' <small>#' + id + '</small></h2>' +
          '<div>' + types + '</div>' +
          '<p class="desc"></p>' +
          '<p class="meta">Height: ' + p.height / 10 + ' m · Weight: ' + p.weight / 10 + ' kg</p>' +
          '<p class="meta">Abilities: ' + abilities + '</p>' +
          '<div class="stats"></div>' +
          '<button class="chip fav-btn" data-id="' + id + '">' + (on ? '♥ In favorites' : '♡ Add to favorites') + '</button>' +
        '</div>');
        $html.find('.desc').text(text);

        // PLUGIN 2: Magnific Popup shows the modal
        $.magnificPopup.open({
          items: { src: $html, type: 'inline' },
          mainClass: 'mfp-fade',
          removalDelay: 200,
          callbacks: {
            // PLUGIN 3 (ours): animated stat bars once the modal is open
            open: function () {
              $('.modal .stats').statBars(p.stats.map(function (s) {
                return { name: s.stat.name.replace('special-', 'sp. '), value: s.base_stat };
              }));
            }
          }
        });
      })
      .fail(fail);
  }
});
