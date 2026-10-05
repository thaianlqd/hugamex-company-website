#!/usr/bin/env python3
"""Prepare user-authorized one-time owner bootstrap; never prints credentials."""
from pathlib import Path
import argparse
import json
import os
import re
import secrets
import shlex

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--email', required=True)
args = parser.parse_args()
if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', args.email):
    raise SystemExit('Provide a valid owner email address.')
env = root / 'backend/.env'
text = env.read_text()
values = {}
for line in text.splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        name, value = line.split('=', 1)
        tokens = shlex.split(value)
        values[name.strip()] = tokens[0] if tokens else ''
if values.get('SPRING_PROFILES_ACTIVE') != 'dev' or values.get('DATABASE_URL') != 'jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require':
    raise SystemExit('Expected the configured Supabase database and dev profile.')
folder = root / '.local'
folder.mkdir(exist_ok=True)
folder.chmod(0o700)
file = folder / 'supabase-admin.json'
if file.exists():
    data = json.loads(file.read_text())
    if data['email'] != args.email.lower():
        raise SystemExit('Existing owner credentials preserved; email does not match.')
    if data.get('status') == 'CREATED_LOGIN_VERIFIED':
        print('Owner creation was already verified; credentials preserved and bootstrap remains disabled.')
        raise SystemExit(0)
else:
    if values.get('BOOTSTRAP_ADMIN_EMAIL') or values.get('BOOTSTRAP_ADMIN_PASSWORD'):
        raise SystemExit('Existing bootstrap configuration preserved; review it before generating another account.')
    data = {'email': args.email.lower(), 'password': secrets.token_urlsafe(32),
            'role': 'SUPER_ADMIN', 'status': 'PENDING_BOOTSTRAP',
            'note': 'Not yet a database account. Created only after successful backend bootstrap; MFA required.'}
    fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as out:
        json.dump(data, out, indent=2)
updates = {'BOOTSTRAP_ADMIN_EMAIL': data['email'], 'BOOTSTRAP_ADMIN_PASSWORD': data['password']}
if any(values.get(name) and values[name] != value for name, value in updates.items()):
    raise SystemExit('Different bootstrap configuration preserved; review it before proceeding.')
lines = [line for line in text.splitlines() if line.split('=', 1)[0].strip() not in updates]
lines.extend(name + '=' + shlex.quote(value) for name, value in updates.items())
env.write_text('\n'.join(lines) + '\n')
env.chmod(0o600)
print('Prepared pending owner credentials in ignored .local/supabase-admin.json (0600).')
print('Backend bootstrap creates the account only if no active SUPER_ADMIN exists. No database write was performed by this helper.')
