export async function onRequestGet(context) {
  const { NOTION_TOKEN, NOTION_DB_ID } = context.env;

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
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
        brand:       p.ITEM?.rich_text?.[0]?.plain_text ?? '',
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
        videoUrl:    p['Video URL']?.url ?? '',
        featured:    p.Featured?.checkbox ?? false,
      };
    });

    return new Response(JSON.stringify(items), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
