#!/usr/bin/env python3
from pathlib import Path
import base64,secrets,os
root=Path(__file__).resolve().parents[1]
if (root/'backend/.env').exists() or (root/'.env').exists():
 raise SystemExit('Existing environment preserved. Edit it manually if needed.')
key=lambda:base64.b64encode(secrets.token_bytes(32)).decode()
password=secrets.token_urlsafe(32)
backend='\n'.join(['SPRING_PROFILES_ACTIVE=dev','DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/hugamex','DATABASE_USERNAME=hugamex','DATABASE_PASSWORD='+password,'JWT_SIGNING_KEY='+key(),'TOKEN_HASH_KEY='+key(),'OTP_HMAC_KEY='+key(),'MFA_ENCRYPTION_KEY='+key(),'CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173','FRONTEND_URL=http://127.0.0.1:5173','DEV_MAIL_MODE=file','BOOTSTRAP_ADMIN_EMAIL=','BOOTSTRAP_ADMIN_PASSWORD='])+'\n'
for p,s in [(root/'backend/.env',backend),(root/'.env','POSTGRES_PASSWORD='+password+'\n')]:
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:f.write(s)
print('Created ignored local environments with fresh random keys. No credentials printed.')
