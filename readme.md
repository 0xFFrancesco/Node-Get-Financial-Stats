# Node GetFinancial

## Get financial data of a predefined list of financial instruments scraping the Google Finance website. Then combine the gathered data into an easily readable image.

### What does it do?
It automatically scrapes the Google Finance website to capture different screenshots of a user-defined list of financial instruments.

Then combines those image to create a big image which at an easy grasp sums up all the data.

It also marks the tickers with the colours and labels set in a strategy function evaluating the P/E ratio.

### Usage:
- Copy `config-template.js` in a new file called `config.js`;
- Edit the file `config.js` to match your preferences;
- Install dependencies: `npm i`.
- Run the program: `node program.js`.

### Requirements:
 - NodeJS
 - NPM