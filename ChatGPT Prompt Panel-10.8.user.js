// ==UserScript==
// @name         ChatGPT Prompt Panel
// @namespace    http://tampermonkey.net/
// @version      10.8
// @description  Adds a highly configurable prompt panel to ChatGPT with prompts, new chat, copy, lock, and settings.
// @author       You
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    console.log('ChatGPT Prompt Panel v10.8 loaded');

    // --- CONFIG & KEYS ---
    const DEFAULT_PROMPTS = [
        { name: 'Explain Code', text: 'Explain this code line by line:', autoSend: false },
        { name: 'Refactor Code', text: 'Refactor this code for readability and performance:', autoSend: false }
    ];
    const GM_PROMPTS_KEY      = 'chatgpt_custom_prompts_v2';
    const GM_THEME_KEY        = 'chatgpt_panel_theme';
    const GM_POSITION_KEY     = 'chatgpt_panel_position';
    const GM_POSITION_TOP_KEY = 'chatgpt_panel_position_top';

    // --- ICONS ---
    function makeIcon(sym) {
        const span = document.createElement('span');
        span.textContent = sym;
        span.style.fontSize = '14px';
        return span;
    }
    const icons = {
        unlocked : makeIcon('🔓'),
        locked   : makeIcon('🔒'),
        settings : makeIcon('⚙️')
    };

    // --- CSS ---
    GM_addStyle(`
        :root {
            --panel-bg: #2a2a2e; --panel-text: #e0e0e0; --panel-header-bg: #3a3a3e; --panel-border: #4a4a4e;
            --btn-bg: #4a4a4e; --btn-hover-bg: #5a5a5e; --btn-border: #5a5a5e;
            --handle-color: #4CAF50; --input-bg: #4a4a4e; --input-text: #f0f0f0; --input-border: #5a5a5e;
        }
        .chatgpt-prompt-panel.light-theme {
            --panel-bg: #f0f2f5; --panel-text: #202124; --panel-header-bg: #e0e2e5; --panel-border: #d0d2d5;
            --btn-bg: #e8eaed; --btn-hover-bg: #dde0e3; --btn-border: #c0c2c5;
            --input-bg: #fff; --input-text: #202124; --input-border: #dadce0;
        }
        .chatgpt-prompt-panel {
            position: fixed; top: var(--panel-top, 90px); z-index: 9999;
            background: var(--panel-bg); color: var(--panel-text);
            border: 1px solid var(--panel-border); border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            display: flex; flex-direction: column; font-family: sans-serif;
            transition: transform 0.3s ease; user-select: none;
            min-width: 220px; box-sizing: border-box;
        }
        .chatgpt-prompt-panel.left-side { left: 0; transform: translateX(-100%); }
        .chatgpt-prompt-panel.right-side{ right:0; transform: translateX(100%); }
        .chatgpt-prompt-panel.visible { transform: translateX(0); }
        .chatgpt-prompt-panel-header {
            padding: 8px; background: var(--panel-header-bg);
            font-size: 14px; font-weight: bold; text-align: center;
            position: relative;
        }
        .panel-header-controls {
            position: absolute; top:50%; transform: translateY(-50%); display:flex; gap:6px;
        }
        .panel-header-controls.left { left:8px }
        .panel-header-controls.right{ right:8px }
        .chatgpt-prompt-panel-content {
            padding:12px; display:flex; flex-direction:column; gap:8px;
            max-height:300px; overflow-y:auto;
        }
        .chatgpt-prompt-panel-button {
            background:var(--btn-bg); border:1px solid var(--btn-border);
            color:var(--panel-text); padding:6px 10px; border-radius:4px;
            display:flex; align-items:center; gap:5px; font-size:13px;
            cursor:pointer; transition:background .2s;
        }
        .chatgpt-prompt-panel-button:hover { background:var(--btn-hover-bg) }
        .prompt-button { position:relative; }
        .prompt-button .delete-btn {
            position:absolute; top:50%; right:8px; transform:translateY(-50%);
            background:transparent; border:none; cursor:pointer; opacity:0;
        }
        .prompt-button:hover .delete-btn { opacity:0.7 }
        #custom-prompts-container { display:flex; flex-direction:column; gap:8px }
        #add-prompt-btn { margin-top:8px }
        #action-buttons-container {
            border-top:1px solid var(--panel-border); padding-top:10px;
            display:flex; flex-direction:column; gap:8px;
        }
        .dragging { opacity:0.4 }
        .panel-handle {
            position:fixed; top:var(--panel-top,90px); left:0;
            width:20px; height:60px; background:var(--handle-color);
            border-radius:0 4px 4px 0; cursor:pointer; z-index:9998;
        }
        .settings-modal-overlay {
            display:none; position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.6); z-index:10000;
            justify-content:center; align-items:center;
        }
        .settings-modal-content {
            background:var(--panel-bg); color:var(--panel-text);
            padding:20px; border-radius:8px; max-width:400px;
            box-shadow:0 5px 25px rgba(0,0,0,0.4); position:relative;
        }
        .settings-close-btn {
            position:absolute; top:10px; right:10px; background:none;
            border:none; font-size:24px; cursor:pointer; color:var(--panel-text);
        }
        .settings-section { margin-top:20px }
        .settings-section>label { display:block; margin-bottom:8px; font-weight:bold }
        .settings-controls { display:flex; gap:10px; flex-wrap:wrap }
        .settings-controls button,
        .settings-controls .radio-group label {
            background:var(--btn-bg); color:var(--panel-text);
            border:1px solid var(--btn-border); padding:6px 10px;
            border-radius:4px; cursor:pointer;
        }
        .settings-controls button:hover,
        .settings-controls .radio-group label:hover {
            background:var(--btn-hover-bg)
        }
        .radio-group input[type="radio"] { display:none }
        .radio-group input[type="radio"]:checked + label {
            background:#1a73e8; color:white; border-color:#1a73e8;
        }
        .chatgpt-prompt-form {
            display:none; flex-direction:column; gap:10px;
            background:var(--panel-header-bg); padding:12px;
            border-top:1px solid var(--panel-border);
        }
        .chatgpt-prompt-form.active { display:flex }
        .chatgpt-prompt-form input[type="text"],
        .chatgpt-prompt-form textarea {
            width:100%; background:var(--input-bg); color:var(--input-text);
            border:1px solid var(--input-border); border-radius:4px;
            padding:6px; font-size:13px; box-sizing:border-box;
        }
        .chatgpt-prompt-form label {
            display:flex; align-items:center; gap:5px; cursor:pointer;
        }
    `);

    // --- STATE ---
    let panel, handle, lockButton, settingsButton, settingsModal, promptForm;
    let copyResponseButton, copyCodeButton;
    let currentPrompts = [], isManuallyLocked = false, isFormActiveLock = false;
    let draggedItem = null, latestResponseCopyTarget = null, latestCodeBlockTarget = null;

    // --- CORE HELPERS ---
    function hidePanel() {
        if (!isManuallyLocked && !isFormActiveLock) panel.classList.remove('visible');
    }
    function updateLockIcon() {
        lockButton.innerHTML = '';
        const icon = (isManuallyLocked || isFormActiveLock)
          ? icons.locked.cloneNode(true)
          : icons.unlocked.cloneNode(true);
        lockButton.appendChild(icon);
    }
    function createButtonWithIcon(txt, ic) {
        const b = document.createElement('button');
        b.className = 'chatgpt-prompt-panel-button';
        if (ic) b.appendChild(ic.cloneNode(true));
        b.appendChild(document.createTextNode(txt));
        return b;
    }
    async function applyTheme() {
        const t = await GM_getValue(GM_THEME_KEY, 'auto');
        const isDark = t === 'dark'
          || (t === 'auto' && window.matchMedia('(prefers-color-scheme:dark)').matches);
        panel.classList.toggle('light-theme', !isDark);
    }
    async function applyPanelPosition() {
        const p = await GM_getValue(GM_POSITION_KEY, 'left');
        panel.classList.toggle('left-side',  p === 'left');
        panel.classList.toggle('right-side', p === 'right');
        handle.style.left  = p === 'left'  ? '0' : '';
        handle.style.right = p === 'right' ? '0' : '';
    }
    async function applyTopOffset() {
        const t = await GM_getValue(GM_POSITION_TOP_KEY, '90px');
        panel.style.setProperty('--panel-top', t);
        handle.style.top = t;
    }

    // --- PROMPT MGMT ---
    function savePrompts() {
        GM_setValue(GM_PROMPTS_KEY, JSON.stringify(currentPrompts));
    }
    async function loadAndDisplayPrompts() {
        try {
            const raw = await GM_getValue(GM_PROMPTS_KEY);
            const arr = JSON.parse(raw);
            currentPrompts = Array.isArray(arr) && arr.length ? arr : [...DEFAULT_PROMPTS];
        } catch {
            currentPrompts = [...DEFAULT_PROMPTS];
        }
        renderAllPrompts();
    }
    function renderAllPrompts() {
        const cont = panel.querySelector('#custom-prompts-container');
        cont.querySelectorAll('.prompt-button').forEach(x=>x.remove());
        currentPrompts.forEach(p => addPromptButtonToPanel(p));
    }
    function addPromptButtonToPanel(pr) {
        const btn = createButtonWithIcon(pr.name, null);
        btn.classList.add('prompt-button');
        btn.title = pr.text;
        // delete icon
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.appendChild(makeIcon('🗑️'));
        del.addEventListener('click', e => {
            e.stopPropagation();
            if (confirm(`Delete "${pr.name}"?`)) {
                currentPrompts = currentPrompts.filter(x=>x!==pr);
                savePrompts(); renderAllPrompts();
            }
        });
        btn.appendChild(del);
        // drag start/end
        btn.draggable = true;
        btn.addEventListener('dragstart', e => {
            draggedItem = pr;
            e.dataTransfer.effectAllowed = 'move';
            btn.classList.add('dragging');
        });
        btn.addEventListener('dragend', ()=>btn.classList.remove('dragging'));
        // on click → inject
        btn.addEventListener('click', ()=> {
            sendPromptToChatGPT(pr.text, pr.autoSend);
            if (!isManuallyLocked) hidePanel();
        });
        const cont = panel.querySelector('#custom-prompts-container');
        const add = panel.querySelector('#add-prompt-btn');
        cont.insertBefore(btn, add);
    }

    // --- SETTINGS & FORM BUILDERS ---
    function buildSettingsModal() {
        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        const content = document.createElement('div');
        content.className = 'settings-modal-content';
        // close
        const x = document.createElement('button');
        x.className = 'settings-close-btn';
        x.textContent = '×';
        x.addEventListener('click', ()=>overlay.style.display='none');
        content.appendChild(x);
        // title
        const h = document.createElement('h3');
        h.textContent = 'Panel Settings';
        content.appendChild(h);
        // helper to make sections
        function mkSection(label, id, radio=false) {
            const s = document.createElement('div');
            s.className = 'settings-section';
            const l = document.createElement('label');
            l.textContent = label;
            s.appendChild(l);
            const ctrl = document.createElement('div');
            ctrl.className = radio ? 'settings-controls radio-group' : 'settings-controls';
            ctrl.id = id;
            s.appendChild(ctrl);
            content.appendChild(s);
            return ctrl;
        }
        // theme
        const thC = mkSection('Theme','theme-control',true);
        ['auto','light','dark'].forEach(t => {
            const inp = document.createElement('input');
            inp.type='radio'; inp.name='theme'; inp.value=t; inp.id='theme-'+t;
            const lbl = document.createElement('label');
            lbl.htmlFor = 'theme-'+t;
            lbl.textContent = t.charAt(0).toUpperCase()+t.slice(1);
            thC.append(inp,lbl);
        });
        thC.addEventListener('change', e => {
            GM_setValue(GM_THEME_KEY, e.target.value);
            applyTheme();
        });
        // position
        const posC = mkSection('Panel Position','position-control',true);
        ['left','right'].forEach(v=>{
            const inp = document.createElement('input');
            inp.type='radio'; inp.name='position'; inp.value=v; inp.id='pos-'+v;
            const lbl=document.createElement('label');
            lbl.htmlFor='pos-'+v;
            lbl.textContent=v.charAt(0).toUpperCase()+v.slice(1);
            posC.append(inp,lbl);
        });
        posC.addEventListener('change', e=>{
            GM_setValue(GM_POSITION_KEY, e.target.value);
            applyPanelPosition();
        });
        // prompt management
        const mC = mkSection('Prompt Management','mgmt-control',false);
        const imp = document.createElement('button');
        imp.textContent='Import'; imp.addEventListener('click',importPrompts);
        const exp = document.createElement('button');
        exp.textContent='Export'; exp.addEventListener('click',exportPrompts);
        const rst = document.createElement('button');
        rst.textContent='Reset'; rst.addEventListener('click',resetPrompts);
        mC.append(imp,exp,rst);

        overlay.appendChild(content);
        overlay.addEventListener('click',e=>{
            if(e.target===overlay) overlay.style.display='none';
        });
        return overlay;
    }

    function buildPromptForm() {
        const f = document.createElement('div');
        f.className = 'chatgpt-prompt-form';
        const ni = document.createElement('input');
        ni.type='text'; ni.placeholder='Button Name';
        const ti = document.createElement('textarea');
        ti.rows=4; ti.placeholder='Prompt Text';
        const autoL = document.createElement('label');
        const autoC = document.createElement('input');
        autoC.type='checkbox';
        autoL.append(autoC, document.createTextNode('Auto-send'));
        const btns = document.createElement('div');
        btns.className='settings-controls';
        btns.style.justifyContent='flex-end';
        const cB = document.createElement('button');
        cB.textContent='Create'; cB.style.background='#28a745'; cB.style.color='white';
        const xB = document.createElement('button');
        xB.textContent='Cancel'; xB.style.background='#dc3545'; xB.style.color='white';
        btns.append(xB,cB);
        f.append(ni,ti,autoL,btns);
        // hide form fn
        const hide = ()=>{
            isFormActiveLock=false; updateLockIcon();
            f.classList.remove('active');
            panel.querySelector('.chatgpt-prompt-panel-content').style.display='flex';
            panel.querySelector('.chatgpt-prompt-panel-header').style.display='block';
            ni.value=''; ti.value=''; autoC.checked=false;
            if(!isManuallyLocked) setTimeout(hidePanel,50);
        };
        xB.addEventListener('click', hide);
        cB.addEventListener('click', ()=>{
            const n=ni.value.trim(), t=ti.value.trim();
            if(n && t){
                currentPrompts.push({ name:n, text:t, autoSend:autoC.checked });
                savePrompts(); renderAllPrompts(); hide();
            } else alert('Enter name and prompt');
        });
        return f;
    }

    // --- PANEL CREATION ---
    async function createAndAppendPanel() {
        if (document.getElementById('chatgpt-prompt-panel-main')) return;
        // handle
        handle = document.createElement('div');
        handle.className = 'panel-handle';
        handle.addEventListener('mouseenter', ()=>panel.classList.add('visible'));
        handle.addEventListener('mouseleave', hidePanel);
        document.body.appendChild(handle);
        // panel
        panel = document.createElement('div');
        panel.id = 'chatgpt-prompt-panel-main';
        panel.className = 'chatgpt-prompt-panel';
        panel.addEventListener('mouseenter', ()=>panel.classList.add('visible'));
        panel.addEventListener('mouseleave', hidePanel);
        // header
        const hdr = document.createElement('div');
        hdr.className = 'chatgpt-prompt-panel-header';
        hdr.textContent = 'Prompt Panel';
        panel.appendChild(hdr);
        // left controls
        const lc = document.createElement('div');
        lc.className = 'panel-header-controls left';
        settingsButton = document.createElement('button');
        settingsButton.style.background='transparent';
        settingsButton.style.border='none';
        settingsButton.appendChild(icons.settings.cloneNode(true));
        settingsButton.addEventListener('click', ()=>settingsModal.style.display='flex');
        lc.appendChild(settingsButton);
        hdr.appendChild(lc);
        // right controls
        const rc = document.createElement('div');
        rc.className = 'panel-header-controls right';
        lockButton = document.createElement('button');
        lockButton.style.background='transparent';
        lockButton.style.border='none';
        lockButton.addEventListener('click', ()=>{
            isManuallyLocked = !isManuallyLocked;
            updateLockIcon();
            if(isManuallyLocked) panel.classList.add('visible');
        });
        rc.appendChild(lockButton);
        hdr.appendChild(rc);
        updateLockIcon();
        // content
        const content = document.createElement('div');
        content.className = 'chatgpt-prompt-panel-content';
        panel.appendChild(content);
        // New Chat
        const newChat = createButtonWithIcon('New Chat', null);
        newChat.id = 'new-chat-btn';
        newChat.addEventListener('click', ()=>{
            if(!isManuallyLocked) hidePanel();
            window.location.href = 'https://chat.openai.com/chat';
        });
        content.appendChild(newChat);
        // custom prompts container
        const cont = document.createElement('div');
        cont.id = 'custom-prompts-container';
        // dragover
        cont.addEventListener('dragover', e=>{
            e.preventDefault();
            const after = getDragAfter(cont, e.clientY);
            const dragEl = cont.querySelector('.dragging');
            if(dragEl) {
                if(!after) cont.appendChild(dragEl);
                else cont.insertBefore(dragEl, after);
            }
        });
        // drop
        cont.addEventListener('drop', ()=>{
            const from = currentPrompts.findIndex(p=>p===draggedItem);
            const order = [...cont.querySelectorAll('.prompt-button')];
            const to = order.indexOf(cont.querySelector('.dragging'));
            if(from>-1 && to>-1){
                currentPrompts.splice(from,1);
                currentPrompts.splice(to,0,draggedItem);
                savePrompts(); renderAllPrompts();
            }
            draggedItem = null;
        });
        content.appendChild(cont);
        // Add Prompt btn
        const addBtn = createButtonWithIcon('Add New Prompt', null);
        addBtn.id = 'add-prompt-btn';
        addBtn.addEventListener('click', ()=>{
            isFormActiveLock = true; updateLockIcon();
            panel.classList.add('visible');
            promptForm.classList.add('active');
            content.style.display = 'none';
            hdr.style.display = 'none';
        });
        cont.appendChild(addBtn);
        // action buttons
        const act = document.createElement('div');
        act.id = 'action-buttons-container';
        copyResponseButton = createButtonWithIcon('Copy Response', null);
        copyResponseButton.addEventListener('click', copyLastResponse);
        act.appendChild(copyResponseButton);
        copyCodeButton = createButtonWithIcon('Copy Code', null);
        copyCodeButton.addEventListener('click', setupCopyCodeAction());
        act.appendChild(copyCodeButton);
        content.appendChild(act);
        // append
        document.body.appendChild(panel);
        // settings modal + prompt form
        settingsModal = buildSettingsModal();
        panel.appendChild(settingsModal);
        promptForm = buildPromptForm();
        panel.appendChild(promptForm);
        // drag helper
        function getDragAfter(container,y){
            const els = [...container.querySelectorAll('.prompt-button:not(.dragging)')];
            return els.reduce((closest,child)=>{
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height/2;
                return offset<0 && offset>closest.offset
                  ? { offset, element: child }
                  : closest;
            },{ offset: Number.NEGATIVE_INFINITY }).element;
        }
        // header drag to save top offset
        hdr.addEventListener('mousedown', e=>{
            if(e.target.closest('.panel-header-controls')) return;
            const startY = e.clientY - panel.getBoundingClientRect().top;
            function onMove(ev){
                panel.style.top = ev.clientY - startY + 'px';
            }
            function onUp(){
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                GM_setValue(GM_POSITION_TOP_KEY, panel.style.top);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        // init features
        initializeCopyActions();
        applyTheme();
        applyPanelPosition();
        applyTopOffset();
        loadAndDisplayPrompts();
    }

    // --- COPY ACTIONS ---
    function initializeCopyActions(){
        const mo = new MutationObserver(muts=>{
            muts.forEach(m=>{
                m.addedNodes.forEach(node=>{
                    if(node.nodeType!==1) return;
                    // code copy button
                    const c = node.querySelector('button[aria-label="Copy code"]');
                    if(c) latestCodeBlockTarget = c;
                    // response copy
                    const r = node.querySelector('button[aria-label="Copy to clipboard"]');
                    if(r) latestResponseCopyTarget = r;
                });
            });
        });
        mo.observe(document.body,{ childList:true, subtree:true });
    }
    function setupCopyCodeAction(){
        return ()=>{
            if(!latestCodeBlockTarget){ alert('No code block found'); return }
            latestCodeBlockTarget.click();
            if(!isManuallyLocked) hidePanel();
            copyCodeButton.textContent = 'Copied!';
            setTimeout(()=> copyCodeButton.textContent = 'Copy Code', 1500);
        };
    }
    function copyLastResponse(){
        if(!latestResponseCopyTarget){ alert('No response found'); return }
        latestResponseCopyTarget.click();
        if(!isManuallyLocked) hidePanel();
        copyResponseButton.textContent = 'Copied!';
        setTimeout(()=> copyResponseButton.textContent = 'Copy Response', 1500);
    }

    // --- PROMPT INJECTION ---
    function sendPromptToChatGPT(text, autoSend=false){
        let input = document.querySelector('textarea')
                 || document.querySelector('div[role="textbox"][contenteditable="true"]');
        if(!input) return;
        if(input.tagName==='TEXTAREA'){
            input.value = text;
        } else {
            input.focus();
            input.textContent = text;
        }
        input.dispatchEvent(new Event('input',{ bubbles:true }));
        if(autoSend){
            const btn = document.querySelector('form button[type="submit"]:not([disabled])');
            if(btn) btn.click();
        }
    }

    // --- IMPORT/EXPORT/RESET ---
    function exportPrompts(){
        const data = JSON.stringify(currentPrompts,null,2);
        const blob = new Blob([data],{type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'chatgpt-prompts.json';
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function importPrompts(){
        const inp = document.createElement('input');
        inp.type='file'; inp.accept='.json';
        inp.onchange = e => {
            const f = e.target.files[0];
            if(!f) return;
            const r = new FileReader();
            r.onload = ev => {
                try {
                    const arr = JSON.parse(ev.target.result);
                    if(Array.isArray(arr) && arr.every(p=>p.name&&p.text)){
                        if(confirm(`Import ${arr.length} prompts?`)){
                            currentPrompts.push(...arr);
                            savePrompts(); renderAllPrompts();
                        }
                    } else throw new Error('Bad format');
                } catch(err){
                    alert('Import error: '+err.message);
                }
            };
            r.readAsText(f);
        };
        inp.click();
    }
    function resetPrompts(){
        if(confirm('Reset prompts to defaults?')){
            currentPrompts = [...DEFAULT_PROMPTS];
            savePrompts(); renderAllPrompts();
        }
    }

    // --- BOOTSTRAP ---
    if(document.body){
        createAndAppendPanel();
    } else {
        new MutationObserver((_, obs)=>{
            if(document.body){
                createAndAppendPanel();
                obs.disconnect();
            }
        }).observe(document, { childList:true, subtree:true });
    }

})();
