# Review: PowerPlatformAcademy Dojo · Copilot (copilot.ninja)

Date: 2026-11-02 · Reviewer: Claude (cloud session, on behalf of the task coordinator) · Branch: `review/dojo-2026-11` · Commit reviewed: `7a6415b` (main)

## Scope and method

- **Content:** all 30 entries in `data/techniken.json` (5 basic forms, 25 techniques) with the English overlay `data/techniken.en.json`, the 19 exam questions in `dojo/selbsttest.json` and `en/dojo/selbsttest.json`, the licence check pages `gratis/` and `gratis/nachschlagen/` (DE and EN). Every claim was compared with the current Microsoft Learn source text (MicrosoftDocs GitHub repositories `microsoft-365-docs/copilot` for Microsoft 365 Copilot and Copilot Chat, `ai-builder`, `power-platform`, `power-automate-docs`, all at `main` on 2026-11-02).
- **Exam questions:** is the marked answer right, is no distractor also right, is the question unambiguous, does the explanation match the docs.
- **Language:** Swiss spelling (ss, real umlauts), Du-form, no em/en dashes, no filler patterns, DE/EN parity.
- **Technical:** dead links, mobile view (Playwright/Chromium at 360 px and 390 px), sitemap, hreflang, canonical, robots, llms.txt, a fresh production build.
- **Not possible in this session:** live HTTP access to learn.microsoft.com or copilot.ninja. The Copilot Studio documentation is not public on GitHub, and the pages under learn.microsoft.com/copilot/ (overview, faq, manage) and the training modules are in docsets that are not public either, so claims sourced only there are listed as "not verifiable" and are not findings.
- **Rules followed:** no content changed on this branch except clear typos (separate commit, listed at the end). Everything else is a suggestion.
- **Severity:** high = wrong or misleading · medium = outdated · low = detail or wording.

## Summary

| Severity | Count |
| --- | --- |
| high | 0 |
| medium | 1 |
| low | 11 |
| **total** | **12** |

Content: 0 high, 1 medium, 7 low (of which 3 fixed on this branch as typos). Technical/language: 0 high, 0 medium, 4 low. Sitemap, hreflang, canonical, robots, llms.txt, internal links and mobile view are all in order.

**Most important:**
1. **Agent Builder "kostenlos ohne Zusatzlizenz" (medium)** – the Microsoft 365 agents admin guide says Agent Builder is available to users with a Microsoft 365 Copilot licence or in tenants with pay-as-you-go for Copilot Studio; Microsoft's pages disagree with each other, the site shows only one side (t14, t15, t16, both gratis pages).
2. **"Microsoft 365 Copilot (Premium oder Pro)" (low, 2 places in data + gratis pages)** – Learn knows only "(Premium)", "(Basic)" and "Copilot chat (Basic)".
3. **125 % overage rule (low, plausible)** – the current Power Platform admin page describes allocation-based enforcement and never mentions a 125 % tolerance (t23 calculator, t24, question f7a, gratis).
4. **Brand name breaks mid-word at 360 px (low)** and the 10.6 px "COPILOT" subline.
5. **Exam:** all 19 questions have a correct, unambiguous marked answer in DE and EN; only f7a depends on the 125 % rule above.

---

## A. Content findings (facts, exam questions, DE/EN)

### A1. Belts 1–3 (g1–g3, t01–t13) and exam questions f1a–f3c

All 16 techniques, their EN overlays and the 7 exam questions were checked; every exam answer is correct and unambiguous, DE/EN parity holds except one placeholder hint.

