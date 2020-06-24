---
layout: post
title: Is your city breathing or hyperventilating?
---

![alt]({{ site.baseurl }}/images/posts/HyperVent/weekday_apr2019.gif)

Cartograms are maps that distort geographical shapes to convey their attributes. While less suitable for serious analysis than choropleths, they can be more visually engaging. In this mini-project, I used cartograms to visualize green and yellow cab ridership in New York City in April, 2019. I plan to recreate the animation when the city releases data from April, 2020 in order to show how lock-down orders have affected taxi ridership.

Originally inspired by [Yan Holtz's work in R](https://www.r-graph-gallery.com/a-smooth-transition-between-chloropleth-and-cartogram.html), this project uses [Matthieu Viry's cartogram_geopandas](https://github.com/mthh/cartogram_geopandas) package and [Paco Nathan's approach to creating gif animations](https://towardsdatascience.com/visualizing-geospatial-data-in-python-e070374fe621). To retrieve the taxi trip data, I also borrowed code from [Chih-Ling Hsu's blog post](https://chih-ling-hsu.github.io/2018/05/14/NYC).

Check out my Jupyter Notebook [here](https://github.com/jleape/HyperVent).