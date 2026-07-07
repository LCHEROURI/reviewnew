const SUPERHUMAN1 = Object.freeze({
  sender: 'superhuman@mail.joinsuperhuman.ai',
  start: new Date('2025-12-01T00:00:00'),
  endExclusive: new Date('2026-06-12T00:00:00'),
  sheetName: 'Superhuman1 Prompt Library',
  query:
    'from:superhuman@mail.joinsuperhuman.ai after:2025/11/30 before:2026/06/12 in:anywhere -in:spam -in:trash',
});

function runSuperhuman1() {
  const spreadsheet = SpreadsheetApp.create(SUPERHUMAN1.sheetName);
  const promptsSheet = spreadsheet.getSheets()[0];
  promptsSheet.setName('Prompts');
  const logSheet = spreadsheet.insertSheet('Run Log');

  const promptHeaders = [
    'Prompt ID', 'Prompt Title', 'Prompt Verbatim', 'Primary Category',
    'Secondary Tags', 'AI Tool / Model', 'Prompt Type', 'Newsletter Date',
    'Newsletter Subject', 'Newsletter Sender', 'Source Attribution',
    'Gmail Message ID', 'Gmail Source URL', 'Extraction Status', 'Confidence',
    'Extraction Notes', 'Processed At'
  ];
  const logHeaders = [
    'Newsletter Date', 'Newsletter Subject', 'Sender', 'Gmail Message ID',
    'Status', 'Prompts Found', 'Notes', 'Processed At'
  ];

  promptsSheet.getRange(1, 1, 1, promptHeaders.length).setValues([promptHeaders]);
  logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);

  const threads = GmailApp.search(SUPERHUMAN1.query, 0, 500);
  const messages = threads
    .flatMap(thread => thread.getMessages())
    .filter(message => {
      const date = message.getDate();
      return date >= SUPERHUMAN1.start && date < SUPERHUMAN1.endExclusive;
    })
    .sort((a, b) => a.getDate() - b.getDate());

  const promptRows = [];
  const logRows = [];
  let newslettersWithPrompts = 0;
  let rejectedSenders = 0;

  messages.forEach(message => {
    const processedAt = new Date();
    const sender = extractEmailAddress_(message.getFrom());
    const date = message.getDate();
    const subject = message.getSubject();
    const messageId = message.getId();

    if (sender !== SUPERHUMAN1.sender) {
      rejectedSenders++;
      logRows.push([
        date, subject, sender, messageId, 'Rejected', 0,
        'Actual sender address did not exactly match the approved sender.',
        processedAt
      ]);
      return;
    }

    try {
      const body = normalizeText_(message.getPlainBody());
      const prompts = extractPrompts_(body);
      if (prompts.length) newslettersWithPrompts++;

      prompts.forEach((item, index) => {
        const classification = classifyPrompt_(item.title, item.prompt, item.model);
        const idDate = Utilities.formatDate(
          date,
          Session.getScriptTimeZone(),
          'yyyyMMdd'
        );
        promptRows.push([
          `SH-${idDate}-${String(index + 1).padStart(2, '0')}`,
          item.title,
          item.prompt,
          classification.category,
          classification.tags.join(', '),
          item.model,
          classification.type,
          date,
          subject,
          sender,
          item.source,
          messageId,
          `https://mail.google.com/mail/#all/${messageId}`,
          item.needsReview ? 'Needs Review' : 'Verified',
          item.needsReview ? 'Medium' : 'High',
          item.notes,
          processedAt
        ]);
      });

      logRows.push([
        date, subject, sender, messageId, 'Processed', prompts.length,
        prompts.length ? '' : 'No explicitly labeled prompt found.',
        processedAt
      ]);
    } catch (error) {
      logRows.push([
        date, subject, sender, messageId, 'Failed', 0,
        String(error && error.message ? error.message : error),
        processedAt
      ]);
    }
  });

  if (promptRows.length) {
    promptsSheet.getRange(2, 1, promptRows.length, promptHeaders.length)
      .setValues(promptRows);
  }
  if (logRows.length) {
    logSheet.getRange(2, 1, logRows.length, logHeaders.length)
      .setValues(logRows);
  }

  formatSheet_(promptsSheet, promptHeaders.length, true);
  formatSheet_(logSheet, logHeaders.length, false);

  const summary = spreadsheet.insertSheet('Summary', 0);
  const failed = logRows.filter(row => row[4] === 'Failed').length;
  const needsReview = promptRows.filter(row => row[13] === 'Needs Review').length;
  summary.getRange('A1:B10').setValues([
    ['Superhuman1 Run Summary', ''],
    ['Google Sheet', spreadsheet.getUrl()],
    ['Date range', 'December 1, 2025 through June 11, 2026'],
    ['Exact sender', SUPERHUMAN1.sender],
    ['Newsletters checked', logRows.length],
    ['Newsletters with prompts', newslettersWithPrompts],
    ['Prompts saved', promptRows.length],
    ['Rejected sender mismatches', rejectedSenders],
    ['Needs review', needsReview],
    ['Failures', failed],
  ]);
  summary.getRange('A1:B1').setBackground('#202124').setFontColor('#ffffff')
    .setFontWeight('bold');
  summary.getRange('A1:A10').setFontWeight('bold');
  summary.setColumnWidth(1, 220);
  summary.setColumnWidth(2, 520);
  summary.setFrozenRows(1);

  console.log(JSON.stringify({
    spreadsheetUrl: spreadsheet.getUrl(),
    newslettersChecked: logRows.length,
    newslettersWithPrompts,
    promptsSaved: promptRows.length,
    needsReview,
    failed,
    rejectedSenders
  }));
}