- **[low] "Microsoft 365 Copilot (Premium oder Pro)": the label "Pro" does not exist on Learn**
  - Site: copilot.ninja
  - Location: data/techniken.json → techniken[id=g3].grenzen[2] «Microsoft 365 Copilot (Premium oder Pro) bietet mit Add-on vollen Umfang und Priority Access»; techniken[id=t08].grenzen[0] «Microsoft 365 Copilot (Premium oder Pro) bietet mit Add-on breiten Zugriff…»; same in data/techniken.en.json g3.grenzen[2] and t08.grenzen[0] («Microsoft 365 Copilot (Premium or Pro)»).
  - Problem: Learn names exactly three in-product labels: "M365 Copilot (Premium)", "M365 Copilot (Basic)" and "Copilot chat (Basic)". There is no "Pro" tier of Microsoft 365 Copilot; "Copilot Pro" was a separate consumer product. A reader may look for a "Pro" label that never appears.
  - Evidence: https://learn.microsoft.com/microsoft-365/copilot/microsoft-365-copilot-overview (copilot/microsoft-365-copilot-overview.md, lines 146–152): "**M365 Copilot (Premium)** indicates that a user has a Microsoft 365 Copilot add-on license and the full experience and priority access … **M365 Copilot (Basic)** indicates that a user does not have the Microsoft 365 Copilot add-on license but will have standard access … **Copilot chat (Basic)** indicates that a user does not have the Microsoft 365 Copilot add-on license and does not have access to Copilot chat in Word, Excel, PowerPoint and OneNote."
  - Verdict: CONFIRMED
  - Suggested correction: Write «Microsoft 365 Copilot (Premium)» and drop «oder Pro» / «or Pro» in g3 and t08 (DE and EN).

- **[low] Source title "What is Microsoft Copilot?" is not the title of the linked page**
  - Site: copilot.ninja
  - Location: data/techniken.json → t01.weitere_quellen[1].titel, t03.weitere_quellen[1].titel, t04.weitere_quellen[0].titel, t08.quelle_titel: «Microsoft Learn: What is Microsoft Copilot?» (identical in data/techniken.en.json).
  - Problem: The linked page microsoft-365-copilot-overview is titled "What is Microsoft 365 Copilot?" (H1 "Microsoft 365 Copilot overview"). Without "365" the title suggests the consumer product.
  - Evidence: copilot/microsoft-365-copilot-overview.md front matter line 3: `title: What is Microsoft 365 Copilot?`; line 29: `# Microsoft 365 Copilot overview`.
  - Verdict: CONFIRMED
  - Suggested correction: Typo fix: 'What is Microsoft Copilot?' → 'What is Microsoft 365 Copilot?' (t01, t03, t04, t08; DE and EN).

- **[low] Source title for the EDP page omits "365" twice**
  - Site: copilot.ninja
  - Location: data/techniken.json → t10.weitere_quellen[0].titel and t12.quelle_titel: «Microsoft Learn: Enterprise data protection in Microsoft Copilot and Microsoft Copilot Chat» (same in data/techniken.en.json; dojo/selbsttest.json f3a.quelle.titel «Enterprise Data Protection» is fine).
  - Problem: The page is titled "Enterprise data protection in Microsoft 365 Copilot and Microsoft 365 Copilot Chat".
  - Evidence: copilot/enterprise-data-protection.md line 2: `title: "Enterprise data protection in Microsoft 365 Copilot and Microsoft 365 Copilot Chat"`; line 21 H1 identical.
  - Verdict: CONFIRMED
  - Suggested correction: Typo fix: 'Enterprise data protection in Microsoft Copilot and Microsoft Copilot Chat' → 'Enterprise data protection in Microsoft 365 Copilot and Microsoft 365 Copilot Chat' (t10, t12; DE and EN).

- **[low] EN overlay t08: second placeholder lost its hint text**
  - Site: copilot.ninja
  - Location: data/techniken.en.json → t08.technik_text, line «Source: My emails, chats, meetings and files about {Counterpart} from {Period|the last three months}.» vs. DE «… zu {Gegenüber|Person oder Firma} aus {Zeitraum|…}».
  - Problem: DE shows the hint «Person oder Firma» for both occurrences of the placeholder; EN shows it only for the first one, so the rendered EN form has one placeholder without hint.
  - Evidence: DE/EN comparison of the two technik_text fields (parity check, no Learn source needed).
  - Verdict: CONFIRMED
  - Suggested correction: Change «{Counterpart}» in the Source line to «{Counterpart|person or company}».

#### Not verifiable locally (belts 1–3)

