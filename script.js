// Ensure DOM is ready before querying widget elements so event listeners attach correctly
(function () {
  function init() {
  // ===== Theme persistence (existing) =====
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);

  function setIcon() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      setIcon();
    });
    setIcon();
  }

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Case study title from ?project
  const params = new URLSearchParams(location.search);
  const project = params.get('project');
  if (project && document.title.startsWith('Case Study')) {
    document.title = `Case Study – ${project.replace(/-/g,' ')} | Hugo`;
  }

    // ===== Chat widget =====
    const chatFab   = document.getElementById('chatFab');
    const chatPanel = document.getElementById('chatPanel');
    const chatClose = document.getElementById('chatClose');
    const chatLog   = document.getElementById('chatLog');
    const chatForm  = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');

  // Point this to your n8n Webhook URL (production) or leave blank for now.
  // Example: "https://n8n.yourdomain.com/webhook/ux-portfolio-chat"
  const N8N_WEBHOOK_URL = ""; // <-- set me later

  // simple session id so n8n can keep context if you want
  const sessionId = (() => {
    const key = "chat_session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const sid = crypto.getRandomValues(new Uint32Array(4)).join("-");
    localStorage.setItem(key, sid);
    return sid;
  })();

  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    el.innerHTML = text.replace(/\n/g, "<br/>");
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  }

  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'msg bot typing';
    typingEl.textContent = 'typing…';
    chatLog.appendChild(typingEl);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) typingEl.remove();
    typingEl = null;
  }

    // Use class-based toggling so CSS transitions can run. Keep `hidden` only when fully closed.
    function openChat() {
      if (!chatPanel) return;
      // ensure element is in DOM and visible to animate
      chatPanel.classList.add('is-open');
      chatPanel.removeAttribute('hidden');
      chatPanel.setAttribute('aria-hidden', 'false');
      chatInput?.focus();
    }

    function closeChat() {
      if (!chatPanel) return;
      // start closing animation
      chatPanel.classList.remove('is-open');
      chatPanel.setAttribute('aria-hidden', 'true');
      // actual `hidden` will be set after transitionend to keep animation visible
    }

    // After closing animation, hide from layout for screen readers and keyboard
    if (chatPanel) {
      chatPanel.addEventListener('transitionend', (e) => {
        // only set hidden when opacity transition finishes and panel is closed
        if (e.propertyName === 'opacity' && !chatPanel.classList.contains('is-open')) {
          chatPanel.hidden = true;
        }
      });
      // set initial aria-hidden based on initial hidden attribute
      if (chatPanel.hidden) chatPanel.setAttribute('aria-hidden', 'true');
      else chatPanel.classList.add('is-open');
    }

    // Attach toggle behavior safely
    if (chatFab) chatFab.addEventListener('click', () => {
      if (!chatPanel) return;
      if (chatPanel.classList.contains('is-open')) closeChat();
      else openChat();
    });

    if (chatClose) chatClose.addEventListener('click', closeChat);

  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (chatInput?.value || "").trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    showTyping();

    try {
      if (!N8N_WEBHOOK_URL) {
        // Dev fallback: fake response so the UI works before n8n is ready
        await new Promise(r => setTimeout(r, 600));
        hideTyping();
        appendMessage('bot', "This is a demo reply. Set N8N_WEBHOOK_URL in script.js to enable live chat.");
        return;
      }

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          // Optional extra context you might use in n8n:
          page: location.pathname + location.search,
          theme: root.getAttribute('data-theme') || 'dark'
        })
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : { reply: await res.text() };

      hideTyping();
      appendMessage('bot', (data.reply || '').toString() || '(no response)');
    } catch (err) {
      hideTyping();
      appendMessage('bot', 'Sorry—there was a network error. Please try again.');
      console.error(err);
    }
  });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

