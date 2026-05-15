// Hapee Blog · Article shared JS · dark toggle + share buttons + copy link
(function(){
  // === Dark mode (persist) ===
  const root = document.documentElement;
  const KEY = 'hapee-theme';
  const initial = localStorage.getItem(KEY);
  if (initial === 'dark' || (!initial && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  }
  const toggle = document.getElementById('darkToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      root.classList.toggle('dark');
      localStorage.setItem(KEY, root.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // === Share buttons ===
  const url = window.location.href;
  const title = document.title.split('|')[0].trim();
  const sharers = {
    x:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' — vía Hapee')}&url=${encodeURIComponent(url)}`,
    li: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    wa: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  };
  document.querySelectorAll('[data-share]').forEach(el => {
    const key = el.dataset.share;
    if (sharers[key]) el.href = sharers[key];
  });

  // === Copy link ===
  const copyBtn = document.getElementById('copyLinkBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(url).catch(() => {});
      const orig = copyBtn.innerHTML;
      copyBtn.classList.add('done');
      copyBtn.innerHTML = '✓ Copiado';
      setTimeout(() => {
        copyBtn.classList.remove('done');
        copyBtn.innerHTML = orig;
      }, 1700);
    });
  }
})();
