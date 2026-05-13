# Kevin Trudeau — Resource Pack

A complete proposal for adding Kevin Trudeau's published book canon (plus Trudeau himself as a person entry) to `resources.json`. Built to be merge-ready: each entry below mirrors the schema already in use for `"type":"book"` and `"type":"person"` records.

## Editorial framing

Kevin Trudeau is a polarising figure. Born 1963 in Lynn, Massachusetts, he became one of the most successful television infomercial pitchmen of the 1990s and 2000s. His "*They* Don't Want You to Know About" series sold tens of millions of copies. He has also been convicted of fraud, larceny, and criminal contempt — most recently a ten-year federal sentence (2014–2022) tied to civil contempt over weight-loss claims, and the FTC ruled his Global Information Network (GIN) a $110M pyramid scheme.

In FRQNCY's voice, this means: present the books as *teachings the author argues* — not as endorsements. Don't validate specific health, financial, or legal claims. Do hold the cultural fact that millions of readers have engaged with this material seriously, and that Trudeau's later turn into manifestation and "channelled" lessons (the GuruKev material) sits inside the same lineage as Hill, Wattles, and the New Thought tradition FRQNCY already covers via Manifestation and Prosperity Mindset.

Use the framing **"the book argues X"** or **"Trudeau teaches X"** rather than asserting any claim is true.

## The canon — seven core books plus the GuruKev compendium

Trudeau's bibliography is unusually compact for someone who sold this volume. The official kevintrudeau.com guide lists seven major titles spanning 1991–2024. Add to that the 2024–2025 *GuruKev Lessons: The Book of Secrets* — a separate, channelled compendium not in the original seven — and you have eight entries plus Trudeau himself.

1. **Mega Memory** (1991) — Trudeau's first major commercial product. The book argues that the human brain has vast untapped recall capacity and teaches association, visualisation, and structured-mental-framework techniques to access it. The companion infomercial ran for years and is widely credited as the template for the modern self-help infomercial.

2. **Natural Cures "They" Don't Want You to Know About** (2005) — A New York Times #1 nonfiction bestseller for 25 weeks, with 30M+ copies claimed in print. The book argues that pharmaceutical, food, and regulatory interests have suppressed natural and inexpensive remedies for chronic disease. Heavily contested by mainstream medicine and the FTC; FRQNCY presents it as a cultural artefact, not a clinical guide.

3. **More Natural "Cures" Revealed: Previously Censored Brand Name Products That Cure Disease** (2006) — Self-published sequel to *Natural Cures*. Trudeau names specific commercial products he claims work for specific conditions. Same caveat applies: the book's claims are not validated by FRQNCY.

4. **The Weight Loss Cure "They" Don't Want You to Know About** (2007) — Built on a hCG-injection protocol originally proposed by British endocrinologist A.T.W. Simeons in the 1950s. The FTC's ruling on this book's marketing claims is what eventually sent Trudeau to federal prison.

5. **Debt Cures "They" Don't Want You to Know About** (2007) — Trudeau's pivot from health to personal finance: credit-repair tactics, lender-side regulations consumers can use, and strategies for renegotiating debt. Of the canon, the most concrete and verifiable subject matter.

6. **Free Money "They" Don't Want You to Know About** (2009) — A directory-style guide to government grants, unclaimed-property databases, foundations, and other "hidden" financial resources. Practical reference content alongside Trudeau's signature framing.

7. **Your Wish Is Your Command** (2009 audio / 2024–2025 hardcover) — Originally released in 2009 as a 14-CD seminar, finally published as a hardcover book in 2024–2025. Subtitled *How to Manifest Your Desires — The Missing Secrets*. The book teaches a manifestation framework Trudeau attributes to material from a private "secret society"; sits squarely in the law-of-attraction lineage. This is the YWIYC Orlando flagged.

