# OpsFluency — NotebookLM Podcast Script
> Source document for NotebookLM podcast generation.
> Tone: peer-to-peer, floor-native, specific. Not a sales pitch.
> Last updated: 2026-06-18

---

## EPISODE: "Fluent in Your Floor — How One Ops Director Got Fed Up and Built the Tool Himself"

---

**HOST:** Alright, so I want to start with something that I think every ops manager has lived through at some point. You walk into a facility — new hire orientation, first day on the floor. And you've got a brand new employee who nodded along through the entire safety briefing, filled out the sign-in sheet, and three days later they do the exact thing you told them not to do. And you go back and watch the tape or talk to the supervisor, and you realize — they had no idea what you were saying. Not because they weren't paying attention. Because the entire training was in English, and English isn't their first language.

**GUEST:** Yeah. And then what happens?

**HOST:** They're embarrassed. They make a mistake. They feel incompetent. And by week eight, they're gone. And you file it under turnover. But that's not what it was.

**GUEST:** That's the whole thing. Workers don't quit for fifty cents more an hour. They quit because they're frustrated and embarrassed. That's the sentence Rob Ramos kept coming back to when he was building OpsFluency. Because he'd seen it — not once, not twice — across multiple facilities, multiple industries, years of floor-level operations. And the industry keeps blaming pay. The real problem is dignity and competence.

**HOST:** Let's talk about Rob for a second, because I think his background is actually what makes this interesting. This is not a tech founder who parachuted in and said "let's disrupt manufacturing." This is someone who spent 22 years on the floor before he ever wrote a line of code.

**GUEST:** Yeah. He came up from the floor, went all the way to Director of Operations running three sites at the same time — Nevada, Oklahoma, Pennsylvania. He's launched four operations from scratch. One of them from lease signing to first product out the door in under 120 days. He maintained zero lost-time incidents across every site he's ever managed. Led ISO 9001 audits, cGMP audits, OSHA inspections — zero non-conformances. Every time.

**HOST:** So when he talks about what happens when workers can't read the procedure, he's not speaking hypothetically.

**GUEST:** Not at all. He was managing floors where 60% of the workers spoke Spanish as a first language. And the SOPs were in English. In binders. And the fix — if you could call it that — was supervisors spending their shifts re-explaining the same three procedures. He's gone on record saying supervisors were burning 17-plus hours a week just re-explaining things that should have been self-service. That's almost half a full-time job, every week, every supervisor, just re-explaining what's already written down somewhere.

**HOST:** And the binder wasn't going to save them. Because even if you update the binder, who checks the binder before they start the machine?

**GUEST:** Nobody. And even if they did, it's in English. And it doesn't have pictures of your specific equipment. And the third-generation photocopy quality is unreadable. Rob looked at that situation and said: this is a solvable problem. And then he went looking for the tool that solved it, and it didn't exist. So he built it.

**HOST:** Okay. So what is OpsFluency, in plain terms. Walk me through what it actually does.

**GUEST:** Sure. So you're a warehouse manager. You've got existing SOPs — Word documents, PDFs, maybe some stuff in Google Drive, maybe an actual binder. You've accumulated these over years. They're in English. They need to be in Spanish. And they need to be accessible to workers on the floor who do not have company email addresses, do not have laptops, and are not going to download an app.

So you upload your document to OpsFluency. You can upload a PDF, a Word doc, a text file — whatever you have. The AI reads it and converts it to clean, structured, readable procedure content. Not a generic translation dump — structured. Numbered steps where there are steps, warning callouts where there are warnings. Done in minutes.

**HOST:** And then what?

**GUEST:** Here's where it gets interesting. Before anything is translated, the system flags site-specific terms. Not generic English — your specific terms. "The 3-line" doesn't mean Line 3. It means the third packaging conveyor at your facility. "The Sparks machine" means something specific to your floor. The AI doesn't know that. But it knows to flag it and ask you to define it.

**HOST:** So you define what those terms mean.

**GUEST:** You define them once. In English. And you write the Spanish equivalent. And that goes into your company glossary. And from that point forward, every document you ever translate through OpsFluency will use that same term, consistently, correctly, across everything. That glossary is yours. It compounds over time. The fifth SOP you translate is more accurate than the first because you've been building the glossary since day one.

