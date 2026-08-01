import json,sys
# karaoke ASS: white box, dark text, cadet-blue as each word is spoken
words=json.load(open(sys.argv[1]))
out=sys.argv[2]
# group into caption lines (<=22 chars or <=4 words, break on sentence punct)
lines=[]; cur=[]
for w in words:
    cur.append(w); j=" ".join(x[2] for x in cur)
    if w[2].endswith(('.','!','?',':',';')) or len(j)>=22 or len(cur)>=4:
        lines.append(cur); cur=[]
if cur: lines.append(cur)
def cs(t): return f"{int(t//3600)}:{int((t%3600)//60):02d}:{t%60:05.2f}"
CADET="&H00A09E5F"   # cadet blue (BGR)
DARK="&H00202020"    # near-black unhit text
WHITE="&H00FFFFFF"
hdr=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: F, Lato, 62, {CADET}, {DARK}, {WHITE}, {WHITE}, 1,0,0,0,100,100,0,0,3,14,0,2,80,80,240,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev=[]
for ln in lines:
    st=ln[0][0]; en=ln[-1][1]
    txt=""
    for i,w in enumerate(ln):
        nxt = ln[i+1][0] if i+1<len(ln) else w[1]
        k=max(1,round((nxt-w[0])*100))
        txt+=f"{{\\k{k}}}{w[2]} "
    ev.append(f"Dialogue: 0,{cs(st)},{cs(en)},F,,0,0,0,,{txt.strip()}")
open(out,"w").write(hdr+"\n".join(ev))
print("lines:",len(lines))
