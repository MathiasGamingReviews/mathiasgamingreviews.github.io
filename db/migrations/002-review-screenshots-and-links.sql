-- Screenshots and links for a review.

CREATE TABLE review_screenshot (
  id          INTEGER PRIMARY KEY,
  review_id   INTEGER NOT NULL REFERENCES review (id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,  -- display order, lowest first
  file        TEXT NOT NULL,               -- image path under public/, e.g. 'screenshots/hades-pc/boss.png'
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE review_link (
  id          INTEGER PRIMARY KEY,
  review_id   INTEGER NOT NULL REFERENCES review (id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,  -- display order, lowest first
  url         TEXT NOT NULL CHECK (url LIKE 'http://%' OR url LIKE 'https://%'),
  description TEXT NOT NULL
);

CREATE INDEX review_screenshot_review_idx ON review_screenshot (review_id, position);
CREATE INDEX review_link_review_idx ON review_link (review_id, position);