**HOST:** That's actually a big deal because the failure mode with generic translation — whether that's Google Translate or something else — is that your facility has its own language. Every facility does.

**GUEST:** Exactly. Generic translation doesn't know that "the 3-line" is the third packaging conveyor. It will translate "3-line" differently in every document, or just leave it as-is, and you end up with a Spanish procedure that uses three different words for the same piece of equipment. That's not a translation. That's a liability.

**HOST:** Okay so you've got the glossary built, the terms are defined. Then the translation runs.

**GUEST:** Translation runs. And before it goes live, a manager reviews the Spanish version. Not just rubber-stamps it — actually reviews it, side by side with the English. They approve it. Then it publishes. And when it publishes, OpsFluency generates a QR code.

**HOST:** And the QR code goes where?

**GUEST:** On the machine. On the wall next to the station. On the dock door. Wherever the work actually happens. You print it once. It never changes — the URL behind that QR code is permanent. If you update the procedure, the QR code still works, it just serves the new version. The only thing that kills a QR code is if you archive the procedure — and then it shows a friendly message that says "this procedure has been retired, ask your manager." You're not getting a broken link.

**HOST:** So from the worker's perspective — they walk up to a machine, they scan a QR code with their phone.

**GUEST:** Their phone. No app download. No password. No company email. They scan it, the procedure loads in their browser, and there's a language toggle right at the top. They pick English or Spanish. That's it. Works offline once they've loaded it — which matters a lot in warehouse environments where WiFi coverage is patchy.

**HOST:** And the manager is looking at what on their end?

**GUEST:** The manager has a dashboard. They can see every published SOP, who's been scanning, which procedures are getting viewed. They manage employees from there — invite people, resend access links. They can post announcements that show up in the worker's app. And if they've got monitors mounted on the wall — like a TV screen in the break room or on the floor — those are paired through the system too, showing department content.

**HOST:** Let's talk about the OSHA angle for a second, because I think that's something that doesn't come up enough when people talk about training. It's not just about making workers feel good. There's a documentation requirement.

**GUEST:** Yeah. And this is something Rob is very clear about. OSHA does not just require that you trained someone. It requires that you can demonstrate comprehension. A sign-in sheet from a group training doesn't prove that the forklift operator understood the lockout/tagout procedure. It proves they were in the room.

There's a Phase 2 feature in OpsFluency — comprehension quizzes. Three questions, auto-generated, bilingual, tied to the specific version of the procedure the worker read. The result is an immutable record: who passed, when, what questions they saw, what they answered, which version of the SOP. That record covers what 29 CFR 1910.178 requires for forklift operators, what 1910.132 requires for PPE, what 1910.1200 requires for HAZCOM. The difference between "we trained everyone" and "we can prove everyone understood" — that's the difference when an OSHA inspector walks in. Or when something goes wrong and you're in front of an attorney.

**HOST:** And that's included in the platform — it's not an add-on.

**GUEST:** The quiz itself and the compliance records are available at every tier. The management analytics — pass rate dashboards, per-employee history, re-quiz workflows — those scale up with the plan. But every facility gets the proof-of-comprehension record regardless of what tier they're on. Because every facility has OSHA obligations regardless of size.

**HOST:** Okay, let's talk pricing, because I think this is where OpsFluency does something genuinely different. Walk me through how it's structured.

**GUEST:** Flat rate. Not per seat. That's the thing. Every other tool in this space prices per user. You've got 200 workers on your floor? You're paying per worker. At typical per-seat pricing, a 200-person floor is looking at $1,200 to $1,600 a month. Maybe more.

OpsFluency prices by facility size and charges a flat monthly rate. Up to 50 workers, $79 a month. Fifty to 150 workers — which is where most facilities in the target range land — $119 a month. 150 to 500 workers, $199 a month. Flat. Whether you add five workers this month or fifty, the price doesn't move.

**HOST:** $119 is under the typical expense threshold for a manager-level approval.

**GUEST:** That's intentional. At most manufacturing and distribution facilities, a manager can expense under $150 a month without a VP signature and without a procurement review. Rob set the Growth tier at $119 for exactly that reason. You don't need a committee to approve it. You just start the trial.

