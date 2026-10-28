import re
I={ # lucide-ish icons
'today':'<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 10h18"/>',
'journal':'<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5a2.5 2.5 0 0 0 0 5H19"/>',
'people':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
'areas':'<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
'more':'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
'plus':'<path d="M12 5v14M5 12h14"/>','pen':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','arrow':'<path d="M5 12h14M13 6l6 6-6 6"/>',
'search':'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>','pin':'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
'flag':'<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>','msg':'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/>',
}
def ic(n,s=16): return f'<svg class="i" width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
nav=[('today','Today'),('journal','Journal'),('people','People'),('areas','Areas'),('more','More')]
def sidebar():
  items=''.join(f'<a class="nav{" on" if k=="today" else ""}">{ic(k,18)}<span>{l}</span>{"<em>3</em>" if k=="people" else ""}</a>' for k,l in nav)
  areas=''.join(f'<a class="nav sub"><i class="dot {c}"></i><span>{n}</span><b>{x}</b></a>' for c,n,x in [('school','School',4),('rounds','Rounds',3),('mdplus','MDplus',2)])
  return f'''<aside class="side"><div class="brand"><div class="logo">L</div><div><strong>Loam OS</strong><small>Private</small></div></div>
<button class="cmd">{ic('search',15)}<span>Search or capture</span><kbd>⌘K</kbd></button>
<nav>{items}</nav><div class="sect">Areas</div><nav>{areas}</nav>
<div class="me"><div class="av">A</div><div><strong>Ali</strong><small>M3 · Surgery block</small></div></div></aside>'''
def tabs(): return '<nav class="tabs">'+''.join(f'<a class="{"on" if k=="today" else ""}">{ic(k,22)}<span>{l}</span></a>' for k,l in nav)+'</nav>'
agenda=[('6:30','7:30','Pre-rounds · 4 West','Hospital','school',True),('9:00','10:00','Surgery didactics: Hernia','Lecture hall B','school',False),('13:00','13:30','Rounds standup','Zoom','rounds',False),('16:00','16:45','MDplus partner call with Priya','Google Meet','mdplus',False),('19:30','20:30','UWorld block · 40 Qs','Home','school',False)]
tasks=[('Finish H&P write-up for bed 12','school','School','Due 5 pm',True,False),('Ship onboarding copy fix','rounds','Rounds','Today',False,False),('Review Q4 pricing deck','mdplus','MDplus','Due tomorrow',False,False),('Anki: surgery deck, 120 cards','school','School','Daily',False,True),('Reply to beta feedback thread','rounds','Rounds','Overdue 1d',True,False)]
counts=[('Surgery shelf','12','days','school'),('Rounds v2 launch','19','days','rounds'),('Step 2 CK','84','days','school')]
people=[('Sam','S','Resident, Gen Surg','Said to read up on Whipple complications before Friday.','6d ago'),('Priya','P','MDplus co-founder','Agreed to split pricing work; she owns the enterprise tier.','2w ago'),('Jordan','J','Rounds beta user','Wants offline mode for night float; promised a follow-up.','3w ago')]
def page(v):
  ag=''.join(f'''<li class="ev{' now' if now else ''}"><div class="t"><b>{a}</b><small>{b}</small></div><i class="bar {c}"></i><div class="body"><strong>{t}</strong><small>{ic('pin',12)}{w}</small></div>{'<span class="live">Now</span>' if now else ''}</li>''' for a,b,t,w,c,now in agenda)
  tk=''.join(f'''<li class="task{' done' if d else ''}"><span class="chk"></span><span class="tt">{t}</span><span class="pill {c}">{n}</span><span class="due{' warn' if w else ''}">{du}</span></li>''' for t,c,n,du,w,d in tasks)
  ct=''.join(f'<div class="cd {c}"><div class="num">{n}<small>{u}</small></div><span>{l}</span></div>' for l,n,u,c in counts)
  pp=''.join(f'<li class="person"><div class="pav">{i}</div><div class="pb"><div class="pn"><strong>{n}</strong><small>{r}</small></div><p>{s}</p></div><span class="ago">{a}</span></li>' for n,i,r,s,a in people)
  return f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loam OS · Today ({v})</title><link rel="stylesheet" href="{v}.css"></head><body><div class="app">{sidebar()}
<main><header class="hd"><div><div class="eyebrow">Wednesday · Week 6 of Surgery</div><h1>October 28</h1><p class="sub">5 events · 5 tasks · 3 people to follow up</p></div>
<a class="jr">{ic('pen',16)}<div><strong>Today's journal</strong><small>Not started · 2 prompts</small></div>{ic('arrow',15)}</a></header>
<div class="countdowns">{ct}</div>
<div class="grid"><section class="card agenda"><div class="ch"><h2>{ic('today',15)}Agenda</h2><span class="meta">5 events</span></div><ul>{ag}</ul></section>
<section class="card tasks"><div class="ch"><h2>{ic('flag',15)}Tasks</h2><div class="seg"><b>All</b><span>School</span><span>Rounds</span><span>MDplus</span></div></div><ul>{tk}</ul></section>
<section class="card people"><div class="ch"><h2>{ic('msg',15)}Follow up</h2><span class="meta">3 people</span></div><ul>{pp}</ul></section></div>
<div class="capture">{ic('plus',18)}<span>Capture a task, note, or person…</span><kbd>⌘K</kbd></div></main>{tabs()}</div></body></html>'''
for v in 'ab': open(f'{v}.html','w').write(page(v))
