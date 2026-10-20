import { getChain } from '../config/chains';

export function getReceiptParams(item) {
  const isCrypto = !!(item.txHash || item.chainId);
  const isOut = item.direction === 'out';
  const isSwap = item.kind === 'swap';
  const isBill = !!item.phone;
  const amountStr = item.symbol === 'NGN'
    ? Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })
    : `${item.amount} ${item.symbol || ''}`.trim();

  const rows = [{ label: 'Type', value: item.label }];
  if (item.symbol === 'NGN' && (item.toUb3Id || item.fromUb3Id)) {
    const sentOut = item.direction === 'out';
    const idv = String(sentOut ? item.toUb3Id : item.fromUb3Id);
    const idPretty = /^[0-9]{8}$/.test(idv) ? idv.slice(0, 4) + ' ' + idv.slice(4) : '@' + idv;
    rows.push({ label: sentOut ? 'To' : 'From', value: (item.counterpartyName ? item.counterpartyName + ' ' : '') + '(UB3 ID ' + idPretty + ')', copyValue: idv });
    rows.push({ label: 'Fee', value: 'Free' });
    return {
      amountPrefix: sentOut ? '- ' : '+ ',
      amount: 'NGN ' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
      topRightLabel: sentOut ? 'Sent' : 'Received',
      topRightIcon: 'swap-horizontal-outline',
      rows,
      explorerUrl: undefined,
      date: item.at,
      status: item.status,
    };
  }
  let explorerUrl;

  if (isBill) {
    rows.push({ label: 'Network', value: item.network });
    rows.push({ label: 'Recipient', value: item.phone });
    if (item.planLabel) rows.push({ label: 'Plan', value: item.planLabel });
    if (item.reference) rows.push({ label: 'Session ID', value: item.reference });
  } else if (isSwap) {
    rows.push({ label: 'From', value: `${item.fromAmount} ${item.fromSymbol}` });
    rows.push({ label: 'To', value: `${item.toAmount} ${item.toSymbol}` });
  } else if (isCrypto) {
    const chain = getChain(item.chainId);
    rows.push({ label: 'Network', value: chain?.name });
    if (item.toUb3Id) {
    const uid8 = String(item.toUb3Id);
    rows.push({
      label: 'To',
      value: /^[0-9]{8}$/.test(uid8) ? ('UB3 ID ' + uid8.slice(0, 4) + ' ' + uid8.slice(4)) : ('UB3 ID @' + uid8),
      copyValue: uid8,
    });
  } else if (item.toAddress) {
      rows.push({
        label: 'To',
        value: `${item.toAddress.slice(0, 6)}...${item.toAddress.slice(-4)}`,
        copyValue: item.toAddress,
      });
    }
    if (item.fromAddress) {
      rows.push({ label: 'From', value: item.fromAddress.slice(0, 6) + '...' + item.fromAddress.slice(-4), copyValue: item.fromAddress });
    }
    rows.push({ label: 'Tx Hash', value: item.txHash || 'Pending' });
    if (chain?.explorer && item.txHash) {
      explorerUrl = chain.explorer + item.txHash.replace('...', '');
    }
  } else {
    if (item.bankName) rows.push({ label: 'Sent to', value: item.accountName || item.bankName });
    if (item.bankName) {
      rows.push({
        label: "Receiver's Account",
        value: `${item.bankName}${item.accountNumber ? ` (${item.accountNumber})` : ''}`,
      });
    }
    if (item.reference) rows.push({ label: 'Session ID', value: item.reference });
  }

  return {
    amountPrefix: isOut ? '- ' : '+ ',
    amount: item.symbol === 'NGN' ? `NGN ${amountStr}` : amountStr,
    topRightLabel: isBill ? item.label : (isSwap ? 'Swap' : (isCrypto ? item.label : 'Bank')),
    topRightIcon: (isCrypto || isSwap) ? 'swap-horizontal-outline' : 'business-outline',
    rows,
    explorerUrl,
    date: item.at,
    status: item.status,
  };
}

export function openReceipt(navigation, item) {
  navigation.navigate('TransactionReceipt', getReceiptParams(item));
}
