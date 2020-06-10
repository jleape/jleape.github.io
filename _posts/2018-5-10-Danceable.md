---
layout: post
title: Danceable<a name="Danceable"></a>
---

![Screenshot]({{ site.baseurl }}/images/posts/Danceable/Danceable.png)

Danceable is an app for finding music suitable for your favorite dance style. Users can select a song from Spotify, Youtube or SoundCloud, or upload an MP3. The song is then converted into an image called a spectrogram, which is then sliced and passed through a Convolutional Neural Network (CNN). The CNN classifies the song as suitable for any of the following dance styles:
- Afrobeat
- Bachata
- Brazilian Zouk
- Kizomba

Danceable also identifies the Title, Artist, Album, Year and BPM of the track. Users can set the correct BPM by tapping and submit corrections to the other meta-data.

![App Demo]({{ site.baseurl }}/images/posts/Danceable/Demo.gif)

Danceable builds off of Julien Despois's work on using CNNs to classify music by genre (see [Article](https://medium.com/@juliendespois/finding-the-genre-of-a-song-with-deep-learning-da8f59a61194#.yhemoyql0) and [Repo](https://github.com/despoisj/DeepAudioClassification)).

[Course Website](https://onexi.org/)