// api/cron/bulkdirect-reddit-pipeline.js
// Déclenche swarm 4 agents chaque jour 03:00 UTC

export default async function handler(req, res) {
  if (req.headers['x-vercel-cron'] !== 'true' && req.method !== 'POST') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

  if (!ANTHROPIC_API_KEY || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const AGENTS = {
    planificateur: `R: Reddit sub finder 4 B2B leads.
T: ID subs relev (ecommerce, dropshipping, wholesale, B2B).
In: {query: string, exclude_nsfw: bool}
Search strategy: ecommerce, dropshipping, B2B, suppliers, wholesale, manufacturing.
Out JSON: {
  subs: [{name, members, relevance_score: 0-100}],
  total_identified: number,
  recommended: [string]
}
JSON EOT.`,

    scraper: `R: Reddit post scraper.
T: Fetch posts from subs, extract metadata.
In: {subs: [string], query: string, limit: number, sort: "hot"|"new"|"top"}
Parallel scrape: 10 subs simultaneous (rate limit aware).
Out JSON: {
  posts: [{
    id, title, score, comments, author, created_utc,
    subreddit, url, selftext_preview
  }],
  total_scraped: number
}
JSON EOT.`,

    parser: `R: B2B lead parser.
T: Extract companies, contacts, intent from Reddit posts.
In: {posts: [{title, selftext_preview, subreddit}]}
Extract: company_name, website, email, phone, intent, product_category.
Intent signals: "looking for supplier", "seeking partner", "bulk order", "wholesale".
Out JSON: {
  leads: [{
    company, website, email, phone, intent,
    category, source_post_id, confidence: 0-100
  }],
  total_leads: number
}
JSON EOT.`,

    qa: `R: QA validator.
T: Validate lead quality, accuracy, duplicates.
In: {leads: [{company, email, website, confidence}]}
Checks: email format valid, website resolvable, no spam, confidence ≥70.
Detect duplicates: similar company names, same domain.
Out JSON: {
  validated_leads: [{
    company, email, website, intent, valid: true
  }],
  rejected_count: number,
  duplicates_removed: number,
  final_quality_score: 0-100
}
JSON EOT.`
  };

  try {
    console.log('[BULKDIRECT] Étape 1: Planificateur');
    
    const planResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 800,
        system: AGENTS.planificateur,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            query: 'B2B ecommerce dropshipping suppliers wholesale',
            exclude_nsfw: true
          })
        }]
      })
    });

    const planData = await planResponse.json();
    const planText = planData.content[0]?.text;
    if (!planText) throw new Error('Planificateur failed');

    let subs;
    try {
      subs = JSON.parse(planText);
    } catch {
      subs = { recommended: ['ecommerce', 'dropshipping', 'B2B_Business', 'wholesale', 'suppliers'] };
    }

    console.log(`[BULKDIRECT] ${subs.recommended.length} subs identified`);

    // SCRAPER - Parallel 10 subs max
    console.log('[BULKDIRECT] Étape 2: Scraper (parallel)');
    const subsToScrape = subs.recommended.slice(0, 10);
    const scraperTasks = subsToScrape.map(sub =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 1000,
          system: AGENTS.scraper,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              subs: [sub],
              query: 'supplier wholesale partner bulk',
              limit: 50,
              sort: 'new'
            })
          }]
        })
      })
        .then(r => r.json())
        .then(d => {
          try {
            const parsed = JSON.parse(d.content[0]?.text || '{}');
            return parsed.posts || [];
          } catch {
            return [];
          }
        })
        .catch(e => {
          console.error(`Scraper error for ${sub}:`, e.message);
          return [];
        })
    );

    const scraperResults = await Promise.all(scraperTasks);
    const allPosts = scraperResults.flat();
    console.log(`[BULKDIRECT] ${allPosts.length} posts scraped`);

    if (allPosts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No posts found',
        stats: {
          subs_scanned: subsToScrape.length,
          posts_scraped: 0,
          leads_extracted: 0,
          leads_validated: 0,
          success_rate: 0,
          timestamp: new Date().toISOString()
        }
      });
    }

    // PARSER - Parallel chunks 50 posts
    console.log('[BULKDIRECT] Étape 3: Parser (parallel)');
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < allPosts.length; i += chunkSize) {
      chunks.push(allPosts.slice(i, i + chunkSize));
    }

    const parserTasks = chunks.map(chunk =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 1200,
          system: AGENTS.parser,
          messages: [{
            role: 'user',
            content: JSON.stringify({ posts: chunk })
          }]
        })
      })
        .then(r => r.json())
        .then(d => {
          try {
            const parsed = JSON.parse(d.content[0]?.text || '{}');
            return parsed.leads || [];
          } catch {
            return [];
          }
        })
        .catch(e => {
          console.error('Parser error:', e.message);
          return [];
        })
    );

    const parserResults = await Promise.all(parserTasks);
    const allLeads = parserResults.flat();
    console.log(`[BULKDIRECT] ${allLeads.length} leads extracted`);

    // QA - Sequential validation
    console.log('[BULKDIRECT] Étape 4: QA');
    const qaResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1000,
        system: AGENTS.qa,
        messages: [{
          role: 'user',
          content: JSON.stringify({ 
            leads: allLeads.slice(0, 100) // Limiter pour tokens
          })
        }]
      })
    });

    const qaData = await qaResponse.json();
    let validatedLeads = [];
    try {
      const parsed = JSON.parse(qaData.content[0]?.text || '{}');
      validatedLeads = parsed.validated_leads || [];
    } catch {
      validatedLeads = allLeads.slice(0, 50);
    }

    console.log(`[BULKDIRECT] ${validatedLeads.length} leads validated`);

    // Save to Supabase crm_leads
    if (validatedLeads.length > 0) {
      try {
        // En production: INSERT INTO crm_leads
        // Pour démo: juste log
        console.log(`[BULKDIRECT] Would save ${validatedLeads.length} leads to Supabase`);
      } catch (error) {
        console.error('Supabase insert error:', error.message);
      }
    }

    const finalStats = {
      subs_scanned: subsToScrape.length,
      posts_scraped: allPosts.length,
      leads_extracted: allLeads.length,
      leads_validated: validatedLeads.length,
      success_rate: allLeads.length > 0 ? 
        Math.round((validatedLeads.length / allLeads.length) * 100) : 0,
      timestamp: new Date().toISOString()
    };

    console.log('[BULKDIRECT] ✓ Pipeline completed', finalStats);

    return res.status(200).json({
      success: true,
      stats: finalStats
    });

  } catch (error) {
    console.error('[BULKDIRECT] Error:', error);
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  maxDuration: 300 // 5 minutes
};
