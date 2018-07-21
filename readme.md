# Node Get Financial Stats 🌏📈

## Gather, aggregate and combine charts and data of different financial products into an easy digestible well-designed web page displaying multiple products at once.

![Node GFS logo](assets/logo.png?raw=true "Node GFS")

### What problem does it solve?
This software solve an important issue for me, displaying the relevant financial stats and data of different financial products in a well-designed and concise way, with the possibility to see and easy compare at a glance multiple financial products (having them in the same page).

I like the Google Finance website, though I would have designed it differently, allowing the user to see multiple charts and instruments in the same page, and removing much of the noisy information floating around.

This is kind of how I would have designed the Google Finance website.

### Usage:
- Copy the `config-template.js` file to a new file called `config.js`;
- Edit the file `config.js` to match your preferences;
- Install dependencies: `npm i`;
- Run the program: `node program.js`;
    - It will create a new sub-directory with all the assets in the defined output directory;
    - It will create the HTML page in the defined output directory;
- Open the just created HTML page to consult your precious data. 🙌

### [About the author.](https://frarizzi.science/about)

### [Generated HTML demo page.](https://frarizzi.science/projects/nodejs-get-financial-statistics-demo)

### Requirements:
 - NodeJS 🦏
 - NPM 📦


### 🔧 Troubleshooting:

##### It doesn't read the Ticker:

It may be possible that Google Finance doesn't find your defined Ticker, resulting in an error.

In that case you can go manually to the Google Finance website, find your product, and then use the full Ticker.

Example with `GIS` (General Mills, Inc.):
- \[`GIS`\] -> error 😒;
- Search on Google Finance. Ouch, the full Ticker is `NYSE: GIS`;
- Change it;
- \[`NYSE: GIS`\] -> works 🎉.

##### Its too fast or too slow for *my* network:

The software is dependent on you internet connection speed. Please adjust the relative values in your `config.js` file to match the time required by your network to perform the needed operations (inject jQuery and wait for the ajax chart data response).

### How does it work? 🤔
It automatically reads the data from the Google Finance website using [NodeJS](https://nodejs.org/en/) and [Puppeteer](https://github.com/GoogleChrome/puppeteer), capturing ~~screenshots~~ SVG-charts and data of a user-defined list of financial instruments.

Then combines those information to create an easy digestible HTML file which at a quick glance sums up all the data.

It also enhance the data marking the Tickers with colours and labels defined in a strategy function that evaluates the P/E ratio. 💸

As a **big bonus** it will output a fine selection of Emoji in the terminal log.

### Sample terminal output expected for Tickers \[`APPL`, `GOOG`, `JNJ`\]:
![Terminal Output](assets/terminal-output-2.png?raw=true "Terminal Output")
