import json, urllib.request, time
from pathlib import Path
BASE='http://127.0.0.1:3010'
def req(path, data=None, headers=None):
    h=headers or {}
    if isinstance(data,dict):
        data=json.dumps(data).encode(); h['Content-Type']='application/json'
    with urllib.request.urlopen(urllib.request.Request(BASE+path,data=data,headers=h),timeout=180) as r:
        return json.load(r)
s=req('/api/settings')
assert s['piModelFast']=='gpt-6-astra' and 'piApiKey' not in s
s=req('/api/settings',{'provider':'codex','piUrl':'https://example.invalid','piApiKey':'REDACTED_SET_VIA_ENV'})
assert s['provider']=='pi' and s['piUrl']=='https://copilot.chillicurry.uk/v1'
print('PASS managed settings and secret masking',flush=True)
boundary='PaperMotionSmokeBoundary'
text='''# Photosynthesis Study Notes
Photosynthesis converts light energy into chemical energy in plants. Chlorophyll pigments in chloroplasts absorb light. The light-dependent reactions occur in thylakoid membranes. These reactions split water and release oxygen while producing ATP and NADPH. The Calvin cycle occurs in the stroma. It uses ATP and NADPH to fix carbon dioxide into sugars. Plants use glucose for respiration, storage as starch, and construction of cellulose. Light intensity, carbon dioxide concentration, and temperature can limit photosynthetic rate. Increasing one limiting factor increases the rate until another factor becomes limiting. Excessively high temperatures can damage enzymes and lower photosynthesis. Oxygen released by plants comes from water, not carbon dioxide.
'''
body=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="deployment-smoke.md"\r\nContent-Type: text/markdown\r\n\r\n{text}\r\n--{boundary}--\r\n').encode()
u=req('/api/upload',body,{'Content-Type':f'multipart/form-data; boundary={boundary}'})
doc=u['docId']; print('PASS markdown upload and PDF conversion',doc,u['numPages'],flush=True)
Path('/tmp/papermotion-smoke-docid').write_text(doc)
c=req('/api/chat/'+doc,{'action':'create','title':'Deployment smoke test'})['chat']['id']
a=req('/api/chat/'+doc,{'action':'send','chatId':c,'message':'请用中文简短解释光合作用产生的氧气来自哪里。'})
print('CHAT',json.dumps(a,ensure_ascii=False)[:2000],flush=True)
a=req('/api/chat/'+doc,{'action':'send','chatId':c,'message':'它是不是来自二氧化碳？请根据刚才的回答解释。'})
print('FOLLOWUP',json.dumps(a,ensure_ascii=False)[:2000],flush=True)
f=req('/api/flashcards/'+doc,{'action':'generate','topic':'Photosynthesis, exactly four cards'})
print('FLASHCARDS',json.dumps(f,ensure_ascii=False)[:2000],flush=True)
print('SMOKE COMPLETE',flush=True)
