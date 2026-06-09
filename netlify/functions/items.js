exports.handler = async () => {
  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DB_ID;

  if (!token || !dbId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing env vars' }) };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'Status', select: { equals: 'Live' } },
        sorts: [
          { property: 'Featured', direction: 'descending' },
          { timestamp: 'created_time', direction: 'descending' },
        ],
      }),
    });

    const data = await res.json();

    const items = (data.results || []).map(page => {
      const p = page.properties;
      return {
        id:          page.id,
        name:        p.Name?.title?.[0]?.plain_text ?? '',
        category:    (p.Category?.multi_select ?? []).map(o => o.name),
        brand:       p.Brand?.rich_text?.[0]?.plain_text ?? '',
        description: p.Description?.rich_text?.[0]?.plain_text ?? '',
        gallery:     (() => {
          const urls = (p.Gallery?.rich_text ?? []).map(r => r.plain_text).join('\n')
                         .split('\n').map(u => u.trim()).filter(Boolean);
          const main = (p['Main Photo']?.number ?? 1) - 1;
          if (main > 0 && main < urls.length) {
            const [picked] = urls.splice(main, 1);
            urls.unshift(picked);
          }
          return urls;
        })(),
        featured:    p.Featured?.checkbox ?? false,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify(items),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
