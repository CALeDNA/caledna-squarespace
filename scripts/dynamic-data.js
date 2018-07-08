/*

    Squarespace Dynamic Data
    ------------------------
    On click, inject page content dynamically into an element.
    Value in a[href] is used.

    Params:

    - wrapper: where to inject the fetched data
    - target: elements to be used as an onclick triggers
    - preCallback: function to be executed pre-load
    - postCallback: function to be executed post-load
    - useHashes: keep track of the current active page using # in URL's
    - autoOpenHash: if the current URL includes a #, fetch that page on init
    - injectEl: by default, all page data is injected into wrapper. Use this option
      to specify which part of the loaded page is to be injected in wrapper.
      Ex: '#content' or '#content, #thumbnails'
    - minimumResolution: minimum browser width required for this plugin to work
      Ex: 1025px ensures that default clicking behavior is maintained on mobiles and tablets
    - scrollToWrapperPreLoad: scroll and focus on wrapper pre-load

    Methods:
    - simulateHash( hash ): simulate an onClick event by passing the
      trigger's href value as hash

 */

YUI.add( 'squarespace-dynamic-data', function( Y ) {

  Y.namespace( 'Squarespace' );

  Y.Squarespace.DynamicData = function( params ) {
    var wrapper = ( params && params.wrapper ) || 'body',
      preCallback = ( params && params.preCallback ) || null,
      postCallback = ( params && params.postCallback ) || null,
      useHashes = ( params && params.useHashes ) || false,
      autoOpenHash = ( params && params.autoOpenHash ) || false,
      injectEl = ( params && params.injectEl ) || null,
      minimumResolution = ( params && params.minimumResolution ) || null,
      scrollToWrapperPreLoad = ( params && params.scrollToWrapperPreLoad ) || false,
      appendData = ( params && params.appendData ) || null,
      classes = {
        search: ( params && params.target ) || '.sqs-dynamic-data',
        active: 'sqs-dynamic-data-active',
        loading: 'sqs-dynamic-data-loading',
        ready: 'sqs-dynamic-data-ready',
        activeWrapper: 'data-dynamic-data-link',
        appendWrapper: 'sqs-dynamic-data-wrapper'
      };

    // Core
    function init() {
      if ( !minimumResolution || window.innerWidth >= minimumResolution ) {
        wrapper = Y.one( wrapper );

        if ( wrapper ) {
          Y.on( 'click', fetch, classes.search );
          openCurrentHash();
        }
      }
    }

    // Simulate a click
    this.simulateHash = function( hash ) {
      if ( hash ) {
        hash = hash.replace( '#', '' );
        fetch( null, hash)
      }
    }

    // Check if current URL contains a hash
    function openCurrentHash() {
      var hash = window.location.hash;

      if ( autoOpenHash && hash ) {
        hash = hash.replace( '#', '' );
        hash = hash.endsWith('/') ? hash : hash + '/'; // append slash if not present
        fetch( null, hash);
      }
    }

    // Call Fn
    function callFn( fn ) {
      if ( typeof fn === 'function') {
        fn();
      }
    }

    // Clean url
    function cleanUrl( url ) {
      return url.replace(/\//g,'');
    }

    // Fetch url - on click or forced
    function fetch( e, simulate ) {
      var trigger = ( simulate && Y.one( classes.search + '[href="' + simulate + '"]'  ) ) || ( e && e.currentTarget || null ),
        url = ( simulate ) || ( trigger && trigger.getAttribute( 'href' ) ),
        tempWrapper,
        loadingWrapper;

      if ( e ) {
        e.preventDefault();
      }

      if ( useHashes ) {
        window.location.hash = url;
      }

      // Only load items that have never been loaded
      if ( ( trigger && !appendData && cleanUrl( url ) != wrapper.getAttribute( classes.activeWrapper ) ) ||
           ( trigger && appendData && !wrapper.one( '[' + classes.activeWrapper + '=' + cleanUrl( url ) + ']' ) ) ) {

        // Destroy old Squarespace blocks
        SQS.Lifecycle.destroy();
        wrapper.setAttribute( classes.activeWrapper, cleanUrl( url ) );

        Y.all( '.' + classes.active ).removeClass( classes.active );
        trigger.addClass( classes.active );
        wrapper.removeClass( classes.ready );
        wrapper.addClass( classes.loading );

        // Scroll to top if required
        if ( !simulate ) {
          scrollToWrapper();
        }

        callFn( preCallback );

        if ( appendData ) {
          tempWrapper = Y.Node.create( '<div></div>' );
          tempWrapper.addClass( classes.appendWrapper );
          tempWrapper.setAttribute( classes.activeWrapper, cleanUrl( url ) );
          tempWrapper.appendTo( wrapper );
        }

        loadingWrapper = tempWrapper ? tempWrapper : wrapper;

        loadingWrapper.load( url, injectEl, function() {
          loadReady( url );
        });
      } else {

        wrapper.setAttribute( classes.activeWrapper, cleanUrl( url ) );

        if ( !simulate ) {
          scrollToWrapper();
        }
      }

    }

    // SQS block related inits
    function sqsBlocks(callback) {

      // TODO: Refactor this craziness
      if (wrapper.ancestor('.visually-hidden')) {
        Y.later(500, this, sqsBlocks); // need to be un-hidden to initialize
        return;
      }

      // Initialize Squarespace blocks
      SQS.Lifecycle.init();
      
      // Initialize Squarespace Commerce
      Squarespace.initializeCommerce(Y);

      // Load Non-Block Images
      wrapper.all('img[data-src]').each(function(el) {
        if (!el.ancestor('.sqs-layout')) {
          ImageLoader.load(el);
        }
      });

      // Execute scripts
      wrapper.all( 'script' ).each(function( n ) {
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        if (n.getAttribute('src')) {
          newScript.src = n.getAttribute('src');
        } else {
          newScript.innerHTML = n.get('innerHTML');
        }
        Y.one('head').append(newScript);
      });


      callFn( callback ); // wait for images to load?
    }

    // Locate Wrapper
    function scrollToWrapper() {
      var scrollY, scrollAnim;

      if ( scrollToWrapperPreLoad ) {
        scrollY = wrapper.getXY();
        scrollY = scrollY[ 1 ];
        var scrollingElementSel = Y.UA.gecko || Y.UA.ie || !!navigator.userAgent.match(/Trident.*rv.11\./) ? 'html' : 'body';
        scrollAnim = new Y.Anim({
          node: Y.one(document.scrollingElement || scrollingElementSel),
          to: {
            scroll: [ 0, scrollY ]
          },
          duration: 0.3,
          easing: 'easeBoth'
        });
        scrollAnim.run();
      }
    }

    // Load ready
    function loadReady( url ) {
      sqsBlocks( postCallback );
      Squarespace.addLoadTrigger(".sqs-block.calendar-block", ["squarespace-calendar-block-renderer"]);


      wrapper.removeClass( classes.loading );
      wrapper.addClass( classes.ready );
    }

    init();
  }
}, '1.0', { requires: [ 'node', 'node-load', 'squarespace-social-buttons' ] });
