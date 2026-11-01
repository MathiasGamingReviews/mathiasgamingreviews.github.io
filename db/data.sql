-- Readable copy of public/data/mgr.db, rewritten by the edit server after every change.
-- Do not edit by hand. Rebuild the database from this file with: npm run db:restore -- --force

PRAGMA user_version = 3;

CREATE TABLE platform (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE                -- e.g. 'PC', 'Nintendo Switch'
);
CREATE TABLE game (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo TEXT NOT NULL                       -- image path under public/, e.g. 'logos/minecraft.svg'
);
CREATE TABLE review (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,        -- web address of the review: /reviews/<slug>
  game_id     INTEGER NOT NULL REFERENCES game (id),
  platform_id INTEGER NOT NULL REFERENCES platform (id),
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_date TEXT NOT NULL,
  body        TEXT NOT NULL                -- paragraphs separated by a blank line
);
CREATE TABLE news (
  id        INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL,                 -- paragraphs separated by a blank line
  news_date TEXT NOT NULL
);
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
CREATE INDEX review_date_idx ON review (review_date);
CREATE INDEX news_date_idx ON news (news_date);
CREATE INDEX review_screenshot_review_idx ON review_screenshot (review_id, position);
CREATE INDEX review_link_review_idx ON review_link (review_id, position);

-- platform
INSERT INTO platform (id, name) VALUES (1, 'PC');
INSERT INTO platform (id, name) VALUES (2, 'PlayStation 5');
INSERT INTO platform (id, name) VALUES (3, 'Xbox Series X|S');
INSERT INTO platform (id, name) VALUES (4, 'Nintendo Switch');
INSERT INTO platform (id, name) VALUES (5, 'Mobile');
INSERT INTO platform (id, name) VALUES (6, 'Nintendo Switch 2');
INSERT INTO platform (id, name) VALUES (7, 'PlayStation 4');
INSERT INTO platform (id, name) VALUES (8, 'Xbox One');
INSERT INTO platform (id, name) VALUES (9, 'Steam Deck');
INSERT INTO platform (id, name) VALUES (10, 'Mac');
INSERT INTO platform (id, name) VALUES (11, 'Meta Quest (VR)');
INSERT INTO platform (id, name) VALUES (12, 'Browser');

-- game
INSERT INTO game (id, name, logo) VALUES (1, 'Minecraft', 'logos/minecraft.jpg');
INSERT INTO game (id, name, logo) VALUES (2, 'Fortnite', 'logos/fortnite.jpg');
INSERT INTO game (id, name, logo) VALUES (4, 'The Legend of Zelda: Tears of the Kingdom', 'logos/zelda-totk.jpg');
INSERT INTO game (id, name, logo) VALUES (5, 'Mario Kart 8 Deluxe', 'logos/mario-kart-8.jpg');
INSERT INTO game (id, name, logo) VALUES (6, 'Super Mario Bros. Wonder', 'logos/mario-wonder.jpg');
INSERT INTO game (id, name, logo) VALUES (7, 'Hollow Knight', 'logos/hollow-knight.jpg');
INSERT INTO game (id, name, logo) VALUES (8, 'Stardew Valley', 'logos/stardew-valley.jpg');
INSERT INTO game (id, name, logo) VALUES (9, 'Terraria', 'logos/terraria.jpg');
INSERT INTO game (id, name, logo) VALUES (10, 'Among Us', 'logos/among-us.jpg');
INSERT INTO game (id, name, logo) VALUES (11, 'Celeste', 'logos/celeste.jpg');
INSERT INTO game (id, name, logo) VALUES (12, 'Portal 2', 'logos/portal-2.jpg');
INSERT INTO game (id, name, logo) VALUES (15, 'Animal Crossing: New Horizons', 'logos/animal-crossing.jpg');
INSERT INTO game (id, name, logo) VALUES (16, 'Hades', 'logos/hades.png');