function extractEmailAddress_(fromValue) {
  const angleMatch = String(fromValue).match(/<([^>]+)>/);
  const candidate = angleMatch ? angleMatch[1] : fromValue;
  const emailMatch = String(candidate).toLowerCase()
    .match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  return emailMatch ? emailMatch[0] : '';
}

function normalizeText_(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function extractPrompts_(body) {
  const stationIndex = body.lastIndexOf('PROMPT STATION');
  if (stationIndex < 0) return extractLabeledPrompts_(body, true);

  let section = body.slice(stationIndex + 'PROMPT STATION'.length);
  const endMarkers = [
    '\nWhenever you’re ready', '\nWhenever you\'re ready',
    '\nIN CASE YOU MISSED IT', '\nWhat did you think of today',
    '\nUntil next time'
  ];
  let end = section.length;
  endMarkers.forEach(marker => {
    const index = section.indexOf(marker);
    if (index >= 0 && index < end) end = index;
  });
  section = section.slice(0, end).trim();
  return extractLabeledPrompts_(section, false);
}

function extractLabeledPrompts_(section, conservative) {
  const labelPattern =
    /^(?:(ChatGPT|Claude|Gemini|Midjourney|DALL-E|DALL·E|Sora|Veo|Runway|Flux|Ideogram|Image|Video)\s+)?Prompt:\s*/gim;
  const matches = Array.from(section.matchAll(labelPattern));
  const results = [];

  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const nextStart = index + 1 < matches.length ? matches[index + 1].index : section.length;
    let block = section.slice(start, nextStart).trim();
    const boundary = findPromptBoundary_(block);
    if (boundary >= 0) block = block.slice(0, boundary).trim();
    if (!block || block.length < 12) return;

    const before = section.slice(0, match.index).trim();
    const titleLines = before.split('\n').map(line => line.trim()).filter(Boolean);
    const title = titleLines.length ? titleLines[titleLines.length - 1] : 'Untitled Prompt';
    const sourceMatch = block.match(/\nSource:\s*([^\n]+)\s*$/i);
    const source = sourceMatch ? sourceMatch[1].trim() : '';
    if (sourceMatch) block = block.slice(0, sourceMatch.index).trim();

    results.push({
      title: cleanTitle_(title),
      prompt: block,
      model: match[1] || inferModel_(match[0], title),
      source,
      needsReview: conservative,
      notes: conservative
        ? 'Prompt was found outside a PROMPT STATION section; verify its boundaries.'
        : ''
    });
  });

  return results;
}

