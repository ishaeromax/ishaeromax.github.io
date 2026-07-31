(function () { 
  // Yeah i really don't like this code knowing it was done in a rush 
  // and usually putting a lot of stuff in 1 lines then organize again and 
  // blah blah balh blah blahhhhhhhhh
  // (i was going to do something more simple but i went very far :sob:)

  // at least i don't need to worry about a database...

  // mid loop: seeks to duration, loops a 10s window
  document.querySelectorAll('video[data-midloop]').forEach(function (v) {
    v.addEventListener('loadedmetadata', function () {
      var mid = v.duration / 2;
      v._ls = mid; v._le = mid + 10;
      v.currentTime = mid;
      
      v.play().catch(function () {});
    });
    
    v.addEventListener('timeupdate', function () {
      if (v._le !== undefined && v.currentTime >= v._le) 
        v.currentTime = v._ls;
    });
  });

  // youtube thumbnails: reload iframe every 10s to loop
  document.querySelectorAll('.yt-thumb-wrap').forEach(function (wrap) {
    var iframe = wrap.querySelector('iframe');
    if (!iframe) 
      return;
    
    var src = iframe.src;
    iframe.addEventListener('load', function () {
      var fb = wrap.querySelector('.yt-thumb-fallback');
      if (fb) 
        fb.style.opacity = '0';
    });
    
    setInterval(function () {
      iframe.src = '';

      // I really don't like to put stuff in 1 like this one but IT GIVES ME A DAMN TICK TO SEE IT IN 3 LINES
      setTimeout(function () { iframe.src = src; }, 80);
    }, 10000);
  });

  // filter bar
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.pcard');
  var grid = document.getElementById('projectsGrid');

  filterBtns.forEach(function (fb) {
    fb.addEventListener('click', function () {
      var f = fb.dataset.filter;
      filterBtns.forEach(function (b) { 
        b.classList.remove('active'); 
      });
      
      fb.classList.add('active');
      var visible = 0;
      
      cards.forEach(function (card) {
        var langs = (card.dataset.langs || '').split(' ');
        
        var show  = f === 'all' || langs.indexOf(f) !== -1;
        card.classList.toggle('hidden', !show);
        
        if (show) 
          visible++;
      });
      
      var ex = grid.querySelector('.empty-state');
      if (ex) 
        grid.removeChild(ex);
      
      if (visible === 0) {
        var msg = document.createElement('p');
        msg.className = 'empty-state';
        msg.textContent = 'no projects yet for this filter';
        grid.appendChild(msg);
      }
    });
  });

  // modal
  var backdrop = document.getElementById('modalBackdrop');
  var gallery = document.getElementById('modalGallery');
  var thumbsEl = document.getElementById('modalThumbs');
  var titleEl = document.getElementById('modalTitle');
  var descEl = document.getElementById('modalDesc');
  var tagsEl = document.getElementById('modalTags');
  var linksEl = document.getElementById('modalLinks');
  var closeBtn = document.getElementById('modalClose');
  var mediaItems = [], current = 0;

  function buildModalEl(item) {
    if (item.type === 'image') {
      var img = document.createElement('img');
      img.src = item.src; img.alt = item.alt || ''; 
      
      return img;
    }
    
    if (item.type === 'video') {
      var v = document.createElement('video');
      v.src = item.src; v.controls = true; 
      v.preload = 'auto';
      
      v.setAttribute('playsinline', '');
      v.addEventListener('loadedmetadata', function () { 
        v.currentTime = 0.1; 
      });
      
      return v;
    }

    if (item.type === 'youtube') {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + item.id + '?rel=0&modestbranding=1' + (item.start ? '&start=' + item.start : '');
      f.title = item.title || 'Video'; f.allowFullscreen = true; 
      
      return f;
    }

    var ph = document.createElement('div');
    ph.className = 'media-ph'; ph.setAttribute('aria-hidden', 'true');
    ph.innerHTML = '<div class="media-ph-ring">&#9654;</div><span>no media</span>';
    
    return ph;
  }

  function showMedia(idx) {
    current = idx;
    
    var existing = gallery.querySelector(':not(.gal-nav)');
    if (existing) 
      gallery.removeChild(existing);
    
    gallery.insertBefore(buildModalEl(mediaItems[idx]), gallery.querySelector('.gal-nav'));
    thumbsEl.querySelectorAll('.modal-thumb').forEach(function (t, i) { 
      t.classList.toggle('active', i === idx); 
    });
    
    gallery.querySelectorAll('.gal-dot').forEach(function (d, i) { 
      d.classList.toggle('active', i === idx); 
    });
  }

  function openModal(card) {
    titleEl.textContent = card.querySelector('.pcard-title').textContent;
    descEl.textContent = card.dataset.modalDesc || card.querySelector('.pcard-desc').textContent;

    tagsEl.innerHTML = '';
    var footer = card.querySelector('.pcard-footer');
    if (footer) 
      tagsEl.innerHTML = footer.innerHTML;

    linksEl.innerHTML = '';
    var rawLinks = [];
    try { 
      rawLinks = JSON.parse(card.dataset.modalLinks || '[]'); 
    } 
    catch (e) {}
    
    rawLinks.forEach(function (l) {
      if (!l.url || l.url.indexOf('PENDING') !== -1) 
        return;
      
      var a = document.createElement('a');
      a.className = 'modal-link'; 
      a.href = l.url;
      
      a.target = '_blank'; 
      a.rel = 'noopener noreferrer';
      a.textContent = l.label; linksEl.appendChild(a);
    });

    mediaItems = [];
    var cm = card.querySelector('.pcard-media');
    var ytW = cm && cm.querySelector('.yt-thumb-wrap');
    var cv = cm && cm.querySelector('video');
    var ci = cm && cm.querySelector('img:not(.yt-thumb-fallback)');

    if (ytW) {
      var ytid = ytW.dataset.ytid, ytstart = parseInt(ytW.dataset.ytstart) || 0;
      if (ytid) 
        mediaItems.push({ 
          type:'youtube', 
          id:ytid, 
          title:'Video', 
          start:ytstart 
        });
    } 
    else if (cv) {
      mediaItems.push({ 
        type:'video', 
        src:cv.getAttribute('src') 
      });
    } 
    else if (ci) {
      mediaItems.push({ 
        type:'image', src:ci.getAttribute('src'), 
        alt:ci.alt 
      });
    } 
    else {
      mediaItems.push({ type:'placeholder' });
    }
    
    var extra = [];
    try { 
      extra = JSON.parse(card.dataset.modalMedia || '[]'); 
    } 
    catch (e) {}
    
    extra.forEach(function (item) { 
      mediaItems.push(item); 
    });

    gallery.innerHTML = ''; thumbsEl.innerHTML = '';

    if (mediaItems.length > 1) {
      var nav = document.createElement('div');
      
      nav.className = 'gal-nav';
      nav.innerHTML = '<button class="gal-btn" id="galPrev" aria-label="Previous">&#8592;</button>' + '<div class="gal-dots" id="galDots"></div>' + '<button class="gal-btn" id="galNext" aria-label="Next">&#8594;</button>';
      gallery.appendChild(nav);
      
      var dotsEl = nav.querySelector('#galDots');
      mediaItems.forEach(function (_, i) {
        var d = document.createElement('span');
        d.className = 'gal-dot' + (i === 0 ? ' active' : '');

        d.addEventListener('click', function () { 
          showMedia(i); 
        });
        
        dotsEl.appendChild(d);
      });
      
      nav.querySelector('#galPrev').addEventListener('click', function (e) {
        e.stopPropagation(); showMedia((current - 1 + mediaItems.length) % mediaItems.length);
      });
      
      nav.querySelector('#galNext').addEventListener('click', function (e) {
        e.stopPropagation(); showMedia((current + 1) % mediaItems.length);
      });
      
      mediaItems.forEach(function (item, i) {
        var thumb = document.createElement('div');
        thumb.className = 'modal-thumb' + (i === 0 ? ' active' : '');
        
        if (item.type === 'image') {
          var tImg = document.createElement('img'); 
          tImg.src = item.src; 
          tImg.alt = ''; 
          
          thumb.appendChild(tImg);
        } 
        else if (item.type === 'video') {
          var tv = document.createElement('video');
          tv.src = item.src; tv.preload = 'metadata'; 
          tv.muted = true;
          tv.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          
          tv.addEventListener('loadedmetadata', function () { 
            tv.currentTime = 0.1; 
          });
          thumb.appendChild(tv);
        } 
        else {
          var tPh = document.createElement('div'); tPh.className = 'modal-thumb-ph';
          tPh.textContent = item.type === 'youtube' ? 'YT' : '>'; 
          thumb.appendChild(tPh);
        }
        
        thumb.addEventListener('click', function () { 
          showMedia(i); 
        });
        thumbsEl.appendChild(thumb);
      });
    } 
    else if (mediaItems.length === 1 && mediaItems[0].type === 'video') {
      var st = document.createElement('div');
      st.className = 'modal-thumb active';
      
      var stv = document.createElement('video');
      stv.src = mediaItems[0].src; stv.preload = 'metadata'; 
      stv.muted = true;
      stv.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      
      stv.addEventListener('loadedmetadata', function () { 
        stv.currentTime = 0.1; 
      });
      
      st.appendChild(stv);
      thumbsEl.appendChild(st);
    }
    
    gallery.insertBefore(buildModalEl(mediaItems[0]), gallery.querySelector('.gal-nav'));
    
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    
    var vid = gallery.querySelector('video'); 
    if (vid) 
      vid.pause();
    
    var fr  = gallery.querySelector('iframe'); 
    if (fr) 
      fr.src = '';
  }

  closeBtn.addEventListener('click', closeModal);
  
  backdrop.addEventListener('click', function (e) { 
    if (e.target === backdrop) 
      closeModal(); 
  });
  
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') 
      closeModal();
    
    if (!backdrop.classList.contains('open')) 
      return;
    
    if (e.key === 'ArrowLeft')  
      showMedia((current - 1 + mediaItems.length) % mediaItems.length);
    
    if (e.key === 'ArrowRight') 
      showMedia((current + 1) % mediaItems.length);
  });

  // card carousels and see more buttons
  cards.forEach(function (card) {
    var cm = card.querySelector('.pcard-media');

    var slides = [];
    var ytW = cm && cm.querySelector('.yt-thumb-wrap');
    var cv = cm && cm.querySelector('video');
    var ci = cm && cm.querySelector('img:not(.yt-thumb-fallback)');

    if (ytW) {
      slides.push({ 
        type:'yt-static', 
        ytid:ytW.dataset.ytid 
      });
    } 
    else if (cv) {
      slides.push({ 
        type:'video', 
        src:cv.getAttribute('src'), 
        midloop:cv.hasAttribute('data-midloop') 
      });
    } 
    else if (ci) {
      slides.push({ 
        type:'image', 
        src:ci.getAttribute('src'), 
        alt:ci.alt || '' 
      });
    } 
    else {
      slides.push({ type:'placeholder' });
    }
    
    var extra = [];
    try { 
      extra = JSON.parse(card.dataset.modalMedia || '[]'); 
    } 
    catch (e) {}
    
    extra.forEach(function (item) { slides.push(item); });

    // buttons row
    var body = card.querySelector('.pcard-body');
    if (body) {
      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.65rem;';

      var smb = document.createElement('button');
      smb.className = 'see-more-btn';
      smb.style.marginTop = '0';
      smb.textContent = 'See More';
      
      smb.addEventListener('click', function (e) { 
        e.stopPropagation(); 
        openModal(card); 
      });
      btnRow.appendChild(smb);

      if (card.dataset.sourceUrl) {
        var src = document.createElement('a');
        src.className = 'see-more-btn';
        src.style.marginTop = '0';
        src.textContent = 'Source Code';
        src.href = card.dataset.sourceUrl;
        src.target = '_blank';
        src.rel = 'noopener noreferrer';
        
        src.addEventListener('click', function (e) { 
          e.stopPropagation(); 
        });

        btnRow.appendChild(src);
      }

      body.appendChild(btnRow);
    }

    card.addEventListener('click', function (e) {
      if (!e.target.closest('.pcard-media') && !e.target.closest('.see-more-btn')) {
        openModal(card);
      }
    });

    if (slides.length <= 1)
      return;

    var idx = 0;
    var originalEl = ytW || cv || ci;
    var activeEl = originalEl;
    var cachedEls = {};
    var ytOverlay = cm && cm.querySelector('.yt-play-overlay');

    function makeSlideEl(slide) {
      var el;
      if (slide.type === 'video') {
        el = document.createElement('video');
        el.src = slide.src; el.muted = true; el.loop = true;
        
        el.setAttribute('playsinline', ''); 
        el.setAttribute('preload', 'auto');
        el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
        
        if (slide.midloop) {
          el.addEventListener('loadedmetadata', function () {
            var mid = el.duration / 2;
            el._ls = mid; el._le = mid + 10;
            
            el.currentTime = mid; el.play().catch(function () {});
          });
          
          el.addEventListener('timeupdate', function () {
            if (el._le !== undefined && el.currentTime >= el._le)
              el.currentTime = el._ls;
          });
        } 
        else {
          el.addEventListener('loadedmetadata', function () { 
            el.currentTime = 0.1; el.play().catch(function () {}); });
        }
      } 
      else if (slide.type === 'image') {
        el = document.createElement('img');
        el.src = slide.src; el.alt = slide.alt || '';
        
        el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
      } 
      else if (slide.type === 'youtube') {
        el = document.createElement('img');
        el.src = 'https://img.youtube.com/vi/' + slide.id + '/hqdefault.jpg'; el.alt = '';
        
        el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
      } 
      else {
        el = document.createElement('div');
        el.style.cssText = 'position:absolute;inset:0;background:var(--bg2);';
      }
      return el;
    }

    function goTo(newIdx) {
      newIdx = (newIdx + slides.length) % slides.length;
      if (newIdx === idx) 
        return;
      
      idx = newIdx;

      if (activeEl) {
        activeEl.style.display = 'none';
        
        if (activeEl.tagName === 'VIDEO') 
          activeEl.pause();
      }

      if (idx === 0) {
        activeEl = originalEl;
        activeEl.style.display = '';
        
        if (activeEl.tagName === 'VIDEO') 
          activeEl.play().catch(function () {});
      } 
      else {
        
        if (!cachedEls[idx]) {
          cachedEls[idx] = makeSlideEl(slides[idx]);
          cm.insertBefore(cachedEls[idx], prevBtn);
        }
        
        activeEl = cachedEls[idx];
        activeEl.style.display = '';
        if (activeEl.tagName === 'VIDEO') 
          activeEl.play().catch(function () {});
      }

      if (ytOverlay) 
        ytOverlay.style.display = idx === 0 ? '' : 'none';

      dotsWrap.querySelectorAll('.card-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === idx);
      });
    }

    var prevBtn = document.createElement('button');
    prevBtn.className = 'card-nav-btn card-nav-prev';
    prevBtn.innerHTML = '&#8592;'; 
    prevBtn.setAttribute('aria-label', 'Previous');

    prevBtn.addEventListener('click', function (e) { 
      e.stopPropagation(); 
      goTo(idx - 1); 
    });

    var nextBtn = document.createElement('button');
    nextBtn.className = 'card-nav-btn card-nav-next';
    nextBtn.innerHTML = '&#8594;'; 
    nextBtn.setAttribute('aria-label', 'Next');
    
    nextBtn.addEventListener('click', function (e) { 
      e.stopPropagation(); 
      goTo(idx + 1); 
    });

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'card-dots';
    slides.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'card-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(d);
    });

    cm.appendChild(prevBtn);
    cm.appendChild(nextBtn);
    cm.appendChild(dotsWrap);
  });
})();