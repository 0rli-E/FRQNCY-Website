#!/usr/bin/env python3
"""One-shot batch: add the 47 pillar-pick books to books.json with FRQNCY-voice bios.

Per task #65 — the 8 pillar pages will render a 'FRQNCY picks for this pillar'
section once these bed entries exist. After this runs, generate.js can produce
the pillar book cards from real data instead of stubs.
"""
import json, datetime, os, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

books = json.load(open('books.json'))
people = json.load(open('people.json'))
people_ids = {p['id'] for p in people['people']}

def author_field(name):
    """Return (author_value, is_person_ref). If person exists, link by id."""
    slug = 'p-' + name.lower().replace('.','').replace("'",'').replace(',','').replace('(','').replace(')','').replace(' ','-').replace('--','-').strip('-')
    if slug in people_ids:
        return slug, True
    return name, False

# (id, title, author_name, url, bio, appears_in, picked_in, year, image)
ADDS = [
  # ── CURATE ─────────────────────────────────────────────────────────────
  ('b-the-power-broker', 'The Power Broker', 'Robert Caro',
   'https://www.penguinrandomhouse.com/books/87144/the-power-broker-by-robert-a-caro/',
   "Robert Moses built and unbuilt New York for forty years. Caro's biography is a 1,200-page study of how one curator of power, with no elected office, shaped the physical and political fabric of a city. Read it for what attention to detail looks like at the scale of a lifetime — and what curation costs when applied without conscience.",
   ['t-leadership','t-curation-craft','t-history'], ['t-curation-craft'], 1974),

  ('b-unto-this-last', 'Unto This Last', 'John Ruskin',
   'https://www.penguinrandomhouse.com/books/116716/unto-this-last-and-other-writings-by-john-ruskin/',
   "Four essays Ruskin published in 1860 that redefined what wealth is — life itself, not money. The ur-text for everything FRQNCY does on the editorial line: that the right question is not what sells but what is worth the lives it touches. Tolstoy and Gandhi each said it changed them.",
   ['t-curation-craft','t-conscap','t-discernment'], ['t-curation-craft'], 1860),

  ('b-the-art-of-the-personal-letter', 'The Art of the Personal Letter', 'Margaret Shepherd',
   'https://www.penguinrandomhouse.com/books/30878/the-art-of-the-personal-letter-by-margaret-shepherd/',
   "A short book on writing letters that matter. Condolences, thank-yous, congratulations, apologies — the writing that the standard inbox has flattened. Curation at the scale of a single message, with the same standard FRQNCY applies to the network.",
   ['t-etiquette','t-writing'], ['t-etiquette'], 2008),

  ('b-the-library-of-babel', 'The Library of Babel', 'Jorge Luis Borges',
   'https://archive.org/details/the-library-of-babel-by-jorge-luis-borges',
   "Borges imagines a library of every possible book — every truth, every falsity, every rearrangement of letters, infinite and indexed by no one. The case for editorial restraint, in the form of a parable. Without a curator, total information is total noise.",
   ['t-curation-craft','t-literature','t-editorial-line'], ['t-editorial-line'], 1941),

  ('b-on-photography', 'On Photography', 'Susan Sontag',
   'https://us.macmillan.com/books/9780312420093/onphotography',
   "Six essays on the camera as moral instrument. Sontag's question — what does it cost to make something visible — is the curator's question one step removed. After reading her, you cannot frame anything innocently again. Required for anyone choosing what gets shown.",
   ['t-photo','t-discernment','t-criticism'], ['t-criticism'], 1977),

  # ── EDUCATE ────────────────────────────────────────────────────────────
  ('b-how-children-learn', 'How Children Learn', 'John Holt',
   'https://www.hachettebookgroup.com/titles/john-holt/how-children-learn/9780201484045/',
   "Holt watched children learn — to walk, to talk, to read, to count — and described what he saw without interpreting it through any pedagogy. The result is the cleanest argument for trusting children's native learning. Required reading for anyone considering taking education back from the institution.",
   ['t-homeschooling','t-edusystem','t-personal-dev'], ['t-homeschooling'], 1967),

  ('b-the-absorbent-mind', 'The Absorbent Mind', 'Maria Montessori',
   'https://www.henryholt.com/9780805041569/the-absorbent-mind/',
   "Montessori's late synthesis: that the child's mind, from birth to six, takes the world in whole. Every Montessori, every Acton, every quiet revolution against the factory schoolroom traces back to this book.",
   ['t-edusystem','t-homeschooling'], ['t-edusystem'], 1949),

  ('b-dumbing-us-down', 'Dumbing Us Down', 'John Taylor Gatto',
   'https://newsociety.com/books/d/dumbing-us-down-25th-anniversary-edition',
   "A New York State Teacher of the Year explains why compulsory schooling produces the citizen the system needs and not the human the child is. Short, furious, undeniable.",
   ['t-edusystem','t-homeschooling'], [], 1992),

  ('b-deschooling-society', 'Deschooling Society', 'Ivan Illich',
   'https://archive.org/details/deschoolingsociety',
   "Illich's case that the institution called school is the obstacle to learning, not the enabler of it. Published in 1971, and somehow more accurate every decade since. Pair with Holt and Gatto for the full diagnosis.",
   ['t-edusystem','t-homeschooling'], [], 1971),

  ('b-free-to-learn', 'Free to Learn', 'Peter Gray',
   'https://www.basicbooks.com/titles/peter-gray/free-to-learn/9780465084999/',
   "An evolutionary psychologist on why children's natural mode is self-directed play, and what schools cost them when that mode is shut down. The empirical complement to Holt and Illich.",
   ['t-homeschooling','t-edusystem'], [], 2013),

  ('b-secrets-of-a-buccaneer-scholar', 'Secrets of a Buccaneer-Scholar', 'James Bach',
   'https://www.simonandschuster.com/books/Secrets-of-a-Buccaneer-Scholar/James-Marcus-Bach/9781416562955',
   "A high-school dropout who became Apple's youngest test manager describes how he taught himself. Reads as a field manual for anyone who has decided that the credential is not the education and the curriculum is not the world.",
   ['t-edusystem','t-personal-dev'], [], 2009),

  # ── RESEARCH ───────────────────────────────────────────────────────────
  ('b-behave', 'Behave', 'Robert Sapolsky',
   'https://www.penguinrandomhouse.com/books/562502/behave-by-robert-m-sapolsky/',
   "Sapolsky walks backward from a single human act — one second before, one minute, one day, one year, one childhood, one evolutionary lineage — until the behaviour stops looking like a choice and starts looking like a settlement. The biological seriousness modern morality is missing.",
   ['t-neuro','t-psych','t-mentalhlth'], ['t-neuro'], 2017),

  ('b-reality-is-not-what-it-seems', 'Reality Is Not What It Seems', 'Carlo Rovelli',
   'https://www.penguinrandomhouse.com/books/541678/reality-is-not-what-it-seems-by-carlo-rovelli/',
   "A loop-quantum-gravity physicist explains what physics has actually concluded about space, time, and matter. Rovelli writes like a man who has met the universe and is reporting back in plain Italian. The clearest entry to where physics is honestly standing today.",
   ['t-quantum','t-physics','t-dims'], ['t-physics'], 2014),

  ('b-the-master-and-his-emissary', 'The Master and His Emissary', 'Iain McGilchrist',
   'https://yalebooks.yale.edu/book/9780300245929/the-master-and-his-emissary/',
   "Twenty years of neuroscience reframed as a civilisational diagnosis: the two hemispheres of the brain attend to the world differently, and Western culture has elevated the wrong one. The most ambitious single-volume work on consciousness this century.",
   ['t-neuro','t-psych'], ['t-neuro'], 2009),

  ('b-thinking-in-systems', 'Thinking in Systems', 'Donella Meadows',
   'https://www.chelseagreen.com/product/thinking-in-systems/',
   "Meadows wrote the primer on how the world actually behaves — feedback loops, stocks, flows, leverage points. After reading her, every problem of climate, money, organisation, or culture stops looking like a list of complaints and starts looking like a system that can be understood.",
   ['t-systems','t-emergence'], ['t-systems'], 2008),

  ('b-the-logic-of-scientific-discovery', 'The Logic of Scientific Discovery', 'Karl Popper',
   'https://www.routledge.com/The-Logic-of-Scientific-Discovery/Popper/p/book/9780415278447',
   "Popper's argument that science advances by falsification — by being wrong in specific, refutable ways. The standard FRQNCY holds to when distinguishing what can be tested from what can only be believed.",
   ['t-systems','t-collective'], [], 1934),

  ('b-the-tell-tale-brain', 'The Tell-Tale Brain', 'V.S. Ramachandran',
   'https://wwnorton.com/books/9780393340624',
   "Case studies from a neurologist who works the edge cases — phantom limbs, synaesthesia, mirror-touch, Capgras syndrome. Each one tells you something about how the normal brain actually constructs the experience you call life.",
   ['t-neuro','t-psych'], [], 2011),

  # ── BROADCAST / MEDIA ──────────────────────────────────────────────────
  ('b-understanding-media', 'Understanding Media', 'Marshall McLuhan',
   'https://mitpress.mit.edu/9780262631594/understanding-media/',
   "McLuhan in 1964 told you what would happen — the medium becomes the message, the global village forms, the inner life gets externalised. Reread it now and feel sixty years of prophecy collapse into description.",
   ['t-broadcasting','t-socialmedia','t-language'], ['t-broadcasting'], 1964),

  ('b-amusing-ourselves-to-death', 'Amusing Ourselves to Death', 'Neil Postman',
   'https://www.penguinrandomhouse.com/books/163291/amusing-ourselves-to-death-by-neil-postman/',
   "Postman's 1985 warning: that television was reshaping public discourse into entertainment, and that the trade was not noticed because it was pleasant. The book to read before assuming any platform — including this one — is neutral.",
   ['t-broadcasting','t-socialmedia'], ['t-broadcasting'], 1985),

  ('b-the-plug-in-drug', 'The Plug-In Drug', 'Marie Winn',
   'https://www.penguinrandomhouse.com/books/289527/the-plug-in-drug-by-marie-winn/',
   "Winn's 1977 study of television's effect on children, updated for the screen era. The granular, observational version of what every parent now suspects. Reads as quiet and damning as it did fifty years ago.",
   ['t-broadcasting','t-mentalhlth'], [], 1977),

  ('b-the-shallows', 'The Shallows', 'Nicholas Carr',
   'https://wwnorton.com/books/the-shallows',
   "Carr's question — is the internet rewiring your brain — answered with neuroscience, history, and his own honest report of losing the ability to read long form. The case for protecting deep attention as a competence worth defending.",
   ['t-broadcasting','t-mentalhlth'], [], 2010),

  ('b-duty-free-art', 'Duty Free Art', 'Hito Steyerl',
   'https://www.versobooks.com/products/207-duty-free-art',
   "Steyerl on what art has become inside global capital — a portable, tax-advantaged asset class, often warehoused in airport free ports. Sharp, funny, terrifying. The criticism FRQNCY's editorial line should be read against.",
   ['t-criticism','t-visual'], [], 2017),

  ('b-free-culture', 'Free Culture', 'Lawrence Lessig',
   'https://www.free-culture.cc/',
   "Lessig on how copyright law was rewritten to lock down the commons — and what is lost when culture cannot be remixed. The legal substrate underneath every platform argument since.",
   ['t-socialmedia','t-opensource'], [], 2004),

  # ── SELL ───────────────────────────────────────────────────────────────
  ('b-influence', 'Influence', 'Robert Cialdini',
   'https://www.harpercollins.com/products/influence-new-and-expanded-robert-b-cialdini-phd',
   "Cialdini's six principles of persuasion, documented across decades of research and field work. Reciprocity, commitment, social proof, authority, liking, scarcity — read it for the immune system, not the toolkit.",
   ['t-psych','t-marketplaces','t-storefronts'], ['t-marketplaces'], 1984),

  ('b-scientific-advertising', 'Scientific Advertising', 'Claude C. Hopkins',
   'https://archive.org/details/scientificadvertising',
   "The 1923 manual on what works in advertising, written by a man who tested everything and kept count. Most of modern direct-response marketing is footnotes on Hopkins. Free online, ninety pages, more useful than any MBA course on demand.",
   ['t-marketplaces','t-storefronts'], [], 1923),

  ('b-confessions-of-an-advertising-man', 'Confessions of an Advertising Man', 'David Ogilvy',
   'https://atlantic-books.co.uk/book/confessions-of-an-advertising-man/',
   "Ogilvy's memoir is the rare book about commerce that is also about taste. How to run an agency, how to write copy that respects the reader, how to refuse work that should not be done. The model for principled selling.",
   ['t-storefronts','t-marketplaces'], [], 1963),

  ('b-building-a-storybrand', 'Building a StoryBrand', 'Donald Miller',
   'https://harpercollinsleadership.com/9780718033323',
   "Miller's seven-part framework for telling a customer that the product is a tool inside their story, not the other way around. The clearest modern playbook for honest positioning.",
   ['t-storefronts','t-marketplaces'], [], 2017),

  ('b-this-is-marketing', 'This Is Marketing', 'Seth Godin',
   'https://www.penguinrandomhouse.com/books/562124/this-is-marketing-by-seth-godin/',
   "Godin's case that marketing is a service done for the people you want to change. The smallest viable audience. Permission. Trust. The book that turns selling from extraction into invitation.",
   ['t-marketplaces','t-storefronts'], ['t-marketplaces'], 2018),

  ('b-the-case-against-education', 'The Case Against Education', 'Bryan Caplan',
   'https://press.princeton.edu/books/hardcover/9780691174655/the-case-against-education',
   "Caplan's argument that most of what school does is signalling, not learning. Empirically grounded, unsentimental, and the strongest available case for credentialism's coming collapse. Required reading for anyone hiring or being hired.",
   ['t-edusystem','t-personal-dev'], [], 2018),

  # ── FUND ───────────────────────────────────────────────────────────────
  ('b-the-most-important-thing', 'The Most Important Thing', 'Howard Marks',
   'https://cup.columbia.edu/book/the-most-important-thing/9780231153683',
   "Twenty essays by the co-founder of Oaktree on what actually matters in investing — second-level thinking, the cost of being right alone, the asymmetry of risk and reward. The clearest mind on capital allocation operating today.",
   ['t-conscap','t-impact','t-stocks'], ['t-conscap'], 2011),

  ('b-zero-to-one', 'Zero to One', 'Peter Thiel',
   'https://www.penguinrandomhouse.com/books/231833/zero-to-one-by-peter-thiel-with-blake-masters/',
   "Thiel's argument that progress comes from going from zero to one — building things that did not exist — and that most of what is called innovation is one-to-many copying. The book founders read before raising.",
   ['t-entrepreneurship','t-startups'], ['t-entrepreneurship'], 2014),

  ('b-the-bitcoin-standard', 'The Bitcoin Standard', 'Saifedean Ammous',
   'https://www.wiley.com/en-us/The+Bitcoin+Standard%3A+The+Decentralized+Alternative+to+Central+Banking-p-9781119473862',
   "Ammous on why hard money mattered, how it was lost, and what Bitcoin restores. The clearest single-volume case for digital scarcity as a corrective to the monetary regime of the last hundred years.",
   ['t-bitcoin','t-conscap','t-sov'], ['t-bitcoin'], 2018),

  ('b-extraordinary-popular-delusions', 'Extraordinary Popular Delusions and the Madness of Crowds', 'Charles Mackay',
   'https://archive.org/details/extraordinarypop00mack',
   "Mackay's 1841 anatomy of speculative manias — tulips, the South Sea Bubble, alchemy, witch hunts. Read it during any bubble; the patterns rhyme. Required immunisation for anyone deploying capital.",
   ['t-stocks','t-history'], [], 1841),

  ('b-the-intelligent-investor', 'The Intelligent Investor', 'Benjamin Graham',
   'https://www.harpercollins.com/products/the-intelligent-investor-rev-ed-benjamin-graham',
   "Graham's 1949 textbook, the one Buffett still calls the best book on investing. Mr. Market, margin of safety, the difference between speculation and investment. The cleanest single source for value discipline.",
   ['t-stocks','t-personal-finance'], [], 1949),

  ('b-the-value-of-everything', 'The Value of Everything', 'Mariana Mazzucato',
   'https://www.hachettebookgroup.com/titles/mariana-mazzucato/the-value-of-everything/9781610396745/',
   "Mazzucato on the slow theft of the word 'value' by financial actors who extract more than they create. The argument behind every serious modern conversation about what an economy is for.",
   ['t-conscap','t-impact'], [], 2018),

  # ── BUILD ──────────────────────────────────────────────────────────────
  ('b-how-buildings-learn', 'How Buildings Learn', 'Stewart Brand',
   'https://www.penguinrandomhouse.com/books/91836/how-buildings-learn-by-stewart-brand/',
   "Brand on what happens to buildings after the architect leaves — the layers of change, the slow accommodation to lives lived inside. The right model for any system you intend to last: design for adaptation, not for a perfect day.",
   ['t-archit','t-systems'], ['t-archit'], 1994),

  ('b-a-pattern-language', 'A Pattern Language', 'Christopher Alexander',
   'https://global.oup.com/academic/product/a-pattern-language-9780195019193',
   "Alexander's 253 patterns for building places people love. The book underneath every serious modern conversation on architecture, urbanism, and human-centred design. Software engineering quietly stole half of it.",
   ['t-archit','t-proddesign'], ['t-archit'], 1977),

  ('b-the-mythical-man-month', 'The Mythical Man-Month', 'Frederick Brooks',
   'https://www.pearson.com/en-us/subject-catalog/p/mythical-man-month-the-essays-on-software-engineering/P200000003345',
   "Brooks on what he learned managing OS/360 at IBM — that adding people to a late project makes it later, that the second system is always over-engineered, that no silver bullet is coming. The most reread book in software, and still right.",
   ['t-proddesign','t-collective'], [], 1975),

  ('b-the-visual-display-of-quantitative-information', 'The Visual Display of Quantitative Information', 'Edward Tufte',
   'https://www.edwardtufte.com/tufte/books_vdqi',
   "Tufte's foundational work on how to show data so it tells the truth. The vocabulary every honest dashboard, every honest chart, every honest infographic owes him.",
   ['t-proddesign'], [], 1983),

  ('b-operating-manual-for-spaceship-earth', 'Operating Manual for Spaceship Earth', 'Buckminster Fuller',
   'https://lars-mueller-publishers.com/operating-manual-for-spaceship-earth',
   "Fuller in 1969 named the planet a spaceship and asked what its operating manual would say. Short, hard, generative. The seed of everything regenerative-design has done since.",
   ['t-systems','t-sustliving'], ['t-systems'], 1969),

  # ── SETTLE / NETWORK STATE ─────────────────────────────────────────────
  ('b-the-network-state', 'The Network State', 'Balaji Srinivasan',
   'https://thenetworkstate.com/',
   "Balaji on the idea that the next sovereign actor will be a digital nation that goes physical — opt-in citizenship, cryptographic property rights, jurisdictional choice. The framing this entire pillar is built on.",
   ['t-networkstates','t-charter-cities'], ['t-networkstates'], 2022),

  ('b-exit-voice-and-loyalty', 'Exit, Voice, and Loyalty', 'Albert Hirschman',
   'https://www.hup.harvard.edu/catalog.php?isbn=9780674276604',
   "Hirschman's classic on the three things you can do when an organisation, a firm, or a state is declining — leave, complain, or stay loyal — and how each strategy interacts with the others. The intellectual scaffolding underneath the entire network-state thesis.",
   ['t-governance','t-networkstates'], ['t-governance'], 1970),

  ('b-the-sovereign-individual', 'The Sovereign Individual', 'James Dale Davidson',
   'https://www.simonandschuster.com/books/The-Sovereign-Individual/James-Dale-Davidson/9780684832722',
   "Davidson and Rees-Mogg in 1997 forecast the rise of digital cash, the decline of the nation-state's monopoly on violence, and the arrival of jurisdiction-shopping as a personal practice. Twenty-five years on, the predictions are most disconcerting where they are most accurate.",
   ['t-tax-sov','t-networkstates'], ['t-tax-sov'], 1997),

  ('b-governing-the-commons', 'Governing the Commons', 'Elinor Ostrom',
   'https://www.cambridge.org/core/books/governing-the-commons/A8BB63BC4A1433A50A3FB92EDBBB97D5',
   "Ostrom won the Nobel for showing — empirically, across decades of fieldwork — that communities can manage shared resources without either privatisation or central control. The basis for every serious modern conversation about coordination at scale.",
   ['t-governance','t-community'], ['t-governance'], 1990),

  ('b-the-fractured-republic', 'The Fractured Republic', 'Yuval Levin',
   'https://www.basicbooks.com/titles/yuval-levin/the-fractured-republic/9780465079612/',
   "Levin's diagnosis: America is not divided between left and right so much as between a centralised past everyone is nostalgic for and a localised future no one has yet learned to navigate. The conservative case for the network-state moment.",
   ['t-governance','t-history'], [], 2016),

  ('b-albions-seed', "Albion's Seed", 'David Hackett Fischer',
   'https://global.oup.com/academic/product/albions-seed-9780195069051',
   "Fischer's 900-page argument that four distinct British folkways — Puritan, Cavalier, Quaker, Scotch-Irish — set the cultural DNA of four American regions, and that those patterns still run the country. Required reading for anyone serious about new cultures: you have to know what came before to build what comes next.",
   ['t-history','t-anthropology','t-networkstates'], [], 1989),
]

added = 0
added_authors = []
for entry in ADDS:
    bid, title, author_name, url, bio, appears_in, picked_in, year = entry[:8]
    image = entry[8] if len(entry) > 8 else None

    # Skip if already exists
    if any(b['id'] == bid for b in books['books']):
        continue

    author, is_ref = author_field(author_name)
    book = {
        'id': bid,
        'title': title,
        'author': author,
        'author_is_person_ref': is_ref,
        'year': year,
        'url': url,
        'bio': bio,
        'appears_in': appears_in,
        'picked_in': picked_in,
    }
    if image:
        book['image'] = image

    books['books'].append(book)
    added += 1
    if not is_ref:
        added_authors.append(author_name)

books['$updated'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
json.dump(books, open('books.json','w'), indent=2, ensure_ascii=False)

print(f'Added {added} books to books.json')
print(f'Books total: {len(books["books"])}')
print(f'Authors added as strings (no person ref yet): {len(set(added_authors))}')
