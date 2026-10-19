dash.onData(() => {
  const { drawLangs, fillMarks, drawReview, drawGuides, drawCat, drawDay, drawTable } = window.LMT;
  drawLangs();
  fillMarks();
  drawReview();
  drawGuides();
  drawCat();
  drawDay();
  drawTable();
});
