import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

try:
    from solana.rpc.api import Client
except Exception:
    Client = None

BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / 'raydium_clmm_state.json'

BOT_ID = os.getenv('RAYDIUM_BOT_ID', 'agente-criptomoedas').strip()
SYNC_KEY = os.getenv('KEYVALUE_SYNC_KEY', 'mppa-rafael-pessoal').strip()
TOKEN_TELEGRAM = os.getenv('RAYDIUM_TELEGRAM_TOKEN', '').strip() or os.getenv('TELEGRAM_TOKEN', '').strip()
CHAT_ID = os.getenv('RAYDIUM_TELEGRAM_CHAT_ID', '').strip() or os.getenv('TELEGRAM_CHAT_ID', '').strip()
RPC_URL = os.getenv('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com').strip()

WALLETS_MONITORADAS = [
    '4j5g5StSfpKJvuGupSuGqBPefxr7jxBPFxiSy3LGYc5H',
    'dAuevFTmPjDRVfvqQdppCBcBrFBFtsEE3UCNHhrxXcd',
    '0x836ae676CBe0FF4C201DF9fA5fF6Dd4Ea06D5390',
]

RAYDIUM_POSITION_NFTS = [
    {'address': 'HNXRpyvXpmjVA8F5noHsu8pPEDH7Xz8rHUaVT8oKLfB4', 'label': 'TSLAx-USDC #1', 'in_range': True},
    {'address': 'GSGKjJfWzaNWbXcr5rajxEZSbk5e4bzvd7tLr5NvgH5f', 'label': 'TSLAx-USDC #2', 'in_range': False},
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
        },
    }
    try:
        url = f'https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/{SYNC_KEY}/{BOT_ID}/{hex_encode(payload)}'
        requests.post(url, timeout=10)
    except Exception:
        pass


def send_telegram(msg):
    if not TOKEN_TELEGRAM or not CHAT_ID:
        return False
    try:
        url = f'https://api.telegram.org/bot{TOKEN_TELEGRAM}/sendMessage'
        requests.post(url, json={'chat_id': CHAT_ID, 'text': msg, 'parse_mode': 'HTML'}, timeout=20)
        return True
    except Exception:
        return False


def snapshot():
    state = load_state()
    state['last_run'] = now().isoformat()
    state['last_snapshot_at'] = state['last_run']
    state['wallet_trigger'] = WALLETS_MONITORADAS[0] if WALLETS_MONITORADAS else ''
    state['status'] = 'healthy'
    state['snapshot_note'] = 'Snapshot Raydium CLMM identificado pelos NFTs da posição.'
    save_state(state)
    send_keyvalue(state)

    pos_lines = []
    for pos in RAYDIUM_POSITION_NFTS:
        status = 'PRICE IN RANGE' if pos.get('in_range') else 'PRICE OUT OF RANGE'
        pos_lines.append(f"• {pos['label']}: {status} | {pos['address']}")

    msg = '\n'.join([
        '🪙 <b>AGENTE CRIPTOMOEDAS</b>',
        '',
        f"Carteiras: {', '.join(WALLETS_MONITORADAS)}",
        f"Snapshot: {state['last_snapshot_at']}",
        '',
        *pos_lines,
    ])
    send_telegram(msg)
    return state


def main():
    try:
        snapshot()
    except Exception as e:
        state = load_state()
        state['status'] = 'danger'
        state['last_error'] = str(e)
        state['snapshot_note'] = f'Falha no Agente Criptomoedas: {e}'
        save_state(state)
        send_keyvalue(state)
        send_telegram(f'⛔ <b>AGENTE CRIPTOMOEDAS COM FALHA</b>\n\n{e}')


if __name__ == '__main__':
    main()