**HOST:** There's a trial?

**GUEST:** Fourteen days, full access, no credit card. The idea is: get to the aha moment first. Import your first SOP, go through the pipeline, approve the Spanish, scan the QR code with your phone, read the procedure as your worker would read it. That moment — the first time you see your own procedure in Spanish on a phone without typing a password — that's the conversion. Not a sales call. Not a demo. That's when someone goes from interested to subscribed.

**HOST:** I want to come back to something you said earlier about supervisors spending 17 hours a week re-explaining procedures. Because that's not just a productivity problem. That's a management capacity problem. If your supervisors are spending half their week on re-explanation, what are they not doing?

**GUEST:** Everything else. They're not doing floor walks. They're not catching equipment issues early. They're not coaching. They're not doing the things that actually require a supervisor to be present. They're standing next to a machine explaining a procedure that should be on the wall next to the machine in the worker's language.

And the hidden cost is in turnover. When a new hire leaves in week eight because they felt incompetent — because they were nodding through training they didn't understand, making mistakes they were embarrassed by, feeling like they couldn't do the job — that's a $3,000 to $5,000 replacement cost, conservatively. Recruiting, onboarding time, productivity lag while the next person ramps. Multiply that across a facility with significant turnover in the first 60 days, and the $119 a month isn't a technology expense. It's turnover insurance.

**HOST:** So where does someone go to try this?

**GUEST:** OpsFluency.com. Fourteen-day trial, full access, no card. You can import your first SOP on day one. If you want to talk to Rob before you start — if you've got specific questions about your facility, your floor mix, your OSHA situation — there's a "talk to us" option on the pricing page. He takes those calls himself. He's not routing you to a sales team. He's been on your floor. He knows what you're dealing with.

**HOST:** Last question: what does a facility look like six months after they've been using this? What's actually changed?

**GUEST:** Workers are reading the procedures. Not because someone told them to. Because the procedure is in their language, at the machine, on their phone, and it's easier to scan it than to track down a supervisor. Supervisors are doing supervisor work instead of translation work. New hires are getting through the first 60 days because they're not nodding through training they don't understand. And the manager has a paper trail — scan records, comprehension records, glossary-consistent translations — that they didn't have before.

The platform tagline is "Fluent in Your Floor." That's both things at once. The workers are fluent in their procedures. And the operation is fluent — knowledge reaches the people who need it without a human standing there to relay it. That's what the tool does. That's what Rob built because it didn't exist when he needed it.

**HOST:** Thanks for walking us through it. Really appreciate it.

**GUEST:** Yeah. Go try it. Fourteen days. Upload your worst SOP. See what comes out.

---

*OpsFluency — Fluent in Your Floor*
*opsfluency.com*

---

## Background Notes for NotebookLM
*(Include these as context — they will improve the generated audio's accuracy)*

**Key facts in this episode:**
- Supervisors spend 17+ hours/week re-explaining procedures in bilingual facilities
- Rob Ramos: 22 years ops experience, Director of 3 simultaneous sites (NV, OK, PA), 4 cold-start launches, zero lost-time incidents, ISO zero non-conformances
- SOP pipeline: upload → AI converts to structured Markdown → glossary flagging → manager defines site-specific terms → translation → manager approves Spanish → publish → QR code generated
- QR codes are permanent — URL never changes, always serves current version, shows friendly 410 message on archive
- Worker experience: scan QR → no download, no password → language toggle (EN/ES) → works offline
- Pricing: $79/mo (up to 50 workers), $119/mo (51–150), $199/mo (151–500) — flat rate, not per seat
- Growth tier ($119) is under most manager-level expense approval thresholds
- 14-day free trial, no credit card required
- OSHA compliance angle: 29 CFR 1910.178 (forklifts), 1910.132 (PPE), 1910.1200 (HAZCOM) all require proof of comprehension, not just attendance
- Company glossary: site-specific terms defined once, injected into every future translation — this is the compounding moat
- Generic LMS comparison: Trainual/Lessonly at per-seat pricing = ~$1,600/month for 200 workers vs. $119 flat

**Voice tone:** Peer-to-peer. Two ops professionals talking. Not a product demo. Specific numbers, not vague claims. No buzzwords.
