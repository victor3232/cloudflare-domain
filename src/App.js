import { useState } from 'react';
import axios from 'axios';

export default function CloudflareDNSManager() {
  const [action, setAction] = useState('create');
  const [zoneNumber, setZoneNumber] = useState('1');
  const [subdomain, setSubdomain] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [fullSubdomain, setFullSubdomain] = useState('');
  const [result, setResult] = useState('');

  const zones = {
    '95e7efc33f0a9339216b28ff2c2bce19': 'hitsssh.web.id',
    '4ba67e22b32facc02df23ba9d7c87906': '404-eror.systems',
    '4ba67e22b32facc02df23ba9d7c88826': 'panel-bot.web.id',
    '13805e8d3a62151955b7a26debc88c33': 'cjdw.tech',
    'b66b7c7ff46762f0dbb1429d3f6d247f': 'slankers.web.id'
  };

  const apiTokens = {
    '95e7efc33f0a9339216b28ff2c2bce19': 'Kv3ypXTX_oKfTLyzdK0i_1r2b1Qg2thR9WBOU1P7',
    '4ba67e22b32facc02df23ba9d7c87906': '4lT84YYJ2scz2C9qkGxZ8RCk1IFT6cR5I4pqHBGd',
    '4ba67e22b32facc02df23ba9d7c88826': 'g6sUpj1Fu5_LFqgAexbi4sNogcL1KuGbievrJ9Kd',
    '13805e8d3a62151955b7a26debc88c33': 'WzIs43_i2VLMZ9I2S0IQj2E7aRcP72Qe7FKueY3t',
    'b66b7c7ff46762f0dbb1429d3f6d247f': 'g6sUpj1Fu5_LFqgAexbi4sNogcL1KuGbievrJ9Kd'
  };

  const handleAction = async () => {
    const zoneIds = Object.keys(zones);
    const zoneId = zoneIds[parseInt(zoneNumber) - 1];
    const apiToken = apiTokens[zoneId];

    if (!zoneId || !apiToken) {
      setResult('❌ Zona tidak valid.');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };

    try {
      if (action === 'create') {
        const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
        const data = {
          type: 'A',
          name: `${subdomain}.${zones[zoneId]}`,
          content: ipAddress,
          ttl: 3600,
          proxied: false
        };
        await axios.post(url, data, { headers });
        setResult(`✅ Subdomain ${data.name} berhasil dibuat.`);
      } else if (action === 'delete') {
        const domain = `${subdomain}.${zones[zoneId]}`;
        const listUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${domain}`;
        const listResp = await axios.get(listUrl, { headers });

        if (listResp.data.result.length === 0) {
          setResult('❌ Subdomain tidak ditemukan.');
          return;
        }

        const recordId = listResp.data.result[0].id;
        const deleteUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
        await axios.delete(deleteUrl, { headers });
        setResult(`✅ Subdomain ${domain} berhasil dihapus.`);
      } else if (action === 'update') {
        const domain = Object.values(zones).find(d => fullSubdomain.endsWith(d));
        const zid = Object.keys(zones).find(zid => zones[zid] === domain);
        const token = apiTokens[zid];

        const listUrl = `https://api.cloudflare.com/client/v4/zones/${zid}/dns_records?type=A&name=${fullSubdomain}`;
        const listResp = await axios.get(listUrl, { headers: { ...headers, 'Authorization': `Bearer ${token}` } });

        if (listResp.data.result.length === 0) {
          setResult('❌ Subdomain tidak ditemukan.');
          return;
        }

        const record = listResp.data.result[0];
        const updateUrl = `https://api.cloudflare.com/client/v4/zones/${zid}/dns_records/${record.id}`;

        await axios.put(updateUrl, {
          type: 'A',
          name: record.name,
          content: ipAddress,
          ttl: 3600,
          proxied: record.proxied
        }, { headers: { ...headers, 'Authorization': `Bearer ${token}` } });

        setResult(`✅ IP ${fullSubdomain} berhasil diubah ke ${ipAddress}.`);
      }
    } catch (error) {
      console.error(error);
      setResult('❌ Terjadi kesalahan.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
      <h1 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Cloudflare DNS Manager</h1>
      <select value={action} onChange={(e) => setAction(e.target.value)} style={{ width: '100%', marginBottom: '10px' }}>
        <option value="create">Create Subdomain</option>
        <option value="delete">Delete Subdomain</option>
        <option value="update">Update IP Subdomain</option>
      </select>
      {(action === 'create' || action === 'delete') && (
        <input type="text" placeholder="Subdomain" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
      )}
      {(action === 'create' || action === 'delete') && (
        <input type="number" placeholder="No Domain (1-5)" value={zoneNumber} onChange={(e) => setZoneNumber(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
      )}
      {(action === 'create' || action === 'update') && (
        <input type="text" placeholder="IP Address" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
      )}
      {action === 'update' && (
        <input type="text" placeholder="Full Subdomain" value={fullSubdomain} onChange={(e) => setFullSubdomain(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
      )}
      <button onClick={handleAction} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white' }}>Proses</button>
      {result && <p style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>{result}</p>}
    </div>
  );
}
}