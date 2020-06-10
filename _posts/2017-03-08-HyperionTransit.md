---
layout: post
title: HyperionTransit
---

![Screenshot]({{ site.baseurl }}/images/posts/HyperionTransit/HT.png)

As a mobility advisor in the Mayor's Office of Bogotá, Colombia, I co-led a study to prioritize infrastructure investments in the city's renowned Bus Rapid Transit system, Transmilenio. Drawing on queing theory, I developed a framework to identify interventions based on interactions between various types of congestion. 

Recognizing that both demand and supply are constantly in flux for most transit systems, I created HyperionTransit, an app to automatically calculate congestion indicators and plan new routes and infrastructure using [GTFS](https://developers.google.com/transit/gtfs), demand matrices and Emme model outputs.

## Features
An interactive Leaflet map visualizes how congestion evolves over the day by station, corridor, route, segment and origin-destination pair. 

![Saturation]({{ site.baseurl }}/images/posts/HyperionTransit/Saturation.gif) 

![Route Heat]({{ site.baseurl }}/images/posts/HyperionTransit/RouteHeat.png) | ![Segment Heat]({{ site.baseurl }}/images/posts/HyperionTransit/SegmentHeat.png) | ![Spider]({{ site.baseurl }}/images/posts/HyperionTransit/Spider.png)

Dynamic charts on the left panel graph congestion over time at various locations and scales.

![Insights]({{ site.baseurl }}/images/posts/HyperionTransit/Insights.gif)

Users can select a sequence of zones to reveal station pairs with highest demand, indicating where to locate stops on express routes.

![RouteDesign]({{ site.baseurl }}/images/posts/HyperionTransit/RouteDesign.gif)

This project is open-source. [Fork Me on GitHub](https://github.com/jleape/HyperionTransit)