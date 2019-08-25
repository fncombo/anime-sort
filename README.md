# Anime Sort

![dependencies](https://img.shields.io/david/fncombo/animesort)

This app uses the [Elo rating system](https://en.wikipedia.org/wiki/Elo_rating_system) to sort anime by continuously comparing two anime against each other. Each anime gains and loses ranking points based on which anime it won against or lost to.

Due to the exponential nature of this method, to significantly reduce the number of comparisons you need to manually make for very large sets of anime, losers of the loser automatically lose to the winner, similarly, winners over the winner win over the loser.

In other words, if you choose `Anime A` over `Anime B`, and then choose `Anime B` over `Anime C` then `Anime A` and all anime it lost to will automatically win against `Anime C`, thus eliminating the need for you to make these decisions manually.

During sorting, you will see a significant increase in total sorting progress as you approach the middle, and it will slow down again towards the very end. This should take about 5 to 15 minutes if you have up to 100 completed anime, 20 to 30 minutes if you have up to 200 anime, and over 30 minutes if you have over 200 anime.

API data powered by [Jikan API](https://jikan.moe/), thanks!
