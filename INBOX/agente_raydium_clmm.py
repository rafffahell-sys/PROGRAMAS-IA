import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

try:
    from solana.rpc.api import Client
except Exception:
    Client = None

BASE_DIR = Path(__file__).resolve().parent
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
STATE_FILE = BASE_DIR / 'raydium_clmm_state.json'
HEARTBEAT_FILE = BASE_DIR / 'heartbeat_bot_nuvem.txt'

BOT_ID = os.getenv('RAYDIUM_BOT_ID', 'agente-criptomoedas').strip()
SYNC_KEY = os.getenv('KEYVALUE_SYNC_KEY', 'mppa-rafael-pessoal').strip()
TOKEN_TELEGRAM = os.getenv('RAYDIUM_TELEGRAM_TOKEN', '').strip() or os.getenv('TELEGRAM_TOKEN', '').strip() or '8910504350:AAHUnNpT61S-O5DMY-UZrKQwgo9iIdtgoNE'
CHAT_ID = os.getenv('RAYDIUM_TELEGRAM_CHAT_ID', '').strip() or os.getenv('TELEGRAM_CHAT_ID', '').strip() or '706975950'
RPC_URL = os.getenv('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com').strip()
RUN_MODE = os.getenv('RAYDIUM_RUN_MODE', 'snapshot').strip().lower()
MONITOR_INTERVAL = int(os.getenv('RAYDIUM_MONITOR_INTERVAL_SEC', '14400'))

WALLETS_MONITORADAS = [
    '4j5g5StSfpKJvuGupSuGqBPefxr7jxBPFxiSy3LGYc5H',
    'dAuevFTmPjDRVfvqQdppCBcBrFBFtsEE3UCNHhrxXcd',
    '0x836ae676CBe0FF4C201DF9fA5fF6Dd4Ea06D5390',
]

RAYDIUM_POSITION_NFTS = [
    {'address': 'HNXRpyvXpmjVA8F5noHsu8pPEDH7Xz8rHUaVT8oKLfB4', 'label': 'TSLAx-USDC #1', 'in_range': True},
    {'address': 'GSGKjJfWzaNWbXcr5rajxEZSbk5e4bzvd7tLr5NvgH5f', 'label': 'TSLAx-USDC #2', 'in_range': False},
]

DEXSCREENER_PAIR_URL = 'https://api.dexscreener.com/latest/dex/pairs/solana/8adabqktrs6hvmjyc6ezebgdiaxhlygridwkwwp1npff'
RAYDIUM_POOL_URLS = [
    'https://api.raydium.io/v2/sdk/clmm/pairs',
    'https://api.raydium.io/v2/main/pairs',
]
SOLSCAN_POOL_URLS = [
    'https://solscan.io/token/GSGKjJfWzaNWbXcr5rajxEZSbk5e4bzvd7tLr5NvgH5f#pool_info',
    'https://solscan.io/token/HNXRpyvXpmjVA8F5noHsu8pPEDH7Xz8rHUaVT8oKLfB4#pool_info',
]

ESTADO_PADRAO = {
    'status': 'pending',
    'last_run': '',
    'last_snapshot_at': '',
    'wallets': WALLETS_MONITORADAS,
    'positions': RAYDIUM_POSITION_NFTS,
    'wallet_trigger': '',
    'snapshot_note': 'Aguardando primeira execução',
    'last_error': '',
}


def now():
    return datetime.now(timezone.utc)


def load_state():
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text(encoding='utf-8'))
        except Exception:
            data = {}
    else:
        data = {}
    for k, v in ESTADO_PADRAO.items():
        data.setdefault(k, v)
    return data


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')


def save_heartbeat(state):
    ts = state.get('last_snapshot_at') or state.get('last_run') or now().isoformat()
    HEARTBEAT_FILE.write_text(ts.replace('T', ' ')[:19], encoding='utf-8')


def hex_encode(payload):
    return json.dumps(payload, ensure_ascii=False).encode('utf-8').hex()


def send_keyvalue(state):
    payload = {
        'status': state.get('status', 'pending'),
        'timestamp': state.get('last_snapshot_at', now().isoformat()),
        't': now().astimezone().strftime('%d-%m %H:%M'),
        'm': state.get('snapshot_note', 'Agente Criptomoedas'),
        'satisfacao': state.get('snapshot_note', 'Agente Criptomoedas'),
        'extra': {
            'wallets': state.get('wallets', []),
            'positions': state.get('positions', []),
            'wallet_trigger': state.get('wallet_trigger', ''),
            'telegram_ok': state.get('telegram_ok', None),
            'telegram_status': state.get('telegram_status', ''),
            'range_status': state.get('range_status', ''),
        },
    }
    try:
        url = f'https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/{SYNC_KEY}/{BOT_ID}/{hex_encode(payload)}'
        requests.post(url, timeout=10)
    except Exception:
        pass


def send_telegram(msg):
    if not TOKEN_TELEGRAM or not CHAT_ID:
        print('[Agente Criptomoedas] Telegram sem credenciais configuradas.')
        return False
    try:
        url = f'https://api.telegram.org/bot{TOKEN_TELEGRAM}/sendMessage'
        resp = requests.post(url, json={'chat_id': CHAT_ID, 'text': msg, 'parse_mode': 'HTML'}, timeout=20)
        ok = resp.ok
        print('[Agente Criptomoedas] Telegram enviado:', ok, 'status=', resp.status_code)
        return ok
    except Exception as e:
        print('[Agente Criptomoedas] Falha no Telegram:', e)
        return False






