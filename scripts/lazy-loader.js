
Y.use('squarespace-dynamic-data', 'history-hash', 'transition', function(Y) {
  Y.Squarespace.LazyLoader = Singleton.create({

    ready: function() {
      document.addEventListener('DOMContentLoaded', this.initialize.bind(this));      
    },

    initialize: function() {
      this.initLoader();
      this.initSlider();
    },

    initLoader: function() {
      var _this = this;
      
      _this.dynamicLoaders = {};

      // setup dynamic loader
      Y.all('a[data-dynamic-load]:not([data-type-protected])').each(function(elem) {
        var href = elem.getAttribute('href'),
            receiver = elem.getAttribute('data-dynamic-receiver') || 'section',
            target = '#' + (elem.getAttribute('id') || elem.setAttribute('id', Y.guid()).getAttribute('id')),
            injectEl = '.sqs-layout[data-type="page"], .gallery > .gallery-item, .gallery > .sqs-video-wrapper';

        if (Y.one('[data-dynamic-href="'+href+'"]').getAttribute('data-type-name').match(/page|gallery/)) {
          _this.dynamicLoaders[_this.cleanUrl(href)] = new Y.Squarespace.DynamicData({
            wrapper: receiver,
            target: target,
            injectEl: injectEl,
            useHashes: true
          });
        } else { // set hash handler on this
          elem.setAttribute('href', '#' + href);
        }
      });
      
    },

    initSlider: function() {
      var _this = this;

      var onHashChange = function (e) {
        // Check if hash change should trigger dynamic loading
        var dynamicLoader = _this.dynamicLoaders[_this.cleanUrl(e.newHash)],
            sliderElem = Y.one('[data-dynamic-href="'+e.newHash+'"]');
        
        if (sliderElem && sliderElem.hasAttribute('data-type-protected')) {
          window.location.replace(e.newHash);
          return;
        } else if (dynamicLoader) {
          dynamicLoader.simulateHash(e.newHash);
        }

        _this.navigate(e.newHash);
      };

      // We navigate via hash
      Y.on('hashchange', onHashChange, Y.config.win);

      if (window.location.hash) {
        onHashChange({ newHash: window.location.hash.replace('#', '') });
      }

    },

    // Fade out <section>, do swap, fade back in
    navigate: function(url) {
      var _this = this;

      url = url || '';

      // support for old urls
      url = url.replace('/index/','/');
      url = url.charAt(0) == '/' ? url : '/' + url;
      url = url.charAt(url.length-1) == '/' ? url : url + '/';

      // check if we need to navigate
      if ( (url !== '/' && !Y.one('[data-dynamic-href="'+url+'"].visually-hidden'))
        || (url == '/' && !Y.one('[data-dynamic-href]:not(.visually-hidden)')) ) {
        Y.fire('lazyload:afterNav', url);
        return;
      }

      Y.fire('lazyload:beforeNav', url);

      Y.one('section').setStyle('opacity', 1).anim({
        opacity: 0
      }, {
        duration: 0.5
      }).run().on('end', function() {

        // reinit for video weirdness
        var activeProj = Y.one('[data-dynamic-href]:not(.visually-hidden)');
        if (activeProj && activeProj.one('.video-block, .code-block, .embed-block, .audio-block, .sqs-video-wrapper')) {
          Y.fire('audioPlayer:stopAll', {container: activeProj });
          activeProj.one('.gallery').empty(true).removeClass('sqs-dynamic-data-ready').removeAttribute('data-dynamic-data-link');
        }

        var slideToShow = Y.one('[data-dynamic-href="'+url+'"]');
        if (url && slideToShow) {
          Y.all('[data-dynamic-href]').addClass('visually-hidden');
          slideToShow.removeClass('visually-hidden');

          /* // Load all unloaded images
	        slideToShow.all( 'img[data-src]' ).each(function(img) {
            if (!img.getAttribute('src')) {
              ImageLoader.load(img, { load: true });
            }
          }); */

          if (!slideToShow.getAttribute('data-type-name').match(/page|gallery/)) { // If not page or gallery, navigate away
            window.location.replace(url);
            return;
          }

          document.title = "" + Static.SQUARESPACE_CONTEXT.website.siteTitle + " — " + slideToShow.one('.meta h1').get('text');
        } else {
          Y.all('[data-dynamic-href]').addClass('visually-hidden');
        }

        Y.one('body').set('scrollTop', 0);
        document.documentElement.scrollTop = 0;

        Y.one('section').anim({}, { to: {opacity: 1}, duration: 0.5 }).run();

        Y.fire('lazyload:afterNav', url);
      });
    },

    cleanUrl: function(url) {
      return url.replace(/\//g,'');
    }

  });
});