-- review
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (1, 'minecraft-pc', 1, 1, 5, '2026-01-12', 'Minecraft is the game I always come back to. You can build anything you can imagine, and survival mode makes every night feel a bit scary.

The best part is playing with friends on a server. We built a whole village with a railway between our houses.

It does not look fancy, but that does not matter at all. A must-play.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (2, 'fortnite-pc', 2, 1, 4, '2026-02-03', 'Fortnite is fast, colourful and really fun with a squad. Building takes a long time to learn, but zero build mode is great if you just want to fight.

The item shop can get expensive, so keep an eye on how much you spend.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (4, 'zelda-tears-of-the-kingdom-switch', 4, 4, 5, '2026-03-09', 'A huge adventure with sky islands, caves and a whole world to explore. The Ultrahand power lets you build cars, planes and crazy machines.

There is so much to do that I keep finding new things after many hours. The best game on the Switch.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (5, 'mario-kart-8-deluxe-switch', 5, 4, 5, '2026-03-28', 'The perfect party game. Lots of tracks, lots of characters and the items keep every race exciting until the finish line.

Smart steering makes it easy for younger players to join in.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (6, 'super-mario-bros-wonder-switch', 6, 4, 4, '2026-04-15', 'Classic side-scrolling Mario with a twist: Wonder Flowers change the level in surprising ways. One turned me into a bouncing ball!

It is quite easy, but really charming and great in co-op.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (7, 'hollow-knight-pc', 7, 1, 5, '2026-05-02', 'A dark and beautiful adventure with a tiny knight in a huge underground kingdom. The boss fights are hard, but fair.

The map is enormous and full of secrets. Not for players who give up easily.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (8, 'stardew-valley-pc', 8, 1, 5, '2026-05-20', 'Farming, fishing, mining and making friends with the people in town. It is the most relaxing game I have played.

Co-op farming with friends is even better.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (9, 'terraria-pc', 9, 1, 4, '2026-06-07', 'Like a 2D Minecraft with way more bosses and items. Digging deeper always leads to something new.

It can be confusing at first, so keep the wiki open.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (10, 'among-us-mobile', 10, 5, 3, '2026-06-25', 'Fun with a group of friends who are good at lying! Playing with strangers is less fun because people leave a lot.

Works well on a phone.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (11, 'celeste-switch', 11, 4, 5, '2026-07-13', 'A tough platformer about climbing a mountain. You will die hundreds of times, but restarting is instant, so it never gets annoying.

The music is fantastic and the story is surprisingly touching.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (12, 'portal-2-pc', 12, 1, 5, '2026-08-01', 'Solve puzzles with a portal gun. The puzzles make you feel clever and the robots are really funny.

Co-op mode is one of the best things to play with a friend.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (15, 'animal-crossing-new-horizons-switch', 15, 4, 4, '2026-09-24', 'Build your own island, catch bugs and fish, and decorate everything. It is slow, but in a nice way.

Best played a little bit every day.');
INSERT INTO review (id, slug, game_id, platform_id, stars, review_date, body) VALUES (16, 'hades-pc', 16, 1, 5, '2026-10-12', 'Escape the underworld again and again. Every run is different and you get stronger each time.

The characters talk to you after every run, so even losing feels like progress.');

-- news
INSERT INTO news (id, title, body, news_date) VALUES (1, 'Welcome to Mathias Gaming Reviews', 'This is the new home for game reviews, cheats, walkthroughs and other fun stuff. Have a look around!', '2026-01-05');
INSERT INTO news (id, title, body, news_date) VALUES (2, 'First reviews are up', 'The first reviews are online. Head over to the Reviews page to see what I thought of them.', '2026-01-12');
INSERT INTO news (id, title, body, news_date) VALUES (3, 'How the star ratings work', 'Every game gets between 1 and 5 stars. 5 stars means you should play it right now. 3 stars means it is fun, but has some problems. 1 star means you should probably skip it.

The stars are my own opinion, so you might disagree, and that is fine!', '2026-02-10');
INSERT INTO news (id, title, body, news_date) VALUES (4, 'Party game month', 'This month is all about games you can play with friends on the same sofa. Expect reviews of racing, party and co-op games.', '2026-03-01');
INSERT INTO news (id, title, body, news_date) VALUES (5, 'Search has been added', 'You can now search for a game or a platform on the Reviews page. Just start typing in the search box and the list updates.', '2026-04-02');
INSERT INTO news (id, title, body, news_date) VALUES (6, 'Summer holiday plans', 'The summer holiday is coming, which means more time for playing and writing. I am planning to review some longer adventure games that are perfect for long summer days, and maybe start a walkthrough series for one of them. Let me know which game you would like to see first.', '2026-06-14');
INSERT INTO news (id, title, body, news_date) VALUES (7, 'Indie game special', 'Small studios make some of the best games. Over the next weeks I will review a few indie favourites that do not get enough attention.', '2026-07-05');
INSERT INTO news (id, title, body, news_date) VALUES (8, 'Back to school', 'School has started again, so new reviews will come out a bit less often. I will still try to post something every couple of weeks.', '2026-08-25');
INSERT INTO news (id, title, body, news_date) VALUES (9, 'Coming soon: walkthroughs', 'Walkthroughs are coming to the site. They will be step-by-step guides that help you get past the hardest parts of a game without spoiling the whole story. The first one will be for a game that has already been reviewed here, so keep an eye on the News page.', '2026-09-15');
INSERT INTO news (id, title, body, news_date) VALUES (10, 'Halloween spooky games', 'Halloween is here! Look out for some spooky (but not too scary) game picks this week.', '2026-10-28');

-- review_screenshot
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (6, 1, 0, 'screenshots/minecraft-pc/1.svg', 'Our village', 'The village we built on our server, with a house for everyone.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (7, 1, 1, 'screenshots/minecraft-pc/2.svg', 'The railway', 'A minecart railway connects all our houses.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (8, 11, 0, 'screenshots/celeste-switch/1.svg', 'Forsaken City', 'The first chapter teaches you to jump, climb and dash.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (9, 11, 1, 'screenshots/celeste-switch/2.svg', 'Collecting strawberries', 'Strawberries are optional, but some are hidden in really tricky places.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (10, 16, 0, 'screenshots/hades-pc/1.svg', 'The House of Hades', 'Where every escape attempt starts. Talk to everyone here between runs.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (11, 16, 1, 'screenshots/hades-pc/2.svg', 'Choosing a boon', 'Gods offer you powers during a run. Picking ones that work together is the key to winning.');
INSERT INTO review_screenshot (id, review_id, position, file, name, description) VALUES (12, 16, 2, 'screenshots/hades-pc/3.svg', 'First boss', 'The first boss fight. Watch for the attack patterns and dash out of the way.');

-- review_link
INSERT INTO review_link (id, review_id, position, url, description) VALUES (5, 1, 0, 'https://www.minecraft.net/', 'Official Minecraft website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (6, 1, 1, 'https://en.wikipedia.org/wiki/Minecraft', 'Minecraft on Wikipedia');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (7, 2, 0, 'https://www.fortnite.com/', 'Official Fortnite website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (8, 4, 0, 'https://zelda.nintendo.com/tears-of-the-kingdom/', 'Official Tears of the Kingdom website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (9, 5, 0, 'https://mariokart8.nintendo.com/', 'Official Mario Kart 8 Deluxe website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (10, 6, 0, 'https://supermariobroswonder.nintendo.com/', 'Official Super Mario Bros. Wonder website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (11, 7, 0, 'https://www.hollowknight.com/', 'Official Hollow Knight website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (12, 8, 0, 'https://www.stardewvalley.net/', 'Official Stardew Valley website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (13, 9, 0, 'https://terraria.org/', 'Official Terraria website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (14, 10, 0, 'https://www.innersloth.com/games/among-us/', 'Official Among Us website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (15, 11, 0, 'https://www.celestegame.com/', 'Official Celeste website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (16, 11, 1, 'https://en.wikipedia.org/wiki/Celeste_(video_game)', 'Celeste on Wikipedia');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (17, 12, 0, 'https://www.thinkwithportals.com/', 'Official Portal 2 website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (18, 15, 0, 'https://animalcrossing.nintendo.com/new-horizons/', 'Official Animal Crossing: New Horizons website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (19, 16, 0, 'https://www.supergiantgames.com/games/hades/', 'Official Hades website');
INSERT INTO review_link (id, review_id, position, url, description) VALUES (20, 16, 1, 'https://en.wikipedia.org/wiki/Hades_(video_game)', 'Hades on Wikipedia');
