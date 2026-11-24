import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEOMETRY_CANVAS_HEIGHT,
  GEOMETRY_CANVAS_WIDTH,
  GEOMETRY_TEMPLATES,
  generateGeometryExercise,
  isGeometryExercise,
} from './geometryGenerator';
import { gradeExercise } from './mathPlatform';

test('generateGeometryExercise produces valid figures and auto-gradable questions for all 5 3AM templates', () => {
  for (const tpl of GEOMETRY_TEMPLATES) {
    const ex = generateGeometryExercise(tpl.key, 1);

    assert.equal(ex.category, 'geometry');
    assert.ok(ex.title.length >= 4);
    assert.ok(ex.chapter.length >= 4);
    assert.equal(ex.geometryData.templateKey, tpl.key);
    assert.equal(ex.geometryData.canvasWidth, GEOMETRY_CANVAS_WIDTH);
    assert.equal(ex.geometryData.canvasHeight, GEOMETRY_CANVAS_HEIGHT);
    assert.ok(ex.geometryData.baseShapes.length >= 4, `${tpl.key} should have base shapes`);
    assert.ok(
      ex.geometryData.teacherCorrectionShapes.length >= 1,
      `${tpl.key} should have teacher correction drawing shapes`
    );
    assert.ok(
      ex.geometryData.teacherCorrectionText.trim().length > 10,
      `${tpl.key} should have teacher written correction`
    );
    assert.ok(ex.questions.length >= 2);
    assert.equal(isGeometryExercise(ex), true);

    // Every generated coordinate stays cleanly inside canvas bounds
    for (const s of [...ex.geometryData.baseShapes, ...ex.geometryData.teacherCorrectionShapes]) {
      if (s.kind === 'segment') {
        assert.ok(s.x1 >= 0 && s.x1 <= GEOMETRY_CANVAS_WIDTH);
        assert.ok(s.x2 >= 0 && s.x2 <= GEOMETRY_CANVAS_WIDTH);
        assert.ok(s.y1 >= 0 && s.y1 <= GEOMETRY_CANVAS_HEIGHT);
        assert.ok(s.y2 >= 0 && s.y2 <= GEOMETRY_CANVAS_HEIGHT);
      } else if (s.kind === 'point') {
        assert.ok(s.x >= 0 && s.x <= GEOMETRY_CANVAS_WIDTH);
        assert.ok(s.y >= 0 && s.y <= GEOMETRY_CANVAS_HEIGHT);
      }
    }

    // Perfect answers produce 20/20
    const perfectAnswers: Record<string, number | string> = {};
    for (const q of ex.questions) {
      perfectAnswers[q.id] = q.type === 'choice' ? q.correctChoiceIndex! : q.correctNumber!;
    }
    const graded = gradeExercise(ex.questions, perfectAnswers);
    assert.equal(graded.outOf20, 20, `${tpl.key} perfect answers should score 20/20`);
  }
});

test('pythagoras generator variant seed produces valid right triangle triples', () => {
  const ex0 = generateGeometryExercise('pythagoras', 0); // 3,4,5
  const ex1 = generateGeometryExercise('pythagoras', 1); // 6,8,10
  assert.notEqual(ex0.title, ex1.title);
  assert.equal(ex0.questions[0].correctNumber, 5);
  assert.equal(ex1.questions[0].correctNumber, 10);
});
