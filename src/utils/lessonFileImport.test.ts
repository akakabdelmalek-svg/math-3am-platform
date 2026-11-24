import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLessonFileKind,
  extractTextFromDocxXml,
  extractTextFromPptxSlideXml,
  formatFileSizeArabic,
  splitDataUrlChunks,
} from './lessonFileImport.ts';

test('detectLessonFileKind classifies JPG, DOCX, PDF, and PPTX files accurately', () => {
  assert.equal(detectLessonFileKind('lesson_board.jpg', 'image/jpeg'), 'image');
  assert.equal(detectLessonFileKind('diagram.PNG', 'image/png'), 'image');
  assert.equal(detectLessonFileKind('summary.pdf', 'application/pdf'), 'pdf');
  assert.equal(detectLessonFileKind('cours_3am.docx'), 'word');
  assert.equal(detectLessonFileKind('fiche.doc', 'application/msword'), 'word');
  assert.equal(detectLessonFileKind('slides.pptx'), 'powerpoint');
  assert.equal(detectLessonFileKind('presentation.ppt'), 'powerpoint');
  assert.equal(detectLessonFileKind('archive.zip'), 'other');
});

test('extractTextFromDocxXml and extractTextFromPptxSlideXml extract Arabic and math text', () => {
  const docxXml = `
    <w:document><w:body>
      <w:p><w:r><w:t>الدرس الأول: </w:t></w:r><w:r><w:t>الأعداد النسبية</w:t></w:r></w:p>
      <w:p><w:r><w:t>a &lt; b &amp; c &gt; 0</w:t></w:r></w:p>
    </w:body></w:document>
  `;
  assert.equal(
    extractTextFromDocxXml(docxXml),
    'الدرس الأول: الأعداد النسبية\na < b & c > 0'
  );

  const pptxXml = `
    <p:sld><p:cSld><p:spTree><p:sp><p:txBody>
      <a:p><a:r><a:t>نظرية فيثاغورس</a:t></a:r></a:p>
      <a:p><a:r><a:t>BC^2 = AB^2 + AC^2</a:t></a:r></a:p>
    </p:txBody></p:sp></p:spTree></p:cSld></p:sld>
  `;
  assert.equal(
    extractTextFromPptxSlideXml(pptxXml),
    'نظرية فيثاغورس\nBC^2 = AB^2 + AC^2'
  );
});

test('formatFileSizeArabic and splitDataUrlChunks work reliably', () => {
  assert.equal(formatFileSizeArabic(512), '512 بايت');
  assert.equal(formatFileSizeArabic(24576), '24 ك.ب');
  assert.equal(formatFileSizeArabic(1572864), '1.5 م.ب');

  const chunks = splitDataUrlChunks('abcdefghij', 4);
  assert.deepEqual(chunks, ['abcd', 'efgh', 'ij']);
  assert.equal(chunks.join(''), 'abcdefghij');
});
