// ============================================================
//   pdfmake 导出 — 将简历数据渲染为可搜索的 2 页 PDF
// ============================================================

/* 初始化：加载自定义中文字体并注册到 pdfMake */
function initPdfMakeFont() {
  if (typeof pdfMake === 'undefined') return Promise.reject('pdfmake not loaded');
  return Promise.all([
    fetch('./NotoSansSC-Regular.subset.ttf').then(function (r) { return r.arrayBuffer(); }),
    fetch('./NotoSansSC-Bold.subset.ttf').then(function (r) { return r.arrayBuffer(); })
  ]).then(function (bufs) {
    pdfMake.vfs = {};
    pdfMake.vfs['NotoSansSC-Regular.subset.ttf'] = arrayBufferToBase64(bufs[0]);
    pdfMake.vfs['NotoSansSC-Bold.subset.ttf']   = arrayBufferToBase64(bufs[1]);
    pdfMake.fonts = {
      noto: {
        normal: 'NotoSansSC-Regular.subset.ttf',
        bold:   'NotoSansSC-Bold.subset.ttf'
      }
    };
  });
}

function arrayBufferToBase64(buf) {
  var binary = '';
  var bytes = new Uint8Array(buf);
  for (var i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/* 构建 pdfmake 文档定义 */
function buildPdfDef(d) {
  var p = d.profile || {};
  var secs = d.sections || [];

  /* ---------- 工具函数 ---------- */
  function text(t, style) {
    return typeof t === 'string' ? { text: t, style: style } : t;
  }

  function sectionTitle(title) {
    return [
      { text: title, style: 'sectionTitle' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 510, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }] },
      { text: '', margin: [0, 2, 0, 0] }
    ];
  }

  /* ---------- 头部 ---------- */
  var headerStack = [];

  // 第一行：姓名 + 头像（右侧可以用空 column 占位）
  headerStack.push({
    columns: [
      { width: '*', stack: [
        { text: p.name || '', style: 'name' },
        p.title ? { text: p.title, style: 'subtitle', margin: [0, 2, 0, 0] } : null
      ].filter(Boolean) },
    ]
  });

  // 联系信息
  var contactItems = [];
  if (p.phone) contactItems.push('📞 ' + p.phone);
  if (p.email) contactItems.push('✉ ' + p.email);
  if (p.所在地) contactItems.push('📍 ' + p.所在地);
  if (p.gender && p.age) contactItems.push(p.gender + ' / ' + p.age + '岁');
  if (p.experience) contactItems.push('💼 ' + p.experience);

  if (contactItems.length) {
    headerStack.push({
      text: contactItems.join('    '),
      style: 'contact',
      margin: [0, 6, 0, 0]
    });
  }

  // 时间轴
  if (p.timeline) {
    headerStack.push({
      text: p.timeline,
      style: 'timeline',
      margin: [0, 6, 0, 0]
    });
  }

  var content = [
    { stack: headerStack, margin: [0, 0, 0, 6] },
    // 分隔线
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 510, y2: 0, lineWidth: 1, lineColor: '#94a3b8' }] },
    { text: '', margin: [0, 2, 0, 0] }
  ];

  /* ---------- Section 内容 ---------- */
  secs.forEach(function (s) {
    if (!s.items || !s.items.length) return;

    content = content.concat(sectionTitle(s.title));

    if (s.type === 'education') {
      s.items.forEach(function (item) {
        content.push({
          columns: [
            { width: '*', stack: [
              { text: (item.school || '') + ' · ' + (item.major || ''), style: 'itemTitle' },
              item.degree ? { text: item.degree, style: 'itemMeta' } : null,
              item.courses ? { text: '课程：' + item.courses, style: 'itemMeta' } : null
            ].filter(Boolean) },
            { width: 'auto', text: item.period || '', style: 'itemDate', alignment: 'right' }
          ],
          margin: [0, 4, 0, 2]
        });
      });
    } else if (s.type === 'experience') {
      s.items.forEach(function (item) {
        content.push({
          columns: [
            { width: '*', stack: [
              { text: (item.company || '') + ' · ' + (item.position || ''), style: 'itemTitle' },
              item.summary ? { text: item.summary, style: 'itemSummary', margin: [0, 1, 0, 0] } : null,
            ].filter(Boolean) },
            { width: 'auto', text: item.period || '', style: 'itemDate', alignment: 'right' }
          ],
          margin: [0, 4, 0, 2]
        });
        if (item.highlights && item.highlights.length) {
          var ul = item.highlights.map(function (h) { return { text: h || '', style: 'itemBullet' }; });
          content.push({ ul: ul, margin: [8, 0, 0, 2] });
        }
      });
    } else if (s.type === 'skills') {
      // 每行 2 个技能
      var row = [];
      s.items.forEach(function (item, i) {
        row.push({
          width: '50%',
          stack: [
            { text: (item.name || ''), style: 'skillName' },
            { text: (item.detail || ''), style: 'skillDetail' }
          ],
          margin: [0, 2, 0, 2]
        });
        if (row.length === 2 || i === s.items.length - 1) {
          content.push({ columns: row, margin: [0, 2, 0, 0] });
          row = [];
        }
      });
    } else if (s.type === 'projects') {
      s.items.forEach(function (item) {
        var tags = item.tags || [];
        content.push({
          columns: [
            { width: '*', stack: [
              { text: item.name || '', style: 'itemTitle' },
              item.summary ? { text: item.summary, style: 'itemSummary' } : null,
              tags.length ? { text: tags.join('  ·  '), style: 'itemTags', margin: [0, 1, 0, 0] } : null
            ].filter(Boolean) },
            { width: 'auto', text: item.period || '', style: 'itemDate', alignment: 'right' }
          ],
          margin: [0, 4, 0, 2]
        });
        if (item.highlights && item.highlights.length) {
          var ul = item.highlights.map(function (h) { return { text: h || '', style: 'itemBullet' }; });
          content.push({ ul: ul, margin: [8, 0, 0, 2] });
        }
      });
    } else if (s.type === 'summary') {
      s.items.forEach(function (item) {
        content.push({ text: item || '', style: 'summary', margin: [0, 2, 0, 2] });
      });
    }
  });

  /* ---------- 文档定义 ---------- */
  return {
    pageSize: 'A4',
    pageMargins: [50, 40, 50, 40],
    defaultStyle: {
      font: 'noto',
      fontSize: 9.5,
      color: '#334155',
      lineHeight: 1.45
    },
    styles: {
      name:       { fontSize: 22, bold: true, color: '#1e293b' },
      subtitle:   { fontSize: 12, color: '#64748b' },
      contact:    { fontSize: 8.5, color: '#64748b' },
      timeline:   { fontSize: 8.5, color: '#94a3b8', italics: true },
      sectionTitle: { fontSize: 13, bold: true, color: '#1e293b', margin: [0, 8, 0, 4] },
      itemTitle:  { fontSize: 10.5, bold: true, color: '#1e293b' },
      itemMeta:   { fontSize: 9, color: '#64748b', margin: [0, 1, 0, 0] },
      itemDate:   { fontSize: 9, color: '#94a3b8', italics: true },
      itemSummary:{ fontSize: 9, color: '#475569', margin: [0, 1, 0, 0] },
      itemBullet: { fontSize: 9, color: '#334155', margin: [0, 0, 0, 1] },
      itemTags:   { fontSize: 8.5, color: '#64748b', italics: true },
      skillName:  { fontSize: 10, bold: true, color: '#1e293b' },
      skillDetail:{ fontSize: 9, color: '#475569', margin: [0, 1, 0, 0] },
      summary:    { fontSize: 9.5, color: '#334155' }
    },
    content: content
  };
}

/* 导出函数 */
function exportPdfPdfMake() {
  if (typeof pdfMake === 'undefined') { alert('pdfmake 尚未加载'); return; }
  var name = (cvData && cvData.profile && cvData.profile.name ? cvData.profile.name : '简历') + '.pdf';
  pdfMake.createPdf(buildPdfDef(cvData)).download(name);
}