function findPromptBoundary_(block) {
  const boundaries = [
    /\nSource:\s*[^\n]+\n\n/i,
    /\nPro Tip:/i,
    /\nWhenever you(?:’|')re ready/i,
    /\n[A-Z][A-Z &]{5,}\n/
  ];
  let result = -1;
  boundaries.forEach(pattern => {
    const match = block.match(pattern);
    if (match && (result < 0 || match.index < result)) result = match.index;
  });
  return result;
}

function cleanTitle_(title) {
  return String(title)
    .replace(/^[-*•\s]+/, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
    .trim()
    .slice(0, 180) || 'Untitled Prompt';
}

function inferModel_(label, title) {
  const text = `${label} ${title}`.toLowerCase();
  if (text.includes('midjourney')) return 'Midjourney';
  if (text.includes('image')) return 'Image model';
  if (text.includes('video')) return 'Video model';
  return '';
}

function classifyPrompt_(title, prompt, model) {
  const text = `${title}\n${prompt}\n${model}`.toLowerCase();
  const rules = [
    ['Visual & Media Generation', 'Image', ['image generation', 'visual design'],
      /image|midjourney|dall|photo|poster|logo|illustration|cinematic|render|style raw/],
    ['Visual & Media Generation', 'Video', ['video generation', 'creative media'],
      /video|sora|veo|runway|camera movement|shot list/],
    ['AI Agents & Automation', 'Agent / Automation', ['agents', 'workflow automation'],
      /agent|automation|automate|workflow|autonomous/],
    ['Testing & QA', 'Coding', ['testing', 'quality assurance'],
      /test case|unit test|integration test|quality assurance|\bqa\b/],
    ['Debugging & Code Review', 'Coding', ['debugging', 'code review'],
      /debug|code review|refactor|bug|stack trace|error message/],
    ['Security & Privacy', 'Analysis', ['security', 'privacy'],
      /security|privacy|vulnerabil|threat model|penetration/],
    ['DevOps & Deployment', 'Coding', ['deployment', 'infrastructure'],
      /deploy|devops|docker|kubernetes|ci\/cd|cloud infrastructure/],
    ['Databases & Data Engineering', 'Coding', ['databases', 'data engineering'],
      /database|sql|schema|data pipeline|postgres|warehouse/],
    ['Backend & API Development', 'Coding', ['backend', 'api development'],
      /backend|\bapi\b|server|endpoint|authentication|webhook/],
    ['Frontend Development', 'Coding', ['frontend', 'web development'],
      /frontend|react|next\.js|javascript|typescript|html|css|website|landing page/],
    ['UI/UX & Design Systems', 'Text / General', ['user experience', 'product design'],
      /\bui\b|\bux\b|user experience|wireframe|design system|interface/],
    ['Product Strategy & Requirements', 'Business / Strategy', ['product strategy', 'requirements'],
      /product requirement|\bprd\b|user stor|roadmap|feature priorit|product strategy/],
    ['Analytics, Growth & Marketing', 'Business / Strategy', ['marketing', 'growth'],
      /marketing|seo|growth|conversion|campaign|customer acquisition|social media/],
    ['Research & Learning', 'Research', ['research', 'learning'],
      /research|learn|teach|tutor|study|explain|analy[sz]e/],
    ['Content & Communication', 'Writing / Communication', ['writing', 'communication'],
      /write|email|newsletter|article|blog|copywriting|resume|linkedin|communication/],
    ['Business & Productivity', 'Business / Strategy', ['business', 'productivity'],
      /business|strategy|meeting|schedule|career|hiring|finance|consultant/],
  ];

  for (const [category, type, tags, pattern] of rules) {
    if (pattern.test(text)) return {category, type, tags};
  }
  return {
    category: 'Business & Productivity',
    type: 'Text / General',
    tags: ['general prompt', 'productivity']
  };
}

function formatSheet_(sheet, columnCount, wrapPromptColumn) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setBackground('#f1f3f4')
    .setFontColor('#202124')
    .setFontWeight('bold');
  sheet.getRange(1, 1, lastRow, columnCount)
    .setVerticalAlignment('top');
  if (lastRow > 1) {
    sheet.getRange(1, 1, lastRow, columnCount).createFilter();
  }
  if (wrapPromptColumn) {
    sheet.getRange(2, 3, Math.max(lastRow - 1, 1), 1).setWrap(true);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 620);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 220);
    sheet.setColumnWidth(9, 300);
    sheet.setColumnWidth(13, 280);
  } else {
    sheet.setColumnWidth(2, 360);
    sheet.setColumnWidth(7, 420);
  }
}