Claims not verifiable locally (no finding, listed for completeness):
- t04 so_nutzt_du_es[1] / t01, t04, t08 grenzen: Copilot Chat in Outlook without license "bezieht Posteingang, Kalender, Besprechungen, Chats und einen begrenzten Satz Dateien ein" / "in unterstützten Szenarien" — attributed to learn.microsoft.com/copilot/overview, which is not in the local clone. The local docs only state generally that Copilot Chat cannot invoke organizational content and that Copilot Chat users get "a limited file attachment" (wordexcelppt-agents.md line 63). Whether Teams "Chats" are included in the Outlook scenario could not be checked.
- t03 grenzen[0]: "Für die Bilderzeugung … gelten laut Microsoft Limits" — from /copilot/overview (not local). Image generation itself is confirmed.
- t12 grenzen[1]: "Dann antwortet Microsoft Copilot Chat laut Microsoft nur aus dem Sprachmodell" — from /copilot/manage (not local); the admin switch itself is confirmed.
- t11 grenzen[2]: "Benutzerdefinierte Anweisungen gelten … für alle deine Unterhaltungen" — from the training unit / support article (not local).
- t06 grenzen[2] "Du kannst sie dort jederzeit löschen" — from /copilot/faq (not local); storage location confirmed.
- f1a/f1b, g1/g2/g3/t01/t02/t05/t07/t11/t13 quelle_url: training module "write-effective-prompts-do-more-prompting" and its units 2, 3, 3a — training content, not checkable locally.
- t07 weitere_quellen: HBR, Gary Klein, September 2007 — external.
- learn.microsoft.com/copilot/overview, /copilot/faq, /copilot/manage: page existence inferred from links inside the local docs; content not readable locally.

### A2. Belts 4–7 (g4, g5, t14–t25), exam questions f4a–f7c, licence-check pages

All 14 techniques, their EN overlays, the 12 exam questions and the four gratis pages (DE/EN) were checked. Exam answers are correct and unambiguous; the licence-check core (Copilot Chat included with eligible Microsoft 365 subscriptions, Pages / file upload / image generation included, web search switch, EDP, no-cost web-grounded agents, metered SharePoint agents off by default, Prompt Coach free) is confirmed in the local Microsoft 365 docs.

- **[medium] Agent Builder "kostenlos ohne Zusatzlizenz" is contradicted by the local Microsoft 365 admin guide**
  - Site: copilot.ninja
  - Location: data/techniken.json → t14.grenzen[0] "Ohne Zusatzlizenz kannst du Agent Builder laut Microsoft kostenlos nutzen, solange der Agent nur auf Anweisungen und Web-Wissen beruht."; t15.grenzen[2]; t16.grenzen[3]; t14/t15/t16.zugang_text "Ohne Zusatzlizenz mit Agent Builder"; gratis/index.html → "Agent Builder im Chat, kostenlos für Agents mit Wissen aus dem Web. (Learn: copilot-studio-experience)"; gratis/nachschlagen/index.html → row "Agent Builder im Chat / Kostenlos für Web-Wissen" and Stufe 2 "Agent Builder ohne Zusatzlizenz"; same in techniken.en.json and en/gratis pages.
  - Problem: The claim that *using* web/instruction-only agents costs nothing is confirmed locally, but the claim that *building* with Agent Builder is free without any licence is contradicted by the Microsoft 365 agents admin guide, which states Agent Builder is available only to users with a Microsoft 365 Copilot licence or in tenants with pay-as-you-go enabled for Copilot Studio. Microsoft's own pages are inconsistent here; the site presents only one side.
  - Evidence: https://learn.microsoft.com/microsoft-365/copilot/agent-essentials/m365-agents-admin-guide (local: copilot/agent-essentials/m365-agents-admin-guide.md, ms.date 04/07/2026), section "Agent Builder in Microsoft 365 Copilot": "Agent Builder is available to users with a Microsoft 365 Copilot license or in tenants with pay-as-you-go enabled for Copilot Studio. Agent capabilities vary depending on the organization's billing model." Same page, Option 1: "This option also provides access to declarative agents, grounded in instructions and public websites, at no additional cost." (confirms the usage claim).
  - Verdict: CONFIRMED (conflicting statement readable in local Learn source; the cited copilot-studio-experience page is not local)
  - Suggested correction: Add one caveat to t14/t15/t16 and the two gratis rows: "Laut dem Admin-Leitfaden zu Agents steht Agent Builder nur Nutzern mit Microsoft-Copilot-Lizenz oder in Mandanten mit aktiviertem Pay-as-you-go für Copilot Studio zur Verfügung; Microsoft ist hier nicht einheitlich, frag deine IT, ob Agent Builder bei euch freigeschaltet ist."

