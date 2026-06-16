const https = require('https');
const fs    = require('fs');
const path  = require('path');

const token = process.env.NOTION_TOKEN;
const dbId  = process.env.NOTION_DB_ID;

if (!token || !dbId) {
  console.error('Missing NOTION_TOKEN or NOTION_DB_ID');
  process.exit(1);
}

const payload = JSON.stringify({
  filter: { property: 'Status', select: { equals: 'Live' } },
});

const options = {
  hostname: 'api.notion.com',
  path: `/v1/databases/${dbId}/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const items = (data.results || []).map(page => {
      const p = page.properties;
      const urls = (p.Gallery?.rich_text ?? []).map(r => r.plain_text).join('\n')
                     .split('\n').map(u => u.trim()).filter(Boolean);
      const main = (p['Main Photo']?.number ?? 1) - 1;
      if (main > 0 && main < urls.length) {
        const [picked] = urls.splice(main, 1);
        urls.unshift(picked);
      }
      return {
        id:          page.id,
        name:        p.Name?.title?.[0]?.plain_text ?? '',
        category:    (p.Category?.multi_select ?? []).map(o => o.name),
        brand:       p.ITEM?.rich_text?.[0]?.plain_text ?? '',
        description: p.Description?.rich_text?.[0]?.plain_text ?? '',
        gallery:     urls,
        videoUrl:    p['Video URL']?.url ?? '',
        featured:    p.Featured?.checkbox ?? false,
        sortTime:    p.Year?.number ? new Date(p.Year.number, 0, 1).getTime() : new Date(page.created_time).getTime(),
      };
    });

    items.sort((a, b) => (b.featured - a.featured) || (b.sortTime - a.sortTime));
    items.forEach(item => delete item.sortTime);

    fs.writeFileSync(path.join(__dirname, '..', 'items.json'), JSON.stringify(items, null, 2));
    console.log(`Written ${items.length} items to items.json`);
  });
});

req.on('error', err => { console.error(err); process.exit(1); });
req.write(payload);
req.end();
