-- Sample content so every page has something to show.
-- Replace with real reviews and news before publishing.

INSERT INTO platform (id, name) VALUES
  (1, 'PC'),
  (2, 'PlayStation 5'),
  (3, 'Xbox Series X|S'),
  (4, 'Nintendo Switch'),
  (5, 'Mobile');

INSERT INTO game (id, name, logo) VALUES
  (1,  'Minecraft',                                 'logos/minecraft.svg'),
  (2,  'Fortnite',                                  'logos/fortnite.svg'),
  (3,  'Rocket League',                             'logos/rocket-league.svg'),
  (4,  'The Legend of Zelda: Tears of the Kingdom', 'logos/zelda-totk.svg'),
  (5,  'Mario Kart 8 Deluxe',                       'logos/mario-kart-8.svg'),
  (6,  'Super Mario Bros. Wonder',                  'logos/mario-wonder.svg'),
  (7,  'Hollow Knight',                             'logos/hollow-knight.svg'),
  (8,  'Stardew Valley',                            'logos/stardew-valley.svg'),
  (9,  'Terraria',                                  'logos/terraria.svg'),
  (10, 'Among Us',                                  'logos/among-us.svg'),
  (11, 'Celeste',                                   'logos/celeste.svg'),
  (12, 'Portal 2',                                  'logos/portal-2.svg'),
  (13, 'Forza Horizon 5',                           'logos/forza-horizon-5.svg'),
  (14, 'Marvel''s Spider-Man 2',                    'logos/spider-man-2.svg'),
  (15, 'Animal Crossing: New Horizons',             'logos/animal-crossing.svg'),
  (16, 'Hades',                                     'logos/hades.svg');

INSERT INTO review (slug, game_id, platform_id, stars, review_date, body) VALUES
  ('minecraft-pc', 1, 1, 5, '2026-01-12',
   'Minecraft is the game I always come back to. You can build anything you can imagine, and survival mode makes every night feel a bit scary.

The best part is playing with friends on a server. We built a whole village with a railway between our houses.

It does not look fancy, but that does not matter at all. A must-play.'),
  ('fortnite-pc', 2, 1, 4, '2026-02-03',
   'Fortnite is fast, colourful and really fun with a squad. Building takes a long time to learn, but zero build mode is great if you just want to fight.

The item shop can get expensive, so keep an eye on how much you spend.'),
  ('rocket-league-ps5', 3, 2, 4, '2026-02-21',
   'Football with rocket cars sounds silly, and it is, in the best way. Every match is short so it is easy to play "just one more".

Getting good at aerials takes forever, but scoring your first one feels amazing.'),
  ('zelda-tears-of-the-kingdom-switch', 4, 4, 5, '2026-03-09',
   'A huge adventure with sky islands, caves and a whole world to explore. The Ultrahand power lets you build cars, planes and crazy machines.

There is so much to do that I keep finding new things after many hours. The best game on the Switch.'),
  ('mario-kart-8-deluxe-switch', 5, 4, 5, '2026-03-28',
   'The perfect party game. Lots of tracks, lots of characters and the items keep every race exciting until the finish line.

Smart steering makes it easy for younger players to join in.'),
  ('super-mario-bros-wonder-switch', 6, 4, 4, '2026-04-15',
   'Classic side-scrolling Mario with a twist: Wonder Flowers change the level in surprising ways. One turned me into a bouncing ball!

It is quite easy, but really charming and great in co-op.'),
  ('hollow-knight-pc', 7, 1, 5, '2026-05-02',
   'A dark and beautiful adventure with a tiny knight in a huge underground kingdom. The boss fights are hard, but fair.

The map is enormous and full of secrets. Not for players who give up easily.'),
  ('stardew-valley-pc', 8, 1, 5, '2026-05-20',
   'Farming, fishing, mining and making friends with the people in town. It is the most relaxing game I have played.

Co-op farming with friends is even better.'),
  ('terraria-pc', 9, 1, 4, '2026-06-07',
   'Like a 2D Minecraft with way more bosses and items. Digging deeper always leads to something new.

It can be confusing at first, so keep the wiki open.'),
  ('among-us-mobile', 10, 5, 3, '2026-06-25',
   'Fun with a group of friends who are good at lying! Playing with strangers is less fun because people leave a lot.

Works well on a phone.'),
  ('celeste-switch', 11, 4, 5, '2026-07-13',
   'A tough platformer about climbing a mountain. You will die hundreds of times, but restarting is instant, so it never gets annoying.

The music is fantastic and the story is surprisingly touching.'),
  ('portal-2-pc', 12, 1, 5, '2026-08-01',
   'Solve puzzles with a portal gun. The puzzles make you feel clever and the robots are really funny.

Co-op mode is one of the best things to play with a friend.'),
  ('forza-horizon-5-xbox', 13, 3, 4, '2026-08-19',
   'Drive amazing cars around a huge open map of Mexico. It looks incredible.

There are so many events that you never run out of things to do.'),
  ('spider-man-2-ps5', 14, 2, 5, '2026-09-06',
   'Swinging through New York has never felt this good. The wing suit makes getting around even faster.

Playing as both Peter and Miles keeps the story interesting.'),
  ('animal-crossing-new-horizons-switch', 15, 4, 4, '2026-09-24',
   'Build your own island, catch bugs and fish, and decorate everything. It is slow, but in a nice way.

Best played a little bit every day.'),
  ('hades-pc', 16, 1, 5, '2026-10-12',
   'Escape the underworld again and again. Every run is different and you get stronger each time.

The characters talk to you after every run, so even losing feels like progress.');

INSERT INTO news (title, body, news_date) VALUES
  ('Welcome to Mathias Gaming Reviews',
   'This is the new home for game reviews, cheats, walkthroughs and other fun stuff. Have a look around!',
   '2026-01-05'),
  ('First reviews are up',
   'The first reviews are online. Head over to the Reviews page to see what I thought of them.',
   '2026-01-12'),
  ('How the star ratings work',
   'Every game gets between 1 and 5 stars. 5 stars means you should play it right now. 3 stars means it is fun, but has some problems. 1 star means you should probably skip it.

The stars are my own opinion, so you might disagree, and that is fine!',
   '2026-02-10'),
  ('Party game month',
   'This month is all about games you can play with friends on the same sofa. Expect reviews of racing, party and co-op games.',
   '2026-03-01'),
  ('Search has been added',
   'You can now search for a game or a platform on the Reviews page. Just start typing in the search box and the list updates.',
   '2026-04-02'),
  ('Summer holiday plans',
   'The summer holiday is coming, which means more time for playing and writing. I am planning to review some longer adventure games that are perfect for long summer days, and maybe start a walkthrough series for one of them. Let me know which game you would like to see first.',
   '2026-06-14'),
  ('Indie game special',
   'Small studios make some of the best games. Over the next weeks I will review a few indie favourites that do not get enough attention.',
   '2026-07-05'),
  ('Back to school',
   'School has started again, so new reviews will come out a bit less often. I will still try to post something every couple of weeks.',
   '2026-08-25'),
  ('Coming soon: walkthroughs',
   'Walkthroughs are coming to the site. They will be step-by-step guides that help you get past the hardest parts of a game without spoiling the whole story. The first one will be for a game that has already been reviewed here, so keep an eye on the News page.',
   '2026-09-15'),
  ('Halloween spooky games',
   'Halloween is here! Look out for some spooky (but not too scary) game picks this week.',
   '2026-10-28');