- **[low] 125 % overage rule: newer Power Platform admin doc describes allocation-based enforcement without the 125 % tolerance**
  - Site: copilot.ninja
  - Location: data/techniken.json → t23.rechner.regeln[1] "100 bis 125 %: Überverbrauch wird geduldet; ab 125 %: Custom Agents deaktiviert; Pay-as-you-go: keine Durchsetzung."; t23.nutzen "was bei 125 Prozent des Kontingents passiert"; t24.grenzen[2] "Laut Microsoft werden Custom Agents bei 125 Prozent der vorausbezahlten Kapazität deaktiviert."; dojo/selbsttest.json → f7a (question, answer 1 and aufloesung); gratis/nachschlagen/index.html → row "Verbrauch je Funktion"; EN copies.
  - Problem: The Copilot Studio page cited (requirements-messages-management) is not readable locally, so the 125 % rule cannot be confirmed or refuted. The current Power Platform admin page (dated 10/14/2026) describes enforcement per environment allocation ("can consume only its allocated prepaid credits … stop working after that allocation is exhausted"), optional overage sources (tenant pool or pay-as-you-go), a per-agent hard stop, and links to a separate "Enforcement policy for agents consuming Copilot Credits" page; it never mentions a 125 % tolerance. The f7a answer "Custom Agents werden deaktiviert, laufende Gespräche werden nicht unterbrochen" may therefore be outdated or incomplete.
  - Evidence: https://learn.microsoft.com/power-platform/admin/manage-copilot-studio-copilot-credits-capacity (local: power-platform/admin/manage-copilot-studio-copilot-credits-capacity.md): "If no overage source is enabled, the environment can consume only its allocated prepaid credits. Experiences that require credits can stop working after that allocation is exhausted." and "When the environment has no Copilot Credits available, new agent flow runs are blocked while the parent agent continues to function for non-flow interactions." Also https://learn.microsoft.com/power-platform/admin/manage-usage-customer-conversation-harness: "When an environment has no available Copilot Credits, experiences that require credits can stop working … see Enforcement policy for agents consuming Copilot Credits (/microsoft-copilot-studio/agents-experience/enforcement-policy-credits)."
  - Verdict: PLAUSIBLE (strong indication of a changed enforcement model; the Copilot Studio page itself is not readable locally)
  - Suggested correction: Re-read requirements-messages-management and the new enforcement-policy-credits page; if the 125 % tolerance is gone, rewrite rule 2 of the calculator, t24.grenzen[2] and f7a around environment allocation and overage settings in the Power Platform admin center.

- **[low] Tier label "Microsoft 365 Copilot (Premium oder Pro)": local Learn page knows only "(Premium)"**
  - Site: copilot.ninja
  - Location: gratis/index.html → intro paragraph and "Auf einen Blick" ("Microsoft 365 Copilot (Premium oder Pro) bietet mit Add-on-Lizenz Priority Access …"); gratis/nachschlagen/index.html → row "Copilot in Word, Excel, PowerPoint und OneNote", Stufe 3 heading, FAQ "Gibt es Copilot in Word und Excel gratis?"; EN pages identical.
  - Problem: The three in-product labels on the local overview page are "M365 Copilot (Premium)", "M365 Copilot (Basic)" and "Copilot chat (Basic)". A "(Pro)" label does not appear in any local Learn file; the site attributes it to copilot/overview, copilot/faq and copilot/manage, which are not local. The rest of the three-tier description matches the local page word for word.
  - Evidence: https://learn.microsoft.com/microsoft-365/copilot/microsoft-365-copilot-overview (local: copilot/microsoft-365-copilot-overview.md, ms.date 03/24/2026): "M365 Copilot (Premium) indicates that a user has a Microsoft 365 Copilot add-on license and the full experience and priority access … M365 Copilot (Basic) indicates that a user does not have the Microsoft 365 Copilot add-on license but will have standard access … Copilot chat (Basic) indicates that a user does not have the Microsoft 365 Copilot add-on license and does not have access to Copilot chat in Word, Excel, PowerPoint and OneNote."
  - Verdict: PLAUSIBLE (the "(Pro)" variant is not readable in any local source)
  - Suggested correction: If "(Pro)" cannot be quoted from a Learn page, drop "oder Pro" / "or Pro" and keep "Microsoft 365 Copilot (Premium)".

