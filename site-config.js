/* Florence Olivia — site configuration
   Pulls live settings from the TimberSea command centre (Supabase) and applies them:
   announcement banner, section visibility, rate display, booking on/off, contact
   details, SEO overrides, hero image, gallery. Every behaviour falls back to the
   hardcoded page content if the fetch fails — the site always renders. */
(function(){
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cGxybnloYmxjYWx3eWlyb2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTUxNDIsImV4cCI6MjA5OTk5MTE0Mn0.oUnGLIOt0_gqm4ARF1RYUPsTJRLnZIVJbdIzG5_alhw';
  var PID = '8d3cb879-cd15-4218-884f-70406e1e234a';
  var FIELDS = 'name,hero_image,gallery_images,story_para_1,story_para_2,story_para_3,contact_email,contact_phone,seo_title,seo_description,og_image,website_config,base_rate';

  function ready(fn){ if(document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }

  fetch('https://btplrnyhblcalwyirolk.supabase.co/rest/v1/ts_properties?id=eq.' + PID + '&select=' + FIELDS, {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  }).then(function(r){ return r.json(); }).then(function(rows){
    if(!Array.isArray(rows) || !rows.length) return;
    var p = rows[0];
    var wc = p.website_config || {};
    ready(function(){ apply(p, wc); });
  }).catch(function(e){ console.warn('site-config unavailable, using page defaults', e); });

  function apply(p, wc){
    /* ── SEO overrides ── */
    if(p.seo_title && (location.pathname === '/' || /index/.test(location.pathname))) document.title = p.seo_title;
    if(p.seo_description){
      var md = document.querySelector('meta[name="description"]');
      if(!md){ md = document.createElement('meta'); md.setAttribute('name','description'); document.head.appendChild(md); }
      md.setAttribute('content', p.seo_description);
    }
    if(p.og_image){
      var og = document.querySelector('meta[property="og:image"]');
      if(!og){ og = document.createElement('meta'); og.setAttribute('property','og:image'); document.head.appendChild(og); }
      og.setAttribute('content', p.og_image);
    }

    /* ── Announcement banner ── */
    if(wc.show_announcement && wc.announcement_banner){
      var bar = document.createElement('div');
      bar.id = 'fo-announce';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10001;background:#111510;color:#F4F1EC;border-bottom:1px solid #7B9E9A;font-size:12px;letter-spacing:.06em;text-align:center;padding:9px 40px;font-weight:300;line-height:1.5';
      bar.textContent = wc.announcement_banner;
      document.body.insertBefore(bar, document.body.firstChild);
      var h = bar.offsetHeight;
      var nav = document.querySelector('nav.nav');
      if(nav && getComputedStyle(nav).position === 'fixed') nav.style.top = h + 'px';
    }

    /* ── Section visibility → nav links ── */
    function hideLinks(match){
      document.querySelectorAll('a[href]').forEach(function(a){
        var href = a.getAttribute('href') || '';
        if(href.indexOf(match) !== -1 && (a.closest('.nav-links') || a.closest('.nav-drawer') || a.closest('footer'))){
          var li = a.closest('li'); (li || a).style.display = 'none';
        }
      });
    }
    if(wc.show_amenities === false) hideLinks('amenities');
    if(wc.show_local_area === false) hideLinks('local');
    if(wc.show_policies_page === false) hideLinks('policies');

    /* ── Rate visibility ── */
    if(wc.show_rates === false){
      var r1 = document.getElementById('js-index-rate'); if(r1){ var s = r1.closest('.stat-item'); if(s) s.style.display = 'none'; }
      var r2 = document.getElementById('js-prop-rate'); if(r2){ var s2 = r2.closest('.prop-stat'); if(s2) s2.style.display = 'none'; }
      var r3 = document.getElementById('js-am-rate'); if(r3){ var pEl = r3.closest('p'); if(pEl) pEl.textContent = 'Rates confirmed on enquiry — we reply personally within 24 hours.'; }
      var r4 = document.getElementById('js-rate-display'); if(r4){ var pr = r4.parentNode; if(pr) pr.textContent = 'Rates confirmed on enquiry'; }
    }

    /* ── Booking on/off ── */
    if(wc.booking_enabled === false){
      var form = document.getElementById('booking-form');
      if(form){
        form.style.display = 'none';
        var msg = document.createElement('div');
        msg.style.cssText = 'border:1px solid rgba(244,241,236,0.12);background:#111510;padding:40px;text-align:center;color:rgba(244,241,236,0.75);line-height:1.8;font-size:15px';
        var email = p.contact_email || 'hello@florenceolivia.com';
        msg.innerHTML = 'Online booking is temporarily unavailable.<br>Please email <a href="mailto:' + email + '" style="color:#7B9E9A">' + email + '</a>' + (p.contact_phone ? ' or call <a href="tel:' + p.contact_phone.replace(/\s/g,'') + '" style="color:#7B9E9A">' + p.contact_phone + '</a>' : '') + ' and we\u2019ll arrange your stay personally.';
        form.parentNode.insertBefore(msg, form);
      }
    }

    /* ── Contact details ── */
    var ce = document.getElementById('fo-contact-email');
    if(ce && p.contact_email){ ce.textContent = p.contact_email; ce.setAttribute('href', 'mailto:' + p.contact_email); }
    var cp = document.getElementById('fo-contact-phone');
    if(cp && p.contact_phone){ cp.textContent = p.contact_phone; cp.setAttribute('href', 'tel:' + p.contact_phone.replace(/\s/g,'')); }

    /* ── Hero image (homepage first slide) ── */
    if(p.hero_image){
      var slide = document.querySelector('.hero-slide img');
      if(slide) slide.src = p.hero_image;
    }

    /* ── Property page: story copy from the command centre ── */
    function setStory(id, text){
      if(!text) return;
      var el = document.getElementById(id);
      if(!el) return;
      el.innerHTML = '';
      text.split(/\n+/).forEach(function(t){
        t = t.trim(); if(!t) return;
        var para = document.createElement('p'); para.textContent = t; el.appendChild(para);
      });
    }
    setStory('fo-story-1', p.story_para_1);
    setStory('fo-story-2', p.story_para_2);
    setStory('fo-story-3', p.story_para_3);

    /* ── Property page: gallery + lightbox from the command centre ── */
    var galleryWrap = document.querySelector('.prop-gallery');
    if(galleryWrap && wc.show_gallery === false){ galleryWrap.style.display = 'none'; }
    var gal = Array.isArray(p.gallery_images) ? p.gallery_images.map(function(g){
      return typeof g === 'string' ? { url: g, caption: '' } : { url: g.url || '', caption: g.caption || '' };
    }).filter(function(g){ return g.url; }) : [];
    if(galleryWrap && gal.length >= 5 && wc.show_gallery !== false){
      var imgs = galleryWrap.querySelectorAll('img');
      for(var i = 0; i < imgs.length && i < gal.length; i++){
        imgs[i].src = gal[i].url;
        if(gal[i].caption) imgs[i].alt = gal[i].caption;
      }
      if(typeof window.lbImages !== 'undefined'){
        window.lbImages = gal.map(function(g){ return { src: g.url, cap: g.caption }; });
      }
    }
  }
})();