8. **The GuruKev Lessons: The Book of Secrets** (2024) — A ~600-page compendium of 300+ short "channelled" lessons Trudeau says he wrote during eight years of seclusion. Distinct from the official canon — a separate work distributed primarily through the Kevin Trudeau Fan Club and gurukevbook.com. This is the "Book of Secrets" reference Orlando asked about; verified as a real, separate title (not just YWIYC's subtitle).

## URL pattern and tagging logic

All books use `/books/<slug>/` per FRQNCY's existing convention. Tagging:

- **Mega Memory** → `personal-development` (Lifestyle), since it's a memory-skill book.
- **Natural Cures**, **More Natural Cures**, **Weight Loss Cure** → `detox` (Lifestyle). Detox is the closest existing topic for alternative-health framing without endorsing specific medical claims. (No "alternative-health" topic exists in `search.json`.)
- **Debt Cures**, **Free Money** → `prosperity-mindset` (Money). Closest topic for personal-finance with a consciousness frame.
- **Your Wish Is Your Command** and **The Book of Secrets** → `manifestation` (Metaphysics). The natural home.
- **Trudeau (person)** → `manifestation` as primary, since YWIYC and the GuruKev material are his most enduring contribution to FRQNCY's editorial space.

## Books not verified with confidence

A few uncertainties worth flagging to Orlando before merging:

- **Mega Memory** has multiple editions (1991, 1995, 1997 reissue under William Morrow). I've used 1991 as the canonical first publication.
- **Your Wish Is Your Command** has a 2009 audio-CD release date and a 2024 (some sources 2025) hardcover release. I've used 2009/2024 in the description to acknowledge both.
- **The Book of Secrets** appears to be in limited numbered first-edition distribution rather than mainstream trade publication. The external link points to gurukevbook.com.
- No standalone book titled simply *The Book of Secrets* exists in the trade canon; the title belongs specifically to *The GuruKev Lessons: The Book of Secrets*. (Don't confuse with Osho's 1974 book of the same short title.)

## Proposed resources.json entries

```json
[
  {"type":"book","name":"Mega Memory — Kevin Trudeau","desc":"Trudeau's 1991 debut, sold via one of the most successful infomercial campaigns in television history. The book teaches association, visualisation, and structured-mental-framework techniques for dramatically improving recall.","url":"/books/mega-memory/","topicSlug":"personal-development","topicLabel":"Personal Development","topicUrl":"/personal-development/","domain":"Lifestyle","domainSlug":"lifestyle","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"Natural Cures \"They\" Don't Want You to Know About — Kevin Trudeau","desc":"A New York Times #1 nonfiction bestseller for 25 weeks. The book argues that pharmaceutical and regulatory interests have suppressed natural remedies for chronic disease. Highly contested by mainstream medicine; included here as a cultural artefact of the alternative-health movement, not a clinical guide.","url":"/books/natural-cures-they-dont-want-you-to-know-about/","topicSlug":"detox","topicLabel":"Detox","topicUrl":"/detox/","domain":"Lifestyle","domainSlug":"lifestyle","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"More Natural \"Cures\" Revealed — Kevin Trudeau","desc":"Self-published 2006 sequel to Natural Cures. Trudeau names specific brand-name products he claims address specific conditions. The book's claims are not validated by FRQNCY; presented as part of the canon for completeness.","url":"/books/more-natural-cures-revealed/","topicSlug":"detox","topicLabel":"Detox","topicUrl":"/detox/","domain":"Lifestyle","domainSlug":"lifestyle","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"The Weight Loss Cure \"They\" Don't Want You to Know About — Kevin Trudeau","desc":"Built around an hCG-injection protocol originally proposed by British endocrinologist A.T.W. Simeons in the 1950s. The FTC's case against the book's marketing eventually led to Trudeau's 2014 contempt conviction. Listed for historical completeness.","url":"/books/the-weight-loss-cure/","topicSlug":"detox","topicLabel":"Detox","topicUrl":"/detox/","domain":"Lifestyle","domainSlug":"lifestyle","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"Debt Cures \"They\" Don't Want You to Know About — Kevin Trudeau","desc":"Trudeau's 2007 pivot into personal finance. Covers credit-repair tactics, consumer-protection regulations, and strategies for renegotiating debt. Of the canon, the most concrete and verifiable subject matter.","url":"/books/debt-cures/","topicSlug":"prosperity-mindset","topicLabel":"Prosperity Mindset","topicUrl":"/prosperity-mindset/","domain":"Money","domainSlug":"money","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"Free Money \"They\" Don't Want You to Know About — Kevin Trudeau","desc":"A 2009 directory-style guide to government grants, unclaimed-property databases, foundations, and other resources Trudeau frames as 'hidden.' Practical reference content alongside the signature framing.","url":"/books/free-money/","topicSlug":"prosperity-mindset","topicLabel":"Prosperity Mindset","topicUrl":"/prosperity-mindset/","domain":"Money","domainSlug":"money","external":"https://www.kevintrudeau.com"},
  {"type":"book","name":"Your Wish Is Your Command — Kevin Trudeau","desc":"Originally a 14-CD seminar (2009), released as a hardcover in 2024. Subtitled 'How to Manifest Your Desires — The Missing Secrets,' the book teaches a manifestation framework Trudeau attributes to material from a private mentor circle. Sits in the law-of-attraction lineage with Hill, Wattles, and Murphy.","url":"/books/your-wish-is-your-command/","topicSlug":"manifestation","topicLabel":"Manifestation","topicUrl":"/manifestation/","domain":"Metaphysics","domainSlug":"metaphysics","external":"https://yourwish.kevintrudeau.com"},
  {"type":"book","name":"The GuruKev Lessons: The Book of Secrets — Kevin Trudeau","desc":"A ~600-page compendium of 300+ short lessons Trudeau describes as channelled during eight years of seclusion. Distributed in limited numbered first editions. Distinct from the seven-book canonical bibliography; the most explicit articulation of Trudeau's later spiritual frame.","url":"/books/the-book-of-secrets/","topicSlug":"manifestation","topicLabel":"Manifestation","topicUrl":"/manifestation/","domain":"Metaphysics","domainSlug":"metaphysics","external":"https://www.gurukevbook.com"},
  {"type":"person","name":"Kevin Trudeau","desc":"American author and television personality, born 1963. Sold tens of millions of books across two distinct eras: the 1990s–2000s 'They Don't Want You to Know About' infomercial canon (memory, health, finance) and a later turn into manifestation teaching with Your Wish Is Your Command and the GuruKev Lessons. Convicted of fraud (1991), larceny, and criminal contempt; served 2014–2022 in federal prison tied to FTC weight-loss-claim litigation. A polarising cultural figure whose work intersects with FRQNCY's manifestation, prosperity, and consumer-skepticism threads — present with intellectual honesty, not endorsement.","url":"/people/kevin-trudeau/","topicSlug":"manifestation","topicLabel":"Manifestation","topicUrl":"/manifestation/","domain":"Metaphysics","domainSlug":"metaphysics","external":"https://www.kevintrudeau.com"}
]
```
