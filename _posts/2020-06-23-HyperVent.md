---
layout: post
title: Is your city breathing or hyperventilating?
---
  

![alt]({{ site.baseurl }}/images/posts/HyperVent/weekday_apr2019.gif)
<div style="text-align:right">
  <a style="font-size:12px">Taxi pick-ups and drop-offs, weekdays in April, 2019</a>
</div>

Cartograms are maps that distort geographical shapes to convey their attributes. While less suitable for serious analysis than choropleths, they can be more visually engaging. In this mini-project, I used cartograms to visualize green and yellow cab ridership in New York City in April, 2019. 

## Method  
1. Combine green and yellow cab trips into a single pandas dataframe.  
2. Sum passenger pick-ups and drop-offs by zone, time (to the nearest half hour), and day type (weekend or weekday).  
3. Calculate the cumulative sums for both pick-ups and drop-offs for each zone.  
4. Adjust zone area according to the expression: 1 + (cumul. drop-offs - cumul. pick-ups) / cumul. pick-ups  
5. Adjust zone color according to number of drop-offs at a given point in time.  

Originally inspired by [Yan Holtz's work in R](https://www.r-graph-gallery.com/a-smooth-transition-between-chloropleth-and-cartogram.html), this project uses [Matthieu Viry's cartogram_geopandas](https://github.com/mthh/cartogram_geopandas) package and [Paco Nathan's approach to creating gif animations](https://towardsdatascience.com/visualizing-geospatial-data-in-python-e070374fe621). To retrieve the [taxi trip data](https://www1.nyc.gov/site/tlc/about/tlc-trip-record-data.page), I also borrowed code from [Chih-Ling Hsu's blog post](https://chih-ling-hsu.github.io/2018/05/14/NYC).

## Results
![alt]({{ site.baseurl }}/images/posts/HyperVent/weekend_apr2019.gif)
<div style="text-align:right">
  <a style="font-size:12px">Taxi pick-ups and drop-offs, weekends in April, 2019</a>
</div>
As expected, the animations show that most drop-offs occur in mid-town Manhattan. Surprising, though, is that trip volumes are asymmetrical. There are more taxi trips going into the CBD than those leaving, which suggests that many commuters take a cab to work but then take transit back home.

I plan to recreate the animation when New York City releases data from 2020 in order to show how lock-down orders have affected taxi ridership. 

Check out my Jupyter Notebook [here](https://github.com/jleape/HyperVent).