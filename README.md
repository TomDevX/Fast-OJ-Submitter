# Fast-OJ-Submitter
Fast submitter with keyboard shortcuts for popular OJs using direct POST and UI Injection

Currently support OJs: [Codeforces](https://codeforces.com/), [DMOJ](https://dmoj.ca/) forks, [SPOJ](https://www.spoj.com/), [Atcoder](https://atcoder.jp/), [CSES](https://cses.fi/), [MarisaOJ](https://marisaoj.com/) - *you can still add OJ by yourself through the source code*

# 📖 How to use
- `Ctrl/Cmd + S`: submit clipboard (must be on problem page)
- `Alt/Opt + S`: submit file (must be on problem page)

* Disclaimer: On firefox, if the userscript doesn't work or it showing the `paste` button. Go to `about:config` and change:
- `dom.events.asyncClipboard.readText` = true
- `dom.events.testing.asyncClipboard` = true

If you want to use the extension for the OJs which are not already written in the source code. Please add `name`,`type`,`match`,`lang` in `OJ_REGISTRY` and `@//match` on top of the source code

# How to download

> You need to download [Tampermoney](https://www.tampermonkey.net/) or similiar tools to be able to use this script

There are 3 ways you can do:
1. Go to [source file](Fast_OJ_Submitter.js) and view it in raw mode. A Tampermonkey script installation request will be prompted
2. Paste [source file](Fast_OJ_Submitter.js) inside your tampermonkey
3. Install from [Greasy Fork](https://greasyfork.org/en/scripts/588502-fast-oj-submitter)

# Contribution / Feature Request
If you want to improve the code or request a feature, feel free to [create an issue](https://github.com/TomDevX/Fast-OJ-Submitter/issues/new/choose).
