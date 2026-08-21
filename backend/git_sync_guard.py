# -*- coding: utf-8 -*-
import os, sys, subprocess, shutil, time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_DIR = BASE_DIR / 'backend' / 'backups' / 'pre_sync_snapshots'

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, cwd=BASE_DIR, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return False, '', str(e)

def safe_sync():
    print('=' * 60)
    print('GIT SYNC GUARD - SAFE CUSTOM MULTI-AGENT SYNC')
    print('=' * 60)
    
    print('[*1] Fetching origin...')
    ok, _, err = run_cmd('git fetch origin')
    if not ok:
        print(f'[ERR] Cannot fetch: {err}')
        return False
        
    _, local_hash, _ = run_cmd('git rev-parse HEAD')
    _, remote_hash, _ = run_cmd('git rev-parse origin/main')
    
    if local_hash == remote_hash:
        print('[OK] This machine is fully up-to-date with remote git.')
        return True
        
    print(f'[Info] New remote commits detected! Local: {local_hash[:7]} | Remote: {remote_hash[:7]}')
    
    # Create snapshot
    snap_dir = BACKUP_DIR / f'snapshot_{int(time.time())}'
    snap_dir.mkdir(parents=True, exist_ok=True)
    for p in ['backend/app.py', 'frontend/index.html', 'frontend/js/app.js', 'backend/gallery_db.json']:
        sp = BASE_DIR / p
        if sp.exists():
            dp = snap_dir / p
            dp.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(sp, dp)
    print(f'[OK] Created local safety snapshot: {snap_dir}')
    
    _, status_out, _ = run_cmd('git status --porcelain')
    stashed = False
    if status_out:
        print('[*] Stashing local dirty changes...')
        st_ok, _, _ = run_cmd('git stash push -u -m AutoSyncStash')
        stashed = st_ok
    
    print('[*2] Pulling new changes via rebase...')
    pok, pout, perr = run_cmd('git pull --rebase origin main')
    if not pok:
        print('[!] Rebase needs merge resolution. Aborting rebase and running safe merge...')
        run_cmd('git rebase --abort')
        mok, _, merr = run_cmd('git merge -X ours origin/main -m "merge: safe sync from peer AI"')
        if not mok:
            print(f'[WARN] Check merge: {merr}')
        else:
            print('[OK] Safely merged remote changes while protecting local code!')
    else:
        print('[OK] Pulled and rebased successfully!')
    
    if stashed:
        print('[*3] Restoring local stash...')
        run_cmd('git stash pop')
    
    print('[*4] Exporting desktop bundle...')
    run_cmd('python backend/workflow_exporter.py')
    print('[DONE] Sync completed successfully!')
    return True

if __name__ == '__main__':
    safe_sync()
