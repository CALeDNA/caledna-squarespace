/* jshint loopFunc:false */
Y.use('node','squarespace-gallery-ng', function(Y) {


  Y.on('domready', function() {

    Y.all('#mobile-navigation li.folder').each(function(elem) {
      elem.on('click', function() {
        toggleFolder(elem.siblings('li.folder.dropdown-open').item(0));
        toggleFolder(elem);
      });
    });

    // move cart pill below nav
   if(Y.one('#topBar')){
      var topBarHeight = Y.one('#topBar').get('offsetHeight');
      Y.all('.sqs-cart-dropzone').setStyle('top', topBarHeight + 10);
   }


    //folder subnav
    var toggleFolder = function(elem) {
      if (elem) {
        elem.toggleClass('dropdown-open');
      }
    };
  });

    // folder click thru fix
    if (Modernizr && Modernizr.touch) {
      Y.all('nav .folder').each(function (f){

        if (f.all('a').size() > 1) {

          f.one('a').on('click', function (e) {
            e.preventDefault();
          });
        }
      });
    }

  Y.Node.prototype.tick = function(key, val) {

    // update
    if (!key) {
      for (var k in this.target) {
        if (!this.current[k]) {
          this.current[k] = parseInt(this.getStyle(k), 10);
          if( isNaN(this.current[k]) ) {
            this.current[k] = 0;
          }
        }

        var currentV = this.current[k];
        var targetV = this.target[k];

        if (typeof(targetV) != 'number') {
          delete this.current[k];
          delete this.target[k];

          this.setStyle(k, targetV);
          return;
        }

        currentV = this.current[k] + ((this.target[k] - this.current[k]) * 0.1);

        this.current[k] = currentV;
        this.setStyle(k, currentV);
      }

      return;
    }

    if (key instanceof Object) {
      for (var k in key) {
        this.tick(k, key[k]);
      }

      return;
    }

    // setup the target and current
    this.target = this.target || {};
    this.current = this.current || {};
    this.target[key] = val;
  };

  window.Site = Singleton.create({

    ready: function() {
      this.listeners = [];

      document.addEventListener('DOMContentLoaded', this.initialize.bind(this));

    },

    initialize: function() {
      this._setupNavigation();
      this._setupBottomBar();
      this._setupPositioning();

      this.gridEl = Y.one('#grid');

      if (this.gridEl) {
        this._setupGrid();
        this._setupTweakHandler();
      }

      if (window.location.hash.replace('#', '') !== '') {
        Y.once('lazyload:afterNav', function() {
          Y.one('#navigator').addClass('loaded');
        });
      } else {
        Y.one('#navigator').addClass('loaded');
      }

      if( Y.one('body.page-index') ) {
        Y.on('lazyload:afterNav', Y.bind(this._afterNav, this));
      } else if ( Y.one('body.page-gallery') ) {
        this._afterNav(window.location.pathname);
      }

    },

    _setupNavigation: function() {
      // Configure the links with transition
      if(Y.one('#topBar')){
        Y.one('#topBar').delegate('click', Y.bind(function(e){
          e.halt();
          this.animate('#container', {
            from: {
              opacity: 1
            },
            to: {
              opacity: 0
            }
          }, function() {
            window.location = e.currentTarget.getAttribute('href');
          });
        }, this), '.transition-link');
      }


      if( Y.one('.projectPrev') ) {
        Y.one('.projectPrev').on('click', Y.bind(this.prevProject, this));
      }

      if( Y.one('.projectNext') ) {
        Y.one('.projectNext').on('click', Y.bind(this.nextProject, this));
      }

      if( Y.one('.projectHome') ) {
        Y.one('.projectHome').on('click', function(e) {
          window.location.hash = '/';
        });
      }

      if (Y.one('#nav li.active-link')) {
        if( this.gridEl && Y.one('#nav li.active-link a').getAttribute('rel') == 'index' ) {
          Y.one('#nav li.active-link a').removeClass('transition-link').setAttribute('href', '#/');
        }
      }

      this._setHeaderValues();

      Y.one('.sqs-announcement-bar-close') && Y.one('.sqs-announcement-bar-close').on('click', function () {
        this._setHeaderValues();
      }, this);
    },

    _setHeaderValues: function () {
      if(Y.one('#topBar')){
        var topBarHeight = Y.one('#topBar').get('offsetHeight');
        Y.one('#container').setStyle('marginTop', topBarHeight);
        Y.all('#project .switcher').setStyle('top', topBarHeight + 35);
      }
    },

    _setupKeyHandlers: function() {
      if (!Modernizr.touch) {
        this.listeners.push(Y.after('key', Y.bind(this.prevProject, this), window, 'down:37', this));
        this.listeners.push(Y.after('key', Y.bind(this.nextProject, this), window, 'down:39', this));
        this.listeners.push(Y.after('key', Y.bind(this.jumpUp, this), window, 'down:38', this));
        this.listeners.push(Y.after('key', Y.bind(this.jumpDown, this), window, 'down:40', this));
      }
    },

    _destroyKeyHandlers: function() {
      if( this.listeners.length ) {
        for( var i=0; i<this.listeners.length; i++ ) {
          this.listeners[i].detach();
        }
      }
      this.listeners = [];
    },

    _afterNav: function(url) {
      var _this = this,
          proj = Y.one('#project .project-item[data-dynamic-href="'+url+'"]'),
          grid = Y.one('#grid'),
          body = Y.one('body');

      _this._destroyKeyHandlers();
      if (url && proj) {
        body.addClass('index-detail');
        _this._checkSidebarHeight(proj);
        _this.currImg = 1;
        _this.currProj = proj;
        _this._setupKeyHandlers();
      } else if (grid) {
        body.removeClass('index-detail');
        _this.galleryGrid.refresh();
      } else if (Y.one('.collection-type-gallery') && Y.one('.meta')) {
        _this._checkSidebarHeight(Y.one('.project-item'));
      }

    },

    _setupBottomBar: function() {
      if (!Modernizr.touch && Y.Squarespace.Template.getTweakValue('autohide-footer') + "" === "true") {
        var bottomBar = Y.one('#bottomBar');
        var layoutNode = bottomBar.one('.sqs-layout');
        var hasSocialLinks = Y.Lang.isValue(bottomBar.one('.social-links'));

        Y.one(window).on('mousemove', function(e) {
          if (bottomBar && (!layoutNode.hasClass('empty') || hasSocialLinks || Static.SQUARESPACE_CONTEXT.authenticatedAccount)) {
            if (e.clientY > window.innerHeight - bottomBar.height()) {
              bottomBar.addClass('viewable');
            } else {
              bottomBar.removeClass('viewable');
            }
          }
        });
      }
    },

    _setupGrid: function() {

      this.gridEl.all('.item img').each(function(img) {
        img.removeAttribute('alt');
      });

      this.galleryGrid = new Y.Squarespace.Gallery2({
          container: this.gridEl,
          design: 'autocolumns',
          designOptions: {
            columnWidth: parseInt(Y.Squarespace.Template.getTweakValue('@projectCoverWidth')),
            columnWidthBehavior: 'min',
            squares: Y.Squarespace.Template.getTweakValue('project-squares') + "" === "true",
            aspectRatio: Y.Squarespace.Template.getTweakValue('project-squares') + "" === "true" ? 1 : 0
          },
          loaderOptions: { load: false },
          lazyLoad: true,
          refreshOnResize: true,
          keys: false
      });

      this._setupGridHovers(this.gridEl);
    },

    _setupGridHovers: function(grid) {
      if (!Modernizr.touch) {
        if (Modernizr.csstransforms) {
          grid.delegate('mouseenter', Y.bind(this._onMouseEnter, this), '.item');

          grid.delegate('mousemove', Y.bind(this._onMouseMove, this), '.item');

          grid.delegate('mouseleave', Y.bind(this._onMouseLeave, this), '.item');
        } else {
          grid.delegate('mouseenter', function(e) {
            e.currentTarget.addClass('hovering');
            e.currentTarget.one('img').setStyles({
              'opacity': .22,
              'filter': 'alpha(opacity=22)'
            });
            e.currentTarget.one('div').setStyles({
              'opacity': 1,
              'filter': 'alpha(opacity=100)'
            });
          }, '.item');

          grid.delegate('mouseleave', function(e) {
            e.currentTarget.removeClass('hovering');
            e.currentTarget.one('img').setStyles({
              'opacity': 1,
              'filter': 'alpha(opacity=100)'
            });
            e.currentTarget.one('div').setStyles({
              'opacity': 0,
              'filter': 'alpha(opacity=0)'
            });
          }, '.item');

          grid.delegate('mousemove', function(e) {});
        }
      }
    },

    _onMouseEnter: function(e) {
      var _this = this;

      clearTimeout(e.currentTarget.getAttribute('overlayDelay'));
      clearInterval(e.currentTarget.getAttribute('tickInterval'));

      e.currentTarget.setAttribute('overlayDelay', setTimeout(function() {
        e.currentTarget.addClass('hovering');
      }, 20));

      if (Y.Squarespace.Template.getTweakValue('project-hover-panning') + "" === "true") {
        e.currentTarget.setAttribute('tickInterval', setInterval(function() {
          e.currentTarget.one('img').tick();
        }, 10));
        e.currentTarget.setAttribute('original-top', e.currentTarget.one('img').getStyle('top'));
        e.currentTarget.setAttribute('original-left', e.currentTarget.one('img').getStyle('left'));
      }
    },

    _onMouseMove: function(e) {
      if (Y.Squarespace.Template.getTweakValue('project-hover-panning') + "" === "false") return;

      var x, y;
      x = (e.currentTarget.getXY()[0] - e.pageX + (e.currentTarget.get('offsetWidth') / 2)) / 8;
      y = (e.currentTarget.getXY()[1] - e.pageY + (e.currentTarget.get('offsetHeight') / 2)) / 8;
      x = Math.round(x);
      y = Math.round(y);

      e.currentTarget.one('img').tick({
        top: y + parseInt(e.currentTarget.getAttribute('original-top')),
        left: x + parseInt(e.currentTarget.getAttribute('original-left'))
      });
    },

    _onMouseLeave: function(e) {
      clearTimeout(e.currentTarget.getAttribute('overlayDelay'));
      clearInterval(e.currentTarget.getAttribute('tickInterval'));

      e.currentTarget.removeClass('hovering');
      var img = e.currentTarget.one('img');

      if (e.currentTarget.getAttribute('original-top')) {
        img.setStyle('top', e.currentTarget.getAttribute('original-top'));
      }
      if (e.currentTarget.getAttribute('original-left')) {
        img.setStyle('left', e.currentTarget.getAttribute('original-left'));
      }
    },

    _checkSidebarHeight: function(proj) {
      // Make meta sidebar absolute if it's too long
      Y.all('#project .project-item .meta').setStyle('position', '');

      var metaHeight = proj.one('.meta').height();
      if( Y.config.win.innerWidth > 1000 && metaHeight + Y.one('#topBar').get('offsetHeight') > Y.config.win.innerHeight ) {
        Y.one('body').addClass('meta-unfixed');
      } else {
        Y.one('body').removeClass('meta-unfixed');
      }

      if( proj.one('.meta').getStyle('position') !== 'relative' && metaHeight > proj.one('.gallery').height() ) {
        proj.one('.gallery').setStyle('minHeight', metaHeight + 'px');
      }
    },

    // to avoid conflicting with lightbox key handlers or form inputs
    _validEvent: function(e) {
      return (Y.one('.yui3-lightbox2') || e.target.ancestor('form')) ? false : true;
    },

    nextProject: function(e) {
      if (!this._validEvent(e)) return;

      var proj = Y.one('.project-item:not(.visually-hidden)').next();
      if( !proj ) {
        proj = Y.one('.project-item');
      }
      window.location.hash = '#' + proj.getAttribute('data-dynamic-href');
    },

    prevProject: function(e) {
      if (!this._validEvent(e)) return;

      var proj = Y.one('.project-item:not(.visually-hidden)').previous();
      if( !proj ) {
        var projs = Y.all('.project-item');
        proj = projs.item(projs.size()-1);
      }
      window.location.hash = '#' + proj.getAttribute('data-dynamic-href');
    },

    jumpDown: function(e) {
      if (!this._validEvent(e)) return;

      var newPos, proj = Y.one('.project-item:not(.visually-hidden)');

      if (!proj) return;

      if (!this.currImg) {
        this.currImg = 1;
      }
      if(Y.one('#topBar')){
        if (this.currImg < proj.all("img").size()) {
          newPos = proj.all('img').item(this.currImg).getXY()[1];
          newPos = 5 + newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
          this.animate('body', { to: {
              scroll: [0,newPos]
            },
            duration: 0.5
          });
        } else {
          newPos = Y.one('#grid').getXY()[1];
          newPos = newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
          this.animate('body', { to: {
              scroll: [0,newPos]
            },
            duration: 0.8
          });
        }
      }

      this.currImg++;
    },

    jumpUp: function(e) {
      if (!this._validEvent(e)) return;

      var newPos, proj = Y.one('.project-item:not(.visually-hidden)'),
          maxPos = proj.all('img').size()+1;
      if (!this.currImg) {
        this.currImg = 1;
      }

      if (!proj) return;
      if(Y.one('#topBar')){
        if (this.currImg > 1) {
          if( this.currImg > maxPos ) this.currImg = maxPos;
          newPos = proj.all('img').item(this.currImg-2).getXY()[1];
          newPos = 5 + newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
          this.animate('body', { to: {
              scroll: [0,newPos]
            },
            duration: 0.5
          });
          this.currImg--;
        }
      }

    },

    _setupPositioning: function() {
      var adjustForHeaderFooter = function() {
        if(Y.one('#topBar')){
          Y.one('#container').setStyle('marginTop', Y.one('#topBar').get('offsetHeight'));
        }

        if (Y.Squarespace.Template.getTweakValue('autohide-footer') + "" === "false" && Y.one('#bottomBar')) {
          Y.one('#container').setStyle('marginBottom', Y.one('#bottomBar').get('offsetHeight'));
        }
      };

      Y.on('resize', adjustForHeaderFooter);
      adjustForHeaderFooter();
    },

    // Convenience method for animating
    animate: function(node, config, callback) {
      config = Y.merge({
        duration: 0.3,
        easing: Y.Easing.easeOutStrong
      }, config);
      Y.one(node).anim({}, config).run().on('end', callback);
    },

    _setupTweakHandler: function() {
      var _this = this,
          bRefresh = false;

      // delayed setup... to make sure we have access to Y.Global
      setTimeout(Y.bind(function() {
        if (Y.Global) {
          Y.Global.on('tweak:change', function(f){
            var tweakName = f.getName();
            if (_this.galleryGrid) {
              if (tweakName.match(/projectCoverWidth/i)) {
                _this.galleryGrid.set('columnWidth', parseInt(f.getValue()));
              } else if (tweakName.match(/project-squares/)) {
                if (f.getValue() == 'true') {
                  _this.galleryGrid.set('aspectRatio', 1);
                } else {
                  _this.galleryGrid.set('aspectRatio', 0);
                }
              }
            }
          });

          // Hack to fix grid on tweak close
          Y.Global.on('tweak:close', function() {
            setTimeout(function() {
              _this.galleryGrid.refresh();
            }, 500);
          });
        }
      }, this), 1000);
    }

  });
});
