---
layout: post
title: TransMilenio's 5-year Plan to Upgrade Stations
---

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/congestion.jpg)
<div style="text-align:right">
  <a style="font-size:12px" href="https://thecitypaperbogota.com/bogota/bogotas-mass-transportation-network-continues-to-inspire-global-cities/20150">Credit: Galo Naranjo / Creative Commons</a>
</div>

Returning to office 16 years after introducing TransMilenio, the world's largest Bus Rapid Transit (BRT) system, Enrique Peñalosa was eager to invest in critical upgrades. I was asked to figure out how to make the best use of the funds. After reviewing dozens of previous studies and literature on system dynamics and queuing theory, I synthesized a framework for diagnosing congestion issues and prioritizing remedies. I then worked with Transmilenio to combine field and operational data to conduct a study that would eventually guide $45 million in upgrades over five years.

As in many complex systems, transit networks can behave in counter-intuitive ways. For example, dispatching more buses on popular routes might cause congestion at stations, ultimately reducing capacity. When passengers accumulate in stations waiting for buses, though, they can block other passengers and leave buses running empty. Meanwhile, attempting to shorten queues by adding turnstiles at station entrances can further overcrowd stations, further undermining passenger flows.

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/dynamics.png)

While it was infeasible to capture all of the potential dynamics, I focused on three potential bottlenecks at stations: buses in stations, passengers in loading bays, and passengers at turnstiles. For every combination of saturation level at these bottlenecks, I identified the most appropriate remedies.

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/radar1.png)

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/radar2.png)

I mapped out how we could fuse available data to measure the three types of congestion systematically across stations. I also had TransMilenio officials collect field data on the 40 most congested stations. 

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/data_flow.png)

The empirical data showed a variety of congestion conditions across stations and a clear relationship between saturation levels and wait times.

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/field_data.png)

After completing the diagnostic study, I emulated [McKinsey's cost curve](https://www.mckinsey.com/business-functions/sustainability/our-insights/a-cost-curve-for-greenhouse-gas-reduction) for reducing greenhouse gas emissions to prioritize the most cost-effective measures for relieving congestion in TransMilenio's stations.

![alt]({{ site.baseurl }}/images/posts/UpgradeTM/prioritize.png)

### Update

Both demand and supply can be extremely volatile in large transit systems like TransMilenio, so I decided to automate this analysis as an interactive web-based app called [HyperionTransit](https://jleape.github.io/HT/). The app uses standard data such as GTFS, Origin-Destination matrices and Emme modeling outputs to compute various types of saturation levels. I have released the app for non-commercial use on [GitHub](https://github.com/jleape/HyperionTransit).

The City of Bogotá continues forward with ambitious plans to [expand BRT stations](https://caracol.com.co/emisora/2019/06/18/bogota/1560860254_340160.html).