- **[low] DE/EN difference: Stufe 3 heading**
  - Site: copilot.ninja
  - Location: gratis/nachschlagen/index.html → "Stufe 3 / Microsoft 365 Copilot (Premium oder Pro)" vs. en/gratis/nachschlagen/index.html → "Level 3 / License for Microsoft Copilot".
  - Problem: The German heading names the in-product tier label, the English heading names the licence; the body text under both is the same. Minor content difference between the two languages.
  - Evidence: n/a (DE/EN comparison)
  - Verdict: CONFIRMED (read in both files)
  - Suggested correction: Use the same heading in both languages, e.g. "Level 3: Microsoft 365 Copilot (Premium)" or "Stufe 3: Lizenz für Microsoft Copilot".

#### Not verifiable locally (belts 4–7 and gratis pages)

Claims not verifiable locally (Copilot Studio docset, Microsoft Copilot docset copilot/*, extensibility docset):
- Copilot Studio trial: build and test but not publish; 30-day extension; agents run up to 90 days after expiry; personal e-mail addresses rejected (g4, g5, t19, t20, f6a, gratis rows). PLAUSIBLE from well-known docs.
- Credit rates Classic Answer 1, Generative Answer 2, Agent Action 5, Tenant Graph Grounding 10, agent flow actions 13 per 100; licensed Microsoft 365 Copilot users consume no credits for classic/generative/graph grounding with fair-use limits; Agent Builder agents without tenant graph grounding incur no credits for generative answers (t20, t23, f6b, gratis). PLAUSIBLE for the rate table; the Agent Builder exemption and the licensing-page vs rate-table inconsistency could not be checked.
- Unit renamed from messages to Copilot Credits on 1 September 2025 (gratis row "Veröffentlichter Agent im Betrieb"). PLAUSIBLE.
- Agent Usage Estimator name and its 10–20 % reserve recommendation and "carry-over" statement (t23). Not verifiable (the local Power Platform page links a "Copilot Credits estimator" at an Azure website, no name match).
- Copilot Studio authoring guidance: agent can only follow instructions about tools/knowledge/topics that are set up; do not change the system citation format; add changes one at a time; triggers vulnerable to jailbreak, restrict tools/parameters; test pane does not reflect all published-channel behaviour; GitHub Copilot harness testing consumes credits (t17, t18, t19, g4, f5a, f5b, f7b). PLAUSIBLE.
- Evaluation test set import: CSV with "Question"/"Expected response", 100 questions per set, 1000 characters per question (t18).
- Agent Builder UI details: "Skip to configure", "Configure"/"Try it" tabs, limits 30/1000/8000 characters, "Only use specified sources" switch, websites two levels deep without parameters, general knowledge cannot be fully excluded (t14, t15).
- Microsoft Copilot docset claims: green shield as EDP indicator, real-time voice only for licensed users, students under 13 not eligible, some markets excluded, Outlook "reduced graph grounding" (emails, calendar, meetings, chats, limited set of files), "Teams EEA", Microsoft 365 E7 including the Copilot licence, renaming of "Microsoft 365 Copilot (Chat)" to "Microsoft Copilot (Chat)" (gratis pages). Note: the local Microsoft 365 docset (pages dated up to 04/2026) still uses the names "Microsoft 365 Copilot" and "Microsoft 365 Copilot Chat" throughout and does not mention "reduced graph grounding" or E7.
- Source URL slugs that could not be checked: learn.microsoft.com/azure/logic-apps/expression-functions-reference (local Power Automate pages link /azure/logic-apps/workflow-definition-language-functions-reference), learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-build-agents (local release notes link /microsoft-365-copilot/extensibility/copilot-studio-agent-builder-build). Both may be renames with redirects.
- Local-file mapping of cited URLs that do exist: /microsoft-365/copilot/enterprise-data-protection → copilot/enterprise-data-protection.md (t21, t22). All other cited URLs belong to docsets that are not local.

## B. Technical and language findings

- **[low] Brand name breaks mid-word on narrow phones**
  - Location: header of every page at 360 px: "PowerPlatfor|mAcademy Dojo" (screenshot `cn-home-de-360`); powerautomate.ninja renders the same brand as "PowerPlatform / Academy Dojo" because its text has a break opportunity.
  - Problem: The word is cut at an arbitrary letter, which looks like a typo on the first screen.
  - Verdict: CONFIRMED (Playwright at 360 px)
  - Suggested correction: Insert a `<wbr>` or a soft hyphen after "PowerPlatform" in the brand partial, or let the brand wrap as two words like the sister site.

- **[low] Brand subline "COPILOT" is rendered at 10.6 px**
  - Location: header, `span` under the brand name (computed font-size 10.56 px on every page).
  - Problem: Smaller than 12 px, the usual floor for readable UI text on phones; the sister site's subline is not flagged by the same check.
  - Verdict: CONFIRMED (Playwright measurement)
  - Suggested correction: Raise the subline to at least 12 px (0.75 rem).

- **[low] Some text links are 23 px high, below the 24 px the README promises**
  - Location: `/gratis/` (8 source links such as "Learn: copilot/overview"), `/gratis/nachschlagen/` (8 links incl. "Direktlink zum Mythos …"), `/dojo/` ("Was gespeichert wird"), same on `/en/gratis/`. Measured 23 px at 360 px.
  - Problem: README states "Klickziele mindestens 24 px (WCAG 2.5.8)". Inline links in running text are exempt in WCAG 2.5.8, so this is a consistency note.
  - Verdict: CONFIRMED (Playwright measurement)
  - Suggested correction: Give these link lists `padding-block: 2px` or a line-height of 1.6.

- **[low] Build hint: six techniques were released a day after their last source check**
  - Location: `node scripts/build.mjs --produktion` prints for t20–t25: "freigegeben am 2026-10-16, geprueft_am 2026-10-15".
  - Problem: Only a consistency hint from the build; if the sources were read at release, `geprueft_am` should carry that date (it also feeds `dateModified` in the JSON-LD).
  - Verdict: CONFIRMED (build output)
  - Suggested correction: Set `geprueft_am` of t20–t25 to 2026-10-16 if the sources were read then.

## Technical review (both sites, done by the coordinating reviewer)

Method: local clone of `main` served with a static file server; Playwright/Chromium at 360×740 and 390×844 (mobile emulation) plus 1280×900; checks for horizontal overflow, elements wider than the viewport, tap targets below 24×24 px, text below 12 px, JavaScript errors; sitemap/hreflang/canonical/noindex cross-checked against the files on disk; both sites' own `scripts/links.mjs --livegang`; a fresh `node scripts/build.mjs --produktion` in a scratch copy.

### Results that are fine (no finding)
- No horizontal overflow on any of the 17 (copilot.ninja) / 14 (powerautomate.ninja) pages tested at 360 px and 390 px; menu button, search, theme switch and DE/EN switch visible on all widths; no JavaScript errors or console errors on any page.
- `sitemap.xml`: every indexable page on disk is listed, every listed URL exists, no `noindex` page is listed (copilot.ninja 80 URLs, 73 noindex pages excluded; powerautomate.ninja 76 URLs, 52 excluded). `xhtml:link` hreflang entries present for every URL.
- Every indexable page carries `hreflang` de, en and x-default plus a canonical that matches its own URL; every hreflang target exists on disk.
- `robots.txt`: `templates/`, `scripts/`, `data/` (and `.github/` on copilot.ninja) blocked, Content-Signal line in every group, sitemap not referenced but hosted at the standard path.
- `llms.txt`: all internal links resolve (copilot.ninja 76/76, powerautomate.ninja 56/56); copilot.ninja also ships `llms-full.txt`, powerautomate.ninja does not (informational, not a defect).
- `scripts/links.mjs --livegang` passes on both sites (copilot.ninja 155 pages / 10,587 links, powerautomate.ninja 130 pages / 6,564 links); no preview build in the folders.
- Language: no ß anywhere, no em or en dashes in data or HTML, Du-form throughout (the capitalised "Sie" hits are the pronoun "sie" at sentence start, plus one deliberate instruction inside an agent prompt), no broken umlauts (ae/oe/ue only in slugs and keys). The hero figure that appears as an outline for the first 650 ms is the intended draw-in animation (`tusch--zeichnen`), not a rendering defect.
- The hand-written DE and EN pages have the same number of h2/h3/details/table/li elements; every technique and exam question has an EN counterpart (copilot.ninja 30/30 and 19/19; powerautomate.ninja 106/106 pool entries, the two pool-excluded tips 19 and 156 have no EN entry by design).


## C. Typo fixes applied on this branch (separate commit)

Commit "Quelltitel korrigiert …" on this branch (data files and the generated pages that contain the same string, 11 files each; no rebuild run):

- `What is Microsoft Copilot?` → `What is Microsoft 365 Copilot?` (source titles of t01, t03, t04, t08; DE and EN).
- `Enterprise data protection in Microsoft Copilot and Microsoft Copilot Chat` → `… in Microsoft 365 Copilot and Microsoft 365 Copilot Chat` (t10, t12; DE and EN).
- EN t08 technik_text: `{Counterpart} from {Period` → `{Counterpart|person or company} from {Period` (restores the lost placeholder hint).

Not applied (content, suggestion only): "(Premium oder Pro)" → "(Premium)", the Agent Builder caveat, the 125 % rule, the Stufe 3 heading, the `geprueft_am` dates.

## D. Umsetzung auf diesem Branch (2026-11-02, dritter Auftrag)

Korrigiert, DE und EN gemeinsam, Seiten mit `node scripts/build.mjs --produktion` und die Fragenliste mit `scripts/karten.mjs --produktion` neu erzeugt, Build und `scripts/links.mjs --livegang` grün:

- **Agent Builder (mittel):** t14, t15, t16 (Grenzen und Zugangstext), beide Gratis-Seiten (Satz v4, Liste «Auf einen Blick», Stufe 2, Tabellenzeile): Agents mit Web-Wissen bleiben laut Microsoft ohne Zusatzkosten; die Verfügbarkeit von Agent Builder ist laut Admin-Leitfaden an eine Microsoft-365-Copilot-Lizenz oder Pay-as-you-go für Copilot Studio gebunden. Nichts wird mehr als sicher kostenlos dargestellt.
- **«(Premium oder Pro)» → «(Premium)»** in den Daten (g3, t08), auf beiden Gratis-Seiten, in `llms.txt` (Quelle `scripts/build.mjs`) und den erzeugten Seiten; die Überschrift der Stufe 3 heisst in DE und EN gleich.
- **Credits-Durchsetzung (125 %):** Da die aktuelle Admin-Seite eine Durchsetzung nach Zuteilung ohne Prozentschwelle beschreibt und die Copilot-Studio-Seite hier nicht lesbar war, vorsichtig formuliert: Rechner t23 (Regeln 2 und 3, Nutzen), t24 (Grenzen), Frage f7a (Frage, Antworten, Auflösung, Quelle neu auf manage-copilot-studio-copilot-credits-capacity, geprueft_am 2026-11-02) und die Zeile «Verbrauch je Funktion» im Nachschlageteil. Die alte 125-Prozent-Aussage steht als «ältere Microsoft-Seiten nannten» drin, massgebend ist die verlinkte Quelle.
- **Mobil:** Umbruch der Marke zwischen «PowerPlatform» und «Academy» (der `<wbr>` greift jetzt, weil der Name unter 420 px 0.92 rem gross ist); Unterzeile «COPILOT» auf 0.75 rem (12 px); `padding-block` der Quellenlinks von 3 auf 4 px, gemessen 25 px. Geprüft mit Chromium bei 320, 360 und 390 px.

Nicht geändert: `geprueft_am` von t20 bis t25 (Entscheid von Marcel); die Vorschaubilder unter `assets/img/karten/` (karten.mjs würde sie auf die aktuelle Papierfarbe umstellen, die PNG-Wandlung braucht ein lokales Chrome; in dieser Umgebung nicht abgeschlossen, darum unverändert gelassen).
