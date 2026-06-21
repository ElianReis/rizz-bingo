Rizz Bingo

A bingo game for one very specific situation: a guy keeps saying the same things over and over, and now you can win prizes for it (the prize is feeling smart).

You get a 5 by 5 board full of his greatest hits. Every time he says one, you dab the square. Five in a row and you scream BINGO while confetti rains down and a tiny cartoon camel walks past like nothing happened.

What it does

Tap squares to mark them. Get five in a line to win.
Works in English and Portuguese. Switch anytime, your phrases get a little translation underneath.
Shuffle gives you a brand new board. New day keeps the same board but wipes your marks.
It remembers everything when you refresh, so no rage quitting and pretending it never happened.
There is a leaderboard. People will be ranked. Friendships may end.
There is a music button. Click it. You know you want to.
There is a camel. The camel is non negotiable.

How to run it

You cannot just double click the file, the modern web is dramatic about that. Open a terminal in this folder and run a tiny server:

python3 -m http.server 8000

Then go to localhost:8000 in your browser. On the actual website it just works, no terminal needed.

How to add more phrases

Open the file data slash phrases dot js and copy one of the lines. Each phrase has the words, the language it is in, and a translation. Add your line, save, shuffle, done. He will not stop talking, so you will have plenty of material.

Where things live

The page is index.html. The looks are in css. The brains are in js. The phrases are in data. The pictures and the song are in assets. Everything has its own little house now and they are all very happy about it.

Made with love, mild suffering, and one camel.