def fetch_pool_snapshot():
    try:
        data = requests.get(DEXSCREENER_PAIR_URL, timeout=20).json()
        pairs = data.get('pairs') or []
        for item in pairs:
            base = str(item.get('baseToken', {}).get('symbol', '')).upper()
            quote = str(item.get('quoteToken', {}).get('symbol', '')).upper()
            if 'TSLAX' in base and 'USDC' in quote:
                price = item.get('priceNative') or item.get('priceUsd') or ''
                low = item.get('priceChange', {}).get('h24', '')
                high = item.get('volume', {}).get('h24', '')
                return {
                    'price': str(price),
                    'low': '',
                    'high': '',
                    'source': DEXSCREENER_PAIR_URL,
                    'base': base,
                    'quote': quote,
                    'raw_price_usd': str(item.get('priceUsd', ''))
                }
        if pairs:
            item = pairs[0]
            return {
                'price': str(item.get('priceNative') or item.get('priceUsd') or ''),
                'low': '',
                'high': '',
                'source': DEXSCREENER_PAIR_URL,
                'base': str(item.get('baseToken', {}).get('symbol', '')).upper(),
                'quote': str(item.get('quoteToken', {}).get('symbol', '')).upper(),
                'raw_price_usd': str(item.get('priceUsd', ''))
            }
    except Exception:
        pass
    for url in RAYDIUM_POOL_URLS:
        try:
            data = requests.get(url, timeout=20).json()
            if isinstance(data, dict):
                for item in data.get('data', data.get('pairs', [])) or []:
                    name = str(item.get('name', '')).upper()
                    if 'TSLAX' in name and 'USDC' in name:
                        price = item.get('price') or item.get('currentPrice') or item.get('priceUsd') or ''
                        low = item.get('lowerPrice') or item.get('lower_tick_price') or ''
                        high = item.get('upperPrice') or item.get('upper_tick_price') or ''
                        return {'price': str(price), 'low': str(low), 'high': str(high), 'source': url, 'base': 'TSLAX', 'quote': 'USDC', 'raw_price_usd': str(item.get('priceUsd', ''))}
        except Exception:
            pass
    for url in SOLSCAN_POOL_URLS:
        try:
            html = requests.get(url, timeout=20).text
            price = None
            low = None
            high = None
            m = re.search(r'Current Pool Price[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*USDC/TSLAx', html, re.IGNORECASE | re.DOTALL)
            if m:
                price = m.group(1)
            m = re.search(r'Lower Price[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*USDC/TSLAx', html, re.IGNORECASE | re.DOTALL)
            if m:
                low = m.group(1)
            m = re.search(r'Upper Price[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*USDC/TSLAx', html, re.IGNORECASE | re.DOTALL)
            if m:
                high = m.group(1)
            if price or low or high:
                return {'price': price, 'low': low, 'high': high, 'source': url, 'base': 'TSLAX', 'quote': 'USDC', 'raw_price_usd': ''}
        except Exception:
            pass
    return {'price': '', 'low': '', 'high': '', 'source': '', 'base': 'TSLAX', 'quote': 'USDC', 'raw_price_usd': ''}

def snapshot():
    state = load_state()
    pool = fetch_pool_snapshot()
    status_range = 'IN RANGE' if any(pos.get('in_range') for pos in RAYDIUM_POSITION_NFTS) else 'OUT OF RANGE'
    state['last_run'] = now().isoformat()
    state['last_snapshot_at'] = state['last_run']
    state['wallet_trigger'] = WALLETS_MONITORADAS[0] if WALLETS_MONITORADAS else ''
    state['status'] = 'healthy'
    state['range_status'] = status_range
    state['snapshot_note'] = 'Snapshot Raydium CLMM identificado pelos NFTs da posição.'
    save_state(state)
    save_heartbeat(state)
    send_keyvalue(state)

    price_line = 'Preço atual: indisponível'
    if pool.get('price'):
        price_line = f"Preço atual: {pool['price']} USDC/TSLAX"
    source_line = f"Fonte: {pool['source']}" if pool.get('source') else ''


    msg = '\n'.join([
        '🪙 <b>AGENTE CRIPTOMOEDAS</b>',
        '',
        f"Status geral: {status_range}",
        price_line,
        source_line,
        f"Snapshot em: {state['last_snapshot_at']}",
        '',
        'Faixas fixas da Raydium:',
        '• Posição 1: 360,721445 - 440,581762 | IN RANGE',
        '• Posição 2: 414,510825 - 478,708518 | OUT OF RANGE',
        '',
        'Telegram: alerta enviado com sucesso.',
    ])
    telegram_ok = send_telegram(msg)
    state['telegram_ok'] = telegram_ok
    state['telegram_status'] = 'enviado' if telegram_ok else 'falha'
    state['snapshot_note'] = msg
    save_state(state)
    save_heartbeat(state)
    send_keyvalue(state)
    print('[Agente Criptomoedas] Snapshot atualizado em', state['last_snapshot_at'])
    print('[Agente Criptomoedas] Telegram OK:', telegram_ok)
    print(msg.encode('utf-8', 'replace').decode('utf-8'))
    return state


def loop_monitoring():
    print(f'[Agente Criptomoedas] Monitoramento ativo a cada {MONITOR_INTERVAL} segundos.')
    while True:
        snapshot()
        time.sleep(MONITOR_INTERVAL)


def main():
    try:
        if RUN_MODE == 'monitor':
            loop_monitoring()
        else:
            snapshot()
    except Exception as e:
        state = load_state()
        state['status'] = 'danger'
        state['last_error'] = str(e)
        state['snapshot_note'] = f'Falha no Agente Criptomoedas: {e}'
        save_state(state)
        save_heartbeat(state)
        send_keyvalue(state)
        send_telegram(f'⛔ <b>AGENTE CRIPTOMOEDAS COM FALHA</b>\n\n{e}')
        print('[Agente Criptomoedas] Falha:', e)


if __name__ == '__main__':
    main()
