#!/usr/bin/env python3
from pathlib import Path
import json,secrets,uuid,os
r=Path(__file__).resolve().parents[1]
env=r/'backend/.env'
if not env.exists():raise SystemExit('Run setup-local.py first.')
if 'SPRING_PROFILES_ACTIVE=dev' not in env.read_text():raise SystemExit('This helper is for the dev profile only.')
d=r/'.local';d.mkdir(exist_ok=True);os.chmod(d,0o700)
f=d/'e2e.json'
if f.exists():raise SystemExit('Existing E2E fixture preserved.')
data={'email':'qa-'+uuid.uuid4().hex+'@example.invalid','password':secrets.token_urlsafe(32)}
fd=os.open(f,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as out:json.dump(data,out)
s=env.read_text().replace('BOOTSTRAP_ADMIN_EMAIL=\n','BOOTSTRAP_ADMIN_EMAIL='+data['email']+'\n').replace('BOOTSTRAP_ADMIN_PASSWORD=\n','BOOTSTRAP_ADMIN_PASSWORD='+data['password']+'\n');env.write_text(s)
print('Created random local-only E2E admin fixture in ignored .local/e2e.json. Restart backend once, then clear BOOTSTRAP_ADMIN_* variables.')
