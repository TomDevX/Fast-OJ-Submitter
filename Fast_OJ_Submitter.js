// ==UserScript==
// @name         Fast Universal OJ Submitter
// @namespace    http://tampermonkey.net/
// @version      2.1
// @license      MIT
// @description  Fast submitter using direct POST and UI Injection in Codeforces, DMOJ forks, SPOJ, Atcoder, CSES, MarisaOJ
// @author       TomDev
// @match        https://cses.fi/problemset/*
// @match        https://oj.vnoi.info/problem/*
// @match        https://oj.vnoi.info/submit/*
// @match        https://atcoder.jp/contests/*/tasks/*
// @match        https://atcoder.jp/contests/*/submit*
// @match        https://marisaoj.com/problem/*
// @match        https://marisaoj.com/submit/*
// @match        *://*.spoj.com/problems/*
// @match        *://*.spoj.com/submit/*
// @match        https://oj.iuhcoder.com/problem/*
// @match        https://oj.iuhcoder.com/submit/*
// @match        https://oj.giftedbat.edu.vn/problem/*
// @match        https://oj.giftedbat.edu.vn/submit/*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/contest/*/submit*
// @match        https://codeforces.com/problemset/problem/*
// @match        https://codeforces.com/problemset/submit*
// @match        https://codeforces.com/gym/*/problem/*
// @match        https://codeforces.com/gym/*/submit*
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 1. OJ REGISTRY & DEFAULT CONFIGURATION
    // =========================================================================
    const OJ_REGISTRY = [
        // --- Direct POST Group: DMOJ Forks ---
        {
            name: 'VNOI',
            type: 'dmoj_post',
            match: /oj\.vnoi\.info\/problem\/([^/?#]+)/,
 getSubmitUrl: (m) => `https://oj.vnoi.info/problem/${m[1]}/submit`,
 lang: 'C++17'
        },
        {
            name: 'IUHCoder',
            type: 'dmoj_post',
            match: /oj\.iuhcoder\.com\/problem\/([^/?#]+)/,
 getSubmitUrl: (m) => `https://oj.iuhcoder.com/problem/${m[1]}/submit`,
 lang: 'CPP17'
        },
        {
            name: 'GiftedBat',
            type: 'dmoj_post',
            match: /oj\.giftedbat\.edu\.vn\/problem\/([^/?#]+)/,
 getSubmitUrl: (m) => `https://oj.giftedbat.edu.vn/problem/${m[1]}/submit`,
 lang: 'CPP17'
        },

        // --- Direct POST Group: SPOJ ---
        {
            name: 'SPOJ',
            type: 'spoj_post',
            match: /spoj\.com\/(?:problems|submit)\/([^/?#]+)/,
 getSubmitUrl: () => `${window.location.origin}/submit/complete/`,
 langId: 44 // 44 = C++14/17 (gcc), 113 = C++20
        },

        // --- Direct POST Group: CSES ---
        {
            name: 'CSES',
            type: 'cses_post',
            match: /cses\.fi\/problemset\/(task|submit)\/(\d+)/,
 getSubmitUrl: (m) => `https://cses.fi/problemset/submit/${m[2]}/`
        },

        // --- UI Simulation Group: MarisaOJ (SPA) ---
        {
            name: 'MarisaOJ',
            type: 'ui_simulation',
            match: /marisaoj\.com\/(problem|submit)\/(\d+)/,
 getSubmitUrl: (m) => `https://marisaoj.com/submit/${m[2]}`
        },

        // --- UI Simulation Group: AtCoder (Cloudflare Turnstile) ---
        {
            name: 'AtCoder',
            type: 'ui_simulation',
            match: /atcoder\.jp\/contests\/([^/]+)\/(tasks|submit)(\/([^/?]+))?/,
 getSubmitUrl: (m, url) => {
     const task = m[4] || new URL(url).searchParams.get('taskScreenName');
     return `https://atcoder.jp/contests/${m[1]}/submit${task ? '?taskScreenName=' + task : ''}`;
 }
        },

        // --- UI Simulation Group: Codeforces ---
        {
            name: 'Codeforces',
            type: 'codeforces_simulation',
            match: /codeforces\.com\/(?:contest|gym)\/(\d+)\/(?:problem|submit)(?:\/([A-Za-z0-9_]+))?|codeforces\.com\/problemset\/(?:problem\/(\d+)\/([A-Za-z0-9_]+)|submit)/,
 resolve: (m, currentUrl) => {
     let contestId = m[1] || m[3];
     let problemIndex = m[2] || m[4];
     const isGym = currentUrl.includes('/gym/');
     const isProblemset = currentUrl.includes('/problemset/');

     let submitUrl = '';
     if (isGym) {
         submitUrl = `https://codeforces.com/gym/${contestId}/submit`;
     } else if (isProblemset) {
         submitUrl = 'https://codeforces.com/problemset/submit';
     } else {
         submitUrl = `https://codeforces.com/contest/${contestId}/submit`;
     }

     return { submitUrl, contestId, problemIndex };
 }
        }
    ];

    // =========================================================================
    // 2. DIRECT POST & API ENGINES
    // =========================================================================
    function submitDMOJDirectly(submitUrl, code, defaultLang) {
        let csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) csrfToken = csrfInput.value;

        const langSelect = document.querySelector('select[name="language"]');
        const language = (langSelect && langSelect.value) ? langSelect.value : (defaultLang || 'CPP17');

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;

        const fields = {
            'csrfmiddlewaretoken': csrfToken,
 'language': language,
 'source': code
        };

        for (const [k, v] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = v;
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    }

    function submitSPOJDirectly(submitUrl, problemCode, code, langId) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;

        const fields = {
            'problemcode': problemCode,
 'lang': langId || 44,
 'file': code,
 'subpage': 'problems'
        };

        for (const [k, v] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = v;
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    }

    function submitCSESDirectly(submitUrl, code) {
        let csrfToken = document.querySelector('input[name="csrf_token"]')?.value || '';

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;
        form.enctype = 'multipart/form-data';

        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const dt = new DataTransfer();
        dt.items.add(new File([code], 'solution.cpp', { type: 'text/plain' }));

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = 'file';
        fileInput.files = dt.files;
        form.appendChild(fileInput);

        document.body.appendChild(form);
        form.submit();
    }

    // =========================================================================
    // 3. UI INJECTION ENGINE
    // =========================================================================
    function syncHiddenInputs(code) {
        const els = document.querySelectorAll('textarea[name="source"], textarea[name="code"], textarea[name="solution"], #sourceCode, textarea[name="sourcefile"], input[name="source"], #sourceCodeTextarea');
        els.forEach(el => {
            el.value = code;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function injectCodeIntoEditor(code) {
        // Monaco Editor (MarisaOJ)
        if (unsafeWindow.monaco?.editor) {
            try {
                const models = unsafeWindow.monaco.editor.getModels();
                if (models?.length > 0) {
                    models[0].setValue(code);
                    syncHiddenInputs(code);
                    return true;
                }
            } catch (e) {}
        }

        // Ace Editor (AtCoder, Codeforces Ace wrapper)
        if (unsafeWindow.ace) {
            try {
                const el = document.querySelector('.ace_editor') || document.getElementById('editor');
                if (el) {
                    const editor = unsafeWindow.ace.edit(el);
                    if (editor) {
                        editor.setValue(code, -1);
                        syncHiddenInputs(code);
                        return true;
                    }
                }
            } catch (e) {}
        }

        // CodeMirror 5 & 6
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl?.CodeMirror) {
            try {
                cmEl.CodeMirror.setValue(code);
                cmEl.CodeMirror.save();
                syncHiddenInputs(code);
                return true;
            } catch (e) {}
        }

        const cm6El = document.querySelector('.cm-editor');
        if (cm6El?.cmView?.view) {
            try {
                cm6El.cmView.view.dispatch({
                    changes: { from: 0, to: cm6El.cmView.view.state.doc.length, insert: code }
                });
                syncHiddenInputs(code);
                return true;
            } catch (e) {}
        }

        // Plain Textarea
        const ta = document.querySelector('#sourceCode, #sourceCodeTextarea, textarea[name="source"], textarea[name="code"], textarea[name="solution"], #editor textarea');
        if (ta && ta.offsetParent !== null) {
            ta.value = code;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        return false;
    }

    function isTurnstileVerified() {
        const cfInput = document.querySelector('input[name="cf-turnstile-response"], [name="cf_challenge_response"], [name="g-recaptcha-response"]');
        if (!cfInput) return true;
        return Boolean(cfInput.value && cfInput.value.trim().length > 0);
    }

    function triggerSubmitButton() {
        const selectors = [
            '#singlePageSubmitButton',
 'form.submitForm input[type="submit"]',
 'form#submit-form input[type="submit"]',
 '#submit',
 'button[type="submit"]',
 'input[type="submit"]',
 'button.btn-submit',
 'button[id*="submit"]',
 'form#submit-form button'
        ];

        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null && !btn.disabled) {
                btn.click();
                return;
            }
        }
    }

    function executeUISubmission(code, targetProblemIndex) {
        let attempts = 0;
        const maxAttempts = 40;

        if (targetProblemIndex) {
            const probSelect = document.querySelector('select[name="submittedProblemIndex"], select[name="submittedProblemCode"]');
            if (probSelect) {
                for (let i = 0; i < probSelect.options.length; i++) {
                    if (probSelect.options[i].value.toUpperCase() === targetProblemIndex.toUpperCase() ||
                        probSelect.options[i].text.toUpperCase().startsWith(targetProblemIndex.toUpperCase())) {
                        probSelect.selectedIndex = i;
                    probSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                        }
                }
            }
        }

        const fillTimer = setInterval(() => {
            attempts++;
            if (injectCodeIntoEditor(code) || attempts >= maxAttempts) {
                clearInterval(fillTimer);

                let cfWait = 0;
                const cfTimer = setInterval(() => {
                    cfWait++;
                    if (isTurnstileVerified() || cfWait >= 60) {
                        clearInterval(cfTimer);
                        setTimeout(triggerSubmitButton, 150);
                    }
                }, 100);
            }
        }, 100);
    }

    // =========================================================================
    // 4. DISPATCHER & EVENT LISTENERS
    // =========================================================================
    function handleSubmission(code) {
        const currentUrl = window.location.href;

        for (const target of OJ_REGISTRY) {
            const match = currentUrl.match(target.match);
            if (match) {
                if (target.type === 'dmoj_post') {
                    const submitUrl = target.getSubmitUrl(match, currentUrl);
                    submitDMOJDirectly(submitUrl, code, target.lang);
                    return;
                }

                if (target.type === 'spoj_post') {
                    const submitUrl = target.getSubmitUrl(match, currentUrl);
                    submitSPOJDirectly(submitUrl, match[1], code, target.langId);
                    return;
                }

                if (target.type === 'cses_post') {
                    const submitUrl = target.getSubmitUrl(match, currentUrl);
                    submitCSESDirectly(submitUrl, code);
                    return;
                }

                if (target.type === 'ui_simulation') {
                    const submitUrl = target.getSubmitUrl(match, currentUrl);
                    if (submitUrl !== currentUrl && !currentUrl.includes('/submit')) {
                        sessionStorage.setItem('oj_autosubmit_code', code);
                        window.location.href = submitUrl;
                    } else {
                        executeUISubmission(code);
                    }
                    return;
                }

                if (target.type === 'codeforces_simulation') {
                    const { submitUrl, problemIndex } = target.resolve(match, currentUrl);
                    if (!currentUrl.includes('/submit')) {
                        sessionStorage.setItem('oj_autosubmit_code', code);
                        if (problemIndex) {
                            sessionStorage.setItem('oj_autosubmit_cf_problem', problemIndex);
                        }
                        window.location.href = submitUrl;
                    } else {
                        executeUISubmission(code, problemIndex);
                    }
                    return;
                }
            }
        }

        executeUISubmission(code);
    }

    window.addEventListener('keydown', async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                if (text?.trim()) handleSubmission(text);
            } catch (err) {
                console.warn("[AutoSubmit] Unable to read clipboard:", err);
            }
        }

        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.cpp,.c,.py,.java,.pas,.txt';
            input.onchange = (ev) => {
                const file = ev.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (re) => handleSubmission(re.target.result);
                reader.readAsText(file);
            };
            input.click();
        }
    });

    const savedCode = sessionStorage.getItem('oj_autosubmit_code');
    if (savedCode) {
        sessionStorage.removeItem('oj_autosubmit_code');
        const savedProblem = sessionStorage.getItem('oj_autosubmit_cf_problem');
        if (savedProblem) sessionStorage.removeItem('oj_autosubmit_cf_problem');

        setTimeout(() => executeUISubmission(savedCode, savedProblem), 300);
    }
})();
